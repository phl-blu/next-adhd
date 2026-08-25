(function() {
  'use strict';

  let currentSteps = [];
  let currentStepIndex = 0;
  let taskStartTime = null;
  let stepsCompleted = 0;
  let currentTaskName = '';
  let completedTasks = JSON.parse(localStorage.getItem('next_completed') || '[]');
  let islandMode = false;

  const screens = {
    input: document.getElementById('screen-input'),
    loading: document.getElementById('screen-loading'),
    takeover: document.getElementById('screen-takeover'),
    cant: document.getElementById('screen-cant'),
    complete: document.getElementById('screen-complete'),
    alarm: document.getElementById('screen-alarm')
  };

  const els = {
    taskInput: document.getElementById('task-input'),
    btnDecompose: document.getElementById('btn-decompose'),
    stepCounter: document.getElementById('step-counter'),
    timeEstimate: document.getElementById('time-estimate'),
    actionText: document.getElementById('action-text'),
    btnDone: document.getElementById('btn-done'),
    btnCant: document.getElementById('btn-cant'),
    progressFill: document.getElementById('progress-fill'),
    completeStats: document.getElementById('complete-stats'),
    btnAnother: document.getElementById('btn-another'),
    taskHistory: document.getElementById('task-history'),
    alarmTime: document.getElementById('alarm-time'),
    alarmReminder: document.getElementById('alarm-reminder'),
    alarmTask: document.getElementById('alarm-task'),
    btnAlarmStart: document.getElementById('btn-alarm-start'),
    btnAlarmSnooze: document.getElementById('btn-alarm-snooze')
  };

  const island = {
    root: document.getElementById('dynamic-island'),
    collapsed: document.getElementById('di-collapsed'),
    expanded: document.getElementById('di-expanded'),
    stepBadge: document.getElementById('di-step-badge'),
    actionPreview: document.getElementById('di-action-preview'),
    time: document.getElementById('di-time'),
    stepCounterEx: document.getElementById('di-step-counter-ex'),
    timeEx: document.getElementById('di-time-ex'),
    expandedAction: document.getElementById('di-expanded-action'),
    btnDone: document.getElementById('di-btn-done'),
    btnCant: document.getElementById('di-btn-cant'),
    progressFill: document.getElementById('di-progress-fill')
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');

    if (name === 'takeover' || name === 'alarm') {
      tryFullscreen();
    }

    if (name !== 'takeover') {
      hideIsland();
    }
  }

  function tryFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {});
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  // === Dynamic Island ===

  function showIsland() {
    islandMode = true;
    island.root.classList.add('visible');
    island.root.classList.remove('expanded');
    exitFullscreen();
    Object.values(screens).forEach(s => s.classList.remove('active'));
  }

  function hideIsland() {
    islandMode = false;
    island.root.classList.remove('visible', 'expanded');
  }

  function updateIsland() {
    const step = currentSteps[currentStepIndex];
    if (!step) return;

    const label = `${currentStepIndex + 1}/${currentSteps.length}`;
    const timeStr = step.time_estimate || '~10s';
    const progress = (currentStepIndex / currentSteps.length) * 100;

    island.stepBadge.textContent = label;
    island.actionPreview.textContent = step.action;
    island.time.textContent = timeStr;

    island.stepCounterEx.textContent = `Step ${currentStepIndex + 1} of ${currentSteps.length}`;
    island.timeEx.textContent = `~${timeStr}`;
    island.expandedAction.textContent = step.action;
    island.progressFill.style.width = progress + '%';
  }

  island.collapsed.addEventListener('click', () => {
    island.root.classList.add('expanded');
  });

  document.addEventListener('click', (e) => {
    if (island.root.classList.contains('expanded') &&
        !island.expanded.contains(e.target) &&
        !island.collapsed.contains(e.target)) {
      island.root.classList.remove('expanded');
    }
  });

  island.btnDone.addEventListener('click', () => {
    stepsCompleted++;
    currentStepIndex++;

    if (currentStepIndex >= currentSteps.length) {
      hideIsland();
      finishTask();
    } else {
      updateIsland();
      island.root.classList.remove('expanded');

      island.collapsed.classList.add('step-flash');
      island.collapsed.style.animation = 'none';
      island.collapsed.offsetHeight;
      island.collapsed.style.animation = 'diSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      setTimeout(() => island.collapsed.classList.remove('step-flash'), 500);
    }
  });

  island.btnCant.addEventListener('click', () => {
    island.root.classList.remove('expanded');
    // Preserve islandMode flag before hideIsland clears it
    const wasIsland = true;
    hideIsland();
    islandMode = wasIsland;
    showScreen('cant');
  });

  // === End Dynamic Island ===

  function renderHistory() {
    els.taskHistory.innerHTML = completedTasks.slice(-5).reverse().map(t =>
      `<div class="task-history-item">
        <span class="task-history-check">&#10003;</span>
        <span class="task-history-name">${escapeHtml(t.name)}</span>
        <span class="task-history-time">${t.steps} steps</span>
      </div>`
    ).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  els.taskInput.addEventListener('input', () => {
    els.btnDecompose.disabled = els.taskInput.value.trim().length === 0;
  });

  els.taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && els.taskInput.value.trim()) {
      startDecomposition();
    }
  });

  els.btnDecompose.addEventListener('click', startDecomposition);

  async function startDecomposition() {
    const task = els.taskInput.value.trim();
    if (!task) return;

    currentTaskName = task;
    showScreen('loading');

    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });

      const data = await res.json();
      currentSteps = data.steps || [];
      currentStepIndex = 0;
      stepsCompleted = 0;
      taskStartTime = Date.now();

      if (currentSteps.length > 0) {
        showStep();
        showScreen('takeover');
      } else {
        showScreen('input');
      }
    } catch (err) {
      console.error('Decomposition failed:', err);
      showScreen('input');
    }
  }

  function showStep() {
    const step = currentSteps[currentStepIndex];
    if (!step) return;

    els.stepCounter.textContent = `Step ${currentStepIndex + 1} of ${currentSteps.length}`;
    els.timeEstimate.textContent = `~${step.time_estimate || '10s'}`;

    els.actionText.style.animation = 'none';
    els.actionText.offsetHeight;
    els.actionText.style.animation = 'fadeInUp 0.5s ease';
    els.actionText.textContent = step.action;

    const progress = (currentStepIndex / currentSteps.length) * 100;
    els.progressFill.style.width = progress + '%';
  }

  els.btnDone.addEventListener('click', () => {
    stepsCompleted++;
    currentStepIndex++;

    // Brief green flash on the takeover screen
    document.body.classList.add('step-flash');
    setTimeout(() => document.body.classList.remove('step-flash'), 500);

    if (currentStepIndex >= currentSteps.length) {
      finishTask();
    } else {
      // Step 1 done on full-screen — switch to Dynamic Island for step 2+
      exitFullscreen();
      updateIsland();
      showIsland();
    }
  });

  function finishTask() {
    const elapsed = Math.round((Date.now() - taskStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    els.completeStats.textContent = `${stepsCompleted} steps done in ${timeStr}`;

    completedTasks.push({
      name: currentTaskName,
      steps: stepsCompleted,
      time: timeStr,
      date: new Date().toISOString()
    });

    try {
      localStorage.setItem('next_completed', JSON.stringify(completedTasks.slice(-20)));
    } catch (e) {}

    exitFullscreen();
    showScreen('complete');

    // Animate progress to 100% after screen transition
    requestAnimationFrame(() => {
      els.progressFill.style.width = '100%';
    });
  }

  els.btnCant.addEventListener('click', () => {
    showScreen('cant');
  });

  document.querySelectorAll('.cant-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const reason = btn.dataset.reason;
      const currentAction = currentSteps[currentStepIndex]?.action;

      if (reason === 'skip') {
        currentStepIndex++;
        if (currentStepIndex >= currentSteps.length) {
          finishTask();
        } else if (currentStepIndex > 1) {
          updateIsland();
          showIsland();
        } else {
          showStep();
          showScreen('takeover');
        }
        return;
      }

      showScreen('loading');

      try {
        const res = await fetch('/api/redecompose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: currentAction, reason })
        });

        const data = await res.json();
        const newSteps = data.steps || [];

        if (newSteps.length > 0) {
          currentSteps.splice(currentStepIndex, 1, ...newSteps);
        }

        // If we were in island mode before "I can't", return to island
        if (islandMode || currentStepIndex > 0) {
          updateIsland();
          showIsland();
          island.root.classList.add('expanded');
        } else {
          showStep();
          showScreen('takeover');
        }
      } catch (err) {
        console.error('Redecompose failed:', err);
        if (islandMode || currentStepIndex > 0) {
          updateIsland();
          showIsland();
        } else {
          showScreen('takeover');
        }
      }
    });
  });

  els.btnAnother.addEventListener('click', () => {
    els.taskInput.value = '';
    els.btnDecompose.disabled = true;
    renderHistory();
    exitFullscreen();
    hideIsland();
    showScreen('input');
    els.taskInput.focus();
  });

  // === ALARM DEMO ===
  els.btnAlarmStart.addEventListener('click', () => {
    showScreen('loading');
    setTimeout(async () => {
      try {
        const res = await fetch('/api/decompose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: currentTaskName || 'Start working on the case study' })
        });
        const data = await res.json();
        currentSteps = data.steps || [];
        currentStepIndex = 0;
        stepsCompleted = 0;
        taskStartTime = Date.now();
        showStep();
        showScreen('takeover');
      } catch (e) {
        showScreen('input');
      }
    }, 800);
  });

  els.btnAlarmSnooze.addEventListener('click', () => {
    exitFullscreen();
    hideIsland();
    showScreen('input');
    renderHistory();
  });

  function showAlarmDemo() {
    const now = new Date();
    els.alarmTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    els.alarmReminder.textContent = 'You wanted to start the case study 20 minutes ago.';
    els.alarmTask.textContent = 'Open Google Docs';
    currentTaskName = 'Complete the Liminal case study';
    showScreen('alarm');
  }

  // === DEMO CONTROLS ===
  const demoBanner = document.createElement('div');
  demoBanner.className = 'demo-banner';
  demoBanner.innerHTML = `
    <button class="demo-btn" id="demo-alarm">Demo: Alarm</button>
    <button class="demo-btn" id="demo-flow">Demo: Full Flow</button>
  `;
  document.body.appendChild(demoBanner);

  document.getElementById('demo-alarm').addEventListener('click', showAlarmDemo);

  document.getElementById('demo-flow').addEventListener('click', () => {
    els.taskInput.value = 'Complete my Liminal case study';
    els.btnDecompose.disabled = false;
    hideIsland();
    showScreen('input');
    els.taskInput.focus();
  });

  // === KEYBOARD SHORTCUTS ===
  document.addEventListener('keydown', (e) => {
    if (screens.takeover.classList.contains('active')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        els.btnDone.click();
      }
      if (e.key === 'Escape') {
        els.btnCant.click();
      }
    }

    if (screens.alarm.classList.contains('active')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        els.btnAlarmStart.click();
      }
    }

    // Dynamic Island keyboard shortcuts
    if (island.root.classList.contains('visible')) {
      if (island.root.classList.contains('expanded')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          island.btnDone.click();
        }
        if (e.key === 'Escape') {
          island.btnCant.click();
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          island.root.classList.add('expanded');
        }
      }
    }
  });

  renderHistory();
})();
