export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  category: string;
  coverEmoji: string;
}

export const posts: BlogPost[] = [
  {
    slug: "how-to-stop-mind-going-blank-interview",
    title: "Why Your Mind Goes Blank in Interviews (And How to Fix It)",
    excerpt:
      "93% of candidates experience mental freeze during interviews. Here's the neuroscience behind it and the exact techniques to stay clear-headed under pressure.",
    author: "Dr. Maya Chen",
    authorRole: "Cognitive Performance Coach",
    date: "February 10, 2026",
    readTime: "7 min read",
    category: "Anxiety",
    coverEmoji: "🧠",
    content: `
## The Science Behind Mental Freeze

When you walk into an interview, your brain perceives it as a threat. The amygdala — your brain's alarm system — fires up and floods your body with cortisol and adrenaline. This is the same response your ancestors had when facing a predator.

The problem? Your prefrontal cortex — the part responsible for complex thinking, recall, and articulate speech — gets partially shut down during this stress response. This is why you can perfectly answer every question the night before, then completely blank during the real thing.

## The 3-Second Reset Technique

Before answering any question, use this pattern:

1. **Breathe in for 4 counts** through your nose
2. **Hold for 2 counts**
3. **Exhale slowly for 6 counts**

This activates your parasympathetic nervous system and partially counteracts the stress response. Three seconds feels like nothing to the interviewer but resets your brain chemistry.

## The "Parking Lot" Method

When you blank on a specific detail mid-answer, use this phrase: *"Let me come back to that specific detail — the broader principle is..."*

Then continue with what you do know. Most interviewers don't actually need the exact detail — they want to see how you think under pressure.

## Build the Neural Pathways First

The real fix is practice — but deliberate, anxiety-simulating practice. Practicing in a relaxed state doesn't train your brain to perform under stress. You need to practice in conditions that actually trigger mild anxiety:

- **Record yourself** — the camera triggers self-consciousness
- **Practice with strangers** — peer sessions create real social pressure
- **Set time limits** — constraints create productive stress

The more you expose yourself to simulated interview pressure, the smaller your amygdala's threat response becomes. This is called exposure therapy, and it works.

## What to Do Right Now

Tonight, set up one 20-minute mock interview session. Don't practice answers — practice the feeling of being asked an unexpected question and finding your way through it. The discomfort you feel is the neural pathway being built.

Consistent exposure to mild interview stress, followed by successful navigation, is the fastest path to genuine confidence.
    `,
  },
  {
    slug: "star-method-behavioral-interviews",
    title: "The STAR Method Actually Works — If You Use It Right",
    excerpt:
      "Most engineers know STAR but still give rambling answers. Here's how to structure compelling behavioral responses that make interviewers lean forward.",
    author: "James Park",
    authorRole: "Senior Engineering Manager, ex-Google",
    date: "February 5, 2026",
    readTime: "6 min read",
    category: "Preparation",
    coverEmoji: "⭐",
    content: `
## Why STAR Fails Most Candidates

Everyone knows STAR: Situation, Task, Action, Result. Yet most behavioral answers are still unfocused, too long, or missing the point. Why?

Because people treat STAR as a checklist instead of a storytelling framework.

A compelling STAR answer isn't four equal boxes — it's a story with stakes, decisions, and a clear resolution. The weight distribution should be roughly:

- **Situation + Task: 15%** — just enough context
- **Action: 60%** — this is what they're evaluating
- **Result: 25%** — quantified impact and what you learned

## The Setup Problem

Most candidates over-explain the situation. The interviewer doesn't need the full company history. Give them enough to understand the stakes — nothing more.

**Weak:** "So I was working at this startup, we had about 40 engineers, and our team was responsible for the checkout flow, which had been built back in 2019 by a different team, and we were in the middle of a replatforming effort when..."

**Strong:** "We had a critical checkout bug causing 12% cart abandonment on mobile. I owned the investigation."

Three sentences. Stakes are clear. Move on.

## The Action Section Is the Interview

This is where candidates reveal their actual level. Interviewers are listening for:

- **Did you identify the real problem**, or just the surface issue?
- **Who did you involve**, and how did you communicate?
- **What trade-offs did you make**, and why?
- **What would you do differently** next time?

Don't just describe what happened — explain your reasoning. "I chose X over Y because..." is infinitely more impressive than "I did X."

## Results That Land

Vague results are almost as bad as no results. Compare:

**Weak:** "The project was a success and the team was happy."

**Strong:** "We reduced mobile cart abandonment from 12% to 3.4%, which translated to roughly $2.1M in recovered annual revenue. More importantly, it led to a refactor that cut our checkout error rate by 60% over the next quarter."

If you don't have exact numbers, use approximations honestly: "roughly," "approximately," "estimated."

## The Question Behind the Question

Every behavioral question maps to a competency. "Tell me about a conflict with a coworker" isn't about the conflict — it's about your emotional intelligence and communication skills.

Before answering, ask yourself: *what quality is this question designed to reveal?* Then make sure your Action section directly demonstrates that quality.

## Practice Smarter

Write out 8-10 core stories from your career. For each one, identify which competencies it demonstrates (ownership, leadership, conflict resolution, failure recovery, etc.). Then you can adapt the same story to multiple questions rather than trying to invent new ones on the spot.
    `,
  },
  {
    slug: "peer-practice-beats-solo-prep",
    title: "Why Practicing Alone Won't Fix Your Interview Anxiety",
    excerpt:
      "Solo prep creates a false sense of readiness. Here's why peer practice is 3x more effective — and how to find the right partners.",
    author: "Aisha Kamara",
    authorRole: "Staff Engineer, ex-Stripe",
    date: "January 28, 2026",
    readTime: "5 min read",
    category: "Strategy",
    coverEmoji: "🤝",
    content: `
## The Solo Practice Illusion

You've read every answer guide. You've rehearsed your stories in the shower. You could recite your greatest weakness in your sleep. Then the actual interview happens and everything falls apart.

This isn't a knowledge problem. It's a performance problem.

Anxiety is fundamentally social. It's triggered by the presence of another person evaluating you — not by the questions themselves. Practicing alone does almost nothing to prepare your nervous system for that social pressure.

## What Peer Practice Actually Does

When you practice with another person, several things happen that solo prep can't replicate:

**1. Real-time eye contact stress.** Being watched activates a different neural pathway than talking to your mirror. Your brain registers social evaluation and produces a mild stress response — exactly what you need to train against.

**2. Unpredictable follow-ups.** A person will ask "why?" or "can you be more specific?" in ways an app cannot anticipate. Learning to handle unexpected redirections in practice makes them feel routine in the real interview.

**3. Non-verbal feedback.** You learn to read subtle cues — when someone looks engaged vs. confused — and adjust in real time. This skill only develops through practice with actual humans.

**4. Accountability.** You show up differently when someone else is counting on you. Cancelled sessions are the biggest killer of interview prep momentum.

## Finding the Right Partners

Not all practice partners are equally useful. The best partners:

- Are at a **similar or slightly higher level** to you (too junior and there's no pressure, too senior and you won't speak freely)
- Are **genuinely in the market** or recently went through the process
- Can give **specific, honest feedback** rather than generic encouragement
- Are willing to **ask follow-up questions** rather than just listening

Avoid practicing exclusively with close friends. Social familiarity reduces the anxiety simulation you need.

## The Optimal Practice Structure

A 45-minute peer session should look like:

- **5 min:** Agree on focus areas (behavioral, technical, system design)
- **20 min:** Candidate 1 answers 2-3 questions with realistic follow-ups
- **10 min:** Debrief — what landed, what felt weak, specific suggestions
- **5 min:** Switch roles / plan next session

The debrief is where the growth happens. Most people skip it.

## How Many Sessions Do You Need?

Research on deliberate practice suggests significant performance improvement after 8-12 sessions of focused, feedback-rich practice. That's roughly 2-3 sessions per week over a month.

The compound effect is real: each session builds on the last, your anxiety baseline drops, and your answers get sharper. By session 8, interview questions start feeling familiar rather than threatening.
    `,
  },
  {
    slug: "system-design-anxiety-engineers",
    title: "System Design Interviews: Why Smart Engineers Freeze Up",
    excerpt:
      "System design questions have no single right answer — and that's exactly what makes them so anxiety-inducing. Here's a framework to approach them confidently.",
    author: "Marcus Torres",
    authorRole: "Principal Engineer, ex-Amazon",
    date: "January 20, 2026",
    readTime: "8 min read",
    category: "Technical",
    coverEmoji: "🏗️",
    content: `
## The Ambiguity Problem

Coding problems have test cases. System design questions have none. You're asked to "design Twitter" or "build a distributed cache" with almost no constraints, and the interviewer watches how you handle the void.

This ambiguity is deliberate — it's testing your engineering judgment, not just your knowledge. But for anxious engineers, open-ended questions are particularly threatening because there's no clear benchmark for success.

## The Framework That Removes Paralysis

Stop trying to jump to the solution. Treat the first 5 minutes as a requirements-gathering phase:

**1. Clarify scale**
- "How many users are we designing for? 100K DAU or 100M?"
- "What's the expected read/write ratio?"
- "Are we optimizing for consistency or availability?"

**2. Define the core use cases**
- Pick 2-3 core user flows to design around
- Explicitly deprioritize edge cases you won't address

**3. Establish constraints**
- "I'll assume we're building this for global scale"
- "I'll use a microservices architecture since this is greenfield"

Spending 5 minutes here accomplishes two things: it narrows the problem space (reducing anxiety), and it shows the interviewer you think like a senior engineer.

## The High-Level Architecture First

Always sketch the 30,000-foot view before diving into components. A simple diagram with:

- Client → Load Balancer → API Gateway
- Core services
- Databases
- Caches
- Async queues

This gives you a map to navigate and shows the interviewer you can think at multiple levels of abstraction.

## Depth Over Breadth

Many engineers try to cover every component at the same level. This is a trap — you'll run out of time and never go deep enough to demonstrate expertise.

Instead, ask the interviewer: "Would you like me to go deeper on the database design, the caching strategy, or the notification system?" Let them guide you toward what they care about. This demonstrates senior judgment — knowing that real engineering is about prioritization.

## Talk Through Trade-offs

The single biggest differentiator between average and excellent system design answers is discussing trade-offs explicitly:

"I could use a relational database here for strong consistency, but given our read-heavy pattern, I'd choose a document store and handle consistency at the application layer. The trade-off is..."

"We could cache aggressively here, but that increases the risk of serving stale data. Given that this is a social feed, I think 30-second eventual consistency is acceptable, so..."

Interviewers aren't looking for the perfect answer — they're looking for evidence that you understand the problem space deeply enough to make principled decisions.

## Practice by Explaining, Not Memorizing

System design can't be memorized. Instead, practice by explaining existing systems to a peer: "How would you design Slack's real-time messaging?" Then have them challenge your assumptions.

This builds the mental flexibility to adapt your knowledge to novel constraints — which is exactly what the interview demands.
    `,
  },
  {
    slug: "confidence-vs-competence-interviews",
    title: "Confidence Affects Hiring More Than You Think",
    excerpt:
      "Studies show that perceived confidence affects hiring decisions by up to 40%. This isn't unfair — here's how to express genuine confidence without faking it.",
    author: "Sarah Lin",
    authorRole: "Engineering Manager & Hiring Lead",
    date: "January 12, 2026",
    readTime: "5 min read",
    category: "Mindset",
    coverEmoji: "💪",
    content: `
## The Uncomfortable Truth

A 2023 study found that candidate confidence levels influenced hiring manager evaluations by approximately 40%, even when controlling for technical accuracy. This isn't about bias toward extroverts — it's about what confidence signals.

Confident candidates communicate that they:
- Understand their own capabilities
- Can handle ambiguity without becoming paralyzed
- Will be able to advocate for their ideas with the team
- Won't need excessive hand-holding on day one

Anxiety-driven hesitation signals the opposite, even when you're technically correct.

## The Difference Between Confidence and Arrogance

Confident engineers:
- Say "I don't know, but here's how I'd find out"
- Challenge assumptions while remaining open to being wrong
- Speak about their impact without qualifying everything
- Make decisions and explain their reasoning

Arrogant engineers:
- Claim certainty they don't have
- Dismiss interviewers' follow-up questions
- Can't say "I don't know"

The goal is not performed confidence — it's actual confidence in your own thinking process, even when you don't have the answer.

## The Language of Confidence

Small language changes make a substantial difference:

**Hedging language (avoid):**
- "I think maybe..."
- "I'm not totally sure but..."
- "This might not be right, but..."

**Confident language (use):**
- "My approach would be..."
- "Based on my experience with X, I'd..."
- "I don't know the answer off the top of my head, but I'd approach it by..."

You can be uncertain and still speak with confidence. "I'd need to investigate this further, but my initial hypothesis is X because Y" is both honest and confident.

## Build Real Confidence Through Evidence

The most durable confidence is evidence-based. It comes from:

1. **Having clear language for your own work** — being able to articulate your impact in every role
2. **Successful practice sessions** — each mock interview you navigate builds a memory of success
3. **Understanding your own preparation** — knowing you've done the work reduces fear of the unknown

Affirmations don't build confidence. Successful reps do.

## The Night Before

Avoid cramming the night before. Instead, spend 15 minutes reviewing your strongest stories and reminding yourself of real things you've accomplished. You're not trying to add new knowledge — you're activating the evidence that you're capable.

Then sleep. Exhaustion tanks confidence more reliably than lack of preparation.
    `,
  },
  {
    slug: "handling-technical-questions-you-dont-know",
    title: "How to Handle Technical Questions You Don't Know",
    excerpt:
      "Every engineer gets stumped. What separates hireable candidates isn't knowing every answer — it's how gracefully they handle not knowing.",
    author: "James Park",
    authorRole: "Senior Engineering Manager, ex-Google",
    date: "January 5, 2026",
    readTime: "4 min read",
    category: "Technical",
    coverEmoji: "🤔",
    content: `
## The Worst Response

"I don't know."

Full stop, silence, waiting for the interviewer to move on. This is the answer that ends interviews. Not because you didn't know — but because you showed you can't work through uncertainty.

## The Best Response

"I haven't worked with that specific technology, but let me reason through how I'd approach it."

Then actually reason through it. Out loud.

## The Reasoning Framework

When you hit an unknown:

**1. Acknowledge it briefly**
"I haven't used X directly, but..."

**2. Identify adjacent knowledge**
"...this sounds similar to [thing I do know] because..."

**3. Apply first principles**
"...the core problem here seems to be [caching/consistency/throughput], and the general approach I'd take is..."

**4. Invite correction**
"...does that reasoning track with how X actually works?"

This demonstrates exactly what senior engineers do every day: they encounter unfamiliar technology constantly and use first principles to navigate it.

## What Interviewers Are Actually Measuring

Technical interviewers know you haven't memorized every API. What they're evaluating:

- **Can you think under pressure?**
- **Do you know enough fundamentals to generalize?**
- **Will you pretend to know things you don't?**
- **Can you learn quickly?**

The candidate who says "I don't know X, here's how I'd think about it" and reasons competently scores higher than the candidate who half-remembers the answer and gets the details wrong.

## Practice Getting Stumped

Most interview prep focuses on questions you can answer. Deliberately practice getting asked questions outside your expertise:

Have a peer ask you about a technology you've never used, then spend 5 minutes reasoning through it out loud. The ability to think transparently is a skill that must be practiced — it doesn't emerge automatically when you're anxious.

## The Transferable Principle

Every time you navigate an unknown well in practice, you build evidence that you can handle it in the real interview. The freeze response weakens with each successful rep of "I don't know, but here's how I'd think about it."
    `,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
