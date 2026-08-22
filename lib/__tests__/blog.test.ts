import { getAllSlugs, getPost, posts } from "../blog";

describe("posts", () => {
  it("ships at least one post", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it("has a unique slug for every post", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses URL-safe kebab-case slugs", () => {
    for (const post of posts) {
      expect(post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(post.slug).toBe(encodeURIComponent(post.slug));
    }
  });

  it("fills every field the post page always renders", () => {
    for (const post of posts) {
      expect(post.title.trim().length).toBeGreaterThan(0);
      expect(post.excerpt.trim().length).toBeGreaterThan(0);
      expect(post.content.trim().length).toBeGreaterThan(0);
      expect(post.category.trim().length).toBeGreaterThan(0);
      expect(post.coverEmoji.trim().length).toBeGreaterThan(0);
    }
  });

  // Some editorial posts are deliberately unbylined. What must never happen is
  // a half-filled byline, which renders as a dangling role with no name.
  it("has an all-or-nothing byline on every post", () => {
    for (const post of posts) {
      const hasAuthor = post.author.trim().length > 0;
      const hasRole = post.authorRole.trim().length > 0;
      expect(hasAuthor).toBe(hasRole);
    }
  });

  it("defines the byline fields on every post even when unbylined", () => {
    for (const post of posts) {
      expect(typeof post.author).toBe("string");
      expect(typeof post.authorRole).toBe("string");
    }
  });

  it("uses a parseable date on every post", () => {
    for (const post of posts) {
      expect(Number.isNaN(Date.parse(post.date))).toBe(false);
    }
  });

  it("formats read time consistently", () => {
    for (const post of posts) {
      expect(post.readTime).toMatch(/^\d+ min read$/);
    }
  });
});

describe("getPost", () => {
  it.each(posts.map((p) => [p.slug] as const))("finds the post for %s", (slug) => {
    expect(getPost(slug)?.slug).toBe(slug);
  });

  it("returns the full post object, not just a stub", () => {
    const [first] = posts;
    expect(getPost(first.slug)).toEqual(first);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getPost("no-such-post")).toBeUndefined();
  });

  it("returns undefined for an empty slug", () => {
    expect(getPost("")).toBeUndefined();
  });

  it("does not match on a partial slug", () => {
    const [first] = posts;
    expect(getPost(first.slug.slice(0, 4))).toBeUndefined();
  });

  it("is case sensitive", () => {
    const [first] = posts;
    expect(getPost(first.slug.toUpperCase())).toBeUndefined();
  });
});

describe("getAllSlugs", () => {
  it("returns one slug per post", () => {
    expect(getAllSlugs()).toHaveLength(posts.length);
  });

  it("returns slugs in the order the posts are declared", () => {
    expect(getAllSlugs()).toEqual(posts.map((p) => p.slug));
  });

  it("returns only slugs that getPost can resolve", () => {
    for (const slug of getAllSlugs()) {
      expect(getPost(slug)).toBeDefined();
    }
  });

  it("returns a fresh array that callers cannot use to mutate the catalogue", () => {
    const slugs = getAllSlugs();
    slugs.push("injected");
    expect(getAllSlugs()).not.toContain("injected");
  });
});
