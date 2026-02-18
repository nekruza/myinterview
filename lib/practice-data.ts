export const CATEGORIES = [
  {
    id: "leadership",
    label: "Leadership & Influence",
    color: "#2dec29",
    questions: [
      "Tell me about a time you led a project through a significant technical challenge.",
      "Describe a situation where you had to influence a team without formal authority.",
      "Give me an example of when you mentored someone and the impact it had.",
      "Tell me about a time you drove a technical decision that others disagreed with.",
    ],
  },
  {
    id: "ownership",
    label: "Ownership & Initiative",
    color: "#f59e0b",
    questions: [
      "Tell me about a time you took ownership of a problem that wasn't technically yours to solve.",
      "Describe a situation where you identified and fixed a critical issue before it became a major problem.",
      "Give me an example of when you went beyond your role to deliver better outcomes.",
      "Tell me about a time you had to make a high-stakes decision with incomplete information.",
    ],
  },
  {
    id: "conflict",
    label: "Conflict & Disagreement",
    color: "#8b5cf6",
    questions: [
      "Tell me about a time you disagreed with your manager and how you handled it.",
      "Describe a situation where two team members were in conflict and you helped resolve it.",
      "Give me an example of when you had to push back on a product decision you believed was wrong.",
      "Tell me about a time you had a difficult conversation with a stakeholder.",
    ],
  },
  {
    id: "failure",
    label: "Failure & Growth",
    color: "#ef4444",
    questions: [
      "Tell me about your biggest professional failure and what you learned from it.",
      "Describe a time you made a mistake that impacted your team. How did you handle it?",
      "Give me an example of a project that failed. What would you do differently?",
      "Tell me about a time when you received critical feedback that was hard to hear.",
    ],
  },
  {
    id: "collaboration",
    label: "Cross-team Collaboration",
    color: "#06b6d4",
    questions: [
      "Tell me about a time you worked across teams to deliver a complex project.",
      "Describe a situation where alignment between teams was difficult to achieve.",
      "Give me an example of when you had to coordinate work with multiple stakeholders.",
      "Tell me about a time you improved a process that benefited teams beyond your own.",
    ],
  },
];

export const TECH_ROLES = [
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "fullstack", label: "Full Stack Developer" },
  { value: "mobile", label: "Mobile Developer" },
  { value: "devops", label: "DevOps / Platform Engineer" },
  { value: "sre", label: "Site Reliability Engineer (SRE)" },
  { value: "cloud", label: "Cloud Engineer" },
  { value: "data", label: "Data Engineer" },
  { value: "ml", label: "Machine Learning / AI Engineer" },
  { value: "security", label: "Security Engineer" },
  { value: "product-engineer", label: "Product Engineer" },
  { value: "architect", label: "Software Architect" },
  { value: "qa", label: "QA / Test Engineer" },
  { value: "embedded", label: "Embedded / Systems Engineer" },
  { value: "general", label: "General Software Engineer" },
  { value: "other", label: "Other..." },
];

export const LEVELS = [
  { value: "junior", label: "Junior (0-2 yrs)" },
  { value: "mid", label: "Mid-level (3-5 yrs)" },
  { value: "senior", label: "Senior (6-9 yrs)" },
  { value: "staff", label: "Staff / Principal (10+ yrs)" },
];

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export type Phase = "setup" | "chat" | "complete";
