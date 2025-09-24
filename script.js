// script.js

document.addEventListener("DOMContentLoaded", function () {
  //************************ SECTION 1: INITIALIZATION ************************//

  // Global variables
  let questions = [];
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
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");
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
    const statsContent = document.getElementById("stats-content");
    if (statsContent) {
      statsContent.innerHTML = `
        <h3>Today's Stats</h3>
        <div class="stat-line"><span>Tests Completed</span><span>${
          testStats.testsTaken
        }</span></div>
        <div class="stat-line"><span>Passed</span><span>${
          testStats.testsPassed
        }</span></div>
        <div class="stat-line"><span>Failed</span><span>${
          testStats.testsFailed
        }</span></div>
        <div class="stat-line"><span>Abandoned</span><span>${
          testStats.testsAbandoned
        }</span></div>
        <button id="reset-stats-button" class="btn btn-tertiary">Reset Stats</button>
      `;

      const resetStatsButton = document.getElementById("reset-stats-button");
      if (resetStatsButton) {
        resetStatsButton.addEventListener("click", resetStats);
      }
    }

    updateStatsPanel();
    updateGamification();
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

  function activateTab(panelId) {
    if (!tabButtons.length || !tabPanels.length) return;
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === panelId;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive.toString());
    });
    tabPanels.forEach((panel) => {
      const isActive = panel.id === panelId;
      panel.classList.toggle("active", isActive);
      panel.setAttribute("aria-hidden", (!isActive).toString());
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset && button.dataset.tab) {
        activateTab(button.dataset.tab);
      }
    });
  });

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
    // Add your test files here
    // "test20.json",
    "test21.json",
    "test22.json",
    "test23.json",
    "test24.json",
    "test25.json",
    "test26.json",
    "test27.json",
    "test28.json",
    "test29.json",
    "test30.json",
    "test31.json",
    "ISTQB1.json",
    "ISTQB2.json",
    "ISTQB3.json",
    // For demonstration, we'll use a sample test file
    // "sample_test.json",
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
  function loadQuestions(filename, customData = null) {
    currentTestFile = filename;
    if (customData) {
      questions = shuffleArray(customData.questions || []);
      initializeTest();
    } else {
      fetch(filename)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error loading file: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          questions = shuffleArray(data.questions || []);
          initializeTest();
        })
        .catch((error) => {
          console.error("Error loading questions:", error);
          questionsContainer.innerHTML = `<p>Unable to load questions. Please try again or select another test.</p>`;
          renderFlashcards();
        });
    }
  }

  // Initialize test variables and UI
  function initializeTest() {
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

    renderQuestions();
    updatePaginationControls();
    updateProgress();
    updateBookmarkPanel();
    renderFlashcards();

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
    questionsContainer.innerHTML = "";
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = Math.min(startIndex + questionsPerPage, questions.length);
    const questionsToDisplay = questions.slice(startIndex, endIndex);

    questionsToDisplay.forEach((question, index) => {
      const actualIndex = startIndex + index;
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
      const questionTextElement = document.createElement("p");
      questionTextElement.innerHTML = `${actualIndex + 1}. ${question.text}`;
      questionElement.appendChild(questionTextElement);

      // Determine if the question has multiple correct answers
      const isMultipleCorrect = Array.isArray(question.correctAnswer);

      if (question.options && question.options.length > 0) {
        const optionsList = document.createElement("ul");
        optionsList.classList.add("options");

        question.options.forEach((option) => {
          const optionElement = document.createElement("li");
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
              } else {
                userAnswers[actualIndex] = userAnswers[actualIndex].filter(
                  (value) => value !== event.target.value
                );
              }
            } else {
              // Handle single selection
              userAnswers[actualIndex] = event.target.value;
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
        correctAnswerElement.innerHTML = `<strong>Correct Answer:</strong> ${formattedCorrectAnswer}`;
        correctAnswerElement.classList.add("study-correct-answer");
        questionElement.appendChild(correctAnswerElement);

        if (question.explanation) {
          const explanationElement = document.createElement("p");
          explanationElement.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
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

    const cardsToShow = questions.slice(0, Math.min(6, questions.length));
    cardsToShow.forEach((question) => {
      const card = document.createElement("div");
      card.className = "flashcard";

      const questionText = document.createElement("p");
      questionText.className = "flashcard-question";
      questionText.textContent = question.text;

      const answerText = document.createElement("p");
      answerText.className = "flashcard-answer";
      const formattedAnswer = formatAnswerForDisplay(question.correctAnswer);
      answerText.textContent = formattedAnswer || "Check the explanation";

      card.appendChild(questionText);
      card.appendChild(answerText);

      card.addEventListener("click", () => {
        card.classList.toggle("flashcard--flipped");
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
    currentPage = Math.floor(questionIndex / questionsPerPage) + 1;
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
    const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
    if (questions.length === 0) {
      paginationControls.classList.add("hidden");
      pageInfo.textContent = "";
      return;
    }

    paginationControls.classList.remove("hidden");
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
      const totalPages = Math.ceil(questions.length / questionsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderQuestions();
        updatePaginationControls();
      }
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

      submitButton.style.display = "none";

      const passMark = parseInt(passMarkInput.value);

      // Calculate the score without relying on DOM elements
      questions.forEach((question, index) => {
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

        if (isCorrect) {
          score++;
        }
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

      const scoreDetail = ` (${score}/${questions.length})`;

      if (scorePercent >= passMark) {
        resultMessageElement.textContent = `You Passed!${scoreDetail}`;
        resultMessageElement.classList.add("pass-message");
        testStats.testsPassed++;
        testStats.passedTests.push(testName);
      } else {
        resultMessageElement.textContent = `You Failed.${scoreDetail}`;
        resultMessageElement.classList.add("fail-message");
        testStats.testsFailed++;
        testStats.failedTests.push(testName);
      }

      incrementStreakIfNeeded();

      // Save stats and update display
      saveStats();
      updateStatsDisplay();

      activateTab("stats-panel");

      evaluateAchievements(score, timeLeftAtSubmission);

      console.log("Test grading completed. Score:", score);

      // Clear saved progress
      clearSavedProgress();

      // Re-render current page to show feedback
      renderQuestions();
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
    correctAnswerElement.innerHTML = `<strong>Correct Answer:</strong> ${formattedCorrectAnswer}`;
    correctAnswerElement.classList.add("correct-answer");
    questionElement.appendChild(correctAnswerElement);

    if (question.explanation) {
      const explanationElement = document.createElement("p");
      explanationElement.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
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
    scoreContainer.classList.add("hidden");
    scoreContainer.style.display = "none";
    submitButton.style.display = "inline-block";
    submitButton.disabled = true;
    startTestButton.disabled = false;
    timerStarted = false;
    isTimerPaused = false;
    testInProgress = false;
    testSubmitted = false;
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

    let yPosition = 20;
    let correctAnswersCount = 0;

    doc.setFontSize(14);
    doc.text(`Test Results`, 105, 10, { align: "center" });

    questions.forEach((question, index) => {
      if (yPosition >= 270) {
        doc.addPage();
        yPosition = 20;
      }

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
      if (isCorrect) correctAnswersCount++;

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - margin * 2;

      const questionLines = doc.splitTextToSize(questionText, maxLineWidth);
      doc.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * 7;

      const userAnswerText = `Your Answer: ${userAnswer}`;
      const userAnswerLines = doc.splitTextToSize(userAnswerText, maxLineWidth);
      doc.text(userAnswerLines, margin, yPosition);
      yPosition += userAnswerLines.length * 7;

      const correctAnswerText = `Correct Answer: ${correctAnswer}`;
      const correctAnswerLines = doc.splitTextToSize(
        correctAnswerText,
        maxLineWidth
      );
      doc.text(correctAnswerLines, margin, yPosition);
      yPosition += correctAnswerLines.length * 7;

      if (!isCorrect && question.explanation) {
        const explanationText = `Explanation: ${question.explanation}`;
        const explanationLines = doc.splitTextToSize(
          explanationText,
          maxLineWidth
        );
        doc.text(explanationLines, margin, yPosition);
        yPosition += explanationLines.length * 7;
      }

      yPosition += 10;
    });

    if (yPosition >= 270) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(16);
    doc.text(
      `Total Score: ${correctAnswersCount} / ${questions.length}`,
      105,
      yPosition,
      { align: "center" }
    );

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
      isStudyMode = studyModeToggle.checked;
      renderQuestions();
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

//************************ SECTION 209: MODAL BUTTON ************************//

/* Get the modal, open button, and close button
const modal1 = document.getElementById("modal1");
const modal2 = document.getElementById("modal2");

const openModal1 = document.getElementById("openModal1");
const openModal2 = document.getElementById("openModal2");

const closeModal1 = document.getElementById("closeModal1");
const closeModal2 = document.getElementById("closeModal2");

openModal1.onclick = () => (modal1.style.display = "block");
openModal2.onclick = () => (modal2.style.display = "block");

closeModal1.onclick = () => (modal1.style.display = "none");
closeModal2.onclick = () => (modal2.style.display = "none");

window.onclick = (event) => {
  if (event.target == modal1) modal1.style.display = "none";
  if (event.target == modal2) modal2.style.display = "none";
}; */
