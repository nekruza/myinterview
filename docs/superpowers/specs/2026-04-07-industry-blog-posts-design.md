# Industry-Specific Interview Questions Blog Posts

**Date:** 2026-04-07
**Status:** Approved

## Overview

Add 6 new blog posts to `lib/blog.ts`, one per industry. Each post follows a hybrid format: strategic framing + 4–5 common questions with concrete answer guidance. No author attribution.

## Posts

| # | Slug | Title | Category | Emoji |
|---|------|-------|----------|-------|
| 1 | `software-engineering-interview-questions` | The Most Common Software Engineering Interview Questions (And How to Answer Them) | Technical | 💻 |
| 2 | `finance-banking-interview-questions` | The Most Common Finance & Banking Interview Questions (And How to Answer Them) | Preparation | 💼 |
| 3 | `product-management-interview-questions` | The Most Common Product Management Interview Questions (And How to Answer Them) | Strategy | 📋 |
| 4 | `healthcare-interview-questions` | The Most Common Healthcare Interview Questions (And How to Answer Them) | Preparation | 🏥 |
| 5 | `sales-marketing-interview-questions` | The Most Common Sales & Marketing Interview Questions (And How to Answer Them) | Strategy | 📈 |
| 6 | `data-science-ml-interview-questions` | The Most Common Data Science & ML Interview Questions (And How to Answer Them) | Technical | 📊 |

## Post Structure (per post)

1. **Intro** (~2 paragraphs): What makes this industry's interviews distinctive and what interviewers are really evaluating
2. **4–5 Questions**: For each:
   - The question itself (as a heading)
   - Why interviewers ask it (1–2 sentences)
   - How to answer it (concrete structure/example)
3. **Closing prep tip**: One actionable thing to do before the interview

## Metadata

- `author: ""` — no author displayed
- `authorRole: ""` — no role displayed
- `readTime`: estimated per post (~6–8 min read)
- `date`: spread March–April 2026

## Implementation

All changes are confined to a single file: `lib/blog.ts`. Append the 6 new post objects to the `posts` array. No changes needed to routing, page components, or other files — the existing dynamic `[slug]` route and blog index page already handle new posts automatically.

## Out of Scope

- No changes to UI components
- No new files
- No routing changes
