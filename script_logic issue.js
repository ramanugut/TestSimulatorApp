document.addEventListener("DOMContentLoaded", function () {
  let questions = [];
  let currentPage = 1;
  const questionsPerPage = 10;
  let userAnswers = {};
 
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

  let timer;
  let remainingTime;
  let isStudyMode = false;
  let isTimerPaused = false;
  let timerStarted = false;
  let testInProgress = false;
  let testSubmitted = false; // Flag to indicate if the test has been submitted

  // Initialize timer display
  floatingTimeDisplay.textContent = `${timerInput.value}:00`;

  // Update timer display when timer input changes
  timerInput.addEventListener("input", () => {
    floatingTimeDisplay.textContent = `${timerInput.value}:00`;
  });

  // Dark Mode Toggle Implementation
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

  // Load test files dynamically into the dropdown menu
  const testFiles = [
    "test1.json",
    "test2.json",
    "test3.json",
    "test4.json",
    "test5.json",
    "test6.json",
    "test7.json",
    "test8.json",
    "test9.json",
    "test10.json",
    "test11.json",
    "test12.json",
    "test13.json",
    "test14.json",
    "test15.json",
    "test16.json",
    "test17.json",
    "test18.json",
    "test19.json" /* , "test20.json" , "test21.json", "test22.json", "test23.json", "test24.json", "test25.json", "test26.json", "test27.json", "test28.json", "test29.json", "test30.json", "test31.json", "test32.json", "test33.json", "test34.json", "test35.json", "test36.json", "test37.json", "test38.json", "test39.json", "test40.json", "test41.json", "test42.json", "test43.json", "test44.json", "test45.json", "test46.json", "test47.json", "test48.json", "test49.json", "test50.json"*/,
  ];

  function loadTestFiles() {
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

  loadTestFiles();

  function loadQuestions(filename) {
    fetch(filename)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error loading file: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        questions = shuffleArray(data.questions || []);
        if (questions.length === 0) {
          questionsContainer.innerHTML = `<p>No questions available in the selected file.</p>`;
        } else {
          currentPage = 1;
          userAnswers = {};
          testInProgress = false;
          testSubmitted = false; // Reset the submitted flag
          timerStarted = false;
          isTimerPaused = false;
          clearInterval(timer);
          startTestButton.disabled = false;
          submitButton.disabled = true;
          floatingTimeDisplay.textContent = `${timerInput.value}:00`;
          pauseTimerButton.textContent = "Pause Timer";
          renderQuestions();
          updatePaginationControls();
          updateProgress();
        }
      })
      .catch((error) => {
        console.error("Error loading questions:", error);
        questionsContainer.innerHTML = `<p>Unable to load questions. Please try again or select another test.</p>`;
      });
  }

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

      questionElement.innerHTML = `<p>${actualIndex + 1}. ${question.text}</p>`;

      if (question.options && question.options.length > 0) {
        const optionsList = document.createElement("ul");
        optionsList.classList.add("options");
        question.options.forEach((option) => {
          const optionElement = document.createElement("li");
          const optionId = `question-${actualIndex}-option-${option}`;

          optionElement.innerHTML = `
                        <label>
                            <input type="radio" id="${optionId}" name="question-${actualIndex}" value="${option}">
                            ${option}
                        </label>
                    `;

          const radioInput = optionElement.querySelector('input[type="radio"]');
          radioInput.addEventListener("change", (event) => {
            userAnswers[actualIndex] = event.target.value;
            updateProgress();
            if (!timerStarted) {
              startTimer();
              startTestButton.disabled = true;
              submitButton.disabled = false;
              testInProgress = true;
            }
          });

          if (userAnswers[actualIndex] === option) {
            radioInput.checked = true;
          }

          // If test has been submitted, disable the inputs
          if (testSubmitted) {
            radioInput.disabled = true;
          }

          optionsList.appendChild(optionElement);
        });
        questionElement.appendChild(optionsList);
      } else {
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
        });

        if (userAnswers[actualIndex]) {
          inputElement.value = userAnswers[actualIndex];
        }

        // If test has been submitted, disable the inputs
        if (testSubmitted) {
          inputElement.disabled = true;
        }

        questionElement.appendChild(inputElement);
      }

      // Check if test has been submitted or is in study mode to display feedback
      if (testSubmitted) {
        const userAnswer = userAnswers[actualIndex];
        let isCorrect = false;

        if (userAnswer !== undefined && userAnswer.trim() !== "") {
          if (
            userAnswer.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase()
          ) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          questionElement.classList.add("correct");
        } else {
          questionElement.classList.add("incorrect");
        }

        let feedbackElement = document.createElement("p");
        feedbackElement.classList.add("feedback");

        if (isCorrect) {
          feedbackElement.textContent = "Correct!";
          feedbackElement.classList.add("correct");
        } else {
          feedbackElement.textContent = "Incorrect.";
          feedbackElement.classList.add("incorrect");

          // Also show the correct answer and explanation
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
        }

        questionElement.appendChild(feedbackElement);
      }
      if (isStudyMode) {
        const answerElement = document.createElement("p");
        answerElement.classList.add("correct-answer");
        answerElement.style.color = "#3483eb";
        answerElement.innerHTML = `<strong>Correct Answer:</strong> ${question.correctAnswer}<br><strong>Explanation:</strong> ${question.explanation}`;
        questionElement.appendChild(answerElement);
      }

      questionsContainer.appendChild(questionElement);
    });
    updateProgress();
  }

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

  function submitTest() {
    console.log("submitTest function called");
    try {
      let unansweredQuestions = [];

      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        console.log(`Question ${index + 1}, User Answer:`, userAnswer);

        if (userAnswer === undefined || userAnswer.trim() === "") {
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
      testSubmitted = true; // Set the submitted flag to true
      let score = 0;

      submitButton.style.display = "none";

      // Calculate the score
      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        let isCorrect = false;

        if (userAnswer !== undefined && userAnswer.trim() !== "") {
          if (
            userAnswer.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase()
          ) {
            isCorrect = true;
            score++;
          }
        }
      });

      scoreElement.textContent = `${score} / ${questions.length}`;

      scoreContainer.style.display = "block";
      scoreContainer.classList.remove("hidden");

      const passMark = parseInt(passMarkInput.value);
      resultMessageElement.textContent = "";
      resultMessageElement.classList.remove("pass-message", "fail-message");

      if ((score / questions.length) * 100 >= passMark) {
        resultMessageElement.textContent = "You Passed!";
        resultMessageElement.classList.add("pass-message");
      } else {
        resultMessageElement.textContent = "You Failed.";
        resultMessageElement.classList.add("fail-message");
      }

      console.log("Test grading completed. Score:", score);

      // Re-render the current page to display feedback
      renderQuestions();
    } catch (error) {
      console.error("Error in submitTest:", error);
      alert(
        "An error occurred during submission. Please check the console for details."
      );
    }
  }

  function resetTest() {
    clearInterval(timer);
    floatingTimeDisplay.textContent = `${timerInput.value}:00`;
    questionsContainer.innerHTML = "";
    scoreContainer.classList.add("hidden");
    scoreContainer.style.display = "none";
    submitButton.style.display = "inline-block";
    timerStarted = false;
    isTimerPaused = false;
    testInProgress = false;
    testSubmitted = false; // Reset the submitted flag
    pauseTimerButton.textContent = "Pause Timer";
    floatingProgressDisplay.querySelector("#progress-text").textContent = `0%`;
    floatingProgressDisplay.querySelector("#progress-bar").style.width = `0%`;
    userAnswers = {};
    currentPage = 1;
    renderQuestions();
    updatePaginationControls();
    updateProgress();
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

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  submitButton.disabled = true;

  startTestButton.addEventListener("click", () => {
    startTimer();
    startTestButton.disabled = true;
    submitButton.disabled = false;
    testInProgress = true;
    console.log("Start Test button clicked. Submit button enabled.");
  });
  pauseTimerButton.addEventListener("click", pauseOrContinueTimer);
  submitButton.addEventListener("click", submitTest);
  resetButton.addEventListener("click", resetTest);
  downloadButton.addEventListener("click", downloadResultsAsPDF);

  testSelect.addEventListener("change", () => {
    if (testInProgress || timerStarted) {
      const confirmSwitch = confirm(
        "Are you sure you want to stop the current test?"
      );
      if (!confirmSwitch) {
        testSelect.value = testSelect.dataset.previousValue;
        return;
      } else {
        resetTest();
        loadQuestions(testSelect.value);
      }
    } else {
      loadQuestions(testSelect.value);
    }
    testSelect.dataset.previousValue = testSelect.value;
  });

  testSelect.dataset.previousValue = testSelect.value;

  studyModeToggle.addEventListener("change", () => {
    isStudyMode = studyModeToggle.checked;
    renderQuestions();
  });

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
});
