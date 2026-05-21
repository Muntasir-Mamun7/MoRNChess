const lessons = [
  {
    title: "Lesson 1: Rook Movement",
    description: "Rooks move any number of squares in straight lines along ranks or files.",
    fen: "4k3/8/8/8/R3p3/8/8/4K3 w - - 0 1",
    objective: "Move your rook from a4 to e4 to capture the pawn.",
    expectedMove: { from: "a4", to: "e4", piece: "r" },
    successMessage: "Great! You used the rook's straight-line movement correctly.",
    guidePoints: [
      "Rooks are strongest on open files (columns without pawns).",
      "Put rooks behind passed pawns whenever possible.",
      "Connect your rooks by moving your king and queen away from the back rank.",
    ],
  },
  {
    title: "Lesson 2: Bishop Movement",
    description: "Bishops move diagonally and stay on their starting color for the whole game.",
    fen: "4k3/8/8/6p1/8/8/8/2B1K3 w - - 0 1",
    objective: "Move your bishop from c1 to g5 to capture the pawn.",
    expectedMove: { from: "c1", to: "g5", piece: "b" },
    successMessage: "Excellent! Your bishop traveled diagonally to capture.",
    guidePoints: [
      "Bishops become powerful on long diagonals.",
      "Try not to block your bishops behind your own pawns.",
      "A bishop pair (both bishops alive) is often a long-term advantage.",
    ],
  },
  {
    title: "Lesson 3: Knight Movement",
    description: "Knights move in an L-shape and can jump over pieces.",
    fen: "4k3/8/8/8/8/8/8/4K1N1 w - - 0 1",
    objective: "Move your knight from g1 to f3.",
    expectedMove: { from: "g1", to: "f3", piece: "n" },
    successMessage: "Nice! Knights always move in an L-shape.",
    guidePoints: [
      "Knights are strongest near the center (e4, d4, e5, d5).",
      "Avoid putting knights on the edge ('a knight on the rim is dim').",
      "Use knight forks to attack two targets at once.",
    ],
  },
  {
    title: "Lesson 4: Pawn Basics",
    description: "Pawns move forward and can move two squares on their first move.",
    fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
    objective: "Move your pawn from e2 to e4.",
    expectedMove: { from: "e2", to: "e4", piece: "p" },
    successMessage: "Well done! You used the pawn's two-square first move.",
    guidePoints: [
      "Control the center with pawns (especially e- and d-pawns).",
      "Avoid creating too many isolated or doubled pawns early.",
      "Passed pawns are dangerous in endgames.",
    ],
  },
  {
    title: "Lesson 5: King Safety (Castling)",
    description: "Castling protects your king and activates your rook.",
    fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
    objective: "Castle kingside by moving your king from e1 to g1.",
    expectedMove: { from: "e1", to: "g1", piece: "k" },
    successMessage: "Perfect! Castling improved king safety and rook activity.",
    guidePoints: [
      "Try to castle within the first 10 moves in most games.",
      "Avoid moving pawns in front of your castled king too much.",
      "If your opponent attacks one side, consider castling the other side when safe.",
    ],
  },
  {
    title: "Lesson 6: Queen Movement",
    description: "The queen combines rook and bishop movement.",
    fen: "4k3/8/8/7p/8/8/8/3QK3 w - - 0 1",
    objective: "Move your queen from d1 to h5 to capture the pawn.",
    expectedMove: { from: "d1", to: "h5", piece: "q" },
    successMessage: "Great! You used the queen's diagonal power.",
    guidePoints: [
      "Do not bring your queen out too early in real games.",
      "Use your queen to support attacks, not to attack alone.",
      "Always check if your queen can be chased by minor pieces.",
    ],
  },
  {
    title: "Lesson 7: Basic Check Pattern",
    description: "When your move attacks the enemy king, that is called check.",
    fen: "4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1",
    objective: "Move your queen from e2 to e7 to give check.",
    expectedMove: { from: "e2", to: "e7", piece: "q" },
    successMessage: "Excellent! You delivered check to the king.",
    guidePoints: [
      "In check, the opponent must respond immediately.",
      "Checks are useful, but only when they improve your position.",
      "Look for forcing sequences: check, capture, threat.",
    ],
  },
  {
    title: "Lesson 8: Center Development",
    description: "Develop knights and bishops quickly toward active squares.",
    fen: "4k3/8/8/8/8/8/8/1N2K3 w - - 0 1",
    objective: "Move your knight from b1 to c3.",
    expectedMove: { from: "b1", to: "c3", piece: "n" },
    successMessage: "Great work! You developed a knight toward the center.",
    guidePoints: [
      "In openings: control the center, develop pieces, and castle.",
      "Avoid moving the same piece repeatedly without reason.",
      "Before every move, ask: what changed in the position?",
    ],
  },
];

const MIN_ELO = 200;
const MAX_ELO = 1000;
const MAX_SKILL_LEVEL = 10;
const ENGINE_SEARCH_DEPTH = 5;
const REVIEW_SEARCH_DEPTH = 10;
const BLACK_TURN = "b";
const ELO_PER_SKILL_LEVEL = 80;
const REVIEW_HISTORY_LIMIT = 200;
const BOARD_RESIZE_DEBOUNCE_MS = 60;
// Extra delayed resize covers late layout stabilization after hidden->visible toggles.
const BOARD_RESIZE_DELAY_MS = 120;

const boardElement = document.getElementById("chess-board");
const instructionsElement = document.getElementById("lesson-instructions");
const onboardingModalElement = document.getElementById("onboarding-modal");
const onboardingCardElements = document.querySelectorAll(".onboarding-level-card");
const interactiveDashboardElement = document.getElementById("interactive-dashboard");
const aiModeToggleButton = document.getElementById("ai-mode-toggle");
const localModeToggleButton = document.getElementById("local-mode-toggle");
const modeStatusElement = document.getElementById("mode-status");
const restartGameButton = document.getElementById("restart-game-button");
const analyzeMoveButton = document.getElementById("analyze-move-button");
const lessonListElement = document.getElementById("lesson-list");
const guideContentElement = document.getElementById("guide-content");
const analysisOutputElement = document.getElementById("analysis-output");
const reviewHistoryElement = document.getElementById("review-history");
const hasChessRuntime = typeof Chess !== "undefined";
const hasChessboardRuntime = typeof Chessboard !== "undefined";

if (
  !boardElement ||
  !instructionsElement ||
  !onboardingModalElement ||
  !interactiveDashboardElement ||
  !aiModeToggleButton ||
  !localModeToggleButton ||
  !modeStatusElement ||
  !restartGameButton ||
  !analyzeMoveButton ||
  !lessonListElement ||
  !guideContentElement ||
  !analysisOutputElement ||
  !reviewHistoryElement
) {
  throw new Error("MoRNChess could not load the chess lesson board.");
}

const game = hasChessRuntime ? new Chess() : null;
let activeLessonIndex = 0;
let feedbackMessage = "";
let selectedElo = MIN_ELO;
let currentMode = "lesson";
let isEngineThinking = false;
let stockfish = null;
let reviewStockfish = null;
let board = null;
let boardResizeObserver = null;
let boardResizeTimeoutId = null;
let reviewRequest = null;
const reviewHistory = [];

function hasFullChessRuntime() {
  return hasChessRuntime && hasChessboardRuntime && Boolean(game);
}

function showRuntimeError(message) {
  feedbackMessage = message;
  renderLessonInstructions();
}

function ensureBoardReady() {
  if (!hasChessboardRuntime) {
    return;
  }

  if (board) {
    return;
  }

  board = Chessboard("chess-board", {
    draggable: true,
    position: "start",
    onDragStart: handleDragStart,
    onDrop: handleMove,
  });

  if (!boardResizeObserver && typeof ResizeObserver !== "undefined") {
    boardResizeObserver = new ResizeObserver(() => {
      try {
        scheduleBoardResizeDebounced();
      } catch (error) {
        console.error("Board resize observer failed.", error);
      }
    });
    boardResizeObserver.observe(boardElement);
  }
}


function scheduleBoardResizeDebounced() {
  if (!board) {
    return;
  }

  window.clearTimeout(boardResizeTimeoutId);
  boardResizeTimeoutId = window.setTimeout(() => {
    board?.resize();
  }, BOARD_RESIZE_DEBOUNCE_MS);
}

function resizeBoardWhenVisible() {
  if (!board) {
    return;
  }

  window.requestAnimationFrame(() => {
    board?.resize();
    window.setTimeout(() => {
      board?.resize();
    }, BOARD_RESIZE_DELAY_MS);
  });
}

function initStockfish(elo) {
  if (!hasChessRuntime) {
    return;
  }

  const eloOrDefault = Number.isFinite(elo) ? elo : MIN_ELO;
  const clampedElo = Math.min(MAX_ELO, Math.max(MIN_ELO, eloOrDefault));
  const skillLevel = Math.max(
    0,
    Math.min(MAX_SKILL_LEVEL, Math.floor((clampedElo - MIN_ELO) / ELO_PER_SKILL_LEVEL))
  );

  if (stockfish) {
    stockfish.terminate();
  }

  stockfish = new Worker("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");
  stockfish.postMessage("uci");
  stockfish.postMessage("ucinewgame");
  stockfish.postMessage(`setoption name Skill Level value ${skillLevel}`);

  stockfish.onmessage = function (event) {
    const message = typeof event.data === "string" ? event.data : "";
    if (!message.startsWith("bestmove")) {
      return;
    }

    const messageTokens = message.trim().split(/\s+/);
    const bestMoveToken = messageTokens.length > 1 ? messageTokens[1] : null;
    if (!bestMoveToken || bestMoveToken.length < 4 || bestMoveToken === "(none)" || currentMode !== "play-ai") {
      isEngineThinking = false;
      return;
    }

    const engineMove = game.move({
      from: bestMoveToken.slice(0, 2),
      to: bestMoveToken.slice(2, 4),
      promotion: bestMoveToken.length > 4 ? bestMoveToken.slice(4, 5) : "q",
    });

    if (engineMove) {
      board.position(game.fen());
      feedbackMessage = `Engine played ${bestMoveToken}. Your turn.`;
      renderLessonInstructions();
    }

    isEngineThinking = false;
  };
}

function formatScoreLabel(scoreType, scoreValue) {
  if (scoreType === "mate") {
    const side = scoreValue > 0 ? "for White" : "for Black";
    return `Mate in ${Math.abs(scoreValue)} ${side}`;
  }

  const cp = Number(scoreValue) || 0;
  const pawnScore = (cp / 100).toFixed(2);
  const side = cp >= 0 ? "White" : "Black";
  return `${side} ${Math.abs(Number(pawnScore))} pawns`;
}

function initReviewEngine() {
  if (!hasChessRuntime) {
    return;
  }

  if (reviewStockfish) {
    reviewStockfish.terminate();
  }

  reviewStockfish = new Worker("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");
  reviewStockfish.postMessage("uci");
  reviewStockfish.postMessage("ucinewgame");
  reviewStockfish.postMessage("setoption name Skill Level value 10");

  reviewStockfish.onmessage = function (event) {
    const message = typeof event.data === "string" ? event.data.trim() : "";
    if (!reviewRequest || !message) {
      return;
    }

    if (message.startsWith("info") && message.includes(" score ")) {
      const tokens = message.split(/\s+/);
      const scoreIndex = tokens.indexOf("score");
      const pvIndex = tokens.indexOf("pv");
      if (scoreIndex > -1 && tokens.length > scoreIndex + 2) {
        reviewRequest.scoreType = tokens[scoreIndex + 1];
        reviewRequest.scoreValue = Number(tokens[scoreIndex + 2]);
      }
      if (pvIndex > -1 && tokens.length > pvIndex + 1) {
        reviewRequest.pv = tokens.slice(pvIndex + 1, pvIndex + 6).join(" ");
      }
      return;
    }

    if (message.startsWith("bestmove")) {
      const tokens = message.split(/\s+/);
      const bestMove = tokens.length > 1 ? tokens[1] : "(none)";
      const scoreText = formatScoreLabel(reviewRequest.scoreType, reviewRequest.scoreValue);
      const summary = `Best move: ${bestMove}. Evaluation: ${scoreText}.${reviewRequest.pv ? ` Suggested line: ${reviewRequest.pv}` : ""}`;
      analysisOutputElement.textContent = summary;
      addReviewEntry(summary);
      reviewRequest = null;
    }
  };
}

function getActiveLesson() {
  return lessons[activeLessonIndex];
}

function getSafeLessonIndex() {
  return activeLessonIndex < lessons.length ? activeLessonIndex : 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLessonList() {
  const activeIndex = Math.min(activeLessonIndex, lessons.length - 1);
  lessonListElement.innerHTML = lessons
    .map((lesson, index) => {
      const isActive = index === activeIndex;
      return `
        <button
          type="button"
          class="lesson-card w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
            isActive
              ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
              : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
          }"
          data-lesson-index="${index}"
        >
          <span class="font-semibold">${index + 1}. ${escapeHtml(lesson.title)}</span>
          <span class="mt-1 block text-xs text-slate-400">${escapeHtml(lesson.objective)}</span>
        </button>
      `;
    })
    .join("");

  lessonListElement.querySelectorAll("[data-lesson-index]").forEach((lessonButton) => {
    lessonButton.addEventListener("click", () => {
      const lessonIndex = Number(lessonButton.getAttribute("data-lesson-index"));
      if (!Number.isInteger(lessonIndex) || lessonIndex < 0 || lessonIndex >= lessons.length) {
        return;
      }
      currentMode = "lesson";
      renderModeStatus();
      loadLesson(lessonIndex);
    });
  });
}

function renderGuideContent() {
  const activeLesson = getActiveLesson();

  if (!activeLesson) {
    guideContentElement.innerHTML = `
      <p class="text-sm text-slate-300">You finished all beginner lessons. Replay any lesson from the list to continue improving.</p>
      <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
        <li>Play slow games and review every blunder.</li>
        <li>Practice 10-15 tactical puzzles daily.</li>
        <li>Focus on king safety and simple endgames.</li>
      </ul>
    `;
    return;
  }

  guideContentElement.innerHTML = `
    <p class="text-sm font-semibold text-slate-100">${escapeHtml(activeLesson.title)} Guide</p>
    <p class="mt-2 text-sm text-slate-300">${escapeHtml(activeLesson.description)}</p>
    <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
      ${activeLesson.guidePoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
    </ul>
  `;
}

function renderModeStatus() {
  if (currentMode === "play-ai") {
    modeStatusElement.textContent = "Mode: Play vs. AI";
  } else if (currentMode === "play-local") {
    modeStatusElement.textContent = "Mode: In-Person (2 Players)";
  } else {
    modeStatusElement.textContent = "Mode: Lesson";
  }

  aiModeToggleButton.textContent = currentMode === "play-ai" ? "Switch to Lesson Mode" : "Play vs AI";
  localModeToggleButton.textContent =
    currentMode === "play-local" ? "Switch to Lesson Mode" : "Play In Person";
}

function renderLessonInstructions() {
  if (!hasFullChessRuntime()) {
    instructionsElement.innerHTML = `
      <div class="space-y-4">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Limited Mode</p>
        <h3 class="text-lg font-semibold text-slate-100">Interactive board could not start</h3>
        <p>Some interactive chess features did not load in your browser/session.</p>
        <p class="text-sm text-slate-300">Reload the page or try a different network/browser to enable full lessons and AI play.</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-amber-300">${escapeHtml(feedbackMessage)}</p>`
            : ""
        }
      </div>
    `;
    renderGuideContent();
    renderLessonList();
    return;
  }

  if (currentMode === "play-ai") {
    instructionsElement.innerHTML = `
      <div class="space-y-4">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Engine Match</p>
        <h3 class="text-lg font-semibold text-slate-100">Play vs. AI Mode</h3>
        <p>Make a legal move as White. The engine replies automatically for fast practice.</p>
        <p class="text-sm text-slate-400">Selected level: ${selectedElo} ELO</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-emerald-300">${escapeHtml(feedbackMessage)}</p>`
            : ""
        }
      </div>
    `;
    return;
  }

  if (currentMode === "play-local") {
    instructionsElement.innerHTML = `
      <div class="space-y-4">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">In-Person Match</p>
        <h3 class="text-lg font-semibold text-slate-100">Play on one board with a friend</h3>
        <p>Both White and Black can move pieces. No engine replies in this mode.</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-sky-300">${escapeHtml(feedbackMessage)}</p>`
            : ""
        }
      </div>
    `;
    return;
  }

  const activeLesson = getActiveLesson();
  const totalLessons = lessons.length;
  const progressLabel = activeLesson
    ? `Lesson ${activeLessonIndex + 1} of ${totalLessons}`
    : `All ${totalLessons} beginner lessons complete`;

  instructionsElement.innerHTML = activeLesson
    ? `
      <div class="space-y-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">${progressLabel}</p>
          <h3 class="mt-2 text-lg font-semibold text-slate-100">${activeLesson.title}</h3>
        </div>
        <p>${activeLesson.description}</p>
        <div class="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-slate-100">
          ${activeLesson.objective}
        </div>
        <p class="text-sm text-slate-400">Drag the piece from the lesson position to complete this step.</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-amber-300">${escapeHtml(feedbackMessage)}</p>`
            : ""
        }
      </div>
    `
    : `
      <div class="space-y-4">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">${progressLabel}</p>
        <h3 class="text-lg font-semibold text-slate-100">Great progress!</h3>
        <p>You completed the beginner lesson pack. Keep replaying lessons and use AI reviews after each game.</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-emerald-300">${escapeHtml(feedbackMessage)}</p>`
            : ""
        }
      </div>
    `;

  renderGuideContent();
  renderLessonList();
}

function handleDragStart(source, piece) {
  if (isEngineThinking) {
    return false;
  }

  if (currentMode === "play-ai") {
    return piece.startsWith("w") && game.turn() === "w";
  }

  return true;
}

function loadLesson(index) {
  if (!hasFullChessRuntime()) {
    activeLessonIndex = index;
    showRuntimeError("Lesson board is unavailable right now.");
    return;
  }

  ensureBoardReady();
  resizeBoardWhenVisible();
  activeLessonIndex = index;
  feedbackMessage = "";

  const activeLesson = getActiveLesson();

  if (!activeLesson) {
    game.reset();
    board.position("start");
    renderLessonInstructions();
    return;
  }

  game.load(activeLesson.fen);
  board.position(activeLesson.fen);
  renderLessonInstructions();
}

function advanceLesson() {
  const completedLesson = lessons[activeLessonIndex];
  const nextLessonIndex = activeLessonIndex + 1;

  if (nextLessonIndex < lessons.length) {
    feedbackMessage = `${completedLesson.successMessage} Loading the next lesson...`;
    renderLessonInstructions();
    window.setTimeout(() => loadLesson(nextLessonIndex), 1200);
    return;
  }

  activeLessonIndex = lessons.length;
  feedbackMessage = `${completedLesson.successMessage} You've finished the beginner practice set.`;
  renderLessonInstructions();
}

function enterAiMatchMode() {
  if (!hasFullChessRuntime()) {
    showRuntimeError("Play mode is unavailable because interactive chess features did not load.");
    return;
  }

  ensureBoardReady();
  currentMode = "play-ai";
  isEngineThinking = false;
  feedbackMessage = "Engine match enabled. Your move as White.";
  game.reset();
  board.position("start");
  renderModeStatus();
  renderLessonInstructions();
}

function enterLocalMatchMode() {
  if (!hasFullChessRuntime()) {
    showRuntimeError("In-person mode is unavailable because interactive chess features did not load.");
    return;
  }

  ensureBoardReady();
  currentMode = "play-local";
  isEngineThinking = false;
  feedbackMessage = "In-person match enabled. White moves first.";
  game.reset();
  board.position("start");
  renderModeStatus();
  renderLessonInstructions();
}

function returnToLessonMode() {
  currentMode = "lesson";
  isEngineThinking = false;
  feedbackMessage = "";
  renderModeStatus();
  loadLesson(getSafeLessonIndex());
}

function requestEngineMove() {
  if (!hasFullChessRuntime()) {
    showRuntimeError("Engine match is unavailable right now.");
    return;
  }

  if (currentMode !== "play-ai" || game.turn() !== BLACK_TURN) {
    return;
  }
  if (!stockfish) {
    feedbackMessage = "Engine is not ready yet. Please restart from onboarding.";
    renderLessonInstructions();
    return;
  }
  isEngineThinking = true;
  stockfish.postMessage(`position fen ${game.fen()}`);
  stockfish.postMessage(`go depth ${ENGINE_SEARCH_DEPTH}`);
}

function addReviewEntry(text) {
  reviewHistory.unshift(text);
  if (reviewHistory.length > REVIEW_HISTORY_LIMIT) {
    reviewHistory.pop();
  }

  reviewHistoryElement.innerHTML = reviewHistory
    .map((entry) => `<li class="rounded-md border border-slate-700 bg-slate-900/60 p-2">${escapeHtml(entry)}</li>`)
    .join("");
}

function requestPositionReview() {
  if (!hasFullChessRuntime()) {
    analysisOutputElement.textContent =
      "AI reviews are unavailable until interactive chess features load successfully.";
    return;
  }

  if (!reviewStockfish) {
    analysisOutputElement.textContent =
      "AI review engine is not available in this browser right now. Try reloading the page.";
    return;
  }

  if (reviewRequest) {
    analysisOutputElement.textContent = "AI review is already running. Please wait for the result.";
    return;
  }

  reviewRequest = {
    scoreType: "cp",
    scoreValue: 0,
    pv: "",
  };

  analysisOutputElement.textContent = "Analyzing current position...";
  reviewStockfish.postMessage(`position fen ${game.fen()}`);
  reviewStockfish.postMessage(`go depth ${REVIEW_SEARCH_DEPTH}`);
}

function handleMove(source, target) {
  if (!hasFullChessRuntime()) {
    return "snapback";
  }

  if (isEngineThinking) {
    return "snapback";
  }

  if (currentMode === "play-ai") {
    const move = game.move({
      from: source,
      to: target,
      promotion: "q",
    });

    if (!move) {
      return "snapback";
    }

    board.position(game.fen());

    if (game.game_over()) {
      feedbackMessage = "Game over. Toggle Engine Match to restart or switch back to lessons.";
      renderLessonInstructions();
      return;
    }

    feedbackMessage = `You played ${move.san}. Engine is thinking...`;
    renderLessonInstructions();
    requestEngineMove();
    return;
  }

  if (currentMode === "play-local") {
    const move = game.move({
      from: source,
      to: target,
      promotion: "q",
    });

    if (!move) {
      return "snapback";
    }

    board.position(game.fen());

    if (game.game_over()) {
      feedbackMessage = "Game over. Restart to play another in-person game.";
      renderLessonInstructions();
      return;
    }

    const nextTurn = game.turn() === "w" ? "White" : "Black";
    feedbackMessage = `Move played: ${move.san}. ${nextTurn} to move.`;
    renderLessonInstructions();
    return;
  }

  const activeLesson = getActiveLesson();

  if (!activeLesson) {
    return "snapback";
  }

  const move = game.move({
    from: source,
    to: target,
    promotion: "q",
  });

  if (!move) {
    feedbackMessage = `That move is not legal. ${activeLesson.objective}`;
    renderLessonInstructions();
    return "snapback";
  }

  const matchesLessonGoal =
    move.from === activeLesson.expectedMove.from &&
    move.to === activeLesson.expectedMove.to &&
    move.piece === activeLesson.expectedMove.piece;

  if (!matchesLessonGoal) {
    game.undo();
    feedbackMessage = `That move is legal, but this lesson is asking for a different move. ${activeLesson.objective}`;
    renderLessonInstructions();
    return "snapback";
  }

  board.position(game.fen());
  feedbackMessage = activeLesson.successMessage;
  renderLessonInstructions();
  advanceLesson();
}

onboardingCardElements.forEach((cardElement) => {
  cardElement.addEventListener("click", () => {
    selectedElo = Number(cardElement.dataset.elo);
    const eloLabel = Number.isFinite(selectedElo) ? selectedElo : MIN_ELO;
    onboardingModalElement.classList.add("hidden");
    interactiveDashboardElement.classList.remove("hidden");
    ensureBoardReady();
    resizeBoardWhenVisible();

    try {
      initStockfish(selectedElo);
      initReviewEngine();
    } catch (error) {
      console.error(`Stockfish failed to initialize for ${eloLabel} ELO.`, error);
      stockfish = null;
      reviewStockfish = null;
    }

    returnToLessonMode();

    if (!hasFullChessRuntime()) {
      showRuntimeError("Some interactive chess features did not load. The interactive board is limited right now—please reload to try again.");
      analysisOutputElement.textContent =
        "AI reviews are unavailable until interactive chess features load successfully. Please reload to try again.";
      return;
    }

    if (!stockfish) {
      feedbackMessage =
        "Engine could not start (browser worker loading issue). You can still practice in lesson mode.";
      renderLessonInstructions();
    }

    if (!reviewStockfish) {
      analysisOutputElement.textContent =
        "AI reviews are unavailable right now, but lessons and normal play still work.";
    }
  });
});

aiModeToggleButton.addEventListener("click", () => {
  if (currentMode === "play-ai") {
    returnToLessonMode();
    return;
  }
  enterAiMatchMode();
});

localModeToggleButton.addEventListener("click", () => {
  if (currentMode === "play-local") {
    returnToLessonMode();
    return;
  }
  enterLocalMatchMode();
});

restartGameButton.addEventListener("click", () => {
  if (currentMode === "play-ai") {
    enterAiMatchMode();
    return;
  }

  if (currentMode === "play-local") {
    enterLocalMatchMode();
    return;
  }
  loadLesson(getSafeLessonIndex());
});

analyzeMoveButton.addEventListener("click", () => {
  requestPositionReview();
});

renderModeStatus();
renderLessonList();
renderGuideContent();
