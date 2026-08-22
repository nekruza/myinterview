/**
 * Test doubles for the Supabase client used by the API route handlers.
 *
 * The real PostgREST client is a chainable, thenable builder: every filter
 * method returns the builder, and awaiting it (or calling `.single()`) resolves
 * to `{ data, error }`. These helpers reproduce that shape so route handlers
 * can be exercised without a database.
 */

export interface QueryResult<T = unknown> {
  data?: T;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}

/** Every builder method the route handlers chain onto a query. */
const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "is",
  "not",
  "or",
  "match",
  "filter",
  "contains",
  "like",
  "ilike",
  "order",
  "limit",
  "range",
] as const;

export type MockQueryBuilder = {
  [K in (typeof CHAIN_METHODS)[number]]: jest.Mock;
} & {
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then: (onFulfilled?: unknown, onRejected?: unknown) => Promise<unknown>;
};

export function createQueryBuilder(result: QueryResult = { data: null, error: null }) {
  const builder = {} as MockQueryBuilder & Record<string, unknown>;

  for (const method of CHAIN_METHODS) {
    builder[method] = jest.fn(() => builder);
  }

  builder.single = jest.fn(() => Promise.resolve(result));
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));

  // PostgrestBuilder is a thenable, so `await supabase.from(t).update(...).eq(...)`
  // resolves without an explicit terminal call.
  builder.then = (onFulfilled?: unknown, onRejected?: unknown) =>
    Promise.resolve(result).then(
      onFulfilled as never,
      onRejected as never
    );

  return builder as MockQueryBuilder;
}

export interface SupabaseMockConfig {
  /** The authenticated user, or null for an anonymous request. */
  user?: { id: string; email?: string } | null;
  /** Error returned by auth.getUser, if any. */
  authError?: { message: string } | null;
  /**
   * Result per table. Pass an array to return a different result for each
   * successive `.from(table)` call; the last entry repeats once exhausted.
   */
  tables?: Record<string, QueryResult | QueryResult[]>;
}

export interface SupabaseMock {
  from: jest.Mock;
  auth: {
    getUser: jest.Mock;
    getSession: jest.Mock;
    signOut: jest.Mock;
  };
  /** Every `.from()` call in order, for asserting on writes. */
  calls: Array<{ table: string; builder: MockQueryBuilder }>;
  /** The nth builder created for a table (defaults to the first). */
  builderFor(table: string, index?: number): MockQueryBuilder;
  /** How many times a table was queried. */
  callCountFor(table: string): number;
}

export function createSupabaseMock(config: SupabaseMockConfig = {}): SupabaseMock {
  const { user = null, authError = null, tables = {} } = config;

  const queues: Record<string, QueryResult[]> = {};
  for (const [table, result] of Object.entries(tables)) {
    queues[table] = Array.isArray(result) ? [...result] : [result];
  }

  const calls: SupabaseMock["calls"] = [];

  const from = jest.fn((table: string) => {
    const queue = queues[table];
    let result: QueryResult = { data: null, error: null };

    if (queue?.length) {
      // Keep returning the final entry once the queue is drained so handlers
      // that re-query a table do not fall off the end.
      result = queue.length > 1 ? queue.shift()! : queue[0];
    }

    const builder = createQueryBuilder(result);
    calls.push({ table, builder });
    return builder;
  });

  return {
    from,
    auth: {
      getUser: jest.fn(async () => ({ data: { user }, error: authError })),
      getSession: jest.fn(async () => ({
        data: { session: user ? { user } : null },
        error: authError,
      })),
      signOut: jest.fn(async () => ({ error: null })),
    },
    calls,
    builderFor(table: string, index = 0) {
      const matches = calls.filter((c) => c.table === table);
      if (!matches[index]) {
        throw new Error(
          `No .from("${table}") call at index ${index}; saw ${matches.length} call(s). ` +
            `Tables queried: ${calls.map((c) => c.table).join(", ") || "none"}`
        );
      }
      return matches[index].builder;
    },
    callCountFor(table: string) {
      return calls.filter((c) => c.table === table).length;
    },
  };
}

/** Payload passed to the nth insert/update on a table. */
export function writePayload(
  mock: SupabaseMock,
  table: string,
  method: "insert" | "update" | "upsert",
  index = 0
) {
  const matches = mock.calls
    .filter((c) => c.table === table)
    .map((c) => c.builder)
    .filter((b) => (b[method] as jest.Mock).mock.calls.length > 0);

  return (matches[index]?.[method] as jest.Mock)?.mock.calls[0]?.[0];
}
