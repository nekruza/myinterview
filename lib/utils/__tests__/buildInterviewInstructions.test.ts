import { buildInterviewInstructions } from "../buildInterviewInstructions";

describe("buildInterviewInstructions", () => {
  it("includes Jason Mitchell persona", () => {
    const result = buildInterviewInstructions({
      interviewType: "technical",
      level: "mid",
      category: "system-design",
      question: "Design a URL shortener",
      role: "backend-engineer",
    });
    expect(result).toContain("Jason Mitchell");
    expect(result).toContain("VP of Engineering");
  });

  it("includes resume block when resumeText provided", () => {
    const result = buildInterviewInstructions({
      interviewType: "technical",
      level: "mid",
      category: "system-design",
      question: "Design a URL shortener",
      resumeText: "Worked at Stripe on payments infrastructure",
    });
    expect(result).toContain("Worked at Stripe on payments infrastructure");
  });

  it("includes job description block when jobContext paste provided", () => {
    const result = buildInterviewInstructions({
      interviewType: "behavioural",
      level: "senior",
      category: "leadership",
      question: "Tell me about a time you led a team",
      jobContext: { mode: "paste", value: "Senior Engineer at Acme Corp" },
    });
    expect(result).toContain("Senior Engineer at Acme Corp");
  });

  it("includes the question to open with", () => {
    const result = buildInterviewInstructions({
      interviewType: "technical",
      level: "mid",
      category: "algorithms",
      question: "How would you implement LRU cache?",
    });
    expect(result).toContain("How would you implement LRU cache?");
  });

  it("uses behavioural prompt for behavioural type", () => {
    const technical = buildInterviewInstructions({
      interviewType: "technical",
      level: "mid",
      category: "system-design",
      question: "test",
    });
    const behavioural = buildInterviewInstructions({
      interviewType: "behavioural",
      level: "mid",
      category: "leadership",
      question: "test",
    });
    expect(technical).toContain("system design");
    expect(behavioural).toContain("leadership");
  });
});
