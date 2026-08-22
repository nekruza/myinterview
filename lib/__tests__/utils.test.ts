import { cn } from "../utils";

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("returns an empty string with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", 0, "b")).toBe("a b");
  });

  it("resolves conditional object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("flattens nested arrays", () => {
    expect(cn(["a", ["b", "c"]], "d")).toBe("a b c d");
  });

  it("lets a later Tailwind utility win over an earlier conflicting one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("resolves conflicts across shorthand and longhand spacing", () => {
    expect(cn("p-4", "px-2")).toBe("p-4 px-2");
    expect(cn("px-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting utilities from the same family", () => {
    expect(cn("mt-2", "mb-4")).toBe("mt-2 mb-4");
  });

  it("respects variant prefixes when merging", () => {
    expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
    expect(cn("bg-red-500", "hover:bg-blue-500")).toBe("bg-red-500 hover:bg-blue-500");
  });

  it("lets a caller override a base class - the reason this helper exists", () => {
    const base = "rounded-md bg-white text-sm";
    expect(cn(base, "bg-black")).toBe("rounded-md text-sm bg-black");
  });

  it("handles an undefined override without changing the base", () => {
    expect(cn("rounded-md", undefined)).toBe("rounded-md");
  });

  it("collapses duplicate identical classes", () => {
    expect(cn("flex", "flex")).toBe("flex");
  });

  it("preserves arbitrary value syntax", () => {
    expect(cn("w-[calc(100%-1rem)]")).toBe("w-[calc(100%-1rem)]");
  });
});
