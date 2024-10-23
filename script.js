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
                <div class="stat-item"><span>Total Tests Taken:</span> ${
                  testStats.testsTaken
                }</div>
                <div class="stat-item passed"><span>Tests Passed:</span> ${
                  testStats.testsPassed
                }</div>
                <ul>${testStats.passedTests
                  .map((test) => `<li>${test}</li>`)
                  .join("")}</ul>
                <div class="stat-item failed"><span>Tests Failed:</span> ${
                  testStats.testsFailed
                }</div>
                <ul>${testStats.failedTests
                  .map((test) => `<li>${test}</li>`)
                  .join("")}</ul>
                <div class="stat-item abandoned"><span>Tests Abandoned:</span> ${
                  testStats.testsAbandoned
                }</div>
                <ul>${testStats.abandonedTests
                  .map((test) => `<li>${test}</li>`)
                  .join("")}</ul>
                <button id="reset-stats-button" class="reset-stats-button">Reset Stats</button>
            `;

      // Add event listener for reset stats button
      const resetStatsButton = document.getElementById("reset-stats-button");
      if (resetStatsButton) {
        resetStatsButton.addEventListener("click", resetStats);
      }
    }
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
    // Save to localStorage
    saveStats();
    // Update the stats display
    updateStatsDisplay();
  }

  loadStats();

  //************************ SECTION 2: ELEMENT REFERENCES ************************//

  // HTML element references
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
  const floatingProgressDisplay = document.getElementById("floating-progress");
  const paginationControls = document.getElementById("pagination-controls");
  const prevPageButton = document.getElementById("prev-page");
  const nextPageButton = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const uploadTestInput = document.getElementById("upload-test-input");

  floatingTimeDisplay.textContent = `${timerInput.value}:00`;

  //************************ SECTION 3: THEME HANDLING ************************//

  // Handle Dark Mode theme based on user preferences
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
    "ISTQB1.json",
    "ISTQB2.json",
    // For demonstration, we'll use a sample test file
    // "sample_test.json",
  ];

  // Load test files into the select element
  function loadTestFiles() {
    testSelect.innerHTML = ""; // Clear existing options
    let firstTestLoaded = false;
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

          if (!firstTestLoaded) {
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
        });
    }
  }

  // Initialize test variables and UI
  function initializeTest() {
    if (questions.length === 0) {
      questionsContainer.innerHTML = `<p>No questions available in the selected file.</p>`;
    } else {
      currentPage = 1;
      userAnswers = {};
      testInProgress = false;
      testSubmitted = false;
      timerStarted = false;
      isTimerPaused = false;
      bookmarkedQuestions = new Set();
      clearInterval(timer);
      startTestButton.disabled = false;
      submitButton.disabled = true;
      floatingTimeDisplay.textContent = `${timerInput.value}:00`;
      pauseTimerButton.textContent = "Pause Timer";
      renderQuestions();
      updatePaginationControls();
      updateProgress();
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
      bookmarkButton.textContent = "Bookmark";
      if (bookmarkedQuestions.has(actualIndex)) {
        bookmarkButton.classList.add("active");
      }
      bookmarkButton.addEventListener("click", () => {
        if (bookmarkedQuestions.has(actualIndex)) {
          bookmarkedQuestions.delete(actualIndex);
          bookmarkButton.classList.remove("active");
        } else {
          bookmarkedQuestions.add(actualIndex);
          bookmarkButton.classList.add("active");
        }
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
                      <input type="${inputType}" id="${optionId}" name="question-${actualIndex}" value="${option}">
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
        const inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.name = `question-${actualIndex}`;
        inputElement.classList.add("text-input");
        inputElement.placeholder = "Enter your answer here...";

        inputElement.addEventListener("input", (event) => {
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
          inputElement.value = userAnswers[actualIndex];
        }

        if (testSubmitted) {
          inputElement.disabled = true;
        }

        questionElement.appendChild(inputElement);
      }

      // Apply feedback if the test has been submitted
      if (testSubmitted) {
        applyFeedback(questionElement, question, actualIndex);
      } else if (isStudyMode) {
        // Handle study mode
        const correctAnswerElement = document.createElement("p");
        correctAnswerElement.innerHTML = `<strong>Correct Answer:</strong> ${question.correctAnswer}`;
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
  }

  //************************ SECTION 7: PAGINATION CONTROLS ************************//

  function updatePaginationControls() {
    paginationControls.classList.remove("hidden");
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
  }

  prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderQuestions();
      updatePaginationControls();
    }
  });

  nextPageButton.addEventListener("click", () => {
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderQuestions();
      updatePaginationControls();
    }
  });

  //************************ SECTION 8: TIMER FUNCTIONALITY ************************//

  function startTimer() {
    if (timerStarted) return;
    timerStarted = true;
    isTimerPaused = false;
    remainingTime = parseInt(timerInput.value) * 60;
    updateTimerDisplay(Math.floor(remainingTime / 60), remainingTime % 60);
    timer = setInterval(() => {
      if (isTimerPaused) return;
      remainingTime--;
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      updateTimerDisplay(minutes, seconds);
      if (remainingTime <= 0) {
        clearInterval(timer);
        submitTest();
      }
      saveProgress();
    }, 1000);
  }

  function updateTimerDisplay(minutes, seconds) {
    const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    floatingTimeDisplay.textContent = timeString;
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
  }

  pauseTimerButton.addEventListener("click", pauseOrContinueTimer);

  startTestButton.addEventListener("click", () => {
    startTimer();
    startTestButton.disabled = true;
    submitButton.disabled = false;
    testInProgress = true;
    console.log("Start Test button clicked. Submit button enabled.");
  });

  //************************ SECTION 9: TEST SUBMISSION ************************//

  function submitTest() {
    console.log("submitTest function called");
    try {
      let unansweredQuestions = [];

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
      scoreElement.textContent = `${score} / ${questions.length}`;
      scoreContainer.style.display = "block";
      scoreContainer.classList.remove("hidden");

      // Display pass or fail message
      resultMessageElement.textContent = "";
      resultMessageElement.classList.remove("pass-message", "fail-message");

      const testName = testSelect.options[testSelect.selectedIndex].textContent;

      testStats.testsTaken++;

      if ((score / questions.length) * 100 >= passMark) {
        resultMessageElement.textContent = "You Passed!";
        resultMessageElement.classList.add("pass-message");
        testStats.testsPassed++;
        testStats.passedTests.push(testName);
      } else {
        resultMessageElement.textContent = "You Failed.";
        resultMessageElement.classList.add("fail-message");
        testStats.testsFailed++;
        testStats.failedTests.push(testName);
      }

      // Save stats and update display
      saveStats();
      updateStatsDisplay();

      console.log("Test grading completed. Score:", score);

      // Clear saved progress
      clearSavedProgress();

      // Re-render current page to show feedback
      renderQuestions();
    } catch (error) {
      console.error("Error in submitTest:", error);
      alert(
        "An error occurred during submission. Please check the console for details."
      );
    }
  }

  submitButton.addEventListener("click", submitTest);

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
    correctAnswerElement.innerHTML = `<strong>Correct Answer:</strong> ${question.correctAnswer}`;
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
      const textInput = questionElement.querySelector('input[type="text"]');
      if (textInput) {
        textInput.value = userAnswer || "";
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
    floatingTimeDisplay.textContent = `${timerInput.value}:00`;
    questionsContainer.innerHTML = "";
    scoreContainer.classList.add("hidden");
    scoreContainer.style.display = "none";
    submitButton.style.display = "inline-block";
    timerStarted = false;
    isTimerPaused = false;
    testInProgress = false;
    testSubmitted = false;
    pauseTimerButton.textContent = "Pause Timer";
    floatingProgressDisplay.querySelector("#progress-text").textContent = `0%`;
    floatingProgressDisplay.querySelector("#progress-bar").style.width = `0%`;
    userAnswers = {};
    bookmarkedQuestions = new Set();
    currentPage = 1;
    renderQuestions();
    updatePaginationControls();
    updateProgress();
    clearSavedProgress();
  }

  resetButton.addEventListener("click", resetTest);

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
    const progressPercent = Math.round(
      (answeredQuestions / totalQuestions) * 100
    );
    floatingProgressDisplay.querySelector(
      "#progress-text"
    ).textContent = `${progressPercent}%`;
    floatingProgressDisplay.querySelector(
      "#progress-bar"
    ).style.width = `${progressPercent}%`;
  }

  //************************ SECTION 13: DOWNLOAD RESULTS ************************//

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
      const userAnswer = userAnswers[index] || "No Answer Provided";
      const isCorrect =
        userAnswer.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase();
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

      const correctAnswerText = `Correct Answer: ${question.correctAnswer}`;
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

  downloadButton.addEventListener("click", downloadResultsAsPDF);

  //************************ SECTION 14: STUDY MODE ************************//

  studyModeToggle.addEventListener("change", () => {
    isStudyMode = studyModeToggle.checked;
    renderQuestions();
  });

  //************************ SECTION 15: TEST SELECTION ************************//

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

  //************************ SECTION 16: BACK TO TOP BUTTON ************************//

  const backToTopButton = document.getElementById("back-to-top");

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

  //************************ SECTION 17: SHUFFLE QUESTIONS ************************//

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Initially disable submit button
  submitButton.disabled = true;

  //************************ SECTION 18: UPLOAD CUSTOM TEST FILE ************************//

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
          testSelect.appendChild(option);
          testSelect.value = file.name;
          loadQuestions(file.name, data);
          testSelect.dataset.previousValue = file.name;
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

  //************************ SECTION 19: SAVE AND RESUME PROGRESS ************************//

  function saveProgress() {
    const progressData = {
      userAnswers,
      remainingTime,
      currentPage,
      testInProgress,
      testSubmitted,
      currentTestFile,
      bookmarkedQuestions: Array.from(bookmarkedQuestions),
    };
    localStorage.setItem("testProgress", JSON.stringify(progressData));
  }

  function loadProgress() {
    const savedProgress = JSON.parse(localStorage.getItem("testProgress"));
    if (savedProgress && savedProgress.currentTestFile === currentTestFile) {
      userAnswers = savedProgress.userAnswers;
      remainingTime = savedProgress.remainingTime;
      currentPage = savedProgress.currentPage;
      testInProgress = savedProgress.testInProgress;
      testSubmitted = savedProgress.testSubmitted;
      bookmarkedQuestions = new Set(savedProgress.bookmarkedQuestions);

      if (testInProgress) {
        startTimer();
      }

      renderQuestions();
      updatePaginationControls();
      updateProgress();
    }
  }

  function clearSavedProgress() {
    localStorage.removeItem("testProgress");
  }

  window.addEventListener("beforeunload", () => {
    if (testInProgress || timerStarted) {
      saveProgress();
    }
  });

  // Load progress on page load
  loadProgress();
});
