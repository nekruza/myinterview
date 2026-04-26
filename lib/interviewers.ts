export type InterviewerSpecialty = "technical" | "behavioural" | "case";

export interface Interviewer {
  id: string;
  name: string;
  title: string;
  specialty: InterviewerSpecialty;
  blurb: string;
  image: string;
  idleVideo: string;
  speakingVideo: string;
  /** Inworld TTS voice id used for this persona. Override via env per-deploy if needed. */
  voiceId: string;
  /** Hex accent for chips/borders. */
  accent: string;
}

export const INTERVIEWERS: Interviewer[] = [
  {
    id: "henry",
    name: "Henry",
    title: "Case Interviewer",
    specialty: "case",
    blurb: "Structuring, business sense, and recommendations",
    image: "/ai_avatars/henry.png",
    idleVideo: "/ai_avatars/henry_idle.mp4",
    speakingVideo: "/ai_avatars/henry_speaking.mp4",
    voiceId: "Clive",
    accent: "#f59e0b",
  },
  {
    id: "luna",
    name: "Luna",
    title: "Behavioural Interviewer",
    specialty: "behavioural",
    blurb: "Leadership, teamwork, and STAR storytelling",
    image: "/ai_avatars/luna.png",
    idleVideo: "/ai_avatars/luna_idle.mp4",
    speakingVideo: "/ai_avatars/luna_speaking.mp4",
    voiceId: "Ashley",
    accent: "#2dec29",
  },
  {
    id: "jake",
    name: "Jake",
    title: "Technical Interviewer",
    specialty: "technical",
    blurb: "System design, coding, and technical depth",
    image: "/ai_avatars/jake.png",
    idleVideo: "/ai_avatars/jake_idle.mp4",
    speakingVideo: "/ai_avatars/jake_speaking.mp4",
    voiceId: "Nate",
    accent: "#06b6d4",
  },
];

export const DEFAULT_INTERVIEWER_ID = "henry";

export function getInterviewerById(id: string | null | undefined): Interviewer {
  return (
    INTERVIEWERS.find((i) => i.id === id) ??
    INTERVIEWERS.find((i) => i.id === DEFAULT_INTERVIEWER_ID)!
  );
}

export function getDefaultInterviewerForSpecialty(
  specialty: InterviewerSpecialty
): Interviewer {
  return (
    INTERVIEWERS.find((i) => i.specialty === specialty) ??
    INTERVIEWERS.find((i) => i.id === DEFAULT_INTERVIEWER_ID)!
  );
}
