# next.

**An ADHD-native task initiator.** Hides the full task tree. Shows only the next physical action. Reduces initiation friction to near-zero.

## The Problem

ADHD task initiation failure isn't about laziness or forgetting. It's a 20-minute wall between deciding to do something and physically beginning. Every productivity tool makes it worse by showing you everything at once.

## The Solution

Next uses an LLM to decompose any task into 5-15 second atomic physical actions and surfaces only one at a time via a full-screen takeover — like an alarm clock you have to engage with.

**"Write my case study"** becomes:
1. Open a new browser tab *(3s)*
2. Go to Google Docs and click '+ Blank' *(5s)*
3. Type the title *(5s)*
4. Press Enter twice *(2s)*
5. Type the first sentence that comes to mind *(15s)*

If you tap **"I can't"** on any step, the AI breaks it down even smaller.

## Run It

```bash
npm install
node server.js
# Open http://localhost:3000
```

With Claude API (real decomposition):
```bash
ANTHROPIC_API_KEY=your-key node server.js
```

Without an API key, built-in mock decompositions demonstrate the full UX flow.

## Case Study

See [CASE_STUDY.md](./CASE_STUDY.md) for the full write-up.
