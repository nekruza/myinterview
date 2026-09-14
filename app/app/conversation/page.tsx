import { Suspense } from "react";
import { ConversationClient, SetupSkeleton } from "./ConversationClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function ConversationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const roleplayId = first(params.roleplay);
  const customId = first(params.custom);
  const tutorId = first(params.tutor);

  return (
    <Suspense fallback={<SetupSkeleton />}>
      <ConversationClient
        key={`${roleplayId ?? ""}:${customId ?? ""}:${tutorId ?? ""}`}
        roleplayId={roleplayId}
        customId={customId}
        tutorId={tutorId}
      />
    </Suspense>
  );
}
