# MyInterview Strategy Document

**Date:** 2026-04-24
**Based on:** Mixpanel analytics (last 30 days), Supabase database, codebase audit, multi-agent strategic debate

---

## 1. Mixpanel Data Summary (Last 30 Days)

### Active Users
- **491 unique users** (total tracked)
- **~300-350 estimated real users** (after filtering bot traffic from cloud data center cities: Boardman OR, Ashburn VA, Des Moines IA)
- **Growth: +0.61%** (effectively flat)
- **Daily activity:** Spiked to ~75/day around Apr 6, crashed to ~15/day after Apr 13
- **Events today (Apr 24):** Only 21 total events

### Funnel Conversion (4-step CTA Click Funnel)
| Step | Event | Users | Conversion |
|------|-------|-------|-----------|
| 1 | Page View | 491 | 100% |
| 2 | Element Click | 103 | 20.98% |
| 3 | CTA Clicked | 57 | 55.34% of step 2 |
| 4 | Session Start | 16 | 28.07% of step 3 |
| **Overall** | | | **3.26%** |

**Key drop-offs:**
- 79% of visitors bounce without any interaction
- 72% drop between CTA click and session start (onboarding friction)

### Retention
- **30.49% overall** ("Any event and then Any event")
- **Retention curve:** ~30% at <1 week -> ~8% at Week 1 -> ~5% at Week 2 -> ~0% by Week 3-4
- **Average retained users:** 15.77

### Geographic Distribution

**By Country:**
| Country | Users |
|---------|-------|
| United States | 293 |
| United Kingdom | 96 |
| India | 29 |
| China | 17 |
| Germany | 8 |
| Sweden | 6 |
| Pakistan | ~4 |

**By City:**
| City | Users | Notes |
|------|-------|-------|
| San Jose | 117 | Silicon Valley |
| (not set) | 86 | Location data missing |
| Santa Clara | 77 | Silicon Valley |
| Stratford | 14 | UK |
| Council Bluffs | 10 | Likely bot (data center) |
| London | 10 | UK |
| Hyderabad | 9 | India |
| Des Moines | 7 | Likely bot (data center) |
| Boardman | 6 | Likely bot (AWS region) |
| Mumbai | 5 | India |
| Ashburn | 5 | Likely bot (AWS region) |
| Birmingham | 5 | UK |

**Key insight:** 194 users (40%+) from San Jose + Santa Clara alone. Strong Silicon Valley cluster.

### Event Tracking State
- **Almost entirely autocapture** -- no meaningful custom instrumentation
- Events tracked: `[Auto] Page View`, `[Auto] Element Click`, `[Auto] Input Change`, `[Auto] Form Submit`, `Session Recording`
- **Custom events in codebase (sparse):**
  - `CTA Clicked` (with button name and location)
  - `Waitlist Joined` / `Waitlist Signup`
  - `FAQ Opened`
  - `landing_practice_now_clicked`
- **User identity:** All Distinct IDs are `$device:` based. `identify()` exists in code (`AppLayoutClient.tsx`) but most tracked activity is anonymous/landing-page visitors
- **Session recording:** Set to 100% of sessions

### What Is NOT Tracked (Critical Gaps)
- Interview session started / completed / abandoned
- Questions answered (count, topic, time spent)
- Resume uploaded / parsed
- AI feedback viewed / rated
- Sign-up completed
- Login events
- Payment completed (only CTA click, not Stripe webhook)
- Error states (AI failures, upload failures)
- Feature usage within the app
- UTM parameters / traffic source attribution

---

## 2. Supabase User & Session Data

### Database Overview
| Table | Rows | Purpose |
|-------|------|---------|
| profiles | 29 | Registered users |
| interview_sessions | 271 | AI mock interviews |
| progress_scores | 114 | Competency assessments |
| subscriptions | 29 | User plans |
| user_streaks | 7 | Practice streaks |
| peer_sessions | 0 | Peer practice (unused) |
| peer_availability | 0 | Peer scheduling (unused) |
| peer_session_participants | 0 | Peer participants (unused) |
| user_feedback | 0 | Session feedback (unused) |
| resume_profiles | 0 | Parsed resumes (unused) |
| notifications | 0 | User notifications (unused) |
| waitlist | 2 | Waitlist signups |
| signups | 4 | Form signups |
| contact_messages | 3 | Contact form |
| job_applications | 4 | Career page applications |

### User Profiles (29 registered users)
| Metric | Value | Implication |
|--------|-------|-------------|
| Completed onboarding | 19/29 (65.5%) | 10 users dropped off during onboarding |
| Has practiced at least once | 11/29 (37.9%) | 18 users signed up but never practiced |
| Average sessions used | 1.2 | Very low engagement |
| Max sessions by one user | 12 | One power user |
| Total sessions tracked in profiles | 36 | Spread thin across users |
| Uploaded a resume | 12/29 (41.4%) | Decent adoption of resume feature |
| Has Stripe customer ID | 1/29 (3.4%) | Only 1 user ever reached payment |
| Used peer sessions | 0/29 (0%) | Nobody has used peer practice |
| Average credits remaining | 7.1 | Users not consuming free credits |
| Users with 0 credits | 2 | Only 2 ran out |

**Critical insight:** Of 29 registered users, only 11 ever practiced, and only 1 ever paid. The product has an activation crisis -- most users sign up but never experience core value.

### Experience Level Distribution
| Level | Users |
|-------|-------|
| Mid-level | 6 |
| Student | 5 |
| Senior | 5 |
| Junior | 2 |
| Staff | 1 |
| Not set | 10 |

### Target Roles (diverse, not tech-only)
| Role | Users |
|------|-------|
| Fullstack developer | 3 |
| ML engineer | 2 |
| Frontend developer | 1 |
| Mobile developer | 1 |
| QA | 1 |
| Senior Software Engineer | 1 |
| Plant manager | 1 |
| Production/manufacturing apprentice | 1 |
| PhD | 1 |
| Director for International Cooperation | 1 |
| Maintenance technician (wastewater) | 1 |
| Supply chain manager | 1 |
| General | 1 |

**Key insight:** Target roles are split roughly 50/50 between tech and non-tech. This validates the founder's instinct to keep the product industry-agnostic.

### Acquisition Source ("How did you hear about us?")
| Source | Users |
|--------|-------|
| Google | 7 |
| LinkedIn | 6 |
| Friend | 2 |
| YouTube | 1 |
| Not set | 13 |

**Key insight:** Google and LinkedIn are the primary channels. Word-of-mouth (friend) exists but is tiny. 13/29 didn't answer -- onboarding should require this field.

### Practice Partner Preference
| Preference | Users |
|------------|-------|
| AI only | 17 |
| Both (AI + human) | 2 |
| Not set | 10 |

**Key insight:** Overwhelmingly AI-only preference. Only 2 users expressed interest in peer practice -- confirms agents' consensus to delay peer matching.

### Interview Sessions (271 total)

**All sessions are AI type. Zero peer sessions have ever occurred.**

| Metric | Value | Implication |
|--------|-------|-------------|
| Total sessions | 271 | |
| Completed | 59 (21.8%) | 78% of sessions are abandoned |
| Still "active" (abandoned) | 212 | Massive drop-off mid-session |
| Average score | 17.9/100 | Very low -- potentially discouraging |
| Min score | 0 | |
| Max score | 75 | |

**Critical insight:** 78% of interview sessions are never completed. Users start but don't finish. This, combined with an average score of 17.9/100, suggests the sessions may be too long, too hard, or the scoring too harsh -- all of which would kill motivation and retention.

### Session Topics
| Topic | Sessions | % |
|-------|----------|---|
| Technical interview | 225 | 83.0% |
| Leadership | 34 | 12.5% |
| Behavioural | 7 | 2.6% |
| Collaboration | 2 | 0.7% |
| Conflict resolution | 2 | 0.7% |
| Case interview | 1 | 0.4% |

**Key insight:** Technical interviews dominate at 83%. Despite diverse target roles, users overwhelmingly practice technical questions. Leadership is a distant second.

### Weekly Session Activity
| Week | Sessions | Completed | Unique Users |
|------|----------|-----------|-------------|
| Apr 13 | 7 | 3 | 2 |
| Apr 6 | 36 | 12 | 7 |
| Mar 30 | 46 | 8 | 5 |
| Mar 23 | 38 | 4 | 1 |
| Mar 2 | 5 | 1 | 1 |
| Feb 23 | 41 | 8 | 1 |
| Feb 16 | 96 | 23 | 1 |
| Feb 9 | 2 | 0 | 1 |

**Critical insight:** Most weeks have only 1-2 unique users creating sessions. The Feb 16 week (96 sessions from 1 user) is almost certainly founder/developer testing. The Apr 6 "spike" was only 7 actual users. Real organic usage is extremely low.

### Competency Scores (Progress Tracking)
| Competency | Avg Score (/100) | Assessments |
|------------|-----------------|-------------|
| Technical | 28.7 | 33 |
| Communication | 26.8 | 17 |
| Problem solving | 22.6 | 17 |
| Technical depth | 25.0 | 9 |
| System design | 19.4 | 9 |
| Confidence | 18.8 | 8 |
| STAR framework | 14.4 | 8 |
| Leadership | 87.1 | 7 |
| Collaboration | 95.0 | 2 |

**Key insight:** Core technical competencies all score below 30/100. Either the scoring is too harsh (demotivating users) or users genuinely need massive improvement. The leadership/collaboration scores are much higher but have tiny sample sizes. The scoring calibration needs investigation -- if users consistently score 15-25/100, they may feel hopeless and leave.

### Subscription & Revenue Status
- **All 29 users are on the free plan**
- **Zero paid subscriptions**
- **1 user has a Stripe customer ID** (may have purchased session credits)
- **Current MRR: effectively $0**

### User Streaks
| User | Current Streak | Longest Streak | Last Practice |
|------|---------------|----------------|---------------|
| User 1 | 2 | 5 | Apr 7 |
| User 2 | 1 | 1 | Apr 16 |
| User 3 | 1 | 1 | Apr 17 |
| User 4 | 1 | 1 | Apr 11 |
| User 5 | 1 | 1 | Apr 6 |
| User 6 | 1 | 1 | Apr 6 |
| User 7 | 1 | 1 | Apr 3 |

Only 7 users have any streak data. The longest streak ever is 5 days. No user has practiced since Apr 17 (a week ago). The streak/gamification feature exists but isn't driving retention.

### Unused Infrastructure (Built But Never Used)
The database has full schema for features with **zero usage:**
- `peer_sessions` / `peer_availability` / `peer_session_participants` -- Peer practice fully built, 0 sessions
- `notifications` -- Notification system built, 0 notifications sent
- `user_feedback` -- Feedback collection built, 0 feedback received
- `resume_profiles` -- Resume parsing pipeline built, 0 parsed profiles
- `user_preferences` -- Preference system built, 0 preferences saved

**Key insight:** Significant engineering effort went into features nobody has used. This is a classic pre-PMF over-building trap. The peer practice tables, notification system, and resume parsing pipeline are all dead code from a product perspective.

---

## 3. Codebase Context

- **Stack:** Next.js 16 (App Router), React 19, Supabase (auth + DB), Stripe, Vercel
- **AI Provider:** Anthropic SDK in dependencies, but monetization agent discovered actual usage may be Gemini Flash Lite -- API costs ~$0.01-0.03/session (96%+ gross margin)
- **Analytics:** Mixpanel (autocapture enabled), Vercel Analytics
- **Resume parsing:** `pdf-parse` and `mammoth` (PDF + DOCX support)
- **Mixpanel init:** `lib/mixpanel.ts` -- autocapture on, 100% session recording, EU API host
- **Custom tracking calls:** Only in landing page components (Navigation, Hero, Pricing, FAQ, Features, Waitlist). Zero tracking inside the actual app experience.

---

## 3. Revised Strategic Insights (Post-Supabase Data)

### The real numbers are much worse than Mixpanel suggested
- Mixpanel shows 491 users, but Supabase has only **29 registered profiles**
- Of those 29, only **11 ever practiced** and only **1 ever paid**
- The 491 Mixpanel users are almost entirely anonymous landing page visitors who never signed up
- The "product" effectively has **~7 weekly active users** at peak, not 491

### Session abandonment is the #1 product problem
- 78% of interview sessions are never completed (212 of 271 abandoned)
- Average score is 17.9/100 -- likely demoralizing users
- Users start a session, get a discouraging score or find it too long, and never come back
- **Fix: shorter sessions, gentler scoring curve, or progressive difficulty**

### Over-engineering before PMF
- Peer practice, notifications, resume parsing, streaks -- all built, all unused (0 rows)
- Engineering time was spent on features before validating the core loop works
- **Fix: freeze feature development, focus entirely on making AI mock interview completion rate go from 22% to 60%+**

### The pricing problem is confirmed
- All 29 users are on free plan. Zero paid subscriptions. $0 MRR.
- Users start with 3 free credits and average 7.1 remaining (not consuming free credits)
- The free tier is generous enough that nobody needs to pay
- **Fix: reduce free tier, add clear upgrade trigger, implement 30-day sprint pricing**

### Target roles validate the industry-agnostic approach
- Roughly 50/50 split between tech roles (fullstack, ML, frontend, mobile, QA) and non-tech roles (plant manager, supply chain, maintenance technician, PhD, director)
- Do not niche to tech-only -- the data shows real demand across industries

---

## 4. Multi-Agent Strategic Debate

### Agent 1: Growth Strategist
**Core argument:** Distribution problem, not product problem. Need viral loops.

- B2B is a "growth graveyard" at this stage -- no case studies, no SOC 2, 6-month sales cycles
- Career companion idea is scope creep for 300 users
- Fastest path to 10K users: Shareable scorecards on LinkedIn, scheduled peer cohorts on Reddit/Discord, invite loop in every session
- Spike-and-crash pattern (Apr 6-13) = one-time launch marketing, not sustainable growth
- LinkedIn is the primary channel -- users are tech workers who live there
- Recommends niching to tech initially despite founder's objection -- "the moat is never the code, it's the community"

### Agent 2: Product Strategist
**Core argument:** No product-market fit yet. Build the Interview Readiness Score.

- "You don't have a retention problem because you don't have a product yet" -- can't see what happens after CTA click
- The product needs a composite Interview Readiness Score benchmarked against cohort data (like Duolingo's streak/XP)
- Peer practice is a trap at current scale -- needs 10x users to function
- B2B play should be an embeddable Score widget, not a platform sale -- become infrastructure, not a destination
- Build order: (1) Real tracking, (2) Interview Score + trends, (3) Shareable scorecard, (4) Embed/API for B2B
- "Make one mock interview session so unreasonably good that people screenshot their score and post it. That is the entire strategy."

### Agent 3: Monetization Strategist
**Core argument:** Revenue model is wrong. Switch to 30-day sprints, sell to bootcamps.

- API costs are ~$0.01-0.03/session -- margins are 96%+. No cost problem, revenue problem
- Session packs are wrong -- switch to "30-Day Interview Sprint" at $39-49 with unlimited sessions
  - Matches 2-4 week interview prep psychology
  - Removes "am I wasting a credit?" anxiety
  - Even power users (5 sessions/day x 30 days) cost ~$1.20 in API
- Path to $100K MRR: Bootcamps (not universities -- too slow procurement)
  - 50-200 students per cohort, 3-4 week cycles, one decision-maker
  - 100 bootcamps x 100 seats x $20/seat x 4 cohorts/year = $800K ARR
- Fix the 72% onboarding drop (57 CTA clicks -> 16 sessions) before building anything new
- "Stop building features. Start selling."

### Agent 4: Marketplace & Network Effects Strategist
**Core argument:** Peer practice will kill the app if built now. Wait for density.

- 300 users across all timezones/industries = 2-5 users online at any moment. Not a cold start -- an empty room
- Failed matches ("Find Partner" -> wait -> nothing) make the entire product feel dead. Worse than not having the feature
- Pramp worked because they launched into ONE homogeneous vertical (SWE interviews). Matching a PM in San Jose with a marketer in London produces terrible match quality
- AI fallback for no-match means "peer practice" = "the same AI with extra steps." Trust evaporates
- Minimum viable liquidity: 5,000+ weekly actives before open matching
- B2B cohorts solve the density problem for free -- a bootcamp hands you 100 users in same vertical, timezone, skill level
- "The founders who win marketplace games are the ones who resist launching the marketplace too early"

### Consensus Across All 4 Agents
| Point | Agreement |
|-------|-----------|
| Instrument tracking properly before any new features | 4/4 |
| Build a shareable Interview Score / Scorecard | 4/4 |
| Peer practice is too early (need 5-10x users first) | 4/4 |
| Fix the funnel (79% bounce + 72% onboarding drop) | 4/4 |
| B2B via bootcamps is fastest revenue path | 3/4 |
| Niche down initially, expand later | 3/4 |

### Key Disagreements
| Topic | Growth | Product | Monetization | Marketplace |
|-------|--------|---------|-------------|-------------|
| Build peer practice now? | Yes (cohorts) | No | No | No |
| Niche to tech? | Yes | Neutral | Neutral | Yes |
| B2B now? | No (too early) | Yes (as embed) | Yes (bootcamps) | Yes (for density) |

---

## 5. Core Strategic Insights

### Interview prep is episodic, not habitual
Users come when job hunting (2-4 weeks), then disappear. This is not a bug -- it's the nature of the category. Strategy must align with this reality:
- Charge per cycle, not per month
- Front-load value in first session
- Build viral/referral loops since retention-based growth won't work
- Track "sessions per job search cycle" not DAU

### The real moat candidates (ranked)
1. **Data moat** -- Scored sessions + benchmarking. Every session makes the product smarter. Competitors start from zero.
2. **Network effects** (future) -- Peer practice creates true defensibility, but only with density.
3. **B2B distribution** -- Bootcamp/university contracts create switching costs and recurring cohorts.
4. **Brand** -- Being the category leader for AI interview prep.

### Bot traffic is inflating metrics
Cloud data center cities (Boardman, Ashburn, Des Moines, Council Bluffs) account for ~30-50 users. Real user base is ~300-350. All strategic decisions should use the lower number.

### The Apr 6 spike source is unknown
Whatever drove ~75 users/day around Apr 6 was effective but unsustained. Identifying this source is critical -- it's the difference between a repeatable channel and a lucky break.

---

## 6. Recommended 90-Day Plan

### Phase 1: Fix What's Broken (Weeks 1-3)
- [ ] **Instrument the full funnel** -- track: session started, session completed, score viewed, score shared, signup completed, login, payment completed (Stripe webhook), errors
- [ ] **Fix user identity chain** -- link anonymous `$device:` IDs to authenticated users via `alias()` + `identify()`
- [ ] **Fix the onboarding drop** -- 72% loss between CTA click and session start. Reduce signup friction, consider letting users try one question before signup
- [ ] **Filter bot traffic** -- exclude data center IPs/cities from Mixpanel reports
- [ ] **Track UTM parameters** -- attribute traffic sources to understand the Apr 6 spike

### Phase 2: Build the Score Engine (Weeks 4-8)
- [ ] **Interview Readiness Score** -- composite score across communication, technical depth, behavioral structure, confidence
- [ ] **Benchmarking** -- "Your answer scored in the top 20% for [Role] candidates"
- [ ] **Progress tracking** -- score history, trends, improvement over sessions
- [ ] **Shareable scorecard** -- one-click share to LinkedIn/Twitter with score breakdown. This is both the product hook AND the viral growth loop
- [ ] **Switch pricing to "30-Day Interview Sprint"** at $39-49 unlimited sessions

### Phase 3: B2B Bootcamp Push (Weeks 8-12)
- [ ] **Build a Team tier** -- 10 seats for ~$149 (entry price for bootcamps)
- [ ] **Manually sell 5-10 bootcamps** -- use the Interview Readiness Score as the value prop
- [ ] **Each bootcamp = 50-200 users** with natural cohort density, same vertical, same timezone
- [ ] **Embeddable Score widget** for bootcamp career dashboards (optional)

### Phase 4: Peer Practice (After 5K+ Weekly Actives)
- [ ] **Scheduled cohorts first** -- "Tuesday 7pm PST, Product Management Interview Prep"
- [ ] **B2B cohorts as beta** -- bootcamp students already grouped by vertical/timezone
- [ ] **Open matching only at 5K+ weekly actives** -- minimum viable liquidity threshold
- [ ] **AI-augmented sessions** -- AI observes peer interviews and scores both participants
- [ ] **Trust/rating system** -- build match quality over time

---

## 7. Key Metrics to Track

### North Star Metrics (episodic product)
| Metric | Target | Why |
|--------|--------|-----|
| Sessions completed per user per cycle | 5-10 | Core value delivery |
| % users completing 3+ sessions | >40% | Activation threshold |
| Interview Readiness Score shared | >10% of users | Viral coefficient |
| Return rate (>30 day gap) | >15% | Job cycle retention |

### Funnel Metrics (fix immediately)
| Metric | Current | Target |
|--------|---------|--------|
| Page View -> First Interaction | 21% | 40%+ |
| CTA Click -> Session Start | 28% | 60%+ |
| Overall Conversion | 3.26% | 10%+ |

### Revenue Metrics
| Metric | Current | 90-Day Target |
|--------|---------|---------------|
| MRR | Unknown | $10K |
| ARPU | ~$5-6 (session pack) | $39-49 (sprint) |
| B2B contracts | 0 | 5-10 bootcamps |
| API cost per session | ~$0.01-0.03 | Same (96%+ margin) |

### Growth Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Real weekly active users | ~50-75 | 500+ |
| Scorecard shares | 0 (not built) | 50+/week |
| Referral conversion | 0 (no loop) | K-factor 0.3 |

---

## 8. What NOT to Build

- Career companion / career tracking platform (scope creep)
- Open peer matching (too early, empty room problem)
- Resume features beyond current parsing (not core)
- Subscription model (misaligned with episodic usage)
- Features requiring user density you don't have

---

## 9. Open Questions

1. What caused the Apr 6 traffic spike? (Check social posts, ad campaigns, Reddit/HN mentions around that date) 
answer: Google Ads campaign
2. What is the actual AI provider -- Anthropic Claude or Gemini Flash Lite? (Affects unit economics)
answer: Gemini Flash Lite
3. What happens after session start? (Currently zero visibility -- instrument this first)
User can see AI and start practicing
4. What does the current onboarding flow look like? (Where is the 72% drop happening?)
check codebase 
5. Are there any existing bootcamp/university relationships to leverage?
no
6. What is current MRR / revenue? (Stripe data needed)
0