const TEST_CATALOG = [
  { file: "test27.json", difficulty: "Hard" },
  { file: "test28.json", difficulty: "Medium" },
  { file: "test28b.json", difficulty: "Medium" },
  { file: "test29.json", difficulty: "Medium" },
  { file: "test30.json", difficulty: "Medium" },
  { file: "test31.json", difficulty: "Hard" },
  { file: "test32.json", difficulty: "Medium" },
  { file: "test33a.json", difficulty: "Medium" },
  { file: "test33b.json", difficulty: "Medium" },
  { file: "test33c.json", difficulty: "Medium" },
  { file: "test33d.json", difficulty: "Medium" },
  { file: "test33e.json", difficulty: "Medium" },
  { file: "test33f.json", difficulty: "Medium" },
  { file: "test34Social.json", difficulty: "Easy" },
  { file: "test35.json", difficulty: "Hard" },
];

const STORAGE_KEYS = {
  STATS: "studyflow.stats",
  ACTIVITY: "studyflow.activity",
  ACHIEVEMENTS: "studyflow.achievements",
  THEME: "studyflow.theme",
  PASS_MARK: "studyflow.passmark",
  TIMER: "studyflow.timer",
};

const DEFAULTS = {
  PASS_MARK: 50,
  TIMER_MINUTES: 30,
  QUESTIONS_PER_PAGE: 10,
};

const ACHIEVEMENTS = [
  {
    id: "perfect",
    name: "Perfect Score",
    description: "Score 100% on any test",
    icon: "🎯",
    check: ({ score, total }) => total > 0 && score === total,
  },
  {
    id: "speed",
    name: "Speed Demon",
    description: "Complete a test in under 10 minutes",
    icon: "⚡",
    check: ({ durationSeconds }) => durationSeconds > 0 && durationSeconds <= 600,
  },
  {
    id: "streak",
    name: "Streak Master",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    check: ({ streak }) => streak >= 7,
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const initialTimerMinutes = loadTimerSetting();

  const state = {
    theme: loadTheme(),
    tests: [],
    currentTest: null,
    questions: [],
    questionOrder: [],
    userAnswers: new Map(),
    reviewFilter: "all",
    mode: "test",
    viewAll: false,
    questionsPerPage: DEFAULTS.QUESTIONS_PER_PAGE,
    currentPage: 0,
    timerSeconds: initialTimerMinutes * 60,
    timerRunning: false,
    timerInterval: null,
    timerStartedAt: null,
    passMark: loadPassMarkSetting(),
    stats: loadStats(),
    recentActivity: loadRecentActivity(),
    unlockedAchievements: loadAchievements(),
    flashcardIndex: 0,
    flashcardFlipped: false,
  };

  const elements = {
    navLinks: document.querySelectorAll(".nav-link"),
    viewPanels: {
      dashboard: document.getElementById("dashboard-view"),
      test: document.getElementById("test-view"),
    },
    dashboardButtons: {
      chooseTest: document.getElementById("dashboard-choose-test"),
      customTest: document.getElementById("dashboard-custom-test"),
      viewTests: document.getElementById("dashboard-view-tests"),
      refreshActivity: document.getElementById("refresh-activity"),
    },
    statValues: {
      streak: document.getElementById("streak-value"),
      xp: document.getElementById("xp-value"),
      badges: document.getElementById("badge-value"),
      passRate: document.getElementById("pass-rate-value"),
      testsTaken: document.getElementById("stats-tests-taken"),
      testsPassed: document.getElementById("stats-tests-passed"),
      testsFailed: document.getElementById("stats-tests-failed"),
    },
    activityList: document.getElementById("recent-activity"),
    achievementList: document.getElementById("achievement-list"),
    testGrid: document.getElementById("dashboard-test-grid"),
    testToolbar: {
      title: document.getElementById("active-test-title"),
      range: document.getElementById("question-range"),
      timer: document.getElementById("timer-display"),
      start: document.getElementById("start-timer"),
      pause: document.getElementById("pause-timer"),
      change: document.getElementById("change-test"),
      progress: document.getElementById("progress-indicator"),
      pageIndicator: document.getElementById("page-indicator"),
    },
    toggleButtons: document.querySelectorAll(".toggle-button"),
    modeTabs: document.querySelectorAll(".mode-tab"),
    resultBanner: document.getElementById("result-banner"),
    resultEmoji: document.getElementById("result-emoji"),
    resultHeadline: document.getElementById("result-headline"),
    resultSummary: document.getElementById("result-summary"),
    resultButtons: {
      restart: document.getElementById("restart-test"),
      reviewFailed: document.getElementById("review-failed"),
      reviewAll: document.getElementById("review-all"),
    },
    flashcards: {
      container: document.getElementById("flashcard-view"),
      front: document.getElementById("flashcard-front"),
      back: document.getElementById("flashcard-back"),
      prev: document.getElementById("flashcard-prev"),
      flip: document.getElementById("flashcard-flip"),
      next: document.getElementById("flashcard-next"),
    },
    questionList: document.getElementById("questions-container"),
    pagination: {
      container: document.getElementById("pagination-controls"),
      prev: document.getElementById("prev-page"),
      next: document.getElementById("next-page"),
      info: document.getElementById("pagination-info"),
    },
    footer: {
      submit: document.getElementById("submit-test"),
      reset: document.getElementById("reset-test"),
      download: document.getElementById("download-results"),
      timerInput: document.getElementById("timer-input"),
      passMarkInput: document.getElementById("pass-mark-input"),
    },
    nav: {
      darkMode: document.getElementById("dark-mode-toggle"),
      tools: document.getElementById("open-tools"),
      mobileChoose: document.getElementById("open-test-selector"),
    },
    modals: {
      backdrop: document.getElementById("modal-backdrop"),
      testSelector: document.getElementById("test-selector-modal"),
      customTest: document.getElementById("custom-test-modal"),
      tools: document.getElementById("tools-modal"),
    },
    modalContent: {
      testList: document.getElementById("test-selector-list"),
      customList: document.getElementById("custom-test-list"),
      customSummary: document.getElementById("custom-test-summary"),
      customQuestionCount: document.getElementById("custom-question-count"),
      customTimer: document.getElementById("custom-timer"),
      toolsPassMark: document.getElementById("tools-pass-mark"),
      toolsThemeToggle: document.getElementById("tools-theme-toggle"),
      uploadInput: document.getElementById("upload-test-input"),
    },
    modalButtons: {
      openCustom: document.getElementById("open-custom-test"),
      startCustom: document.getElementById("start-custom-test"),
      statsReset: document.getElementById("stats-reset"),
    },
    toast: document.getElementById("toast"),
    scrollTop: document.getElementById("scroll-top"),
  };

  function init() {
    applyTheme(state.theme);
    syncInputs();
    elements.testToolbar.pause.classList.add("hidden");
    attachEvents();
    setActiveView("dashboard");
    lucide?.createIcons?.();
    loadAllTests().then(() => {
      renderDashboard();
      renderTestSelector();
      lucide?.createIcons?.();
    });
    updateTimerDisplay();
    renderAchievements();
    renderActivity();
  }

  function attachEvents() {
    elements.navLinks.forEach((button) => {
      button.addEventListener("click", () => {
        const view = button.dataset.view;
        setActiveView(view);
      });
    });

    elements.dashboardButtons.chooseTest.addEventListener("click", () =>
      openModal(elements.modals.testSelector)
    );

    elements.dashboardButtons.viewTests.addEventListener("click", () =>
      openModal(elements.modals.testSelector)
    );

    elements.dashboardButtons.customTest.addEventListener("click", () =>
      openModal(elements.modals.customTest)
    );

    elements.nav.tools.addEventListener("click", () =>
      openModal(elements.modals.tools)
    );

    elements.nav.mobileChoose.addEventListener("click", () =>
      openModal(elements.modals.testSelector)
    );

    elements.nav.darkMode.addEventListener("click", toggleTheme);
    elements.modalContent.toolsThemeToggle.addEventListener("click", toggleTheme);

    elements.dashboardButtons.refreshActivity.addEventListener("click", () => {
      renderActivity();
      showToast("Activity refreshed");
    });

    elements.toggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        elements.toggleButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (btn.dataset.questions === "all") {
          state.viewAll = true;
        } else {
          state.viewAll = false;
          state.questionsPerPage = Number(btn.dataset.questions) || DEFAULTS.QUESTIONS_PER_PAGE;
        }
        state.currentPage = 0;
        renderQuestions();
      });
    });

    elements.modeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setMode(tab.dataset.mode);
      });
    });

    elements.testToolbar.start.addEventListener("click", () => startTimer());
    elements.testToolbar.pause.addEventListener("click", () => pauseTimer());
    elements.testToolbar.change.addEventListener("click", () =>
      openModal(elements.modals.testSelector)
    );

    elements.pagination.prev.addEventListener("click", () => {
      if (state.currentPage > 0) {
        state.currentPage -= 1;
        renderQuestions();
      }
    });

    elements.pagination.next.addEventListener("click", () => {
      const totalPages = getTotalPages();
      if (state.currentPage < totalPages - 1) {
        state.currentPage += 1;
        renderQuestions();
      }
    });

    elements.footer.submit.addEventListener("click", submitTest);
    elements.footer.reset.addEventListener("click", resetTest);
    elements.footer.download.addEventListener("click", downloadResults);

    elements.footer.timerInput.addEventListener("change", (event) => {
      const value = Math.max(Number(event.target.value) || 0, 0);
      state.timerSeconds = value * 60;
      saveTimerSetting(value);
      updateTimerDisplay();
    });

    elements.footer.passMarkInput.addEventListener("change", (event) => {
      const value = clamp(Number(event.target.value) || DEFAULTS.PASS_MARK, 0, 100);
      state.passMark = value;
      event.target.value = value;
      savePassMarkSetting(value);
      elements.modalContent.toolsPassMark.value = value;
    });

    elements.modalContent.toolsPassMark.addEventListener("change", (event) => {
      const value = clamp(Number(event.target.value) || DEFAULTS.PASS_MARK, 0, 100);
      state.passMark = value;
      elements.footer.passMarkInput.value = value;
      savePassMarkSetting(value);
    });

    elements.modalButtons.openCustom.addEventListener("click", () => {
      closeModal(elements.modals.testSelector);
      openModal(elements.modals.customTest);
    });

    elements.modalButtons.startCustom.addEventListener("click", startCustomTest);
    elements.modalContent.customList.addEventListener("change", updateCustomSummary);
    elements.modalContent.customQuestionCount.addEventListener("input", updateCustomSummary);
    elements.modalContent.customTimer.addEventListener("input", updateCustomSummary);
    elements.modalButtons.statsReset.addEventListener("click", () => {
      resetStats();
      renderDashboard();
      renderActivity();
      renderAchievements();
      showToast("Statistics reset");
    });

    elements.resultButtons.restart.addEventListener("click", () => {
      if (state.currentTest) {
        startTest(state.currentTest);
      }
    });

    elements.resultButtons.reviewFailed.addEventListener("click", () => {
      state.reviewFilter = "incorrect";
      state.viewAll = true;
      updateViewToggleButtons();
      renderQuestions();
      scrollToTop();
    });

    elements.resultButtons.reviewAll.addEventListener("click", () => {
      state.reviewFilter = "all";
      state.viewAll = true;
      updateViewToggleButtons();
      renderQuestions();
      scrollToTop();
    });

    elements.flashcards.prev.addEventListener("click", () => {
      state.flashcardIndex = (state.flashcardIndex - 1 + state.questions.length) % state.questions.length;
      state.flashcardFlipped = false;
      renderFlashcard();
    });

    elements.flashcards.next.addEventListener("click", () => {
      state.flashcardIndex = (state.flashcardIndex + 1) % state.questions.length;
      state.flashcardFlipped = false;
      renderFlashcard();
    });

    elements.flashcards.flip.addEventListener("click", () => {
      state.flashcardFlipped = !state.flashcardFlipped;
      renderFlashcard();
    });

    elements.modalContent.uploadInput.addEventListener("change", handleUpload);

    elements.scrollTop.addEventListener("click", scrollToTop);

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => closeAllModals());
    });

    elements.modals.backdrop.addEventListener("click", closeAllModals);
  }

  function syncInputs() {
    elements.footer.passMarkInput.value = state.passMark;
    elements.footer.timerInput.value = Math.round(state.timerSeconds / 60);
    elements.modalContent.toolsPassMark.value = state.passMark;
    elements.modalContent.toolsThemeToggle.dataset.state = state.theme === "dark" ? "on" : "off";
  }

  function setActiveView(view) {
    elements.navLinks.forEach((link) => {
      const isActive = link.dataset.view === view;
      link.classList.toggle("active", isActive);
    });
    Object.entries(elements.viewPanels).forEach(([key, panel]) => {
      panel.classList.toggle("active", key === view);
    });
    if (view === "dashboard") {
      renderDashboard();
    } else {
      renderQuestions();
    }
  }

  async function loadAllTests() {
    const tests = [];
    for (const entry of TEST_CATALOG) {
      try {
        const response = await fetch(entry.file);
        if (!response.ok) {
          throw new Error(`Failed to load ${entry.file}`);
        }
        const data = await response.json();
        const questions = Array.isArray(data.questions) ? data.questions : [];
        tests.push({
          file: entry.file,
          name: data.testName || entry.file.replace(/\.json$/, ""),
          difficulty: entry.difficulty || "Medium",
          questions,
        });
      } catch (error) {
        console.error("Unable to load test", entry.file, error);
      }
    }
    state.tests = tests;
    renderDashboardTests();
    renderTestSelector();
  }

  function renderDashboard() {
    renderStats();
    renderDashboardTests();
    renderActivity();
    renderAchievements();
  }

  function renderStats() {
    const { stats, unlockedAchievements } = state;
    const passAttempts = stats.testsPassed + stats.testsFailed;
    const passRate = passAttempts > 0 ? Math.round((stats.testsPassed / passAttempts) * 100) : 0;
    const xp = calculateXp();
    if (elements.statValues.streak) {
      elements.statValues.streak.textContent = `${stats.streak} ${stats.streak === 1 ? "day" : "days"}`;
    }
    if (elements.statValues.xp) {
      elements.statValues.xp.textContent = xp.toLocaleString();
    }
    if (elements.statValues.badges) {
      elements.statValues.badges.textContent = `${unlockedAchievements.size}`;
    }
    if (elements.statValues.passRate) {
      elements.statValues.passRate.textContent = `${passRate}%`;
    }
    if (elements.statValues.testsTaken) {
      elements.statValues.testsTaken.textContent = stats.testsTaken;
    }
    if (elements.statValues.testsPassed) {
      elements.statValues.testsPassed.textContent = stats.testsPassed;
    }
    if (elements.statValues.testsFailed) {
      elements.statValues.testsFailed.textContent = stats.testsFailed;
    }
  }

  function renderActivity() {
    const container = elements.activityList;
    if (!container) return;
    container.innerHTML = "";
    const entries = state.recentActivity.slice(-6).reverse();
    if (!entries.length) {
      container.innerHTML = `<div class="activity-empty">No activity yet. Complete a test to see your progress.</div>`;
      return;
    }

    entries.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "activity-item";
      item.innerHTML = `
        <div class="activity-header">
          <div>
            <div class="activity-name">${entry.test}</div>
            <div class="activity-meta">
              <span>${formatRelativeTime(entry.timestamp)}</span>
              <span>•</span>
              <span>${entry.questions} questions</span>
            </div>
          </div>
          <div class="activity-score">${entry.score}%</div>
        </div>
        <div class="activity-footer">
          <span class="status-chip ${entry.status}">
            ${entry.status === "passed" ? "✓ Passed" : "✕ Failed"}
          </span>
        </div>
      `;
      container.appendChild(item);
    });
    lucide?.createIcons?.();
  }

  function renderAchievements() {
    const container = elements.achievementList;
    if (!container) return;
    container.innerHTML = "";
    ACHIEVEMENTS.forEach((achievement) => {
      const unlocked = state.unlockedAchievements.has(achievement.id);
      const item = document.createElement("div");
      item.className = `achievement-item ${unlocked ? "" : "locked"}`;
      item.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-body">
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-desc">${achievement.description}</div>
        </div>
        ${unlocked ? '<svg data-lucide="check" width="20" height="20"></svg>' : ""}
      `;
      container.appendChild(item);
    });
    lucide?.createIcons?.();
  }

  function renderDashboardTests() {
    const container = elements.testGrid;
    if (!container) return;
    container.innerHTML = "";
    const subset = state.tests.slice(0, 6);
    if (!subset.length) {
      container.innerHTML = `<div class="activity-empty">Upload a test to get started.</div>`;
      return;
    }
    subset.forEach((test) => {
      const card = document.createElement("article");
      card.className = "test-card";
      card.innerHTML = `
        <div>
          <h3>${test.name}</h3>
          <div class="test-meta">
            <span>${test.questions.length} questions</span>
            <span class="difficulty-tag ${difficultyClass(test.difficulty)}">${test.difficulty}</span>
          </div>
        </div>
        <button class="primary-button">
          <svg data-lucide="play"></svg>
          <span>Start Test</span>
        </button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        closeAllModals();
        startTest(test);
        setActiveView("test");
      });
      container.appendChild(card);
    });
    lucide?.createIcons?.();
  }

  function renderTestSelector() {
    const container = elements.modalContent.testList;
    if (!container) return;
    container.innerHTML = "";
    if (!state.tests.length) {
      container.innerHTML = `<div class="activity-empty">No tests available. Upload your own to begin.</div>`;
      return;
    }
    state.tests.forEach((test) => {
      const card = document.createElement("article");
      card.className = "modal-test-card";
      card.innerHTML = `
        <div>
          <h3>${test.name}</h3>
          <p>${test.questions.length} questions</p>
        </div>
        <div class="test-meta">
          <span>${test.difficulty}</span>
          <span>${test.file}</span>
        </div>
        <button class="primary-button">
          <svg data-lucide="play"></svg>
          <span>Select Test</span>
        </button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        startTest(test);
        closeAllModals();
        setActiveView("test");
      });
      container.appendChild(card);
    });
    lucide?.createIcons?.();
    renderCustomTestList();
  }

  function renderCustomTestList() {
    const container = elements.modalContent.customList;
    if (!container) return;
    container.innerHTML = "";
    if (!state.tests.length) {
      container.innerHTML = `<div class="activity-empty">Upload tests to build a custom mix.</div>`;
      return;
    }
    state.tests.forEach((test, index) => {
      const id = `custom-test-${index}`;
      const item = document.createElement("label");
      item.className = "custom-test-item";
      item.innerHTML = `
        <div>
          <div class="activity-name">${test.name}</div>
          <div class="activity-meta">${test.questions.length} questions available</div>
        </div>
        <input type="checkbox" id="${id}" data-file="${test.file}" />
      `;
      container.appendChild(item);
    });
    updateCustomSummary();
  }

  function updateCustomSummary() {
    const summary = elements.modalContent.customSummary;
    if (!summary) return;
    const selected = getSelectedCustomTests();
    const questionCount = selected.reduce((acc, file) => {
      const test = state.tests.find((t) => t.file === file);
      return acc + (test ? test.questions.length : 0);
    }, 0);
    summary.textContent = `${selected.length} test${selected.length === 1 ? "" : "s"} selected • ${questionCount} questions available`;
  }

  function startTest(test) {
    state.currentTest = {
      file: test.file,
      name: test.name,
      difficulty: test.difficulty,
      questions: cloneDeep(test.questions || []),
      custom: !!test.custom,
    };
    state.questions = state.currentTest.questions.map((question, index) => {
      const correctValue =
        question.correctAnswer ??
        question.answer ??
        (Array.isArray(question.options) &&
          typeof question.correctOptionIndex === "number"
          ? question.options[question.correctOptionIndex]
          : undefined);
      return {
        ...question,
        id: `${state.currentTest.file}-${index}`,
        source: state.currentTest.name,
        answer: normalizeAnswer(correctValue),
        displayAnswer: correctValue || "",
        explanation: question.explanation || question.hint || "",
      };
    });
    state.userAnswers.clear();
    state.questionOrder = state.questions.map((_, index) => index);
    state.currentPage = 0;
    state.viewAll = false;
    state.reviewFilter = "all";
    state.flashcardIndex = 0;
    state.flashcardFlipped = false;
    state.mode = "test";
    updateModeTabs();
    updateViewToggleButtons();
    hideResults();
    pauseTimer();
    state.timerSeconds = loadTimerSetting() * 60;
    updateTimerDisplay();
    renderTestHeader();
    renderQuestions();
    renderFlashcard();
    showToast(`Loaded ${state.currentTest.name}`);
  }

  function renderTestHeader() {
    if (!state.currentTest) {
      elements.testToolbar.title.textContent = "Select a test to begin";
      elements.testToolbar.range.textContent = "--";
      elements.testToolbar.progress.style.width = "0%";
      elements.testToolbar.pageIndicator.textContent = "";
      return;
    }
    const { name, questions } = state.currentTest;
    elements.testToolbar.title.textContent = name;
    const total = questions.length;
    const start = state.viewAll ? 1 : state.currentPage * state.questionsPerPage + 1;
    const end = state.viewAll
      ? total
      : Math.min(start + state.questionsPerPage - 1, total);
    elements.testToolbar.range.textContent = `Questions ${start}-${end} of ${total}`;
    elements.testToolbar.pageIndicator.textContent = state.viewAll
      ? `All questions`
      : `Page ${state.currentPage + 1} of ${getTotalPages()}`;
    updateProgress();
  }

  function renderQuestions() {
    renderTestHeader();
    const container = elements.questionList;
    if (!container) return;
    container.innerHTML = "";
    if (!state.currentTest) {
      container.innerHTML = `<div class="activity-empty">Choose a test to start practising.</div>`;
      elements.pagination.container.classList.add("hidden");
      return;
    }
    if (state.mode === "flashcards") {
      container.classList.add("hidden");
      elements.flashcards.container.classList.remove("hidden");
      elements.pagination.container.classList.add("hidden");
      renderFlashcard();
      return;
    }
    container.classList.remove("hidden");
    elements.flashcards.container.classList.add("hidden");

    const filtered = filterQuestions();
    let questionsToRender = filtered;

    if (!state.viewAll) {
      const start = state.currentPage * state.questionsPerPage;
      const end = start + state.questionsPerPage;
      questionsToRender = filtered.slice(start, end);
    }

    questionsToRender.forEach((question) => {
      container.appendChild(renderQuestionCard(question));
    });

    if (!questionsToRender.length) {
      container.innerHTML = `<div class="activity-empty">No questions match the current view.</div>`;
    }

    const shouldPaginate = !state.viewAll && filtered.length > state.questionsPerPage;
    elements.pagination.container.classList.toggle("hidden", !shouldPaginate);
    if (shouldPaginate) {
      const totalPages = Math.max(Math.ceil(filtered.length / state.questionsPerPage), 1);
      elements.pagination.info.textContent = `Page ${state.currentPage + 1} of ${totalPages}`;
    }
    lucide?.createIcons?.();
  }

  function renderQuestionCard(question) {
    const card = document.createElement("article");
    card.className = "question-card";
    const userAnswer = state.userAnswers.get(question.id);
    const showResults = !elements.resultBanner.classList.contains("hidden");
    card.innerHTML = `
      <div class="question-header">
        <span class="question-number">Q${getQuestionNumber(question.id)}</span>
        <span class="question-source">${question.source}</span>
      </div>
      <div class="question-text">${question.text}</div>
      <div class="options"></div>
      ${state.mode === "study" && question.explanation ? `<div class="hint"><div class="hint-title"><svg data-lucide="zap" width="16" height="16"></svg>Hint</div><div>${question.explanation}</div></div>` : ""}
    `;
    const optionsContainer = card.querySelector(".options");
    const options = Array.isArray(question.options) ? question.options : [];
    options.forEach((option, index) => {
      const button = document.createElement("button");
      button.className = "option";
      button.innerHTML = `<span class="bullet">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
      if (userAnswer === index) {
        button.classList.add("selected");
      }
      if (showResults) {
        const normalizedOption = normalizeAnswer(option);
        if (normalizedOption === question.answer) {
          button.classList.add("correct");
        }
        if (userAnswer === index && normalizedOption !== question.answer) {
          button.classList.add("incorrect");
        }
      }
      button.addEventListener("click", () => {
        if (showResults) return;
        state.userAnswers.set(question.id, index);
        renderQuestions();
        updateProgress();
      });
      optionsContainer.appendChild(button);
    });
    if (!options.length) {
      optionsContainer.innerHTML = `<div class="activity-empty">No answer choices provided.</div>`;
    }
    return card;
  }

  function getQuestionNumber(questionId) {
    const index = state.questions.findIndex((q) => q.id === questionId);
    return index + 1;
  }

  function filterQuestions() {
    if (!state.currentTest) return [];
    const base = state.questions;
    if (state.reviewFilter === "incorrect") {
      return base.filter((question) => {
        const answerIndex = state.userAnswers.get(question.id);
        if (typeof answerIndex !== "number") return false;
        const chosen = normalizeAnswer(question.options[answerIndex]);
        return chosen !== question.answer;
      });
    }
    return base;
  }

  function getTotalPages() {
    const filtered = filterQuestions();
    return Math.max(Math.ceil(filtered.length / state.questionsPerPage), 1);
  }

  function updateProgress() {
    if (!state.currentTest) return;
    const answered = Array.from(state.userAnswers.entries()).filter(([id, index]) => typeof index === "number" && index >= 0);
    const total = state.questions.length;
    const progress = total > 0 ? (answered.length / total) * 100 : 0;
    elements.testToolbar.progress.style.width = `${progress}%`;
  }

  function setMode(mode) {
    state.mode = mode;
    updateModeTabs();
    if (mode === "flashcards") {
      renderFlashcard();
    }
    renderQuestions();
  }

  function updateModeTabs() {
    elements.modeTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.mode === state.mode);
    });
  }

  function renderFlashcard() {
    if (!state.currentTest || !state.questions.length) {
      elements.flashcards.container.classList.add("hidden");
      return;
    }
    elements.flashcards.container.classList.toggle("hidden", state.mode !== "flashcards");
    const question = state.questions[state.flashcardIndex];
    elements.flashcards.front.textContent = stripHtml(question.text);
    const displayAnswer =
      question.displayAnswer || question.correctAnswer || question.answer || "No answer available";
    elements.flashcards.back.innerHTML = displayAnswer;
    elements.flashcards.back.style.display = state.flashcardFlipped ? "block" : "none";
    elements.flashcards.front.style.display = state.flashcardFlipped ? "none" : "block";
  }

  function updateViewToggleButtons() {
    elements.toggleButtons.forEach((btn) => {
      const matches = btn.dataset.questions === "all" ? state.viewAll : !state.viewAll && Number(btn.dataset.questions) === state.questionsPerPage;
      btn.classList.toggle("active", matches);
    });
  }

  function startTimer() {
    if (!state.currentTest || state.timerRunning) return;
    if (state.timerSeconds <= 0) {
      const fallbackMinutes = Number(elements.footer.timerInput.value) || DEFAULTS.TIMER_MINUTES;
      state.timerSeconds = Math.max(fallbackMinutes, 0) * 60;
    }
    state.timerRunning = true;
    state.timerStartedAt = Date.now();
    state.timerInterval = setInterval(() => {
      if (state.timerSeconds > 0) {
        state.timerSeconds -= 1;
        updateTimerDisplay();
      } else {
        pauseTimer();
        submitTest();
      }
    }, 1000);
    elements.testToolbar.start.classList.add("hidden");
    elements.testToolbar.pause.classList.remove("hidden");
  }

  function pauseTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    state.timerRunning = false;
    elements.testToolbar.start.classList.remove("hidden");
    elements.testToolbar.pause.classList.add("hidden");
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(state.timerSeconds / 60);
    const seconds = state.timerSeconds % 60;
    const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;
    elements.testToolbar.timer.textContent = formatted;
  }

  function submitTest() {
    if (!state.currentTest) return;
    const total = state.questions.length;
    let correct = 0;
    state.questions.forEach((question) => {
      const answerIndex = state.userAnswers.get(question.id);
      if (typeof answerIndex !== "number") return;
      const choice = normalizeAnswer(question.options[answerIndex]);
      if (choice === question.answer) {
        correct += 1;
      }
    });
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= state.passMark;
    const emoji = passed ? "🎉" : "💡";
    const headline = passed ? "Great job!" : "Keep practicing";
    const summary = `You answered ${correct} of ${total} questions correctly (${score}%).`;
    elements.resultEmoji.textContent = emoji;
    elements.resultHeadline.textContent = headline;
    elements.resultSummary.textContent = summary;
    elements.resultBanner.classList.remove("hidden");
    state.reviewFilter = "all";
    pauseTimer();
    const durationSeconds = state.timerStartedAt ? Math.max(Math.round((Date.now() - state.timerStartedAt) / 1000), 1) : 0;
    registerCompletion({
      scorePercentage: score,
      correct,
      passed,
      total,
      durationSeconds,
    });
    renderQuestions();
  }

  function hideResults() {
    elements.resultBanner.classList.add("hidden");
  }

  function registerCompletion({ scorePercentage, correct, passed, total, durationSeconds }) {
    const testName = state.currentTest ? state.currentTest.name : "Unknown Test";
    const entry = {
      test: testName,
      score: scorePercentage,
      status: passed ? "passed" : "failed",
      questions: total,
      timestamp: Date.now(),
    };
    state.recentActivity.push(entry);
    if (state.recentActivity.length > 20) {
      state.recentActivity = state.recentActivity.slice(-20);
    }
    saveRecentActivity();
    updateStats(passed);
    evaluateAchievements({
      correct,
      total,
      percentage: scorePercentage,
      durationSeconds,
    });
    renderDashboard();
    renderActivity();
    renderAchievements();
  }

  function updateStats(passed) {
    const today = new Date().toISOString().split("T")[0];
    if (state.stats.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      state.stats.streak = state.stats.lastActiveDate === yesterday ? state.stats.streak + 1 : 1;
      state.stats.lastActiveDate = today;
    }
    state.stats.testsTaken += 1;
    if (passed) {
      state.stats.testsPassed += 1;
    } else {
      state.stats.testsFailed += 1;
    }
    saveStats();
  }

  function evaluateAchievements({ correct, total, percentage, durationSeconds }) {
    const context = {
      score: correct,
      total,
      durationSeconds,
      streak: state.stats.streak,
    };
    ACHIEVEMENTS.forEach((achievement) => {
      if (!state.unlockedAchievements.has(achievement.id) && achievement.check(context)) {
        state.unlockedAchievements.add(achievement.id);
        saveAchievements();
        showToast(`Achievement unlocked: ${achievement.name}`);
      }
    });
  }

  function resetTest() {
    if (!state.currentTest) return;
    startTest(state.currentTest);
    hideResults();
    pauseTimer();
    const minutes = Number(elements.footer.timerInput.value) || DEFAULTS.TIMER_MINUTES;
    state.timerSeconds = Math.max(minutes, 0) * 60;
    updateTimerDisplay();
  }

  function startCustomTest() {
    const selectedFiles = getSelectedCustomTests();
    if (!selectedFiles.length) {
      showToast("Select at least one test to build a custom mix");
      return;
    }
    const questionsPool = selectedFiles.flatMap((file) => {
      const test = state.tests.find((t) => t.file === file);
      return (test?.questions || []).map((question, index) => ({
        ...question,
        source: test?.name || file,
        id: `${file}-${index}-${Math.random().toString(36).slice(2)}`,
      }));
    });
    if (!questionsPool.length) {
      showToast("Selected tests do not contain questions");
      return;
    }
    const count = clamp(Number(elements.modalContent.customQuestionCount.value) || questionsPool.length, 1, questionsPool.length);
    shuffleArray(questionsPool);
    const selectedQuestions = questionsPool.slice(0, count);
    const customTimer = Math.max(Number(elements.modalContent.customTimer.value) || DEFAULTS.TIMER_MINUTES, 0);
    state.timerSeconds = customTimer * 60;
    elements.footer.timerInput.value = customTimer;
    state.currentTest = {
      file: "custom",
      name: "Custom Mix",
      difficulty: "Mixed",
      questions: selectedQuestions.map((question) => ({
        ...question,
        correctAnswer: question.correctAnswer,
      })),
      custom: true,
    };
    startTest(state.currentTest);
    closeAllModals();
    setActiveView("test");
    showToast("Custom session ready");
  }

  function getSelectedCustomTests() {
    return Array.from(elements.modalContent.customList.querySelectorAll("input[type=checkbox]"))
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.dataset.file);
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.questions)) {
          throw new Error("Invalid test file: missing questions array");
        }
        const test = {
          file: file.name,
          name: data.testName || file.name.replace(/\.json$/, ""),
          difficulty: data.difficulty || "Custom",
          questions: data.questions,
          custom: true,
        };
        state.tests.unshift(test);
        renderDashboardTests();
        renderTestSelector();
        showToast(`Uploaded ${test.name}`);
      } catch (error) {
        console.error(error);
        showToast("Unable to import test file");
      }
    };
    reader.readAsText(file);
  }

  function downloadResults() {
    if (!state.currentTest) return;
    const lines = [];
    lines.push(`StudyFlow Results - ${state.currentTest.name}`);
    lines.push(`Score: ${elements.resultSummary.textContent}`);
    lines.push("");
    state.questions.forEach((question, index) => {
      lines.push(`Q${index + 1}: ${stripHtml(question.text)}`);
      const answerIndex = state.userAnswers.get(question.id);
      const hasOptions = Array.isArray(question.options);
      const userAnswer =
        typeof answerIndex === "number" && hasOptions
          ? stripHtml(question.options[answerIndex])
          : "Not answered";
      lines.push(`Your answer: ${userAnswer}`);
      lines.push(`Correct answer: ${stripHtml(question.displayAnswer || question.correctAnswer || question.answer || "")}`);
      if (question.explanation) {
        lines.push(`Hint: ${stripHtml(question.explanation)}`);
      }
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.currentTest.name.replace(/\s+/g, "-")}-results.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function setTheme(theme) {
    state.theme = theme;
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    elements.modalContent.toolsThemeToggle.dataset.state = theme === "dark" ? "on" : "off";
  }

  function toggleTheme() {
    const newTheme = state.theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }

  function applyTheme(theme) {
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme === "light");
    lucide?.createIcons?.();
  }

  function openModal(modal) {
    if (!modal) return;
    closeAllModals();
    modal.classList.add("active");
    elements.modals.backdrop.classList.add("active");
    updateCustomSummary();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
  }

  function closeAllModals() {
    Object.values(elements.modals).forEach((modal) => {
      if (modal && modal.classList) {
        modal.classList.remove("active");
      }
    });
    elements.modals.backdrop.classList.remove("active");
  }

  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add("active");
    setTimeout(() => elements.toast.classList.remove("active"), 2200);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function calculateXp() {
    const base = state.stats.testsTaken * 120;
    const success = state.stats.testsPassed * 80;
    const badges = state.unlockedAchievements.size * 150;
    return base + success + badges;
  }

  function loadStats() {
    const stored = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!stored) {
      return {
        testsTaken: 0,
        testsPassed: 0,
        testsFailed: 0,
        streak: 0,
        lastActiveDate: null,
      };
    }
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Unable to parse stats", error);
      return {
        testsTaken: 0,
        testsPassed: 0,
        testsFailed: 0,
        streak: 0,
        lastActiveDate: null,
      };
    }
  }

  function saveStats() {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(state.stats));
  }

  function resetStats() {
    state.stats = {
      testsTaken: 0,
      testsPassed: 0,
      testsFailed: 0,
      streak: 0,
      lastActiveDate: null,
    };
    state.recentActivity = [];
    state.unlockedAchievements.clear();
    saveStats();
    saveRecentActivity();
    saveAchievements();
  }

  function loadRecentActivity() {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Unable to parse activity", error);
      return [];
    }
  }

  function saveRecentActivity() {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(state.recentActivity));
  }

  function loadAchievements() {
    const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (!stored) return new Set();
    try {
      const parsed = JSON.parse(stored);
      return new Set(parsed);
    } catch (error) {
      console.warn("Unable to parse achievements", error);
      return new Set();
    }
  }

  function saveAchievements() {
    localStorage.setItem(
      STORAGE_KEYS.ACHIEVEMENTS,
      JSON.stringify(Array.from(state.unlockedAchievements))
    );
  }

  function loadTheme() {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    return stored === "light" ? "light" : "dark";
  }

  function loadPassMarkSetting() {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.PASS_MARK));
    if (Number.isFinite(stored)) {
      return clamp(stored, 0, 100);
    }
    return DEFAULTS.PASS_MARK;
  }

  function savePassMarkSetting(value) {
    localStorage.setItem(STORAGE_KEYS.PASS_MARK, String(value));
  }

  function loadTimerSetting() {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.TIMER));
    if (Number.isFinite(stored) && stored >= 0) {
      return stored;
    }
    return DEFAULTS.TIMER_MINUTES;
  }

  function saveTimerSetting(value) {
    localStorage.setItem(STORAGE_KEYS.TIMER, String(value));
  }

  function normalizeAnswer(value) {
    return stripHtml(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function stripHtml(value) {
    const temp = document.createElement("div");
    temp.innerHTML = value || "";
    return temp.textContent || temp.innerText || "";
  }

  function difficultyClass(level) {
    switch ((level || "").toLowerCase()) {
      case "hard":
        return "difficulty-hard";
      case "easy":
        return "difficulty-easy";
      default:
        return "difficulty-medium";
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function cloneDeep(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.floor(diff / 86400000);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  init();
});
