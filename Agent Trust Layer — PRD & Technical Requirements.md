# Agent Trust Layer — PRD & Technical Requirements

Sep 28, 2026 · @Parth Kshirsagar

## Overview

We are building a membership directory of AI agents with trust scores, earned on real tasks judged by vetted human reviewers and re-tested on every agent update.

**Pitch:** A Costco membership for AI agents. Members browse agents we have already vetted, and can submit any agent they are considering for a trust score.

**Problem.** Businesses cannot tell which agents actually deliver. Gartner expects over 40% of agentic AI projects to be cancelled by end of 2027, and estimates only about 130 of thousands of agentic vendors are real ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)). Existing certification (AIUC-1) audits enterprise platforms for security, not task quality.

**Goals**

- Give buyers a single score covering quality, cost and speed for a specific kind of task.
- Keep scores current by re-testing whenever an agent changes version.
- Ground every score in human judgment, with reviewer quality enforced by hidden known-answer tasks.
- Launch in one non-software vertical: lead research.

**Non-goals (for now)**

- Insurance or performance guarantees.
- Software-engineering agents.
- Rating platforms or marketplaces (future extension).
- Real reviewer payouts at the hackathon (Stripe test mode only).

## Users and personas

Buyers pay; reviewers do the judging; agent owners are rated but never pay for their own score.

| Persona | Who they are | What they need | How they pay or earn |
| --- | --- | --- | --- |
| Member (buyer) | Small or mid-size business about to trust an agent with revenue-affecting work | Find an agent that works; compare quality, cost, speed | Monthly membership |
| Submitter | A member vetting a specific agent not yet in the directory | A trust score before committing money | Per-agent vetting fee |
| Reviewer | Vetted expert, globally sourced, paid above local rates | Clear tasks, a rubric, fast payment | Paid per review |
| Agent owner | Vendor whose agent is listed | Visibility and a fair, current score | Pays nothing (avoids conflict of interest) |
| Admin | Our team | Manage tasks, rubrics, reviewer quality, disputes | Internal |

## Product requirements

The hackathon MVP is one end-to-end loop: submit an agent, run tasks, human review, trust score, test payment.

| Feature | Requirement | Priority |
| --- | --- | --- |
| Agent submission | Member submits an agent (API endpoint or hosted URL), picks a task category, pays vetting fee | P0 Hackathon |
| Task library | Curated lead-research tasks with rubric and optional known answer | P0 Hackathon |
| Test runner | Runs each task against each agent; records output, cost, time, agent version | P0 Hackathon |
| Review queue | Reviewers claim outputs, score against rubric, write a reason | P0 Hackathon |
| Reviewer qualification | New reviewers pass a test task before seeing paid work | P0 Hackathon |
| Trust score | Computed per agent version; shown with quality, cost, speed breakdown | P0 Hackathon |
| Directory | Browse and filter agents by category and score | P0 Hackathon |
| Membership billing | Stripe subscription (test mode) | P0 Hackathon |
| Hidden known-answer checks | Ongoing gold tasks slipped into reviewer queues | P1 Post-launch |
| Re-testing on update | Detect version change or schedule; re-run and flag score changes | P1 Post-launch |
| Human baseline | Expert completes same task; show agent vs human cost and time | P1 Post-launch |
| Reviewer payouts | Real cross-border payouts (Stripe Connect plus Wise or Payoneer) | P1 Post-launch |
| Second reviewer and disputes | Two reviews per output; agent owner can contest a score | P2 Later |
| New verticals | Customer-support replies, marketing copy, translation | P2 Later |
| Platform trust scores | Rate marketplaces and platforms that host agents | P2 Later |

**Core user stories**

1. As a member, I browse lead-research agents and see which one scores best for my budget.
2. As a member, I submit an agent I'm considering and get a trust score back.
3. As a reviewer, I pass a qualification task, then review outputs and get paid per review.
4. As an admin, I see each reviewer's accuracy on known-answer tasks and remove unreliable ones.

## Trust score methodology

Each agent version gets a 0–100 score: 60% human-judged quality, 20% cost, 20% speed, shown with a confidence level.

```latex
\text{Trust} = 10 \times (0.6\,Q + 0.2\,C + 0.2\,S)
```

- **Q (quality, 0–10):** mean rubric score across tasks, each review weighted by that reviewer's accuracy on known-answer tasks.
- **C (cost, 0–10):** 10 × min(1, category median cost ÷ agent cost per task).
- **S (speed, 0–10):** 10 × min(1, category median time ÷ agent time per task).
- **Confidence:** Low under 5 reviewed tasks, Medium 5–9, High 10+. Only Medium or High scores are published.

**Lead-research rubric (each 0–10, averaged)**

1. Accuracy: contacts and companies are real and match the brief.
2. Deliverability: emails and phone numbers are valid.
3. Fit: leads match the requested profile (industry, size, role).
4. Completeness: required fields are filled.

**Versioning and re-testing**

- Every score is tied to an agent version (owner-declared version, model name if exposed, or a hash of its declared config).
- A version change triggers a re-test; otherwise agents are re-tested on a schedule (monthly at launch).
- The directory shows score history, and flags any drop of 10+ points.

**Reviewer quality control**

- Qualification: a new reviewer must score within 1 point of the known answer on a test task.
- Hidden known-answer tasks make up about 10% of each reviewer's queue, forever.
- Reviewers whose accuracy falls below 80% are paused and their recent reviews re-checked.
- Every score requires a written reason; empty or copy-pasted reasons are rejected.
- Reviewers may use AI to help, but the reason must reflect their own judgment; gold tasks catch rubber-stamping.

## Business model and metrics

Lead with paid vetting (profitable per sale), then grow the membership directory from those results. All figures below are estimates to validate.

| Revenue line | Price (USD) | Est. cost to serve | Notes |
| --- | --- | --- | --- |
| Membership | $200/month | Shared directory cost | Access to all scores and history |
| Vetting fee | $400 per agent | \~$80–100 per rating | 10 tasks × 2 reviews at \~$3–4, plus compute |
| Enterprise tier | Custom | Custom tasks and rubrics | Later |

**Unit economics (global reviewer pool)**

- One rating costs roughly $80–100 per agent version.
- A 100-agent directory re-tested monthly costs about $8–10k/month, so roughly 40–50 members at $200 break even on review cost.
- Add \~10–20% on payouts for cross-border fees and employer-of-record costs at scale.

**Success metrics**

| Metric | Hackathon target | 90-day target |
| --- | --- | --- |
| Businesses paying for a vetting | Demo only | 10 |
| Agents with a published score | 3–5 | 50 |
| Reviewer accuracy on known-answer tasks | Demo only | ≥ 85% |
| Time from submission to score | Under 10 min (team reviewers) | Under 48 hours |
| Paying members | 0 | 40 |

## Technical architecture

Everything runs on Cloudflare, with Claude powering our own comparison agents and Stripe handling money.

&#91;embedded content: system architecture · 11 components\]

Apps call one API Worker. It queues test runs, which call agents through adapters and save outputs; human reviews feed the score engine, and Cron Triggers enqueue re-tests.

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Cloudflare Pages (React or plain HTML) | Fast deploy, same account as backend |
| API | Cloudflare Workers (TypeScript, Hono) | Serverless, sponsor stack |
| Jobs | Cloudflare Queues | Fan out runs across agents and tasks |
| Database | Cloudflare D1 (SQLite) | Relational data, zero setup |
| Blobs | Cloudflare R2 | Raw agent outputs |
| Scheduling | Cron Triggers | Re-tests |
| Auth | Magic-link email or Cloudflare Access | Simple for the demo |
| AI | Claude API | Wrapper agents, rubric drafting, reason-quality checks |
| Payments | Stripe Checkout, Billing, webhooks (test mode) | Membership and vetting fees |

## Data model

Nine D1 tables; every score and run points to a specific agent version.

| Table | Key fields | Notes |
| --- | --- | --- |
| users | id, email, role (member, reviewer, admin), stripe\_customer\_id, created\_at | One table, role-based access |
| agents | id, name, owner\_url, category, adapter\_type (http, mcp, claude\_wrapper), endpoint, submitted\_by | Listed or submitted agents |
| agent\_versions | id, agent\_id, version\_label, config\_hash, detected\_at | New row on each detected change |
| tasks | id, category, prompt, rubric\_json, is\_gold, gold\_answer\_json, active | Gold tasks are hidden from reviewers |
| runs | id, agent\_version\_id, task\_id, status, output\_r2\_key, cost\_usd, duration\_ms, started\_at | One per agent version × task |
| reviews | id, run\_id, reviewer\_id, scores\_json, overall, reason, is\_gold\_check, created\_at | Reason is required |
| reviewer\_stats | reviewer\_id, qualified, gold\_accuracy, reviews\_count, paused | Drives review weighting |
| scores | id, agent\_version\_id, quality, cost, speed, trust, confidence, computed\_at | Published only at Medium confidence or above |
| payments | id, user\_id, type (membership, vetting, payout), stripe\_id, amount\_usd, status | Mirrors Stripe webhooks |

## APIs and integrations

A small REST API on Workers covers the MVP; Stripe webhooks are the only inbound integration.

| Method | Endpoint | Who | Purpose |
| --- | --- | --- | --- |
| GET | /agents?category=&sort= | Member | Directory with latest scores |
| GET | /agents/:id | Member | Score breakdown and version history |
| POST | /agents | Member | Submit agent; returns Stripe Checkout URL for vetting fee |
| POST | /runs/enqueue | System, Cron | Queue runs for an agent version |
| GET | /reviews/next | Reviewer | Claim next output (may be a hidden gold task) |
| POST | /reviews | Reviewer | Submit rubric scores and reason |
| POST | /reviewers/qualify | Reviewer | Submit qualification task |
| POST | /scores/recompute/:versionId | System | Recompute trust score |
| POST | /webhooks/stripe | Stripe | Payment and subscription events |

**Agent adapters**

- **HTTP:** POST the task prompt to the agent's endpoint, read the response, measure time; cost from the owner's declared price or response metadata.
- **MCP:** call the agent's tool through an MCP client.
- **Claude wrapper:** our own comparison agents, built on the Claude API with different prompts or tools; cost from token usage.

**Stripe flows (test mode)**

1. Membership: Checkout in subscription mode; `customer.subscription.updated` gates directory access.
2. Vetting fee: one-time Checkout; `checkout.session.completed` enqueues the runs.
3. Reviewer payouts: recorded in the payments table only; real payouts later via Stripe Connect, plus Wise or Payoneer where Connect isn't available.

## Non-functional requirements

Score integrity comes first: a leaked gold task or a gamed score destroys the product's value.

| Area | Requirement |
| --- | --- |
| Score integrity | Gold answers never sent to the client; task set rotates; reviewers never see which agent produced an output |
| Security | Agent API keys encrypted at rest (Workers secrets or encrypted D1 column); least-privilege roles; Stripe webhook signatures verified |
| Privacy | Test tasks use synthetic or public data only; no member customer data sent to agents in MVP |
| Reliability | Runs retried up to 3 times with timeout (e.g. 120 s); failed runs recorded, not silently dropped |
| Auditability | Every score traceable to its runs, reviews and reviewer accuracy at that time |
| Performance | Directory loads under 1 s; hackathon submission-to-score under 10 min |
| Compliance (later) | Contractor agreements and tax forms for reviewers; employer-of-record where needed; terms stating scores are opinions, not guarantees |
| Fair pay | Reviewer rates set above local market rate and published |

## Hackathon build plan

There are about 5 working hours between kickoff (9:30) and hacking end (3:30), after lunch and the panel; the end-to-end loop must work by 2:30.

**Team split (assumes 3 people)**

| Role | Owns |
| --- | --- |
| Backend | Workers API, D1 schema, Queues runner, adapters, score engine |
| Frontend | Member directory, submission flow, reviewer app |
| Product and pitch | Tasks and rubrics, seeding agents, Stripe setup, demo script, rehearsal |

**Schedule**

1. 9:30–10:00: Kickoff; lock scope, create Cloudflare and Stripe test accounts, D1 schema.
2. 10:00–12:30: Runner and adapters working against 3–5 agents (include 2–3 Claude wrappers); reviewer app can submit reviews; directory page lists agents.
3. 12:30–1:45: Lunch and panel; one person keeps fixing bugs, others attend and network.
4. 1:45–2:30: Score engine, Stripe Checkout for vetting fee, webhook enqueues runs. Loop works end to end.
5. 2:30–3:00: Invite attendees to try it; seed real reviews; fix what breaks.
6. 3:00–3:30: Freeze code; rehearse pitch twice with a timer.

**Demo script (about 3 minutes)**

1. Hook: a real lead-research agent that returned bounced emails.
2. Submit that agent and pay the vetting fee in Stripe test mode.
3. Show runs completing with cost and time.
4. A judge or attendee reviews one output live.
5. The trust score appears in the directory next to competitors.
6. Close with the 10-second pitch and the membership model.

**Cut list (drop in this order if behind)**

1. Cron re-testing (describe it on a slide).
2. Membership subscription (keep the vetting fee only).
3. MCP adapter (HTTP and Claude wrapper are enough).
4. Admin console (seed tasks directly in D1).

## Risks, open questions and roadmap

The biggest unknown is whether buyers will pay; the first post-hackathon goal is 10 paid vettings.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Buyers won't pay | Fatal | Sell paid vettings before building more |
| Human review cost | Margins | Global reviewer pool; later, humans audit cheaper automated checks |
| Cold start | Membership not worth it | Seed the directory ourselves before charging |
| Vendors block testing | Missing agents | Test as a normal customer; publish "declined to be tested" |
| Liability for a bad top-rated agent | Legal | Terms: scores are opinions, not guarantees; show confidence and date |
| Marketplaces or AIUC add task ratings | Competition | Move fast in one vertical; build the reviewer data moat |
| Cross-border payouts | Ops cost | Stripe Connect where available, Wise or Payoneer elsewhere |

**Open questions**

- [ ] What vetting price do buyers accept: $200, $400, or $800?
- [ ] How often do lead-research agents actually change versions?
- [ ] Can we detect version changes, or must owners declare them?
- [ ] Which countries give the best mix of reviewer skill and cost for US lead research?

**Roadmap**

1. Hackathon: end-to-end loop in lead research, test-mode payments.
2. Month 1: 10 paid vettings; recruit 20 qualified reviewers; hidden gold tasks live.
3. Month 3: 50 scored agents; membership launched; real payouts.
4. Month 6: second vertical (customer-support replies); human baseline comparisons.
5. Later: trust scores for agent platforms and marketplaces.
