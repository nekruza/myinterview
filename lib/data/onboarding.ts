/**
 * Onboarding flow constants.
 *
 * Ported from fina:
 * - LEVEL_OPTIONS / LEVEL_LABEL: components/onboarding/OnboardingShared.tsx (LEVELS/LEVEL_LABEL)
 * - MOTIVATIONS / MOTIV_LEAD_IN / GOALS: components/onboarding/OnboardingShared.tsx
 * - DESTINATION_BY_MOTIVATION: app/plan-reveal.tsx
 * - PLAN_PHASES: app/plan-generating.tsx
 * - AI_SERVICES: app/ai-consent.tsx
 */

/** Self-reported level question — id maps to a UserLevel via onboardingLevelToUserLevel(). */
export const LEVEL_OPTIONS = [
  { id: 'beginner', label: 'Just starting' },
  { id: 'some', label: 'I know some words' },
  { id: 'convo', label: 'I can have simple chats' },
  { id: 'fluent', label: "I'm pretty fluent" },
];

export const LEVEL_LABEL: Record<string, string> = {
  beginner: 'beginner',
  some: 'near-beginner',
  convo: 'conversational',
  fluent: 'advanced',
};

export const MOTIVATIONS = [
  { id: 'travel', emoji: '✈️', label: 'Travel', sub: 'Order food, make friends abroad' },
  { id: 'work', emoji: '💼', label: 'Work', sub: 'Meetings, emails, interviews' },
  { id: 'connect', emoji: '❤️', label: 'Connect', sub: 'Family, partner, community' },
  { id: 'media', emoji: '🎬', label: 'Media', sub: 'Movies, music, books' },
  { id: 'challenge', emoji: '🎯', label: 'Challenge', sub: 'Personal growth' },
];

export const MOTIV_LEAD_IN: Record<string, string> = {
  travel: 'Planning a trip soon? ✈️',
  work: 'Leveling up at work is huge. 💼',
  connect: 'Language is love in another form. ❤️',
  media: 'Unlocking culture is addictive. 🎬',
  challenge: 'Respect — this takes grit. 🎯',
};

export const GOALS = [
  { min: 5, label: '5 min', sub: 'Casual', emoji: '☕' },
  { min: 10, label: '10 min', sub: 'Recommended', emoji: '🌿', recommended: true },
  { min: 20, label: '20 min', sub: 'Serious', emoji: '🎯' },
  { min: 30, label: '30 min', sub: 'Intensive', emoji: '🚀' },
];

/** Plan-reveal destination copy, keyed by MOTIVATIONS id. */
export const DESTINATION_BY_MOTIVATION: Record<string, (lang: string) => string> = {
  travel: (lang) => `you'll order dinner\nin ${lang}.`,
  work: (lang) => `you'll run a meeting\nin ${lang}.`,
  connect: (lang) => `you'll have your first\nreal chat in ${lang}.`,
  media: () => `you'll watch a show\nwithout subtitles.`,
  challenge: (lang) => `you'll think in ${lang}\nfor a full day.`,
};

/** Plan-generating screen's sequential phase labels ("Briefing {tutorName}" is a function). */
export const PLAN_PHASES: (string | ((name: string) => string))[] = [
  'Analyzing your answers',
  'Picking lessons for your level',
  (name: string) => `Briefing ${name}`,
  'Building your 30-day plan',
];

/** AI-consent screen's third-party service disclosures. */
export const AI_SERVICES = [
  {
    name: 'Google Gemini',
    operator: 'Google LLC',
    dataSent: 'Your conversation messages and text',
    purpose: 'Chat responses, vocabulary generation, conversation analysis',
  },
  {
    name: 'Inworld AI',
    operator: 'Inworld AI Inc.',
    dataSent: 'Your voice audio (microphone) and AI-generated text',
    purpose: 'Real-time voice conversation and text-to-speech audio',
  },
];
