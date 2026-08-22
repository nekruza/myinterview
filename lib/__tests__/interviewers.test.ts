import {
  DEFAULT_INTERVIEWER_ID,
  INTERVIEWERS,
  getDefaultInterviewerForSpecialty,
  getInterviewerById,
  type InterviewerSpecialty,
} from "../interviewers";

describe("INTERVIEWERS catalogue", () => {
  it("has a unique id for every persona", () => {
    const ids = INTERVIEWERS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all three specialties exactly once", () => {
    const specialties = INTERVIEWERS.map((i) => i.specialty).sort();
    expect(specialties).toEqual(["behavioural", "case", "technical"]);
  });

  it("includes the default interviewer", () => {
    expect(INTERVIEWERS.some((i) => i.id === DEFAULT_INTERVIEWER_ID)).toBe(true);
  });

  it("gives every persona the media assets the UI renders", () => {
    for (const person of INTERVIEWERS) {
      expect(person.image).toMatch(/^\/ai_avatars\/.+\.png$/);
      expect(person.idleVideo).toMatch(/^\/ai_avatars\/.+_idle\.mp4$/);
      expect(person.speakingVideo).toMatch(/^\/ai_avatars\/.+_speaking\.mp4$/);
    }
  });

  it("gives every persona a distinct TTS voice", () => {
    const voices = INTERVIEWERS.map((i) => i.voiceId);
    expect(voices.every(Boolean)).toBe(true);
    expect(new Set(voices).size).toBe(voices.length);
  });

  it("gives every persona a valid hex accent colour", () => {
    for (const person of INTERVIEWERS) {
      expect(person.accent).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("gives every persona display copy", () => {
    for (const person of INTERVIEWERS) {
      expect(person.name.length).toBeGreaterThan(0);
      expect(person.title.length).toBeGreaterThan(0);
      expect(person.blurb.length).toBeGreaterThan(0);
    }
  });
});

describe("getInterviewerById", () => {
  it.each(INTERVIEWERS.map((i) => [i.id] as const))(
    "returns the %s persona by id",
    (id) => {
      expect(getInterviewerById(id).id).toBe(id);
    }
  );

  it("falls back to the default for an unknown id", () => {
    expect(getInterviewerById("does-not-exist").id).toBe(DEFAULT_INTERVIEWER_ID);
  });

  it("falls back to the default for null", () => {
    expect(getInterviewerById(null).id).toBe(DEFAULT_INTERVIEWER_ID);
  });

  it("falls back to the default for undefined", () => {
    expect(getInterviewerById(undefined).id).toBe(DEFAULT_INTERVIEWER_ID);
  });

  it("falls back to the default for an empty string", () => {
    expect(getInterviewerById("").id).toBe(DEFAULT_INTERVIEWER_ID);
  });

  it("is case sensitive and falls back rather than fuzzy matching", () => {
    expect(getInterviewerById("HENRY").id).toBe(DEFAULT_INTERVIEWER_ID);
  });

  it("never returns undefined", () => {
    for (const id of ["henry", "nope", "", "  "]) {
      expect(getInterviewerById(id)).toBeDefined();
    }
  });
});

describe("getDefaultInterviewerForSpecialty", () => {
  it.each([
    ["case", "henry"],
    ["behavioural", "luna"],
    ["technical", "jake"],
  ] as const)("maps the %s specialty to %s", (specialty, expectedId) => {
    expect(getDefaultInterviewerForSpecialty(specialty).id).toBe(expectedId);
  });

  it("returns a persona whose specialty matches the request", () => {
    const specialties: InterviewerSpecialty[] = ["case", "behavioural", "technical"];
    for (const specialty of specialties) {
      expect(getDefaultInterviewerForSpecialty(specialty).specialty).toBe(specialty);
    }
  });

  it("falls back to the default for an unrecognised specialty", () => {
    const result = getDefaultInterviewerForSpecialty(
      "design" as InterviewerSpecialty
    );
    expect(result.id).toBe(DEFAULT_INTERVIEWER_ID);
  });
});
