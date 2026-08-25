# Architecture: Next

## Overview

Next is an ADHD task-initiation tool. It takes a vague task, decomposes it into atomic physical actions using an LLM, and presents them one at a time through a two-phase UI designed to break the initiation wall and maintain momentum.

## System Architecture

```
┌─────────────────────────────────────────────┐
│  Client (Vanilla JS SPA)                    │
│  ┌───────────────┐  ┌────────────────────┐  │
│  │ Phase 1:      │  │ Phase 2:           │  │
│  │ Full-screen   │──│ Dynamic Island     │  │
│  │ Takeover      │  │ (floating popup)   │  │
│  └───────────────┘  └────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │ POST /api/decompose
               │ POST /api/redecompose
┌──────────────▼──────────────────────────────┐
│  Express Server (Node.js)                   │
│  - Routes: decompose, redecompose           │
│  - Mock fallback when no API key            │
└──────────────┬──────────────────────────────┘
               │ Gemini generateContent API
┌──────────────▼──────────────────────────────┐
│  Gemini 2.0 Flash                           │
│  - System prompt: 6-friction rules          │
│  - responseMimeType: application/json       │
└─────────────────────────────────────────────┘
```

## Key Design Decisions

### Why Gemini 2.0 Flash (not Claude, GPT-4, etc.)

| Factor | Decision |
|--------|----------|
| **Latency** | Flash is optimised for speed. Task decomposition needs to feel instant — any delay longer than ~2 seconds breaks the momentum we're trying to create. A slower model undermines the core UX. |
| **Cost** | Free tier is generous enough for a prototype. No billing setup needed for demo or evaluation. |
| **JSON mode** | `responseMimeType: 'application/json'` gives native structured output without needing to parse markdown or hope for consistent formatting. This removes an entire class of bugs. |
| **Quality floor** | The decomposition task (breaking a sentence into physical verbs) is well within Flash's capability. We don't need frontier reasoning — we need fast, reliable, structured output. |

### Why Two-Phase UI (Takeover → Dynamic Island)

The two-phase approach maps directly to the psychology of ADHD task initiation:

**Phase 1 — Full-screen takeover (step 1 only)**
- The hardest moment is the first action. The full-screen black background with a single action in large text eliminates every possible distraction.
- Uses the Fullscreen API + Wake Lock API to prevent the phone from sleeping or showing notifications.
- Modelled on the alarm UX pattern: you cannot ignore it, you must engage.
- The design deliberately removes all UI chrome — no nav, no status bar, no back button. Just the action and two buttons.

**Phase 2 — Dynamic Island (step 2+)**
- Once the user has started (completed step 1), the friction shifts from "can't begin" to "might lose momentum."
- The Dynamic Island sits at the top of the screen as a persistent pace-setter while the user navigates to other apps (browser, Google Docs, file manager) to actually do the work.
- Collapsed state shows the step badge and action preview — just enough to remind you what's next.
- Tap to expand for the full action + Done/I can't buttons.
- This mirrors how iOS Dynamic Island works: ambient awareness without interruption.

**Why the transition matters:**
Step 1 needs maximum force — the initiation wall is the hardest part. Steps 2+ need lighter touch — the user is already in motion, and a full-screen takeover for every step would be patronising and would prevent them from actually doing the task (which often requires other apps).

### Why Vanilla JS (no React, no framework)

| Factor | Decision |
|--------|----------|
| **Simplicity** | Six screens, one API call, no routing. A framework adds complexity without solving a real problem at this scale. |
| **Performance** | Zero bundle size, instant load. For a tool that needs to feel responsive in a paralysis moment, every millisecond matters. |
| **Portability** | The entire frontend is three files (HTML, CSS, JS) served as static assets. Easy to wrap in Capacitor/Cordova for native, or deploy anywhere. |
| **Prototype velocity** | No build step, no config, no dependency management. `node server.js` and it runs. |

### Why Express (not serverless, not edge)

The server is a thin proxy between the client and Gemini. Express was chosen for:
- **One file** — `server.js` contains the entire backend, including the system prompt.
- **Mock fallback** — When no `GEMINI_API_KEY` is set, the server returns hardcoded decompositions for common task types. This means the prototype always works in demo mode.
- **No cold start** — Serverless functions add latency on first call. For a tool targeting people in a paralysis state, a 3-second cold start could mean they give up.

In production, this would move to a proper backend with auth, rate limiting, and persistent state. The prototype proves the UX thesis; it doesn't need production infrastructure.

### Why the System Prompt is the Product

The system prompt encodes the 6-Friction Framework as generation constraints:

1. **Physical verbs only** → eliminates Ambiguity friction
2. **One atomic movement per step** → eliminates Time-scope friction
3. **Include micro-steps** → eliminates Access friction
4. **No abstract verbs** → eliminates Decision friction
5. **Make decisions for the user** → eliminates Decision friction (again — it's the biggest one)
6. **First step startable right now** → eliminates Access friction

The prompt also uses `responseMimeType: 'application/json'` to enforce structured output. This is a deliberate choice over few-shot examples or output parsers — native JSON mode means the response is always valid JSON, which eliminates a class of runtime errors.

### Why "I Can't" is a First-Class Input

Most productivity tools treat failure to complete as... failure. Next treats "I can't" as signal:
- The user selects a reason (too big, unclear, stuck, or skip)
- The current action is sent back to Gemini with a re-decomposition prompt
- The response replaces the current step with even smaller micro-steps
- The UI returns to wherever the user was (takeover or Dynamic Island)

This is modelled on cognitive behavioural therapy's "behavioural activation" technique: when a task feels impossible, make it smaller until it doesn't.

## File Structure

```
next-adhd/
├── server.js           # Express server + Gemini API integration
├── public/
│   ├── index.html      # All 6 screens + Dynamic Island markup
│   ├── style.css       # Full styling including DI animations
│   └── app.js          # Client logic, state machine, DI controller
├── screenshots/        # Playwright-captured prototype screenshots
├── pitch-deck.html     # Presentation (built from build script)
├── ARCHITECTURE.md     # This file
├── CASE_STUDY.md       # Liminal case study writeup
└── README.md           # Setup + run instructions
```

## API Endpoints

### `POST /api/decompose`
- **Input:** `{ task: string }`
- **Output:** `{ task_summary, steps: [{action, time_estimate}], total_estimate }`
- Falls back to mock data when `GEMINI_API_KEY` is not set

### `POST /api/redecompose`
- **Input:** `{ action: string, reason: string }`
- **Output:** Same format, with the single action broken into smaller micro-steps
- The system prompt is appended with re-decomposition instructions that emphasise making the first step "almost silly" in its simplicity

## Production Considerations

This prototype validates the UX thesis. A production version would add:
- **React Native** for true native alarms and push notifications
- **Persistent state** (Supabase/Postgres) for task history and behavioural analytics
- **Calendar integration** for proactive task surfacing
- **Adaptive decomposition** — learn which granularity works for each user
- **Offline support** — cache recent decompositions for when connectivity is poor
