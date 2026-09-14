import { LANGUAGES, getLanguage, speechLocale, pronunciationVoice, isLanguageId, ONBOARDING_LANGUAGE_IDS } from "@/lib/languages";

describe("languages", () => {
  it("lists the nine supported languages", () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(["english","spanish","french","german","chinese","japanese","portuguese","russian","arabic"]);
  });
  it("falls back to English for unknown ids", () => {
    expect(getLanguage("klingon").id).toBe("english");
    expect(getLanguage(null).id).toBe("english");
  });
  it("maps speech locales", () => {
    expect(speechLocale("spanish")).toBe("es-ES");
    expect(speechLocale("chinese")).toBe("zh-CN");
    expect(speechLocale(undefined)).toBe("en-US");
  });
  it("maps pronunciation voices", () => {
    expect(pronunciationVoice("german")).toBe("Johanna");
    expect(pronunciationVoice("nope")).toBe("Ashley");
  });
  it("guards ids", () => {
    expect(isLanguageId("french")).toBe(true);
    expect(isLanguageId("FRENCH")).toBe(false);
  });
  it("offers eight onboarding languages in mobile order", () => {
    expect(ONBOARDING_LANGUAGE_IDS).toEqual(["english","spanish","french","japanese","german","portuguese","chinese","arabic"]);
  });
});
