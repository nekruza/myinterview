import type { ReactNode } from "react";
import { Flame, Languages, Sparkles, Volume2 } from "lucide-react";
import { roleplays } from "@/lib/data/roleplays";
import { STUDY_PLAN_30 } from "@/lib/data/studyPlan";
import { lessonsByLanguage } from "@/lib/data/lessons";
import type { RoleplayScenario } from "@/lib/types/roleplay";
import { sectionHeading, shell } from "./styles";

const SHOWCASE_TITLES = [
  "Coffee Shop Order",
  "Hotel Check-in",
  "Asking for Directions",
  "Doctor's Appointment",
  "Splitting the Bill",
  "Team Meeting",
  "Lost Luggage",
  "Birthday Party",
];

const SCORES = ["Overall", "Fluency", "Grammar", "Vocabulary", "Engagement", "Relevancy"];

/** Matches WORD_COUNT in app/api/ai/vocabulary/route.ts. */
const GENERATED_WORDS = 12;
const GENERATED_SAMPLE = ["campsite", "lantern", "sleeping bag", "campfire"];

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const WEEK_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EXAMPLE_TODAY = 4; // Friday, in the illustrative week and plan below

type Tone = "ink" | "soft" | "plain";

function Cell({
  title,
  body,
  tone = "plain",
  className = "",
  children,
}: {
  title: string;
  body: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === "ink"
      ? "bg-ink text-cream"
      : tone === "soft"
        ? "bg-accent-soft text-ink"
        : "border border-line bg-surface text-ink";
  const bodyClass = tone === "ink" ? "text-cream/70" : "text-sub";

  return (
    <article className={`fina-reveal flex flex-col rounded-[28px] p-7 sm:p-8 ${toneClass} ${className}`}>
      <h3 className="text-xl font-semibold tracking-[-0.01em]">{title}</h3>
      <p className={`mt-2 max-w-[44ch] text-[15px] leading-relaxed ${bodyClass}`}>{body}</p>
      <div className="mt-auto pt-8">{children}</div>
    </article>
  );
}

export function Features() {
  const scenarioCount = Math.floor(roleplays.length / 10) * 10;
  const showcase = SHOWCASE_TITLES.map((title) => roleplays.find((r) => r.title === title)).filter(
    (r): r is RoleplayScenario => Boolean(r)
  );

  const firstLesson = lessonsByLanguage.english[0];
  const word = firstLesson.vocabularyWords.find((w) => w.word === "breakfast") ?? firstLesson.vocabularyWords[0];

  const today = STUDY_PLAN_30[EXAMPLE_TODAY];

  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
      <div className={shell}>
        <h2 id="features-title" className={`${sectionHeading} fina-reveal max-w-[20ch]`}>
          Speak English first. <em className="italic">The rest makes it stick.</em>
        </h2>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 lg:grid-cols-12">
          <Cell
            tone="ink"
            className="md:col-span-2 lg:col-span-7"
            title="Realtime voice roleplays"
            body={`${scenarioCount}+ scenarios across daily life, food, travel and work. Or write your own custom roleplay: set the scene, who you are and who your tutor plays.`}
          >
            <ul className="flex flex-wrap gap-2">
              {showcase.map((r) => (
                <li key={r.id} className="rounded-full border border-cream/20 px-3.5 py-1.5 text-[13px] text-cream/90">
                  {r.title}
                </li>
              ))}
              <li className="rounded-full border border-dashed border-cream/45 px-3.5 py-1.5 text-[13px] text-cream">
                Your own roleplay
              </li>
            </ul>
          </Cell>

          <Cell
            tone="soft"
            className="lg:col-span-5"
            title="Post-conversation analysis"
            body="After every conversation: six scores from 0 to 100, a short summary, your strengths and up to five corrections."
          >
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {SCORES.map((score) => (
                <li key={score} className="font-display fina-display text-[22px] leading-snug tracking-[-0.01em] text-ink">
                  {score}
                </li>
              ))}
            </ul>
          </Cell>

          <Cell
            className="lg:col-span-4"
            title="English words by topic and flashcards"
            body="English lessons by topic. Hear each word, see it in a sentence, and save favorites to review later."
          >
            <div className="rounded-[20px] border border-line bg-cream p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                <p lang="en" className="font-display fina-display text-[30px] leading-none tracking-[-0.015em] text-ink">
                    {word.word}
                  </p>
                  <p className="mt-2 text-[13px] text-sub">
                    {word.pronunciation} · {word.partOfSpeech}
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line">
                  <Volume2 aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 border-t border-line pt-4 text-[15px] font-semibold text-ink">{word.definition}</p>
              <p lang="en" className="mt-1 text-[14px] italic text-sub">
                {word.example}
              </p>
            </div>
          </Cell>

          <Cell
            className="lg:col-span-8"
            title="30-day study plan"
            body="Every day has one conversation and one word topic, so you always know what to practice next."
          >
            <ol aria-label="Example plan, on day 5" className="grid grid-cols-10 gap-1.5 sm:gap-2">
              {STUDY_PLAN_30.map((day, i) => (
                <li
                  key={day.day}
                  aria-label={`Day ${day.day}: ${day.speakLabel}`}
                  className={`flex aspect-square items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.01em] ${
                    i < EXAMPLE_TODAY
                      ? "bg-ink text-cream"
                      : i === EXAMPLE_TODAY
                        ? "bg-surface text-ink ring-2 ring-accent-brand"
                        : "bg-cream text-sub"
                  }`}
                >
                  {day.day}
                </li>
              ))}
            </ol>
            <p className="mt-5 text-[15px]">
              <span className="font-semibold text-ink">Day {today.day}.</span>{" "}
              <span className="text-sub">
                {today.speakLabel}, then {today.vocabTopic} words.
              </span>
            </p>
          </Cell>

          <Cell
            className="lg:col-span-5"
            title="AI word generation"
            body={`Type any topic and get ${GENERATED_WORDS} English words at your level, saved as a lesson you can study straight away.`}
          >
            <div className="flex items-center justify-between rounded-full border border-line bg-cream px-4 py-2.5 text-[15px] text-ink">
              Camping trip
              <Sparkles aria-hidden="true" strokeWidth={1.75} className="h-4 w-4 text-sub" />
            </div>
            <ul lang="en" className="mt-3 flex flex-wrap gap-2">
              {GENERATED_SAMPLE.map((w) => (
                <li key={w} className="rounded-full bg-cream px-3 py-1.5 text-[13px] text-ink">
                  {w}
                </li>
              ))}
              <li lang="en" className="px-1 py-1.5 text-[13px] text-sub">
                and {GENERATED_WORDS - GENERATED_SAMPLE.length} more
              </li>
            </ul>
          </Cell>

          <Cell
            className="lg:col-span-4"
            title="Instant translation and hints"
            body="Tap a line to see it in your language. Stuck? A hint gives you four things you could say next."
          >
            <p
              lang="en"
              className="w-fit rounded-[20px] rounded-tl-md bg-accent-soft px-4 py-3 font-display fina-display text-[18px] leading-snug text-ink"
            >
              Could you say that again?
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1 text-xs text-sub">
              <Languages aria-hidden="true" strokeWidth={1.75} className="h-3.5 w-3.5 shrink-0" />
              Translation and hints are one tap away.
            </p>
          </Cell>

          <Cell className="lg:col-span-3" title="Streaks" body="Speak once a day to keep your streak going.">
            <Flame aria-hidden="true" strokeWidth={1.75} className="h-7 w-7 text-hot" />
            <ol aria-label="Example week" className="mt-4 flex justify-between gap-1">
              {WEEK.map((d, i) => (
                <li
                  key={WEEK_NAMES[i]}
                  aria-label={`${WEEK_NAMES[i]}${i < EXAMPLE_TODAY ? ", practiced" : ""}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${
                    i < EXAMPLE_TODAY
                      ? "bg-hot text-cream"
                      : i === EXAMPLE_TODAY
                        ? "text-ink ring-2 ring-hot"
                        : "bg-cream text-sub"
                  }`}
                >
                  {d}
                </li>
              ))}
            </ol>
          </Cell>
        </div>
      </div>
    </section>
  );
}
