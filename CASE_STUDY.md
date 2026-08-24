# Next: An AI-Native Task Initiator for ADHD Minds

**Submitted by:** PHAM, Huong Linh
**Role:** Apprentice, AI / Software Engineering — Liminal

---

## 1. The Problem

ADHD affects roughly 5% of adults worldwide. The single most debilitating symptom isn't distractibility — it's **task initiation failure**. You know what you need to do. You want to do it. You physically cannot start.

Every existing productivity tool makes this worse. They show you the *entire* task list: 47 items, nested subtasks, color-coded priorities, due dates in red. For an ADHD brain, that's not organization — it's paralysis. The tool itself becomes the obstacle.

I have ADHD. I know this problem viscerally. The gap isn't "what to do" — it's the 20-minute wall between deciding to do something and physically beginning the first motion.

**Why this matters beyond personal experience:** Untreated ADHD costs the U.S. economy $122.8 billion annually in lost productivity (Journal of Clinical Psychiatry, 2020). Task initiation is the bottleneck, and no tool addresses it at the right layer.

### The 6-Friction Framework

Through personal experience and research, I've identified six friction types that block ADHD task initiation:

| Friction | Example | How tools make it worse |
|---|---|---|
| **Decision** | "Which task should I start?" | Show you all 47 tasks at once |
| **Access** | "Where do I even open this?" | Require 4 clicks to get to the right screen |
| **Ambiguity** | "What does 'work on report' actually mean?" | Let you write vague task names |
| **Time-scope** | "This will take 3 hours, I can't face that" | Show total time estimates |
| **Emotional weight** | "What if I do it wrong?" | Surface deadlines, dependencies, stakes |
| **Perfectionism** | "I need the right setup before I start" | Offer templates, frameworks, prep steps |

**The thesis:** All six frictions must be reduced to near-zero *simultaneously*. Fixing one while leaving others intact doesn't help — the brain routes around the remaining friction and stays stuck.

---

## 2. The Solution: Next

**Next** is an ADHD-native task initiator that uses an LLM to hold the full task decomposition in its context and surfaces only one thing: **the next physical action.**

### The Core Insight

LLMs are the first tool that can:
1. Take a vague task ("work on my case study") and decompose it into 5–15 second physical actions ("Open a browser tab," "Navigate to Google Docs," "Click the + Blank button")
2. Hold the full decomposition tree in context
3. Show only the leaf node — the single next action
4. When someone says "I can't," re-decompose that single action into even smaller steps

No previous tool could do this. Rule-based systems can't handle the infinite variety of human tasks. A checklist app requires the human to decompose (which is itself a task requiring initiation). An LLM can do the cognitive work the ADHD brain cannot.

### The Design: Full-Screen Takeover

Next doesn't send you a notification. Notifications are dismissable — and dismissing things is what ADHD brains do.

Instead, Next takes over the entire screen, like an alarm clock:

> **2:30 PM**
> You wanted to start the case study 20 minutes ago.
> Let's begin.
>
> # Open Google Docs
>
> **[ Start now ]**
> *5 more minutes*

The key properties:
- **Full-screen black** — no other UI, no distractions, no escape route
- **One action** — not the task, not the plan, just the next physical motion
- **Two buttons** — "Done" (advance) or "I can't" (re-decompose smaller)
- **No dismiss** — like an alarm, you must engage with it

After you tap "Done," the next action appears. And the next. Each one takes 5–15 seconds. Before you know it, you've been working for 10 minutes. Initiation has already happened.

### How "I Can't" Works

This is where the LLM matters most. When someone taps "I can't," Next doesn't judge, skip, or give up. It asks one question — "It feels too big," "I don't know how," "I'm just stuck," or "Skip this one" — and then re-decomposes that single action into something even smaller.

"Open your laptop" becomes:
1. Put your hand on the laptop lid (3s)
2. Lift it open (2s)
3. Look at the screen (1s)

This is not a gimmick. For someone in an ADHD paralysis state, the difference between "open your laptop" and "put your hand on the laptop lid" can be the difference between starting and not starting.

---

## 3. The Prototype

A working prototype is included in this repository (`/next`). It's a Node.js web application demonstrating the complete flow.

### Architecture

```
┌───────────────────────────┐
│    Full-Screen Web App    │   ← The "alarm" UI
│  (HTML/CSS/JS + Fullscreen API)│
└──────────┬────────────────┘
           │ HTTP API
┌──────────▼────────────────┐
│     Express Server        │   ← Orchestration layer
│  /api/decompose           │   ← Task → atomic steps
│  /api/redecompose         │   ← "I can't" → smaller steps
└──────────┬────────────────┘
           │
┌──────────▼────────────────┐
│     Claude API            │   ← The decomposition engine
│  (Sonnet 4)               │
│  System prompt:           │
│  - Physical verbs only    │
│  - 5-15s per step         │
│  - Zero ambiguity         │
│  - No abstract thinking   │
└───────────────────────────┘
```

### Running It

```bash
cd next
npm install
ANTHROPIC_API_KEY=your-key node server.js
# Open http://localhost:3000
```

Without an API key, the prototype uses built-in mock decompositions for common tasks (writing, email, cleaning, exercise) to demonstrate the UX flow.

### Key Implementation Details

**The system prompt** is engineered around the 6-friction framework:
- Every action starts with a physical verb (open, type, click, pick up)
- Every action is ONE atomic movement — "and" means split
- Includes micro-steps most tools skip (unlock phone, navigate to X)
- Never uses abstract verbs (consider, think about, plan)
- If a step requires a decision, the AI makes the decision with a reasonable default

**The full-screen takeover** uses the Web Fullscreen API and Wake Lock API to prevent dismissal and screen sleep.

**Demo modes** — two buttons in the top-right let you preview:
- *Demo: Alarm* — the alarm-clock-style screen takeover
- *Demo: Full Flow* — a complete decomposition-and-execution cycle

### What's in the Prototype vs. What's in the Blueprint

| Feature | Prototype (built) | Production (blueprint) |
|---|---|---|
| Task decomposition via LLM | Yes | Yes |
| Full-screen takeover UI | Yes | Yes (native app) |
| "I can't" re-decomposition | Yes | Yes |
| Step-by-step execution | Yes | Yes |
| Completion tracking | Yes (localStorage) | Persistent DB |
| Scheduled alarms | Demo only | Native OS alarms |
| Push notifications | No | Yes (FCM/APNs) |
| Recurring tasks | No | Yes |
| Calendar integration | No | Yes (Google Calendar) |
| Initiation latency measurement | No | Yes (instrumented) |
| Multi-device sync | No | Yes |

---

## 4. Impact Analysis

### Before AI (Current Tools)

A person with ADHD using Todoist, Notion, or Things:

1. Opens the app → sees 30+ tasks → decision paralysis (Friction: Decision)
2. Picks a task: "Write report" → what does that mean? (Friction: Ambiguity)
3. Thinks "I should outline it first, find the template, gather sources..." (Friction: Perfectionism)
4. Estimates it'll take 2 hours → "I don't have time for that right now" (Friction: Time-scope)
5. Closes the app → opens Instagram → 45 minutes gone

**Result:** 0% task initiation rate on hard tasks. Average 20+ minutes from "I should do X" to first physical motion (if it happens at all).

### After AI (Next)

The same person with Next:

1. Full-screen alarm fires → no other UI to escape into → forced engagement
2. Sees ONE action: "Open Google Docs" → zero decision (all 6 frictions eliminated)
3. Taps "Done" → sees next: "Click + Blank" → does it (5 seconds)
4. 7 steps later, they're writing → initiation happened without them noticing
5. If stuck on any step → "I can't" → gets an even smaller step

**Projected result:** 60-80% initiation rate on hard tasks. Average <30 seconds from alarm to first physical motion.

### Where AI Augmentation Breaks Down

1. **Emotional regulation** — An LLM can make steps smaller, but it can't fix the emotional weight of a dreaded task. Next reduces emotional friction through smallness ("just put your hand on the laptop") but doesn't eliminate it.

2. **Context it can't see** — "Reply to Sarah's email" decomposes well. "Fix the bug in the auth flow" requires understanding of a specific codebase the LLM doesn't have. Production Next would need integrations.

3. **The alarm paradox** — If someone is in deep paralysis, even engaging with the alarm is a barrier. The "5 more minutes" snooze option is a deliberate concession to this — it reduces the guilt of not starting *right now*, which paradoxically increases the chance of starting *soon*.

4. **Task capture** — Next handles initiation, not capture. You still need to get the task *into* Next. In production, this would come from calendar events, Slack messages, or voice ("Hey Next, I need to email Marcus back").

### What Still Requires Human Judgment

- **Which tasks to schedule** — Next can't know what matters to you
- **When "I can't" means "I shouldn't"** — sometimes the right answer is to not do the task, and an AI shouldn't override that
- **When to stop** — Next gets you started but doesn't manage sustained focus (that's a different problem with different solutions)

### Measurement Plan

To validate Next in production:

| Metric | Method | Success Threshold |
|---|---|---|
| Initiation latency | Time from alarm to first "Done" tap | <30 seconds (vs. 20+ min baseline) |
| Task start rate | % of alarmed tasks where user completes ≥1 step | >60% |
| Emotional cost | Post-task self-report (1-10 scale) | <4 average (vs. 7-8 baseline) |
| Sustained engagement | % of tasks where user completes all steps | >40% |
| "I can't" rate | % of steps that trigger redecomposition | <20% (should decrease over time) |

---

## 5. The Meta-Proof

This case study is itself evidence that the approach works.

I have ADHD. This case study — writing a structured document with a working prototype under a deadline — is exactly the kind of task I would normally fail to initiate. Instead, I used AI (Claude, in this case) as the decomposition engine for the case study itself: breaking the work into small steps, holding the full context so I didn't have to, and surfacing only the next thing to do.

The tool helped build the tool. The proof is recursive.

---

## Why This Fits Liminal

Liminal builds with seasoned founders from MVP to Series B. Next is:

- **A real problem** with a $122B economic cost and 350M people affected globally
- **AI-native** — impossible without LLMs (no rule-based system can decompose arbitrary human tasks into physical actions)
- **Defensible** — the moat is in the decomposition prompt engineering, the "I can't" re-decomposition loop, and the behavioral data on what step-sizes work for which task types
- **Measurable** — initiation latency is a concrete metric, not a vague "productivity improvement"
- **Already validated** by the person building it (me), on the task that matters (this case study)

The prototype runs. The thesis is grounded. The problem is real. Let's build it.
