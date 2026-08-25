# next.

**An ADHD-native task initiator.** Takes any vague task, decomposes it into atomic physical actions using AI, and presents them through a two-phase UI designed to break the initiation wall.

## The Problem

ADHD task initiation failure isn't laziness. It's a wall between intention and action. You know what to do, you want to do it, you physically cannot begin. Every productivity tool makes it worse by showing you everything at once.

## The Solution

Next uses Gemini 2.0 Flash to decompose any task into 5-15 second physical actions and surfaces them one at a time:

- **Phase 1 (Step 1): Full-screen takeover** — Black screen, one action, no escape. Maximum friction-breaking force to shatter the initiation wall.
- **Phase 2 (Step 2+): Dynamic Island** — A floating pill at the top of the screen that acts as a pace-setter while you navigate other apps to do the actual work.

If you tap **"I can't"** on any step, the AI re-decomposes it into even smaller micro-steps. No judgment.

**"Write my case study"** becomes:
1. Open a new browser tab *(3s)*
2. Go to Google Docs and click '+ Blank' *(5s)*
3. Type the title *(5s)*
4. Press Enter twice *(2s)*
5. Type the first sentence that comes to mind *(15s)*

## Run It

```bash
npm install
node server.js
# Open http://localhost:3000
```

With Gemini API (real AI decomposition):
```bash
GEMINI_API_KEY=your-key node server.js
```

Without an API key, built-in mock decompositions demonstrate the full UX flow.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions and technical rationale.

## Case Study

See [CASE_STUDY.md](./CASE_STUDY.md) for the full Liminal case study write-up.
