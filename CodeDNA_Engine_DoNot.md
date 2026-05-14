# Code DNA — Engine: What To Never Do
## Strict Rules, Boundaries & Anti-Patterns for the Analysis Engine

> This document exists for one reason — the analysis engine touches real people's code, real careers, and real reputations. Getting this wrong doesn't just break the product. It breaks trust, and in some cases, it can genuinely harm someone's professional life.
> 
> Every engineer working on the fingerprint engine must read this before touching the scoring logic.

---

## Table of Contents

1. [Never Judge a Developer as a Person](#1-never-judge-a-developer-as-a-person)
2. [Never Score Based on Quantity Alone](#2-never-score-based-on-quantity-alone)
3. [Never Penalise Learning Repos](#3-never-penalise-learning-repos)
4. [Never Treat Language Popularity as Quality](#4-never-treat-language-popularity-as-quality)
5. [Never Compare Against an Impossible Standard](#5-never-compare-against-an-impossible-standard)
6. [Never Store or Expose Raw Source Code](#6-never-store-or-expose-raw-source-code)
7. [Never Analyse Private Repos Without Explicit Consent](#7-never-analyse-private-repos-without-explicit-consent)
8. [Never Make Hiring Decisions Sound Definitive](#8-never-make-hiring-decisions-sound-definitive)
9. [Never Punish Experimental or Hackathon Code](#9-never-punish-experimental-or-hackathon-code)
10. [Never Assume Commit Author = Sole Code Author](#10-never-assume-commit-author--sole-code-author)
11. [Never Rate Someone on a Stale Analysis](#11-never-rate-someone-on-a-stale-analysis)
12. [Never Expose One Developer's Score Inside Another's Report](#12-never-expose-one-developers-score-inside-anothers-report)
13. [Never Let the Blind Spot Detector Be Cruel](#13-never-let-the-blind-spot-detector-be-cruel)
14. [Never Apply One Language's Standards to Another](#14-never-apply-one-languages-standards-to-another)
15. [Never Penalise Non-English Naming or Comments](#15-never-penalise-non-english-naming-or-comments)
16. [Never Allow Scores to Be Gamed Easily](#16-never-allow-scores-to-be-gamed-easily)
17. [Never Surface Mental Health Risk Signals](#17-never-surface-mental-health-risk-signals)
18. [Engine Behaviour Checklist](#18-engine-behaviour-checklist)

---

## 1. Never Judge a Developer as a Person

### What this means
The engine analyzes **code patterns**. It does not analyze intelligence, worth, talent, or potential. These are fundamentally different things and the engine must never blur the line.

### What the engine must never output
- "This developer is not skilled"
- "This developer is a poor hire"
- "This developer writes bad code"
- Any language that equates a low score with low value as a person

### What it should output instead
- "This axis scored lower than average — here's what that means and how to improve"
- "This pattern suggests an opportunity to grow in X area"
- Scores are always framed as *current measurable patterns*, never permanent labels

### Why this matters
A junior developer six months into their career will have a very different fingerprint than a senior engineer. Both are valid. The engine must never output something that would make a junior developer feel worthless. That is not what Code DNA is for.

---

## 2. Never Score Based on Quantity Alone

### The trap
More commits ≠ better developer. More lines of code ≠ better developer. More repos ≠ better developer.

### Specific things the engine must never do
- Rank developers higher simply because they have more public repos
- Give a higher commit discipline score just because someone commits 10 times a day (that can actually indicate poor planning)
- Score language depth based on total lines written (10,000 lines of copy-pasted boilerplate means nothing)
- Reward large commits — large commits are often a sign of poor discipline, not productivity

### What quality signals actually look like
- Consistent, meaningful commit messages over time
- Functions that are short, focused, and well-named (not just short)
- Test files that exist AND are substantive (not just `expect(true).toBe(true)`)
- Code that gets refactored and improved across commits, not just added to

### Rule
Every metric must measure **signal quality**, not raw volume. When in doubt, weight quality over quantity.

---

## 3. Never Penalise Learning Repos

### The problem
Most developers have repos with names like `learning-react`, `python-practice`, `dsa-solutions`, `todo-app-v1`. These are intentionally exploratory. The code is expected to be rough. Penalising someone's DNA score for a learning repo is deeply unfair.

### What the engine must do
- Detect learning/practice repos using heuristics:
  - Repo name contains: `practice`, `learning`, `tutorial`, `beginner`, `test`, `demo`, `playground`, `dsa`, `leetcode`, `study`
  - Single-file repos with no meaningful commit history
  - Repos with < 5 commits total
  - Forked repos where the developer has made < 10 original commits
- Exclude these repos from scoring entirely OR create a separate "learning activity" section
- Never let a half-finished todo app drag down someone's readability score

### The rule
If a repo was clearly not meant for production, it must not be treated like production code.

---

## 4. Never Treat Language Popularity as Quality

### What the engine must never do
- Give a higher "language depth" score just because someone uses TypeScript over JavaScript, or Python over PHP
- Penalise developers who work primarily in less trendy languages (PHP, Perl, COBOL, VBA)
- Assume that a Go developer is inherently more skilled than a Ruby developer

### Why this matters
A developer maintaining a massive legacy PHP codebase with clean architecture and excellent test coverage is a far better engineer than someone who writes messy TypeScript. Language choice is often determined by the job, the team, or the domain — not the developer's ability.

### What the engine should do instead
- Score **how well** someone uses their primary language
- Reward consistency, depth, and appropriate use of language features
- Never penalise for language choice itself

---

## 5. Never Compare Against an Impossible Standard

### The trap
If the global average for "test mindset" is 40, and 80% of developers score below 60, displaying "you scored 45 — below average" is technically true but deeply misleading and demoralising.

### What the engine must never do
- Compare developers to an idealised perfect score
- Display raw percentile ranks without context
- Show "below average" labels without immediately explaining what average actually means
- Use language that implies most developers are failing

### What it should do instead
- Always show the global distribution so users can see where average actually sits
- Frame low scores as: "Most developers score in this range — here's how to move up"
- Only use "above average" / "below average" when the distribution is roughly normal and meaningful
- For metrics where almost everyone scores low (e.g., test coverage is notoriously poor across the industry), add a context note: "Most developers score between 20–45 here — this is a hard metric industry-wide"

---

## 6. Never Store or Expose Raw Source Code

### This is non-negotiable

The engine fetches code to analyze it. It must never:
- Store raw source code files in any database
- Log source code in any error tracking system (Sentry, Datadog, etc.)
- Include source code snippets in API responses
- Cache raw file contents beyond the duration of a single analysis job
- Send source code to any third-party service including AI APIs

### What gets stored
Only derived metrics — numbers, ratios, scores, patterns. Never the code itself.

### Implementation rule
The Python analysis microservice processes code in memory. Once metrics are extracted, the raw content is discarded. No exceptions. This must be enforced at the architecture level, not just the policy level.

### Why this matters legally
Storing someone's code — even public code — without explicit consent creates liability. Even public repos have licenses. Caching source code long-term could be a copyright issue. Don't do it.

---

## 7. Never Analyse Private Repos Without Explicit Consent

### The rule
The engine only ever requests `public_repo` scope by default. Private repo analysis is a paid Pro feature that requires:

1. The user explicitly navigating to Settings → Private Repo Access
2. Reading a clear explanation of exactly what will be accessed
3. Clicking a separate "Grant private access" button that triggers a new OAuth flow with `repo` scope
4. A confirmation modal: "This will allow Code DNA to read your private repositories. We will never store your source code."

### What the engine must never do
- Request `repo` scope (full private access) on initial login
- Silently analyze a private repo because the user granted broad access once
- Include private repo data in the public profile without a separate privacy toggle
- Use private repo data in any leaderboard or comparison feature

### Re-authorization
If a user downscopes their GitHub permissions later, the engine must immediately stop accessing private data and delete any cached results from private repos.

---

## 8. Never Make Hiring Decisions Sound Definitive

### The problem
Code DNA will be used by recruiters. This creates risk. The engine must never output anything that sounds like a hiring recommendation.

### What the engine must never say
- "This developer is hire-ready"
- "This developer is not suitable for senior roles"
- "We recommend this candidate for your team"
- Any score that is presented as a definitive measure of employability

### Required disclaimers
Every profile page, every API response used in the hiring dashboard, and every exported report must include:

> "Code DNA measures observable patterns in public code. It is one data point among many. It does not measure intelligence, problem-solving ability, communication skills, cultural fit, or overall engineering judgment. It should never be the sole basis for a hiring decision."

### Why this matters ethically
A developer from a non-English speaking country may score lower on documentation because they comment in their native language. A developer who works primarily in closed-source jobs will have sparse public repos. A developer who writes excellent code for 40 hours a week may not have side projects. None of these people are bad engineers. The engine cannot see any of this context — so it must be humble about what it claims to know.

---

## 9. Never Punish Experimental or Hackathon Code

### What to exclude
- Repos created during a hackathon (detectable by: repo created and last updated within 72 hours, commit messages containing "hackathon", "hack", "24h", "48h")
- Repos explicitly marked as experiments in their README
- Proof-of-concept repos with 1–3 files and no test suite
- Archived repos (GitHub marks these clearly — respect that signal)

### Why
Hackathon code is intentionally written fast. That is the entire point. Penalising someone for not having docstrings during a 24-hour competition tells you nothing useful about them as a developer.

### What to do instead
Surface hackathon activity as a positive signal — "Active hackathon participant" — without analyzing the code quality inside those repos.

---

## 10. Never Assume Commit Author = Sole Code Author

### The problem
Pair programming, code review with suggestions, AI-assisted code, copied snippets, generated boilerplate, and team mob programming sessions all produce commits where the committing developer did not write every line.

### What the engine must never do
- Attribute all code in a commit exclusively to the committing developer
- Score someone's "readability" based on generated boilerplate they didn't write
- Penalise someone for inconsistent naming in files they clearly didn't author (detectable by co-author git trailers)

### What to watch for
- `Co-authored-by:` git trailers — these signal collaborative authorship
- Files that appear fully formed in a single massive commit (often copied or generated)
- Commits with messages like "initial scaffold", "generate boilerplate", "create-react-app init"

### The rule
When authorship is ambiguous, the engine should either exclude that code from scoring or apply reduced weighting. It should never assign full credit or blame for code that wasn't clearly written by the committing developer.

---

## 11. Never Rate Someone on a Stale Analysis

### The problem
A developer's DNA from 2 years ago may look completely different from their current code. Using stale data to represent someone's current ability is misleading and unfair.

### Rules
- Analysis results expire after **30 days** — after which the profile shows a "last analyzed 30+ days ago" warning
- Expired profiles must not appear in leaderboards or teammate matching results
- The API must include an `analyzed_at` timestamp in every response so consumers can decide how to handle staleness
- The hiring dashboard must prominently show when a profile was last analyzed

### What the engine must not do
- Serve a 6-month-old fingerprint as if it represents the developer today
- Include stale profiles in "trending" or "active" sections
- Cache analysis results indefinitely without a forced refresh mechanism

---

## 12. Never Expose One Developer's Score Inside Another's Report

### The rule
When Developer A views their own profile, they must never see:
- The raw scores of Developer B unless B has a public profile
- The identity of developers in the "similar DNA" section if those developers have set their profiles to private
- Commit patterns or language stats of other developers derived from shared repos

### In the Compare feature
- Both developers must either have public profiles OR both must be logged in and consent to the comparison
- Comparison data must not be cached in a way that could expose private profile data to third parties

### In the Teammate Finder
- Private profiles must appear as "Anonymous Developer — [type] — [top language]" with no username or identifiable information
- Opt-out from matching must be immediate and respected within one analysis cycle

---

## 13. Never Let the Blind Spot Detector Be Cruel

### This is a UX and ethics rule

The blind spot detector is the most sensitive feature in the product. It tells someone that what they think they know — they don't actually know. That can sting. The engine must handle this with care.

### What it must never do
- Use language like "you lied about", "you falsely claimed", "this is misleading"
- Display a large red warning label on the main profile with a skill the user claimed
- Surface blind spots in the public profile view (this is private, for the user only)
- Generate blind spot data for someone who hasn't opted in to that section

### What it should do
- Frame everything as an opportunity: "Java shows limited recent activity — consider some projects to build this up"
- Show a trend line — "This was stronger 18 months ago, has declined recently" is very different from "you don't know this"
- Always pair a blind spot with a concrete, actionable suggestion
- Keep this section collapsible so users can choose when to engage with it

### The golden rule
The blind spot detector should make the user feel motivated, not ashamed. If the copy could make someone close their laptop and feel bad about themselves, rewrite it.

---

## 14. Never Apply One Language's Standards to Another

### The problem
A Python developer who writes snake_case is following the language's official style guide (PEP 8). Penalising them for "inconsistent naming" when compared to a camelCase standard designed for JavaScript is a bug, not a feature.

### What the engine must always do
- Detect the primary language of each file before applying any style analysis
- Apply language-specific standards:
  - Python → PEP 8 (snake_case, 79-char lines, docstrings)
  - JavaScript/TypeScript → Airbnb / ESLint standard (camelCase, JSDoc)
  - Go → gofmt standard (no negotiation — Go is self-opinionated)
  - Ruby → Ruby style guide (snake_case, 2-space indent)
  - Java → Google Java Style (PascalCase classes, camelCase methods)
- Never compare cross-language style metrics directly

### What it must never do
- Run a Python file through JavaScript naming rules
- Penalise Go code for not having comments on every function (Go has godoc conventions that differ)
- Compare function length across languages without normalizing for language verbosity

---

## 15. Never Penalise Non-English Naming or Comments

### The rule
A developer who writes comments in Telugu, Hindi, Portuguese, Arabic, or any other language is not a worse developer than someone who writes in English. Code comments in any language are better than no comments.

### What the engine must never do
- Flag non-English comments as "documentation quality: poor"
- Score naming conventions lower because variable names use transliterated non-English words
- Treat any human language as less valid than English in code

### What the engine should do
- Detect the language of comment blocks and simply note it: "Comments written in Portuguese"
- Score documentation quality based on the **presence and coverage** of comments, not their language
- For naming conventions, score only on structural consistency (snake_case vs camelCase uniformity), not on the words themselves

### Why this matters
Code DNA will be used by developers across India, Brazil, China, Eastern Europe, and beyond. Embedding English bias into the scoring model would make the product actively discriminatory against non-native English speakers. This is not acceptable.

---

## 16. Never Allow Scores to Be Gamed Easily

### Common gaming attempts to defend against

| Gaming attempt | What it looks like | How to defend |
|---|---|---|
| Commit flooding | 100 tiny commits in one day to boost "commit frequency" | Cap daily commit weight, detect suspiciously uniform commit sizes |
| Comment stuffing | Adding thousands of empty `# comment` lines | Measure comment-to-logic ratio, not raw comment count |
| README inflation | Giant README with no actual code quality | README quality is one small signal, never a dominant one |
| Star farming | Creating repos that get stars but have no real code | Stars are not a scoring input at all |
| Fake test files | Adding empty test files to boost "test mindset" score | Require test files to have assertions above a minimum threshold |
| Language claiming | Adding one file in 20 languages | Language depth requires minimum 500 substantive lines |

### The general principle
Every metric must be hard to game without actually improving as a developer. If someone can boost a score by doing something that doesn't make them better, the metric is wrong.

---

## 17. Never Surface Mental Health Risk Signals

### This one is important

The engine has access to commit timestamps. It can detect if someone commits at 3am every night for months. It can detect irregular patterns that might correlate with burnout, stress, or worse.

### What the engine must never do
- Flag late-night coding patterns as a wellness concern
- Display "burnout risk" or any mental health adjacent label
- Use commit frequency drops to suggest a developer is struggling
- Include any mental health inference in any report, public or private

### Why
Code DNA is a code analysis tool. It has no clinical expertise. Any attempt to infer mental health from commit patterns would be inaccurate, inappropriate, and potentially harmful. It is entirely outside the product's scope and the engine must enforce this at the output level.

### What to do with timing data instead
Use it only for neutral, factual observations: "Most active between 9pm–12am IST" — framed as a work style insight with no wellness judgment attached.

---

## 18. Engine Behaviour Checklist

Before any new scoring metric or output is shipped, run through this checklist:

### Fairness checks
- [ ] Does this metric disadvantage developers from non-English speaking backgrounds?
- [ ] Does this metric disadvantage junior developers unfairly compared to seniors?
- [ ] Does this metric disadvantage developers whose primary work is in closed-source repos?
- [ ] Does this metric punish legitimate code styles from specific languages or ecosystems?
- [ ] Could this metric be gamed without the developer actually improving?

### Safety checks
- [ ] Does any output sound like a hiring recommendation?
- [ ] Does any output sound like a judgment of the developer as a person?
- [ ] Is any raw source code being stored or logged anywhere?
- [ ] Is private repo data being accessed without explicit re-authorization?
- [ ] Is any mental health inference being surfaced?

### UX checks
- [ ] Is every low score paired with a constructive, actionable message?
- [ ] Is the blind spot detector copy motivating rather than shaming?
- [ ] Is the analysis timestamp visible so users know how fresh the data is?
- [ ] Are learning repos and hackathon repos excluded from scoring?

### Data checks
- [ ] Is the analysis based on data that is less than 30 days old?
- [ ] Are excluded repos (user-specified) correctly filtered out?
- [ ] Is the global distribution shown alongside the user's score?
- [ ] Is co-authorship handled correctly so no one is scored on code they didn't write?

---

> If a feature, metric, or output fails even one item on this checklist — it does not ship.
> 
> The engine's job is to help developers understand themselves better and grow. The moment it starts making developers feel judged, exposed, or unfairly evaluated — it has failed at its core purpose.

---

*This document should be reviewed every time a new scoring axis is added, a new data source is integrated, or the output language of the engine changes.*

*Last principle: when in doubt, be kind. The person reading their DNA report is a real human being who cares about their work.*
