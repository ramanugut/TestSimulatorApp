// script.js

document.addEventListener("DOMContentLoaded", function () {
  //************************ SECTION 1: INITIALIZATION ************************//

  // Global variables
  let questions = [];
  let originalQuestions = [];
  let currentPage = 1;
  const questionsPerPage = 10;
  let userAnswers = {};
  let timer;
  let remainingTime;
  let isStudyMode = false;
  let isTimerPaused = false;
  let timerStarted = false;
  let testInProgress = false;
  let testSubmitted = false;
  let currentTestFile = "";
  let bookmarkedQuestions = new Set();
  let initialTimerSeconds = null;
  let bookmarkCycleIndex = 0;
  let lastMotivationIndex = null;
  let currentMode = "test";
  let questionResults = [];
  let reviewFilter = "all";

  //************************ SECTION 1A: ELEMENT REFERENCES ************************//

  const questionsContainer = document.getElementById("questions-container");
  const timerInput = document.getElementById("timer-input");
  const passMarkInput = document.getElementById("pass-mark-input");
  const startTestButton = document.getElementById("start-test");
  const pauseTimerButton = document.getElementById("pause-timer");
  const floatingTimeDisplay = document.getElementById("floating-time");
  const submitButton = document.getElementById("submit-test");
  const resetButton = document.getElementById("reset-test");
  const downloadButton = document.getElementById("download-results");
  const scoreContainer = document.getElementById("score-container");
  const scoreElement = document.getElementById("score");
  const resultMessageElement = document.getElementById("result-message");
  const testSelect = document.getElementById("test-select");
  const studyModeToggle = document.getElementById("study-mode-toggle");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const paginationControls = document.getElementById("pagination-controls");
  const prevPageButton = document.getElementById("prev-page");
  const nextPageButton = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const uploadTestInput = document.getElementById("upload-test-input");
  const motivationMessageElement = document.getElementById("motivation-message");
  const newMotivationButton = document.getElementById("new-motivation");
  const bookmarkListElement = document.getElementById("bookmark-list");
  const cycleBookmarksButton = document.getElementById("cycle-bookmarks");
  const achievementListElement = document.getElementById("achievement-list");
  const achievementToast = document.getElementById("achievement-toast");
  const flashcardsGrid = document.getElementById("flashcards-grid");
  const flashcardsEmptyState = document.getElementById("flashcards-empty");
  const reviewFilterSelect = document.getElementById("review-filter");
  const scoreFilterContainer = document.getElementById(
    "score-filter-container"
  );
  const filterEmptyStateElement = document.getElementById(
    "filter-empty-state"
  );
  const resultBanner = document.getElementById("result-banner");
  const resultEmojiElement = document.getElementById("result-emoji");
  const resultHeadlineElement = document.getElementById("result-headline");
  const resultSummaryElement = document.getElementById("result-summary");
  const resultRestartButton = document.getElementById("result-restart");
  const resultReviewFailedButton = document.getElementById(
    "result-review-failed"
  );
  const resultReviewAllButton = document.getElementById("result-review-all");
  const modeButtons = document.querySelectorAll(".mode-tab-button");
  const modePanelTest = document.getElementById("mode-panel-test");
  const modePanelFlashcards = document.getElementById("mode-panel-flashcards");
  const openOptionsButton = document.getElementById("open-options");
  const closeOptionsButton = document.getElementById("close-options");
  const optionsModal = document.getElementById("options-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const streakValueElement = document.getElementById("streak-value");
  const xpValueElement = document.getElementById("xp-value");
  const badgeValueElement = document.getElementById("badge-value");
  const statsTestsTakenElement = document.getElementById("stats-tests-taken");
  const statsTestsPassedElement = document.getElementById("stats-tests-passed");
  const statsTestsFailedElement = document.getElementById("stats-tests-failed");
  const statsTestsAbandonedElement = document.getElementById("stats-tests-abandoned");
  const statsPassedList = document.getElementById("stats-passed-list");
  const statsFailedList = document.getElementById("stats-failed-list");
  const statsAbandonedList = document.getElementById("stats-abandoned-list");
  const statsResetButton = document.getElementById("stats-reset");
  const downloadReportButton = document.getElementById("download-report");
  const progressBarElement = document.getElementById("progress-bar");
  const progressTextElement = document.getElementById("progress-text");
  const headerElement = document.getElementById("floating-header");
  const headerToggleButton = document.getElementById("header-toggle");
  const floatingActionsContainer = document.getElementById("floating-actions");
  const floatingActionsToggle = document.getElementById(
    "floating-actions-toggle"
  );

  const MOBILE_BREAKPOINT = 768;
  let lastViewportIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  let headerCollapsed = window.innerWidth <= MOBILE_BREAKPOINT;
  let actionsCollapsed = window.innerWidth <= MOBILE_BREAKPOINT;

  if (flashcardsGrid) {
    flashcardsGrid.classList.add("hidden");
  }

  function getTimerInputSeconds() {
    if (!timerInput) {
      return 0;
    }
    const minutes = parseInt(timerInput.value, 10);
    if (Number.isNaN(minutes)) {
      return 0;
    }
    return Math.max(minutes, 0) * 60;
  }

  remainingTime = getTimerInputSeconds();
  updateTimerDisplay(
    Math.floor(remainingTime / 60) || 0,
    Math.max(remainingTime % 60, 0)
  );

  const motivationMessages = [
    "You're turning knowledge into power!",
    "Every answer gets you closer to your goals.",
    "Stay curious and keep exploring!",
    "Brains love challenges—keep them coming!",
    "Small steps today lead to big wins tomorrow.",
    "You’ve got this—one question at a time!",
    "Learning is your superpower. Use it!",
  ];

  const achievementDefinitions = [
    {
      id: "first-test",
      title: "First Steps",
      description: "Complete your first test.",
    },
    {
      id: "perfect-score",
      title: "Perfectionist",
      description: "Score 100% on a test.",
    },
    {
      id: "speedster",
      title: "Speedster",
      description: "Finish a test with more than five minutes to spare.",
    },
    {
      id: "bookmark-hero",
      title: "Bookmark Hero",
      description: "Bookmark five questions in a single test.",
    },
  ];

  let unlockedAchievements = new Set();
  try {
    const storedAchievements = JSON.parse(
      localStorage.getItem("achievements") || "[]"
    );
    if (Array.isArray(storedAchievements)) {
      unlockedAchievements = new Set(storedAchievements);
    }
  } catch (error) {
    console.warn("Unable to load achievements:", error);
  }

  // Stats tracking
  let testStats = {
    testsTaken: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsAbandoned: 0,
    passedTests: [],
    failedTests: [],
    abandonedTests: [],
  };

  let streakData = {
    count: 0,
    lastDate: null,
  };

  function resetReviewState() {
    questionResults = [];
    reviewFilter = "all";
    if (reviewFilterSelect) {
      reviewFilterSelect.value = "all";
    }
    if (scoreFilterContainer) {
      scoreFilterContainer.classList.add("hidden");
    }
    if (filterEmptyStateElement) {
      filterEmptyStateElement.classList.add("hidden");
    }
  }

  function updateReviewFilterVisibility() {
    if (!scoreFilterContainer) {
      return;
    }
    if (testSubmitted && questions.length > 0 && questionResults.length > 0) {
      scoreFilterContainer.classList.remove("hidden");
      if (reviewFilterSelect) {
        reviewFilterSelect.value = reviewFilter;
      }
    } else {
      scoreFilterContainer.classList.add("hidden");
    }
  }

  function hideResultBanner() {
    if (!resultBanner) {
      return;
    }
    resultBanner.classList.add("hidden");
    resultBanner.classList.remove("result-banner--pass", "result-banner--fail");
    if (resultEmojiElement) {
      resultEmojiElement.classList.remove("party", "sad");
    }
  }

  function showResultBanner({ status, scorePercent, scoreBreakdown, missedCount }) {
    if (
      !resultBanner ||
      !resultEmojiElement ||
      !resultHeadlineElement ||
      !resultSummaryElement
    ) {
      return;
    }

    resultBanner.classList.remove(
      "hidden",
      "result-banner--pass",
      "result-banner--fail"
    );
    resultEmojiElement.classList.remove("party", "sad");

    const missedMessageTail =
      missedCount === 0
        ? ""
        : ` ${missedCount} question${missedCount === 1 ? "" : "s"} to review.`;

    if (status === "pass") {
      resultBanner.classList.add("result-banner--pass");
      resultEmojiElement.textContent = "🎉🥳🎊";
      resultEmojiElement.classList.add("party");
      resultHeadlineElement.textContent = "You Passed!";
      const celebrationMessage =
        missedCount === 0
          ? "You aced every question. Incredible work!"
          : `Amazing job—you were close!${missedMessageTail}`;
      resultSummaryElement.textContent = `You scored ${scorePercent}% (${scoreBreakdown}). ${celebrationMessage}`;
    } else {
      resultBanner.classList.add("result-banner--fail");
      resultEmojiElement.textContent = "😢";
      resultEmojiElement.classList.add("sad");
      resultHeadlineElement.textContent = "Keep Going!";
      const encouragementMessage =
        missedCount === 0
          ? "Give it another go—you have the knowledge to improve!"
          : `You've got this—review those tricky spots.${missedMessageTail}`;
      resultSummaryElement.textContent = `You scored ${scorePercent}% (${scoreBreakdown}). ${encouragementMessage}`;
    }

    if (resultReviewFailedButton) {
      resultReviewFailedButton.disabled = missedCount === 0;
    }

    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (typeof resultBanner.scrollIntoView === "function") {
      resultBanner.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (typeof resultBanner.focus === "function") {
      requestAnimationFrame(() => {
        resultBanner.focus();
      });
    }
  }

  function setReviewMode(newFilter) {
    reviewFilter = newFilter;
    if (reviewFilterSelect) {
      reviewFilterSelect.value = newFilter;
    }
    currentPage = 1;
    renderQuestions();
    updatePaginationControls();
    updateBookmarkPanel();
  }

  function getFilteredQuestionIndexes() {
    const totalQuestions = questions.length;
    const allIndexes = Array.from({ length: totalQuestions }, (_, index) => index);

    if (!testSubmitted || questionResults.length === 0) {
      return allIndexes;
    }

    if (reviewFilter === "correct") {
      return allIndexes.filter((index) => questionResults[index] === "correct");
    }

    if (reviewFilter === "incorrect") {
      return allIndexes.filter((index) => questionResults[index] !== "correct");
    }

    return allIndexes;
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Load stats from localStorage
  function loadStats() {
    const storedDate = localStorage.getItem("statsDate");
    if (storedDate === today) {
      const storedStats = JSON.parse(localStorage.getItem("testStats"));
      if (storedStats) {
        testStats = storedStats;
      }
    } else {
      // New day, reset stats
      localStorage.setItem("statsDate", today);
      saveStats();
    }
    updateStatsDisplay();
  }

  // Save stats to localStorage
  function saveStats() {
    localStorage.setItem("testStats", JSON.stringify(testStats));
  }

  // Update stats display
  function updateStatsDisplay() {
    updateStatsPanel();
    updateGamification();
  }

  function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function syncHeaderToggleState() {
    if (!headerElement || !headerToggleButton) {
      return;
    }

    if (!isMobileViewport()) {
      headerCollapsed = false;
      headerElement.classList.remove("collapsed");
      headerToggleButton.setAttribute("aria-expanded", "true");
      headerToggleButton.setAttribute("aria-label", "Hide header tools");
      headerToggleButton.setAttribute("title", "Hide header tools");
      return;
    }

    headerElement.classList.toggle("collapsed", headerCollapsed);
    const headerToggleLabel = headerCollapsed
      ? "Show header tools"
      : "Hide header tools";
    headerToggleButton.setAttribute(
      "aria-expanded",
      headerCollapsed ? "false" : "true"
    );
    headerToggleButton.setAttribute("aria-label", headerToggleLabel);
    headerToggleButton.setAttribute("title", headerToggleLabel);
  }

  function syncFloatingActionsState() {
    if (!floatingActionsContainer || !floatingActionsToggle) {
      return;
    }

    floatingActionsContainer.classList.toggle("collapsed", actionsCollapsed);
    const toggleLabel = actionsCollapsed
      ? "Show quick actions"
      : "Hide quick actions";
    floatingActionsToggle.setAttribute(
      "aria-expanded",
      actionsCollapsed ? "false" : "true"
    );
    floatingActionsToggle.setAttribute("aria-label", toggleLabel);
    floatingActionsToggle.setAttribute("title", toggleLabel);
  }

  function updateModeButtons(activeMode) {
    if (!modeButtons.length) {
      return;
    }

    modeButtons.forEach((button) => {
      const isActive = button.dataset.mode === activeMode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive.toString());
      button.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  }

  function updateModePanels(activeMode) {
    const showFlashcards = activeMode === "flashcards";

    if (modePanelTest) {
      modePanelTest.classList.toggle("active", !showFlashcards);
      modePanelTest.setAttribute("aria-hidden", showFlashcards.toString());
    }

    if (modePanelFlashcards) {
      modePanelFlashcards.classList.toggle("active", showFlashcards);
      modePanelFlashcards.setAttribute(
        "aria-hidden",
        (!showFlashcards).toString()
      );
    }
  }

  function applyStudyModeState(checked) {
    if (isStudyMode === checked) {
      return;
    }

    isStudyMode = checked;
    document.body.classList.toggle("study-mode-active", isStudyMode);
    renderQuestions();
  }

  function isOptionsModalOpen() {
    return optionsModal && !optionsModal.classList.contains("hidden");
  }

  function openOptionsModal() {
    if (!optionsModal || !modalBackdrop) {
      return;
    }

    if (isOptionsModalOpen()) {
      return;
    }

    optionsModal.classList.remove("hidden");
    modalBackdrop.classList.remove("hidden");
    optionsModal.setAttribute("aria-hidden", "false");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (openOptionsButton) {
      openOptionsButton.setAttribute("aria-expanded", "true");
    }

    if (closeOptionsButton) {
      closeOptionsButton.focus();
    }
  }

  function closeOptionsModal() {
    if (!optionsModal || !modalBackdrop) {
      return;
    }

    if (!isOptionsModalOpen()) {
      return;
    }

    optionsModal.classList.add("hidden");
    modalBackdrop.classList.add("hidden");
    optionsModal.setAttribute("aria-hidden", "true");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (openOptionsButton) {
      openOptionsButton.setAttribute("aria-expanded", "false");
    }

    if (openOptionsButton && optionsModal.contains(document.activeElement)) {
      openOptionsButton.focus();
    }
  }

  function setMode(mode) {
    if (!mode) {
      return;
    }

    if (mode === currentMode) {
      updateModeButtons(currentMode);
      updateModePanels(currentMode);

      if (currentMode === "flashcards") {
        renderFlashcards();
      } else if (currentMode === "study") {
        if (studyModeToggle && !studyModeToggle.checked) {
          studyModeToggle.checked = true;
        }
        applyStudyModeState(true);
      } else if (currentMode === "test") {
        if (studyModeToggle && studyModeToggle.checked) {
          studyModeToggle.checked = false;
        }
        applyStudyModeState(false);
      }

      return;
    }

    currentMode = mode;

    if (mode === "study") {
      if (studyModeToggle && !studyModeToggle.checked) {
        studyModeToggle.checked = true;
      }
      applyStudyModeState(true);
    } else if (mode === "test") {
      if (studyModeToggle && studyModeToggle.checked) {
        studyModeToggle.checked = false;
      }
      applyStudyModeState(false);
    }

    updateModeButtons(mode);
    updateModePanels(mode);

    if (mode === "flashcards") {
      renderFlashcards();
    }
  }


  function handleResponsiveState() {
    const isMobile = isMobileViewport();

    if (isMobile && !lastViewportIsMobile) {
      headerCollapsed = true;
      actionsCollapsed = true;
      if (isOptionsModalOpen()) {
        closeOptionsModal();
      }
    } else if (!isMobile && lastViewportIsMobile) {
      headerCollapsed = false;
    }

    syncHeaderToggleState();
    syncFloatingActionsState();

    lastViewportIsMobile = isMobile;
  }

  function escapeHTML(value) {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = typeof value === "string" ? value : String(value);
    return stringValue
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatInlineRichText(segment) {
    if (!segment) {
      return "";
    }
    const safeSegment =
      typeof segment === "string" ? segment : String(segment);
    const parts = safeSegment.split(/`([^`]+)`/g);
    return parts
      .map((part, index) => {
        if (index % 2 === 0) {
          return escapeHTML(part).replace(/\n/g, "<br>");
        }
        return `<code class="inline-code">${escapeHTML(part)}</code>`;
      })
      .join("");
  }

  function formatRichText(text) {
    if (!text) {
      return "";
    }
    const safeText = typeof text === "string" ? text : String(text);

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    const segments = [];
    let match;

    while ((match = codeBlockRegex.exec(safeText)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          value: safeText.slice(lastIndex, match.index),
        });
      }
      segments.push({
        type: "code",
        language: match[1] ? match[1].trim() : "",
        value: match[2] || "",
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < safeText.length) {
      segments.push({
        type: "text",
        value: safeText.slice(lastIndex),
      });
    }

    return segments
      .map((segment) => {
        if (segment.type === "code") {
          const trimmedCode = segment.value.replace(/^\n+|\n+$/g, "");
          const languageClass = segment.language
            ? ` language-${segment.language.toLowerCase()}`
            : "";
          return `<pre class="code-block"><code class="${languageClass}">${escapeHTML(
            trimmedCode
          )}</code></pre>`;
        }
        return formatInlineRichText(segment.value);
      })
      .join("")
      .trim();
  }


  function resetStats() {
    // Reset the stats object
    testStats = {
      testsTaken: 0,
      testsPassed: 0,
      testsFailed: 0,
      testsAbandoned: 0,
      passedTests: [],
      failedTests: [],
      abandonedTests: [],
    };
    resetStreak();
    // Save to localStorage
    saveStats();
    // Update the stats display
    updateStatsDisplay();
  }

  function updateHistoryList(listElement, items) {
    if (!listElement) return;
    listElement.innerHTML = "";
    if (!items || items.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "No records yet.";
      listElement.appendChild(emptyItem);
      return;
    }

    items
      .slice(-5)
      .reverse()
      .forEach((item) => {
        const entry = document.createElement("li");
        entry.textContent = item;
        listElement.appendChild(entry);
      });
  }

  function updateStatsPanel() {
    if (statsTestsTakenElement) {
      statsTestsTakenElement.textContent = testStats.testsTaken;
    }
    if (statsTestsPassedElement) {
      statsTestsPassedElement.textContent = testStats.testsPassed;
    }
    if (statsTestsFailedElement) {
      statsTestsFailedElement.textContent = testStats.testsFailed;
    }
    if (statsTestsAbandonedElement) {
      statsTestsAbandonedElement.textContent = testStats.testsAbandoned;
    }
    updateHistoryList(statsPassedList, testStats.passedTests);
    updateHistoryList(statsFailedList, testStats.failedTests);
    updateHistoryList(statsAbandonedList, testStats.abandonedTests);
  }

  function calculateXp() {
    const activityPoints = testStats.testsTaken * 120;
    const successBonus = testStats.testsPassed * 80;
    const achievementBonus = unlockedAchievements.size * 150;
    return activityPoints + successBonus + achievementBonus;
  }

  function updateGamification() {
    if (streakValueElement) {
      const label = streakData.count === 1 ? "day" : "days";
      streakValueElement.textContent = `${streakData.count} ${label}`;
    }
    if (xpValueElement) {
      xpValueElement.textContent = calculateXp().toLocaleString();
    }
    if (badgeValueElement) {
      const badgeCount = unlockedAchievements.size;
      badgeValueElement.textContent = `${badgeCount} ${
        badgeCount === 1 ? "badge" : "badges"
      } earned`;
    }
  }

  function saveStreak() {
    localStorage.setItem("studyStreak", JSON.stringify(streakData));
  }

  function resetStreak() {
    streakData = { count: 0, lastDate: null };
    saveStreak();
    updateGamification();
  }

  function isConsecutiveDay(previousDate, currentDate) {
    if (!previousDate) return false;
    const previous = new Date(previousDate);
    const current = new Date(currentDate);
    if (Number.isNaN(previous.getTime()) || Number.isNaN(current.getTime())) {
      return false;
    }
    const diff = current.setHours(0, 0, 0, 0) - previous.setHours(0, 0, 0, 0);
    return Math.round(diff / (1000 * 60 * 60 * 24)) === 1;
  }

  function incrementStreakIfNeeded() {
    if (streakData.lastDate === today) {
      return;
    }
    if (streakData.lastDate && isConsecutiveDay(streakData.lastDate, today)) {
      streakData.count += 1;
    } else {
      streakData.count = 1;
    }
    streakData.lastDate = today;
    saveStreak();
    updateGamification();
  }

  function loadStreak() {
    try {
      const stored = JSON.parse(localStorage.getItem("studyStreak"));
      if (stored && typeof stored.count === "number") {
        streakData = stored;
      }
    } catch (error) {
      console.warn("Unable to load streak data:", error);
    }

    if (
      streakData.lastDate &&
      streakData.lastDate !== today &&
      !isConsecutiveDay(streakData.lastDate, today)
    ) {
      streakData.count = 0;
    }

    updateGamification();
  }

  if (statsResetButton) {
    statsResetButton.addEventListener("click", resetStats);
  }

  if (optionsModal) {
    optionsModal.setAttribute(
      "aria-hidden",
      optionsModal.classList.contains("hidden") ? "true" : "false"
    );
  }

  if (modalBackdrop) {
    modalBackdrop.setAttribute(
      "aria-hidden",
      modalBackdrop.classList.contains("hidden") ? "true" : "false"
    );
    modalBackdrop.addEventListener("click", closeOptionsModal);
  }

  if (modeButtons.length) {
    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetMode = button.dataset.mode;
        if (targetMode) {
          setMode(targetMode);
        }
      });
    });
  }

  if (openOptionsButton) {
    openOptionsButton.addEventListener("click", openOptionsModal);
  }

  if (closeOptionsButton) {
    closeOptionsButton.addEventListener("click", closeOptionsModal);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOptionsModalOpen()) {
      closeOptionsModal();
    }
  });

  if (studyModeToggle && studyModeToggle.checked) {
    currentMode = "study";
  }

  setMode(currentMode);

  handleResponsiveState();

  if (headerToggleButton) {
    headerToggleButton.addEventListener("click", () => {
      if (!isMobileViewport()) {
        return;
      }
      headerCollapsed = !headerCollapsed;
      syncHeaderToggleState();
    });
  }

  if (floatingActionsToggle) {
    floatingActionsToggle.addEventListener("click", () => {
      actionsCollapsed = !actionsCollapsed;
      syncFloatingActionsState();
    });
  }


  window.addEventListener("resize", handleResponsiveState);

  loadStreak();
  loadStats();

  //************************ SECTION 1B: MOTIVATION & ACHIEVEMENTS ************************//


  function updateMotivationMessage() {
    if (!motivationMessageElement) return;
    let randomIndex = Math.floor(Math.random() * motivationMessages.length);
    if (motivationMessages.length > 1 && randomIndex === lastMotivationIndex) {
      randomIndex = (randomIndex + 1) % motivationMessages.length;
    }
    lastMotivationIndex = randomIndex;
    motivationMessageElement.textContent = motivationMessages[randomIndex];
  }

  if (newMotivationButton) {
    newMotivationButton.addEventListener("click", updateMotivationMessage);
  }

  updateMotivationMessage();

  let toastTimeoutId;


  function saveAchievements() {
    localStorage.setItem(
      "achievements",
      JSON.stringify(Array.from(unlockedAchievements))
    );
  }

  function showAchievementToast(message) {
    if (!achievementToast) return;
    achievementToast.textContent = message;
    achievementToast.classList.remove("hidden");
    achievementToast.classList.add("visible");
    clearTimeout(toastTimeoutId);
    toastTimeoutId = setTimeout(() => {
      achievementToast.classList.remove("visible");
      toastTimeoutId = setTimeout(() => {
        achievementToast.classList.add("hidden");
      }, 400);
    }, 2500);
  }

  function updateAchievementDisplay() {
    if (!achievementListElement) return;
    achievementListElement.innerHTML = "";
    if (unlockedAchievements.size === 0) {
      const emptyState = document.createElement("li");
      emptyState.classList.add("empty");
      emptyState.textContent = "Complete a test to start earning badges!";
      achievementListElement.appendChild(emptyState);
      return;
    }

    achievementDefinitions.forEach((achievement) => {
      if (unlockedAchievements.has(achievement.id)) {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${achievement.title}:</strong> ${achievement.description}`;
        achievementListElement.appendChild(item);
      }
    });

    updateGamification();
  }

  function unlockAchievement(achievementId) {
    if (unlockedAchievements.has(achievementId)) {
      return;
    }
    unlockedAchievements.add(achievementId);
    saveAchievements();
    updateAchievementDisplay();
    const achievement = achievementDefinitions.find(
      (item) => item.id === achievementId
    );
    if (achievement) {
      showAchievementToast(`Achievement unlocked: ${achievement.title}!`);
    }
  }

  function evaluateAchievements(score, timeLeftAtSubmission) {
    if (questions.length === 0) return;

    unlockAchievement("first-test");

    if (score === questions.length) {
      unlockAchievement("perfect-score");
    }

    if (
      typeof timeLeftAtSubmission === "number" &&
      timeLeftAtSubmission >= 300
    ) {
      unlockAchievement("speedster");
    }

    checkBookmarkAchievements();
  }

  updateAchievementDisplay();


  //************************ SECTION 3: THEME HANDLING ************************//

  // Handle Dark Mode theme based on user preferences
  if (darkModeToggle) {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
      darkModeToggle.textContent = "Disable Dark Mode";
    } else {
      document.body.classList.add("light-mode");
      darkModeToggle.textContent = "Enable Dark Mode";
    }

    darkModeToggle.addEventListener("click", () => {
      if (document.body.classList.contains("dark-mode")) {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        localStorage.setItem("theme", "light");
        darkModeToggle.textContent = "Enable Dark Mode";
      } else {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
        darkModeToggle.textContent = "Disable Dark Mode";
      }
    });
  }

  //************************ SECTION 4: TEST FILE LOADING ************************//

  // Test file references
const testFiles = [
 /* "test23.json",
  "test24.json",
  "test25.json",
  "test26.json", **/
  "test27.json",
  "test28.json",
  "test28b.json",
  "test29.json",
  "test30.json",
  "test31.json",
  "test32.json",
   "test33a.json",
  "test33b.json",
  "test33c.json",
  "test33d.json",
  "test33e.json",
  "test33f.json",
  "test34Social.json",
  "test35.json"
];


  // Load test files into the select element
  function loadTestFiles() {
    testSelect.innerHTML = ""; // Clear existing options
    let firstTestLoaded = false;
    let savedProgressFile = null;
    try {
      const storedProgress = JSON.parse(localStorage.getItem("testProgress"));
      if (storedProgress && storedProgress.currentTestFile) {
        savedProgressFile = storedProgress.currentTestFile;
      }
    } catch (error) {
      console.warn("Unable to read saved progress metadata:", error);
    }

    let fetchPromises = testFiles.map((filename) => {
      return fetch(filename)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error loading file: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          const option = document.createElement("option");
          option.value = filename;
          option.textContent = data.testName
            ? data.testName
            : filename.replace(".json", "").replace(/_/g, " ");
          testSelect.appendChild(option);

          const shouldLoadThisFile = savedProgressFile
            ? filename === savedProgressFile
            : !firstTestLoaded;

          if (!firstTestLoaded && shouldLoadThisFile) {
            firstTestLoaded = true;
            testSelect.value = filename;
            loadQuestions(filename);
          }
        })
        .catch((error) => {
          console.error("Error loading test name:", error);
          const errorOption = document.createElement("option");
          errorOption.textContent = `Error loading ${filename}`;
          errorOption.disabled = true;
          testSelect.appendChild(errorOption);
        });
    });

    Promise.all(fetchPromises)
      .then(() => {
        console.log("All test files loaded");
        if (!firstTestLoaded && testFiles.length > 0) {
          testSelect.value = testFiles[0];
          loadQuestions(testFiles[0]);
        }
        testSelect.dataset.previousValue = testSelect.value;
      })
      .catch((error) => {
        console.error("Error loading test files:", error);
      });
  }

  // Load the test files into the dropdown on page load
  loadTestFiles();

  //************************ SECTION 5: QUESTION LOADING ************************//

  // Load questions from selected file
  function cloneQuestionData(question) {
    if (!question || typeof question !== "object") {
      return question;
    }

    const clonedQuestion = { ...question };

    if (Array.isArray(question.options)) {
      clonedQuestion.options = [...question.options];
    }

    if (Array.isArray(question.correctAnswer)) {
      clonedQuestion.correctAnswer = [...question.correctAnswer];
    }

    return clonedQuestion;
  }

  function cloneQuestionsData(rawQuestions) {
    if (!Array.isArray(rawQuestions)) {
      return [];
    }
    return rawQuestions.map((question) => cloneQuestionData(question));
  }

  function prepareQuestionsForSession(baseQuestions) {
    if (!Array.isArray(baseQuestions)) {
      return [];
    }

    const questionsWithShuffledOptions = baseQuestions.map((question) => {
      const clonedQuestion = cloneQuestionData(question);
      if (Array.isArray(clonedQuestion.options)) {
        clonedQuestion.options = shuffleArray([...clonedQuestion.options]);
      }
      return clonedQuestion;
    });

    return shuffleArray(questionsWithShuffledOptions);
  }

  function loadQuestions(filename, customData = null) {
    currentTestFile = filename;

    const initializeFromQuestions = (rawQuestions) => {
      originalQuestions = cloneQuestionsData(rawQuestions || []);
      questions = prepareQuestionsForSession(originalQuestions);
      initializeTest();
    };

    if (customData) {
      initializeFromQuestions(customData.questions);
    } else {
      fetch(filename)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error loading file: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          initializeFromQuestions(data.questions);
        })
        .catch((error) => {
          console.error("Error loading questions:", error);
          originalQuestions = [];
          questions = [];
          questionsContainer.innerHTML = `<p>Unable to load questions. Please try again or select another test.</p>`;
          renderFlashcards();
        });
    }
  }

  // Initialize test variables and UI
  function initializeTest() {
    resetReviewState();
    if (questions.length === 0) {
      questionsContainer.innerHTML = `<p>No questions available in the selected file.</p>`;
      paginationControls.classList.add("hidden");
      bookmarkedQuestions = new Set();
      updateBookmarkPanel();
      return;
    }

    clearInterval(timer);
    timer = null;
    timerStarted = false;
    initialTimerSeconds = null;

    const savedProgress = getSavedProgress();
    const hasSavedProgress = Boolean(savedProgress);

    if (hasSavedProgress) {
      userAnswers = savedProgress.userAnswers || {};
      remainingTime =
        typeof savedProgress.remainingTime === "number"
          ? savedProgress.remainingTime
          : getTimerInputSeconds();
      currentPage = savedProgress.currentPage || 1;
      testInProgress = !!savedProgress.testInProgress && remainingTime > 0;
      testSubmitted = !!savedProgress.testSubmitted;
      bookmarkedQuestions = new Set(savedProgress.bookmarkedQuestions || []);
      isTimerPaused = !!savedProgress.isTimerPaused;
    } else {
      currentPage = 1;
      userAnswers = {};
      testInProgress = false;
      testSubmitted = false;
      bookmarkedQuestions = new Set();
      isTimerPaused = false;
      remainingTime = getTimerInputSeconds();
    }

    bookmarkCycleIndex = 0;
    startTestButton.disabled = testInProgress;
    submitButton.disabled = !testInProgress;
    submitButton.style.display = testSubmitted ? "none" : "inline-block";
    pauseTimerButton.textContent = isTimerPaused
      ? "Continue Timer"
      : "Pause Timer";

    updateTimerDisplay(
      Math.floor(Math.max(remainingTime, 0) / 60),
      Math.max(remainingTime, 0) % 60
    );

    scoreContainer.classList.add("hidden");
    scoreContainer.style.display = "none";
    resultMessageElement.textContent = "";
    resultMessageElement.classList.remove("pass-message", "fail-message");
    hideResultBanner();

    renderQuestions();
    updatePaginationControls();
    updateProgress();
    updateBookmarkPanel();
    renderFlashcards();
    updateReviewFilterVisibility();

    if (hasSavedProgress && testInProgress && remainingTime > 0) {
      startTimer(true);
      if (isTimerPaused) {
        isTimerPaused = true;
        pauseTimerButton.textContent = "Continue Timer";
      }
    } else {
      testInProgress = false;
    }
  }

  //************************ SECTION 6: RENDERING QUESTIONS ************************//

  function renderQuestions() {
    if (!questionsContainer) {
      return;
    }

    questionsContainer.innerHTML = "";
    if (filterEmptyStateElement) {
      filterEmptyStateElement.classList.add("hidden");
    }
    updateReviewFilterVisibility();

    const filteredIndexes = getFilteredQuestionIndexes();
    const totalFiltered = filteredIndexes.length;

    if (totalFiltered === 0) {
      if (filterEmptyStateElement) {
        filterEmptyStateElement.classList.remove("hidden");
      } else {
        questionsContainer.innerHTML =
          '<p class="empty-state">No questions match your current filter.</p>';
      }
      return;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(totalFiltered / questionsPerPage)
    );
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * questionsPerPage;
    const indexesToDisplay = filteredIndexes.slice(
      startIndex,
      startIndex + questionsPerPage
    );

    indexesToDisplay.forEach((actualIndex) => {
      const question = questions[actualIndex];
      const questionElement = document.createElement("div");
      questionElement.classList.add("question");
      questionElement.setAttribute("data-question-index", actualIndex);

      // Bookmark Button
      const bookmarkButton = document.createElement("button");
      bookmarkButton.classList.add("bookmark-button");
      bookmarkButton.textContent = bookmarkedQuestions.has(actualIndex)
        ? "Bookmarked"
        : "Bookmark";
      if (bookmarkedQuestions.has(actualIndex)) {
        bookmarkButton.classList.add("active");
      }
      bookmarkButton.addEventListener("click", () => {
        if (bookmarkedQuestions.has(actualIndex)) {
          bookmarkedQuestions.delete(actualIndex);
          bookmarkButton.classList.remove("active");
          bookmarkButton.textContent = "Bookmark";
        } else {
          bookmarkedQuestions.add(actualIndex);
          bookmarkButton.classList.add("active");
          bookmarkButton.textContent = "Bookmarked";
        }
        updateBookmarkPanel();
        checkBookmarkAchievements();
        saveProgress();
      });
      questionElement.appendChild(bookmarkButton);

      // Question Text
      const questionTextElement = document.createElement("div");
      questionTextElement.classList.add("question-text");

      const questionNumberElement = document.createElement("span");
      questionNumberElement.classList.add("question-number");
      questionNumberElement.textContent = `${actualIndex + 1}.`;
      questionTextElement.appendChild(questionNumberElement);

      const questionBodyElement = document.createElement("div");
      questionBodyElement.classList.add("question-body");
      const questionBodyMarkup =
        formatRichText(question.text) || escapeHTML(question.text);
      questionBodyElement.innerHTML = questionBodyMarkup;
      questionTextElement.appendChild(questionBodyElement);

      questionElement.appendChild(questionTextElement);

      // Determine if the question has multiple correct answers
      const isMultipleCorrect = Array.isArray(question.correctAnswer);

      if (question.options && question.options.length > 0) {
        const optionsList = document.createElement("ul");
        optionsList.classList.add("options");

        question.options.forEach((option) => {
          const optionElement = document.createElement("li");
          optionElement.classList.add("option-item");
          const optionId = `question-${actualIndex}-option-${option}`;

          // Use checkbox for multiple correct answers, radio button otherwise
          const inputType = isMultipleCorrect ? "checkbox" : "radio";

          optionElement.innerHTML = `
          <label>
              <input type="${inputType}" id="${optionId}" name="question-${actualIndex}${
            isMultipleCorrect ? "-" + optionId : ""
          }" value="${option}">
              ${option}
          </label>
        `;

          const input = optionElement.querySelector(
            `input[type="${inputType}"]`
          );
          input.addEventListener("change", (event) => {
            if (isMultipleCorrect) {
              // Handle multiple selections
              if (!Array.isArray(userAnswers[actualIndex])) {
                userAnswers[actualIndex] = [];
              }
              if (event.target.checked) {
                userAnswers[actualIndex].push(event.target.value);
                optionElement.classList.add("selected");
              } else {
                userAnswers[actualIndex] = userAnswers[actualIndex].filter(
                  (value) => value !== event.target.value
                );
                optionElement.classList.remove("selected");
              }
            } else {
              // Handle single selection
              userAnswers[actualIndex] = event.target.value;
              const optionItems = optionsList.querySelectorAll("li");
              optionItems.forEach((item) => item.classList.remove("selected"));
              optionElement.classList.add("selected");
            }

            updateProgress();
            if (!timerStarted) {
              startTimer();
              startTestButton.disabled = true;
              submitButton.disabled = false;
              testInProgress = true;
            }
            saveProgress();
          });

          // Restore user selections
          if (isMultipleCorrect && Array.isArray(userAnswers[actualIndex])) {
            input.checked = userAnswers[actualIndex].includes(option);
          } else if (userAnswers[actualIndex] === option) {
            input.checked = true;
          }

          if (input.checked) {
            optionElement.classList.add("selected");
          }

          if (testSubmitted) {
            input.disabled = true;
          }

          optionsList.appendChild(optionElement);
        });
        questionElement.appendChild(optionsList);
      } else {
        // Handle questions without options (e.g., short answer questions)
        const textareaElement = document.createElement("textarea");
        textareaElement.name = `question-${actualIndex}`;
        textareaElement.classList.add("text-area-input");
        textareaElement.placeholder = "Enter your answer here...";
        textareaElement.rows = 5; // Adjust the number of rows as needed

        textareaElement.addEventListener("input", (event) => {
          userAnswers[actualIndex] = event.target.value;
          updateProgress();
          if (!timerStarted) {
            startTimer();
            startTestButton.disabled = true;
            submitButton.disabled = false;
            testInProgress = true;
          }
          saveProgress();
        });

        if (userAnswers[actualIndex]) {
          textareaElement.value = userAnswers[actualIndex];
        }

        if (testSubmitted) {
          textareaElement.disabled = true;
        }

        questionElement.appendChild(textareaElement);
      }

      // Apply feedback if the test has been submitted
      if (testSubmitted) {
        applyFeedback(questionElement, question, actualIndex);
      } else if (isStudyMode) {
        // Handle study mode
        const correctAnswerElement = document.createElement("p");
        const formattedCorrectAnswer = formatAnswerForDisplay(
          question.correctAnswer
        );
        const studyAnswerMarkup =
          formatRichText(formattedCorrectAnswer) ||
          escapeHTML(formattedCorrectAnswer);
        correctAnswerElement.innerHTML = `<strong>Correct Answer:</strong> ${studyAnswerMarkup}`;
        correctAnswerElement.classList.add("study-correct-answer");
        questionElement.appendChild(correctAnswerElement);

        if (question.explanation) {
          const explanationElement = document.createElement("p");
          const studyExplanationMarkup =
            formatRichText(question.explanation) ||
            escapeHTML(question.explanation);
          explanationElement.innerHTML = `<strong>Explanation:</strong> ${studyExplanationMarkup}`;
          explanationElement.classList.add("study-explanation");
          questionElement.appendChild(explanationElement);
        }
      }

      questionsContainer.appendChild(questionElement);
    });
    updateProgress();
    updateBookmarkPanel();
  }

  function renderFlashcards() {
    if (!flashcardsGrid || !flashcardsEmptyState) return;

    flashcardsGrid.innerHTML = "";
    if (!questions.length) {
      flashcardsGrid.classList.add("hidden");
      flashcardsEmptyState.classList.remove("hidden");
      return;
    }

    flashcardsGrid.classList.remove("hidden");
    flashcardsEmptyState.classList.add("hidden");

    questions.forEach((question, cardIndex) => {
      const card = document.createElement("div");
      card.className = "flashcard";

      const questionText = document.createElement("p");
      questionText.className = "flashcard-question";
      const flashcardQuestionMarkup =
        formatRichText(question.text) || escapeHTML(question.text);
      questionText.innerHTML = flashcardQuestionMarkup;

      const answerText = document.createElement("p");
      answerText.className = "flashcard-answer";
      const formattedAnswer = formatAnswerForDisplay(question.correctAnswer);
      const fallbackAnswer =
        formattedAnswer && formattedAnswer.trim().length > 0
          ? formattedAnswer
          : "Check the explanation";
      const flashcardAnswerMarkup =
        formatRichText(fallbackAnswer) || escapeHTML(fallbackAnswer);
      answerText.innerHTML = flashcardAnswerMarkup;

      const hintText = document.createElement("span");
      hintText.className = "flashcard-hint";
      hintText.textContent = "Tap or press Enter to reveal the answer";
      hintText.setAttribute("aria-hidden", "true");

      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-expanded", "false");
      const accessibleQuestionSummary = questionText.textContent
        .replace(/\s+/g, " ")
        .trim();
      const trimmedSummary =
        accessibleQuestionSummary.length > 120
          ? `${accessibleQuestionSummary.slice(0, 117)}...`
          : accessibleQuestionSummary;

      card.setAttribute(
        "aria-label",
        `Flashcard ${cardIndex + 1}: ${trimmedSummary}`
      );

      card.appendChild(questionText);
      card.appendChild(answerText);
      card.appendChild(hintText);

      const plainQuestionLength = questionText.textContent.trim().length;
      const plainAnswerLength = answerText.textContent.trim().length;
      const longestLength = Math.max(plainQuestionLength, plainAnswerLength);
      const codeBlocks = Array.from(card.querySelectorAll("pre"));
      const codeLineCount = codeBlocks.reduce((max, block) => {
        const lines = block.textContent.split("\n").length;
        return Math.max(max, lines);
      }, 0);
      const containsCodeBlock = codeBlocks.length > 0;

      if (containsCodeBlock || longestLength > 220) {
        card.classList.add("flashcard--wide");
      }

      if (longestLength > 420 || codeLineCount > 10) {
        card.classList.add("flashcard--full");
      }

      const toggleFlashcard = () => {
        const flipped = card.classList.toggle("flashcard--flipped");
        card.setAttribute("aria-expanded", flipped.toString());
        hintText.textContent = flipped
          ? "Tap again to hide the answer"
          : "Tap or press Enter to reveal the answer";
      };

      card.addEventListener("click", toggleFlashcard);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleFlashcard();
        }
      });

      flashcardsGrid.appendChild(card);
    });
  }

  //************************ SECTION 7: PAGINATION CONTROLS ************************//

  function highlightQuestion(questionIndex) {
    const questionElement = document.querySelector(
      `[data-question-index="${questionIndex}"]`
    );
    if (!questionElement) return;
    questionElement.classList.add("highlighted");
    questionElement.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      questionElement.classList.remove("highlighted");
    }, 1500);
  }

  function jumpToQuestion(questionIndex) {
    let targetIndexes = getFilteredQuestionIndexes();
    let position = targetIndexes.indexOf(questionIndex);

    if (position === -1) {
      reviewFilter = "all";
      if (reviewFilterSelect) {
        reviewFilterSelect.value = "all";
      }
      updateReviewFilterVisibility();
      targetIndexes = getFilteredQuestionIndexes();
      position = targetIndexes.indexOf(questionIndex);
    }

    if (position === -1) {
      return;
    }

    currentPage = Math.floor(position / questionsPerPage) + 1;
    renderQuestions();
    updatePaginationControls();
    requestAnimationFrame(() => highlightQuestion(questionIndex));
  }

  function updateBookmarkPanel() {
    if (!bookmarkListElement) return;

    bookmarkListElement.innerHTML = "";
    const bookmarks = Array.from(bookmarkedQuestions).sort((a, b) => a - b);
    if (bookmarkCycleIndex >= bookmarks.length) {
      bookmarkCycleIndex = 0;
    }

    if (bookmarks.length === 0) {
      bookmarkListElement.classList.add("empty");
      bookmarkListElement.textContent = "No bookmarks yet.";
      bookmarkCycleIndex = 0;
      return;
    }

    bookmarkListElement.classList.remove("empty");
    bookmarks.forEach((bookmark) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bookmark-pill";
      button.textContent = `Q${bookmark + 1}`;
      button.addEventListener("click", () => jumpToQuestion(bookmark));
      bookmarkListElement.appendChild(button);
    });

    checkBookmarkAchievements();
  }

  function checkBookmarkAchievements() {
    if (bookmarkedQuestions.size >= 5) {
      unlockAchievement("bookmark-hero");
    }
  }

  if (cycleBookmarksButton) {
    cycleBookmarksButton.addEventListener("click", () => {
      const bookmarks = Array.from(bookmarkedQuestions).sort((a, b) => a - b);
      if (bookmarks.length === 0) {
        alert("No bookmarked questions yet! Bookmark a question to start a review loop.");
        return;
      }
      const target = bookmarks[bookmarkCycleIndex % bookmarks.length];
      bookmarkCycleIndex = (bookmarkCycleIndex + 1) % bookmarks.length;
      jumpToQuestion(target);
    });
  }

  function updatePaginationControls() {
    if (
      !paginationControls ||
      !pageInfo ||
      !prevPageButton ||
      !nextPageButton
    ) {
      return;
    }
    const filteredIndexes = getFilteredQuestionIndexes();
    const totalFiltered = filteredIndexes.length;
    if (totalFiltered === 0) {
      paginationControls.classList.add("hidden");
      pageInfo.textContent = "";
      return;
    }

    paginationControls.classList.remove("hidden");
    const totalPages = Math.max(
      1,
      Math.ceil(totalFiltered / questionsPerPage)
    );
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
  }

  if (prevPageButton) {
    prevPageButton.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderQuestions();
        updatePaginationControls();
      }
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
      const totalFiltered = getFilteredQuestionIndexes().length;
      const totalPages = Math.max(
        1,
        Math.ceil(totalFiltered / questionsPerPage)
      );
      if (currentPage < totalPages) {
        currentPage++;
        renderQuestions();
        updatePaginationControls();
      }
    });
  }

  if (reviewFilterSelect) {
    reviewFilterSelect.addEventListener("change", (event) => {
      reviewFilter = event.target.value;
      currentPage = 1;
      renderQuestions();
      updatePaginationControls();
    });
  }

  if (resultReviewFailedButton) {
    resultReviewFailedButton.addEventListener("click", () => {
      if (!testSubmitted) {
        return;
      }
      setReviewMode("incorrect");
    });
  }

  if (resultReviewAllButton) {
    resultReviewAllButton.addEventListener("click", () => {
      if (!testSubmitted) {
        return;
      }
      setReviewMode("all");
    });
  }

  if (resultRestartButton) {
    resultRestartButton.addEventListener("click", () => {
      resetTest();
    });
  }

  //************************ SECTION 8: TIMER FUNCTIONALITY ************************//

  function startTimer(resume = false) {
    if (timerStarted) return;
    timerStarted = true;
    isTimerPaused = false;

    if (!resume || typeof remainingTime !== "number" || Number.isNaN(remainingTime)) {
      remainingTime = getTimerInputSeconds();
    }

    if (!resume || initialTimerSeconds === null) {
      initialTimerSeconds = getTimerInputSeconds();
    }

    updateTimerDisplay(
      Math.floor(Math.max(remainingTime, 0) / 60),
      Math.max(remainingTime, 0) % 60
    );

    timer = setInterval(() => {
      if (isTimerPaused) {
        return;
      }
      remainingTime = Math.max(0, remainingTime - 1);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      updateTimerDisplay(minutes, seconds);
      if (remainingTime <= 0) {
        clearInterval(timer);
        timerStarted = false;
        submitTest();
        return;
      }
      saveProgress();
    }, 1000);
  }

  function updateTimerDisplay(minutes, seconds) {
    const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    if (floatingTimeDisplay) {
      floatingTimeDisplay.textContent = timeString;
    }
  }

  function pauseOrContinueTimer() {
    if (!timerStarted) return;
    if (isTimerPaused) {
      isTimerPaused = false;
      pauseTimerButton.textContent = "Pause Timer";
    } else {
      isTimerPaused = true;
      pauseTimerButton.textContent = "Continue Timer";
    }
    saveProgress();
  }

  if (pauseTimerButton) {
    pauseTimerButton.addEventListener("click", pauseOrContinueTimer);
  }

  if (startTestButton) {
    startTestButton.addEventListener("click", () => {
      startTimer();
      startTestButton.disabled = true;
      if (submitButton) {
        submitButton.disabled = false;
      }
      testInProgress = true;
      saveProgress();
    });
  }

  //************************ SECTION 9: TEST SUBMISSION ************************//

  function submitTest() {
    console.log("submitTest function called");
    try {
      let unansweredQuestions = [];
      const timeLeftAtSubmission =
        typeof remainingTime === "number" ? Math.max(remainingTime, 0) : 0;

      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        console.log(`Question ${index + 1}, User Answer:`, userAnswer);

        if (
          userAnswer === undefined ||
          (typeof userAnswer === "string" && userAnswer.trim() === "")
        ) {
          unansweredQuestions.push(index + 1);
        }
      });

      if (unansweredQuestions.length > 0) {
        const proceed = confirm(
          `You have unanswered questions: ${unansweredQuestions.join(
            ", "
          )}.\nDo you want to proceed with submission?`
        );
        if (!proceed) {
          console.log("User chose to cancel submission.");
          return;
        }
      }

      console.log("Proceeding with test grading...");
      clearInterval(timer);
      isTimerPaused = false;
      timerStarted = false;
      testInProgress = false;
      testSubmitted = true;
      submitButton.disabled = true;
      startTestButton.disabled = false;
      pauseTimerButton.textContent = "Pause Timer";
      let score = 0;
      reviewFilter = "all";
      if (reviewFilterSelect) {
        reviewFilterSelect.value = "all";
      }
      questionResults = Array.from(
        { length: questions.length },
        () => "unanswered"
      );

      submitButton.style.display = "none";

      const passMark = parseInt(passMarkInput.value);

      // Calculate the score without relying on DOM elements
      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const hasAnswer = Array.isArray(userAnswer)
          ? userAnswer.length > 0
          : userAnswer !== null &&
            userAnswer !== undefined &&
            userAnswer.toString().trim() !== "";
        let isCorrect = false;
        const isMultipleCorrect = Array.isArray(question.correctAnswer);

        // Determine if the answer is correct
        if (isMultipleCorrect) {
          const selectedOptions = Array.isArray(userAnswer)
            ? userAnswer.map((option) => option.trim().toLowerCase())
            : [];

          const correctAnswers = question.correctAnswer.map((answer) =>
            answer.trim().toLowerCase()
          );
          selectedOptions.sort();
          correctAnswers.sort();
          isCorrect =
            JSON.stringify(selectedOptions) === JSON.stringify(correctAnswers);
        } else {
          if (
            typeof userAnswer === "string" &&
            userAnswer.trim().toLowerCase() ===
              question.correctAnswer.trim().toLowerCase()
          ) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          score++;
        }
        questionResults[index] = isCorrect
          ? "correct"
          : hasAnswer
          ? "incorrect"
          : "unanswered";
      });

      // Update the score display
      const scorePercent =
        questions.length === 0
          ? 0
          : Math.round((score / questions.length) * 100);
      scoreElement.textContent = `${scorePercent}%`;
      scoreContainer.style.display = "block";
      scoreContainer.classList.remove("hidden");

      // Display pass or fail message
      resultMessageElement.textContent = "";
      resultMessageElement.classList.remove("pass-message", "fail-message");

      const testName = testSelect.options[testSelect.selectedIndex].textContent;

      testStats.testsTaken++;

      const scoreBreakdown = `${score}/${questions.length}`;
      const didPass = scorePercent >= passMark;

      if (didPass) {
        resultMessageElement.textContent = `You Passed! (${scoreBreakdown})`;
        resultMessageElement.classList.add("pass-message");
        testStats.testsPassed++;
        testStats.passedTests.push(testName);
      } else {
        resultMessageElement.textContent = `You Failed. (${scoreBreakdown})`;
        resultMessageElement.classList.add("fail-message");
        testStats.testsFailed++;
        testStats.failedTests.push(testName);
      }

      const missedCount = questionResults.filter(
        (status) => status !== "correct"
      ).length;

      showResultBanner({
        status: didPass ? "pass" : "fail",
        scorePercent,
        scoreBreakdown,
        missedCount,
      });

      incrementStreakIfNeeded();

      // Save stats and update display
      saveStats();
      updateStatsDisplay();

      evaluateAchievements(score, timeLeftAtSubmission);

      console.log("Test grading completed. Score:", score);

      // Clear saved progress
      clearSavedProgress();

      // Re-render current page to show feedback
      renderQuestions();
      updatePaginationControls();
      updateBookmarkPanel();
    } catch (error) {
      console.error("Error in submitTest:", error);
      alert(
        "An error occurred during submission. Please check the console for details."
      );
    }
  }

  if (submitButton) {
    submitButton.addEventListener("click", submitTest);
  }

  //************************ SECTION 10: APPLY FEEDBACK ************************//

  function applyFeedback(questionElement, question, index) {
    const userAnswer = userAnswers[index];
    let isCorrect = false;
    const isMultipleCorrect = Array.isArray(question.correctAnswer);

    // Determine if the answer is correct
    if (isMultipleCorrect) {
      const selectedOptions = Array.isArray(userAnswer)
        ? userAnswer.map((option) => option.trim().toLowerCase())
        : [];

      const correctAnswers = question.correctAnswer.map((answer) =>
        answer.trim().toLowerCase()
      );
      selectedOptions.sort();
      correctAnswers.sort();
      isCorrect =
        JSON.stringify(selectedOptions) === JSON.stringify(correctAnswers);
    } else {
      if (
        typeof userAnswer === "string" &&
        userAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase()
      ) {
        isCorrect = true;
      }
    }

    // Apply feedback to the question element
    let feedbackElement = document.createElement("p");
    feedbackElement.classList.add("feedback");

    if (isCorrect) {
      questionElement.classList.add("correct");
      feedbackElement.textContent = "Correct!";
      feedbackElement.classList.add("correct");
    } else {
      questionElement.classList.add("incorrect");
      feedbackElement.textContent = "Incorrect.";
      feedbackElement.classList.add("incorrect");
    }

    questionElement.appendChild(feedbackElement);

    // Display correct answer and explanation for all questions
    const correctAnswerElement = document.createElement("p");
    const formattedCorrectAnswer = formatAnswerForDisplay(
      question.correctAnswer
    );
    const submissionAnswerMarkup =
      formatRichText(formattedCorrectAnswer) ||
      escapeHTML(formattedCorrectAnswer);
    correctAnswerElement.innerHTML = `<strong>Correct Answer:</strong> ${submissionAnswerMarkup}`;
    correctAnswerElement.classList.add("correct-answer");
    questionElement.appendChild(correctAnswerElement);

    if (question.explanation) {
      const explanationElement = document.createElement("p");
      const submissionExplanationMarkup =
        formatRichText(question.explanation) ||
        escapeHTML(question.explanation);
      explanationElement.innerHTML = `<strong>Explanation:</strong> ${submissionExplanationMarkup}`;
      explanationElement.classList.add("explanation");
      questionElement.appendChild(explanationElement);
    }

    // Ensure user selections are preserved and highlighted correctly
    if (question.options && question.options.length > 0) {
      const inputs = questionElement.querySelectorAll("input");
      inputs.forEach((input) => {
        if (Array.isArray(userAnswer)) {
          // Handle multiple answers (checkbox)
          input.checked = userAnswer.some(
            (answer) =>
              answer.trim().toLowerCase() === input.value.trim().toLowerCase()
          );
        } else if (typeof userAnswer === "string") {
          // Handle single answer (radio)
          input.checked =
            userAnswer.trim().toLowerCase() ===
            input.value.trim().toLowerCase();
        }
        input.disabled = true; // Disable input to prevent changes after submission
        const optionItem = input.closest("li");
        if (optionItem) {
          optionItem.classList.toggle("selected", input.checked);
        }
      });
    } else {
      // Handle text-based answers
      const textInput = questionElement.querySelector(".text-area-input");
      if (textInput) {
        if (typeof userAnswer === "string") {
          textInput.value = userAnswer;
        }
        textInput.disabled = true; // Disable text input after submission
      }
    }

    // Disable bookmark button after submission
    const bookmarkButton = questionElement.querySelector(".bookmark-button");
    if (bookmarkButton) {
      bookmarkButton.disabled = true;
    }

    return isCorrect;
  }

  //************************ SECTION 11: TEST RESET ************************//

  function resetTest() {
    if (testInProgress || timerStarted) {
      const confirmReset = confirm(
        "Are you sure you want to reset the current test?"
      );
      if (!confirmReset) {
        return;
      } else {
        // Update stats for abandoned test
        testStats.testsAbandoned++;
        const testName =
          testSelect.options[testSelect.selectedIndex].textContent;
        testStats.abandonedTests.push(testName);
        saveStats();
        updateStatsDisplay();
      }
    }
    clearInterval(timer);
    timer = null;
    remainingTime = getTimerInputSeconds();
    initialTimerSeconds = null;
    updateTimerDisplay(
      Math.floor(remainingTime / 60),
      remainingTime % 60
    );
    questionsContainer.innerHTML = "";
    hideResultBanner();
    scoreContainer.classList.add("hidden");
    scoreContainer.style.display = "none";
    submitButton.style.display = "inline-block";
    submitButton.disabled = true;
    startTestButton.disabled = false;
    timerStarted = false;
    isTimerPaused = false;
    testInProgress = false;
    testSubmitted = false;
    resetReviewState();
    pauseTimerButton.textContent = "Pause Timer";
    if (progressTextElement) {
      progressTextElement.textContent = `0%`;
    }
    if (progressBarElement) {
      progressBarElement.style.width = `0%`;
    }
    userAnswers = {};
    bookmarkedQuestions = new Set();
    bookmarkCycleIndex = 0;
    if (originalQuestions.length > 0) {
      questions = prepareQuestionsForSession(originalQuestions);
    }
    currentPage = 1;
    renderQuestions();
    updatePaginationControls();
    updateProgress();
    updateBookmarkPanel();
    renderFlashcards();
    clearSavedProgress();
  }

  if (resetButton) {
    resetButton.addEventListener("click", resetTest);
  }


  //************************ SECTION 12: PROGRESS TRACKING ************************//

  function updateProgress() {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(userAnswers).filter((index) => {
      const answer = userAnswers[index];
      return (
        answer !== null &&
        answer !== undefined &&
        answer.toString().trim() !== ""
      );
    }).length;
    const progressPercent =
      totalQuestions === 0
        ? 0
        : Math.round((answeredQuestions / totalQuestions) * 100);
    if (progressTextElement) {
      progressTextElement.textContent = `${progressPercent}%`;
    }
    if (progressBarElement) {
      progressBarElement.style.width = `${progressPercent}%`;
    }
  }

  //************************ SECTION 13: DOWNLOAD RESULTS ************************//

  function formatAnswerForDisplay(answer) {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    if (answer === null || answer === undefined) {
      return "";
    }
    return answer.toString();
  }

  function normalizeAnswerForComparison(answer) {
    if (Array.isArray(answer)) {
      return answer
        .map((value) =>
          value === null || value === undefined
            ? ""
            : value.toString().trim().toLowerCase()
        )
        .filter((value) => value !== "")
        .sort();
    }
    if (answer === null || answer === undefined) {
      return "";
    }
    return answer.toString().trim().toLowerCase();
  }

  function answersMatch(userAnswer, correctAnswer) {
    const normalizedUser = normalizeAnswerForComparison(userAnswer);
    const normalizedCorrect = normalizeAnswerForComparison(correctAnswer);

    if (Array.isArray(normalizedUser) || Array.isArray(normalizedCorrect)) {
      if (!Array.isArray(normalizedUser) || !Array.isArray(normalizedCorrect)) {
        return false;
      }
      return JSON.stringify(normalizedUser) === JSON.stringify(normalizedCorrect);
    }

    return normalizedUser === normalizedCorrect;
  }

  function downloadResultsAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const bottomMargin = 20;
    const blockPadding = 4;
    const blockSpacing = 6;
    const blockX = margin - 2;
    const blockWidth = pageWidth - margin * 2 + 4;
    const maxLineWidth = blockWidth - blockPadding * 2;
    const bodyFontSize = 11;

    const defaultTextColor = { r: 33, g: 37, b: 41 };
    const neutralFill = { r: 244, g: 247, b: 252 };
    const correctFill = { r: 209, g: 250, b: 229 };
    const incorrectFill = { r: 255, g: 228, b: 225 };
    const explanationFill = { r: 255, g: 249, b: 196 };
    const correctTextColor = { r: 21, g: 87, b: 36 };
    const incorrectTextColor = { r: 155, g: 28, b: 28 };
    const explanationTextColor = { r: 102, g: 60, b: 0 };

    doc.setFont("helvetica", "normal");
    doc.setFontSize(bodyFontSize);
    doc.setTextColor(defaultTextColor.r, defaultTextColor.g, defaultTextColor.b);

    let correctAnswersCount = 0;

    const totalQuestions = questions.length;

    const resultsData = questions.map((question, index) => {
      const questionText = `Question ${index + 1}: ${question.text}`;
      const rawUserAnswer = userAnswers[index];
      const hasUserAnswer = Array.isArray(rawUserAnswer)
        ? rawUserAnswer.length > 0
        : rawUserAnswer !== null &&
          rawUserAnswer !== undefined &&
          rawUserAnswer.toString().trim() !== "";
      const userAnswer = hasUserAnswer
        ? formatAnswerForDisplay(rawUserAnswer)
        : "No Answer Provided";
      const correctAnswer = formatAnswerForDisplay(question.correctAnswer);
      const isCorrect =
        hasUserAnswer && answersMatch(rawUserAnswer, question.correctAnswer);

      if (isCorrect) {
        correctAnswersCount++;
      }

      doc.setFont("helvetica", "bold");
      const questionLines = doc.splitTextToSize(questionText, maxLineWidth);
      const questionDimensions = doc.getTextDimensions(questionLines, {
        maxWidth: maxLineWidth,
      });
      doc.setFont("helvetica", "normal");

      const userAnswerText = `Your Answer: ${userAnswer}`;
      const userAnswerLines = doc.splitTextToSize(userAnswerText, maxLineWidth);
      const userAnswerDimensions = doc.getTextDimensions(userAnswerLines, {
        maxWidth: maxLineWidth,
      });

      const correctAnswerText = `Correct Answer: ${correctAnswer}`;
      const correctAnswerLines = doc.splitTextToSize(
        correctAnswerText,
        maxLineWidth
      );
      const correctAnswerDimensions = doc.getTextDimensions(
        correctAnswerLines,
        {
          maxWidth: maxLineWidth,
        }
      );

      let explanationLines = [];
      let explanationDimensions = { h: 0 };
      if (!isCorrect && question.explanation) {
        const explanationText = `Explanation: ${question.explanation}`;
        explanationLines = doc.splitTextToSize(explanationText, maxLineWidth);
        explanationDimensions = doc.getTextDimensions(explanationLines, {
          maxWidth: maxLineWidth,
        });
      }

      return {
        questionLines,
        questionHeight: questionDimensions.h,
        userAnswerLines,
        userAnswerHeight: userAnswerDimensions.h,
        correctAnswerLines,
        correctAnswerHeight: correctAnswerDimensions.h,
        explanationLines,
        explanationHeight: explanationDimensions.h,
        isCorrect,
        hasUserAnswer,
      };
    });

    const percentageScore = totalQuestions
      ? Math.round((correctAnswersCount / totalQuestions) * 100)
      : 0;
    const scoreBadgeText = totalQuestions
      ? `${correctAnswersCount}/${totalQuestions} correct (${percentageScore}%)`
      : "No questions answered";

    const headerHeight = 34;

    const renderHeader = (includeLegend = false) => {
      doc.setFillColor(35, 48, 68);
      doc.rect(0, 0, pageWidth, headerHeight, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Test Simulator Results", margin, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Learning Progress Snapshot", margin, 26);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const badgeWidth = doc.getTextWidth(scoreBadgeText) + 14;
      const badgeHeight = 14;
      const badgeX = pageWidth - margin - badgeWidth;
      const badgeY = headerHeight / 2 - badgeHeight / 2;

      doc.setFillColor(57, 181, 74);
      doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(scoreBadgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 3, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodyFontSize);
      doc.setTextColor(
        defaultTextColor.r,
        defaultTextColor.g,
        defaultTextColor.b
      );

      let yOffset = headerHeight + 12;

      if (includeLegend) {
        const legendTop = headerHeight + 5;
        const legendHeight = 24;
        doc.setFillColor(248, 250, 255);
        doc.rect(margin - 4, legendTop, pageWidth - (margin - 4) * 2, legendHeight, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(
          defaultTextColor.r,
          defaultTextColor.g,
          defaultTextColor.b
        );
        doc.text("Legend", margin, legendTop + 11);

        const legendItems = [
          { label: "Correct response", color: correctFill },
          { label: "Incorrect response", color: incorrectFill },
          { label: "Explanation", color: explanationFill },
        ];

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        let legendX = margin + 35;
        const legendBaseline = legendTop + 11;

        legendItems.forEach((item) => {
          doc.setFillColor(item.color.r, item.color.g, item.color.b);
          doc.rect(legendX, legendBaseline - 5, 8, 8, "F");
          doc.setTextColor(
            defaultTextColor.r,
            defaultTextColor.g,
            defaultTextColor.b
          );
          doc.text(item.label, legendX + 12, legendBaseline + 1);
          legendX += doc.getTextWidth(item.label) + 32;
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodyFontSize);
        doc.setTextColor(
          defaultTextColor.r,
          defaultTextColor.g,
          defaultTextColor.b
        );

        yOffset = legendTop + legendHeight + 10;
      }

      return yOffset;
    };

    const ensureSpace = (requiredHeight) => {
      if (yPosition + requiredHeight > pageHeight - bottomMargin) {
        doc.addPage();
        yPosition = renderHeader(false);
      }
    };

    const drawBlock = (lines, textHeight, options = {}) => {
      if (!lines || !lines.length) {
        return;
      }

      const {
        fillColor = neutralFill,
        textColor = defaultTextColor,
        fontStyle = "normal",
        fontSize = bodyFontSize,
        spacingAfter = blockSpacing,
        badge,
      } = options;

      const blockHeight = textHeight + blockPadding * 2;
      ensureSpace(blockHeight + spacingAfter);

      doc.setFillColor(fillColor.r, fillColor.g, fillColor.b);
      doc.rect(blockX, yPosition, blockWidth, blockHeight, "F");

      if (badge) {
        const previousFont = doc.getFont();
        const previousFontSize = doc.getFontSize();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        const badgeTextWidth = doc.getTextWidth(badge.label) + 8;
        const badgeHeight = 8;
        const badgeX = blockX + blockWidth - badgeTextWidth - 6;
        const badgeY = yPosition + 4;
        doc.setFillColor(
          badge.fillColor.r,
          badge.fillColor.g,
          badge.fillColor.b
        );
        doc.rect(badgeX, badgeY, badgeTextWidth, badgeHeight, "F");
        doc.setTextColor(
          badge.textColor.r,
          badge.textColor.g,
          badge.textColor.b
        );
        doc.text(
          badge.label,
          badgeX + badgeTextWidth / 2,
          badgeY + badgeHeight / 2 + 2,
          { align: "center" }
        );
        const previousFontName =
          (previousFont && (previousFont.fontName || previousFont.FontName)) ||
          "helvetica";
        const previousFontStyle =
          (previousFont && previousFont.fontStyle) || "normal";
        doc.setFont(previousFontName, previousFontStyle);
        doc.setFontSize(previousFontSize);
      }

      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor.r, textColor.g, textColor.b);
      doc.text(lines, blockX + blockPadding, yPosition + blockPadding, {
        baseline: "top",
      });

      yPosition += blockHeight + spacingAfter;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodyFontSize);
      doc.setTextColor(
        defaultTextColor.r,
        defaultTextColor.g,
        defaultTextColor.b
      );
    };

    let yPosition = renderHeader(true);

    resultsData.forEach((entry) => {
      drawBlock(entry.questionLines, entry.questionHeight, {
        fillColor: neutralFill,
        textColor: defaultTextColor,
        fontStyle: "bold",
        spacingAfter: 4,
      });

      if (entry.hasUserAnswer) {
        drawBlock(entry.userAnswerLines, entry.userAnswerHeight, {
          fillColor: entry.isCorrect ? correctFill : incorrectFill,
          textColor: entry.isCorrect ? correctTextColor : incorrectTextColor,
          spacingAfter: 4,
          badge: {
            label: entry.isCorrect ? "Correct" : "Incorrect",
            fillColor: entry.isCorrect ? correctTextColor : incorrectTextColor,
            textColor: { r: 255, g: 255, b: 255 },
          },
        });
      } else {
        drawBlock(entry.userAnswerLines, entry.userAnswerHeight, {
          fillColor: incorrectFill,
          textColor: incorrectTextColor,
          spacingAfter: 4,
          badge: {
            label: "No Answer",
            fillColor: incorrectTextColor,
            textColor: { r: 255, g: 255, b: 255 },
          },
        });
      }

      drawBlock(entry.correctAnswerLines, entry.correctAnswerHeight, {
        fillColor: { r: 224, g: 242, b: 254 },
        textColor: { r: 13, g: 60, b: 97 },
        spacingAfter: entry.explanationLines.length ? 4 : 8,
      });

      if (entry.explanationLines.length) {
        drawBlock(entry.explanationLines, entry.explanationHeight, {
          fillColor: explanationFill,
          textColor: explanationTextColor,
          spacingAfter: 10,
        });
      }
    });

    const summaryText = `Summary: You answered ${correctAnswersCount} of ${totalQuestions} questions correctly (${percentageScore}%).`;
    doc.setFont("helvetica", "bold");
    const summaryLines = doc.splitTextToSize(summaryText, maxLineWidth);
    const summaryDimensions = doc.getTextDimensions(summaryLines, {
      maxWidth: maxLineWidth,
    });
    doc.setFont("helvetica", "normal");

    drawBlock(summaryLines, summaryDimensions.h, {
      fillColor: { r: 227, g: 242, b: 253 },
      textColor: { r: 25, g: 74, b: 129 },
      fontStyle: "bold",
      spacingAfter: 0,
    });

    doc.save("test_results.pdf");
  }


  if (downloadButton) {
    downloadButton.addEventListener("click", downloadResultsAsPDF);
  }


  if (downloadReportButton) {
    downloadReportButton.addEventListener("click", downloadResultsAsPDF);
  }

  //************************ SECTION 14: STUDY MODE ************************//

  if (studyModeToggle) {
    studyModeToggle.addEventListener("change", () => {
      const desiredMode = studyModeToggle.checked ? "study" : "test";
      setMode(desiredMode);
    });
  }

  //************************ SECTION 15: TEST SELECTION ************************//

  if (testSelect) {
    testSelect.addEventListener("change", () => {
      if (testInProgress || timerStarted) {
        const confirmSwitch = confirm(
          "Are you sure you want to stop the current test?"
        );
        if (!confirmSwitch) {
          testSelect.value = testSelect.dataset.previousValue;
          return;
        } else {
          // Update stats for abandoned test
          testStats.testsAbandoned++;
          const testName =
            testSelect.options[testSelect.selectedIndex].textContent;
          testStats.abandonedTests.push(testName);
          saveStats();
          updateStatsDisplay();

          resetTest();
          loadQuestions(testSelect.value);
        }
      } else {
        loadQuestions(testSelect.value);
      }
      testSelect.dataset.previousValue = testSelect.value;
    });

    testSelect.dataset.previousValue = testSelect.value;
  }

  //************************ SECTION 16: BACK TO TOP BUTTON ************************//

  const backToTopButton = document.getElementById("back-to-top");

  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (
        document.body.scrollTop > 200 ||
        document.documentElement.scrollTop > 200
      ) {
        backToTopButton.style.display = "block";
      } else {
        backToTopButton.style.display = "none";
      }
    });

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  //************************ SECTION 17: SHUFFLE QUESTIONS ************************//

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Initially disable submit button
  if (submitButton) {
    submitButton.disabled = true;
  }

  //************************ SECTION 18: UPLOAD CUSTOM TEST FILE ************************//

  if (uploadTestInput) {
    uploadTestInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file && file.name.endsWith(".json")) {
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const data = JSON.parse(e.target.result);
            const testName = data.testName || "Custom Test";
            const option = document.createElement("option");
            option.value = file.name;
            option.textContent = testName;
            if (testSelect) {
              testSelect.appendChild(option);
              testSelect.value = file.name;
              loadQuestions(file.name, data);
              testSelect.dataset.previousValue = file.name;
            }
            alert("Custom test loaded successfully!");
          } catch (error) {
            console.error("Error parsing JSON file:", error);
            alert("Invalid JSON file. Please select a valid test file.");
          }
        };
        reader.readAsText(file);
      } else {
        alert("Please select a valid JSON file.");
      }
    });
  }

  //************************ SECTION 19: SAVE AND RESUME PROGRESS ************************//

  function saveProgress() {
    const progressData = {
      userAnswers,
      remainingTime,
      currentPage,
      testInProgress,
      testSubmitted,
      currentTestFile,
      isTimerPaused,
      bookmarkedQuestions: Array.from(bookmarkedQuestions),
    };
    localStorage.setItem("testProgress", JSON.stringify(progressData));
  }

  function getSavedProgress() {
    try {
      const savedProgress = JSON.parse(localStorage.getItem("testProgress"));
      if (
        savedProgress &&
        savedProgress.currentTestFile &&
        savedProgress.currentTestFile === currentTestFile
      ) {
        return savedProgress;
      }
    } catch (error) {
      console.warn("Unable to load saved progress:", error);
    }
    return null;
  }

  function clearSavedProgress() {
    localStorage.removeItem("testProgress");
  }

  window.addEventListener("beforeunload", () => {
    if (testInProgress || timerStarted) {
      saveProgress();
    }
  });

  // Load progress on page load will be handled when questions are initialized
});

