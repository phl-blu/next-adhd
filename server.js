const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are the decomposition engine for "Next," an ADHD task-initiation tool.

Your job: take ANY task and break it into the smallest possible physical actions. Each action must be something a person can do in 5–15 seconds without thinking.

Rules:
1. Every action starts with a physical verb (open, type, click, pick up, walk to, say, write, tap, look at)
2. Every action is ONE atomic movement — if it has "and" in it, split it
3. Zero ambiguity — a person in a brain-fog moment should be able to do it without extra thought
4. Include the micro-steps people skip (unlock phone, open app, navigate to X) — those ARE the friction
5. Never use abstract verbs (consider, think about, decide, plan, figure out, research)
6. If a step requires a decision, make the decision FOR them with the most reasonable default
7. Return 5-20 steps maximum. If the task is bigger, cover the first meaningful chunk that ends at a natural pause point
8. The first step must be physically startable RIGHT NOW — no prerequisites

Respond ONLY with valid JSON in this exact format:
{
  "task_summary": "2-4 word name for this task",
  "steps": [
    {"action": "the physical action to take", "time_estimate": "5s"},
    {"action": "the next physical action", "time_estimate": "10s"}
  ],
  "total_estimate": "3 minutes"
}`;

app.post('/api/decompose', async (req, res) => {
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.json(getMockDecomposition(task));
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Decompose this task: ${task}` }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return res.json(getMockDecomposition(task));
    }

    const text = data.content[0].text;
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error('Decomposition error:', err);
    res.json(getMockDecomposition(task));
  }
});

app.post('/api/redecompose', async (req, res) => {
  const { action, reason } = req.body;

  if (!ANTHROPIC_API_KEY) {
    return res.json({
      task_summary: "Easier start",
      steps: [
        { action: "Stand up from your chair", time_estimate: "3s" },
        { action: "Take one deep breath", time_estimate: "5s" },
        { action: action.replace(/^[A-Z]/, c => c.toLowerCase()), time_estimate: "10s" }
      ],
      total_estimate: "20 seconds"
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + `\n\nThe user said "I can't" to the action: "${action}"\nTheir reason: "${reason || 'no reason given'}"\n\nBreak this single action into even smaller micro-steps. Make the first step so trivially easy it's almost silly. Think: "stand up" or "put your hand on the mouse."`,
        messages: [{ role: 'user', content: `Make this easier: ${action}` }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.json({
        task_summary: "Easier start",
        steps: [
          { action: "Take one deep breath", time_estimate: "5s" },
          { action: action, time_estimate: "15s" }
        ],
        total_estimate: "20 seconds"
      });
    }

    const text = data.content[0].text;
    res.json(JSON.parse(text));
  } catch (err) {
    console.error('Redecompose error:', err);
    res.json({
      task_summary: "Easier start",
      steps: [
        { action: "Take one deep breath", time_estimate: "5s" },
        { action: action, time_estimate: "15s" }
      ],
      total_estimate: "20 seconds"
    });
  }
});

function getMockDecomposition(task) {
  const lower = task.toLowerCase();

  if (lower.includes('case study') || lower.includes('essay') || lower.includes('write') || lower.includes('document')) {
    return {
      task_summary: "Start writing",
      steps: [
        { action: "Open a new browser tab", time_estimate: "3s" },
        { action: "Go to Google Docs and click '+ Blank'", time_estimate: "5s" },
        { action: "Type the title: '" + task.slice(0, 30) + "'", time_estimate: "5s" },
        { action: "Press Enter twice to start a new line", time_estimate: "2s" },
        { action: "Type the first sentence that comes to mind about the topic", time_estimate: "15s" },
        { action: "Press Enter and type one more sentence", time_estimate: "10s" },
        { action: "Save the document (Cmd+S)", time_estimate: "2s" }
      ],
      total_estimate: "42 seconds"
    };
  }

  if (lower.includes('email') || lower.includes('message') || lower.includes('reply')) {
    return {
      task_summary: "Send message",
      steps: [
        { action: "Open your email app", time_estimate: "3s" },
        { action: "Click on the message to reply to", time_estimate: "5s" },
        { action: "Click 'Reply'", time_estimate: "2s" },
        { action: "Type: 'Hi, '", time_estimate: "3s" },
        { action: "Type one sentence with your main point", time_estimate: "15s" },
        { action: "Click Send", time_estimate: "2s" }
      ],
      total_estimate: "30 seconds"
    };
  }

  if (lower.includes('clean') || lower.includes('tidy') || lower.includes('room') || lower.includes('dishes')) {
    return {
      task_summary: "Start cleaning",
      steps: [
        { action: "Stand up from where you are", time_estimate: "3s" },
        { action: "Pick up the nearest item that's out of place", time_estimate: "5s" },
        { action: "Put it where it belongs", time_estimate: "10s" },
        { action: "Pick up the next nearest item", time_estimate: "5s" },
        { action: "Put it where it belongs", time_estimate: "10s" },
        { action: "Look left — pick up one more thing", time_estimate: "5s" },
        { action: "Put it away", time_estimate: "10s" }
      ],
      total_estimate: "48 seconds"
    };
  }

  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('gym') || lower.includes('run')) {
    return {
      task_summary: "Start moving",
      steps: [
        { action: "Stand up right now", time_estimate: "3s" },
        { action: "Walk to where your shoes are", time_estimate: "10s" },
        { action: "Sit down and put on your left shoe", time_estimate: "10s" },
        { action: "Put on your right shoe", time_estimate: "10s" },
        { action: "Stand up and walk to the front door", time_estimate: "10s" },
        { action: "Open the door and step outside", time_estimate: "5s" },
        { action: "Walk to the end of your street", time_estimate: "60s" }
      ],
      total_estimate: "2 minutes"
    };
  }

  return {
    task_summary: "Get started",
    steps: [
      { action: "Unlock your phone or open your laptop", time_estimate: "3s" },
      { action: "Open the app or tool you need for: " + task.slice(0, 40), time_estimate: "5s" },
      { action: "Find where you left off (or start fresh)", time_estimate: "10s" },
      { action: "Do the smallest possible first action", time_estimate: "15s" },
      { action: "Do one more small thing while you're at it", time_estimate: "15s" }
    ],
    total_estimate: "48 seconds"
  };
}

app.listen(PORT, () => {
  console.log(`Next is running on http://localhost:${PORT}`);
});
