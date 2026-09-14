import { TUTORS, getTutorById, tutorVoice, DEFAULT_TUTOR_ID } from "@/lib/tutors";

describe("tutors", () => {
  it("has luna, henry, jake", () => expect(TUTORS.map((t) => t.id)).toEqual(["luna","henry","jake"]));
  it("defaults to luna", () => {
    expect(DEFAULT_TUTOR_ID).toBe("luna");
    expect(getTutorById("zzz").id).toBe("luna");
  });
  it("picks the voice for the language", () => {
    expect(tutorVoice(getTutorById("henry"), "spanish")).toBe("Diego");
    expect(tutorVoice(getTutorById("luna"), "english")).toBe("Ashley");
    expect(tutorVoice(getTutorById("jake"), "japanese")).toBe("Satoshi");
  });
  it("points every asset at /ai_avatars", () => {
    for (const t of TUTORS) for (const p of [t.image, t.idleVideo, t.speakingVideo]) expect(p).toMatch(/^\/ai_avatars\//);
  });
});
