const lessons = [
  {
    title: "How the Rook Moves",
    description: "Rooks move any number of squares in straight lines along ranks or files.",
    fen: "4k3/8/8/8/R3p3/8/8/4K3 w - - 0 1",
    objective: "Move your Rook to e4 to capture the pawn!",
    expectedMove: { from: "a4", to: "e4", piece: "r" },
    successMessage: "Great job! The rook captured straight across the rank.",
  },
  {
    title: "How the Bishop Moves",
    description: "Bishops move diagonally across the board for as many squares as you like.",
    fen: "4k3/8/8/6p1/8/8/8/2B1K3 w - - 0 1",
    objective: "Move your Bishop to g5 to capture the pawn!",
    expectedMove: { from: "c1", to: "g5", piece: "b" },
    successMessage: "Excellent! The bishop captured by traveling diagonally.",
  },
];

const MIN_ELO = 200;
const MAX_ELO = 1000;
const ELO_RANGE = MAX_ELO - MIN_ELO;
const MAX_SKILL_LEVEL = 10;

const boardElement = document.getElementById("chess-board");
const instructionsElement = document.getElementById("lesson-instructions");
const onboardingModalElement = document.getElementById("onboarding-modal");
const onboardingCardElements = document.querySelectorAll(".onboarding-level-card");
const interactiveDashboardElement = document.getElementById("interactive-dashboard");
const engineModeToggleButton = document.getElementById("engine-mode-toggle");
const modeStatusElement = document.getElementById("mode-status");

if (
  !boardElement ||
  !instructionsElement ||
  !onboardingModalElement ||
  !interactiveDashboardElement ||
  !engineModeToggleButton ||
  !modeStatusElement ||
  typeof Chess === "undefined" ||
  typeof Chessboard === "undefined"
) {
  throw new Error("MoRNChess could not load the chess lesson board.");
}

const stockfish = new Worker("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");
const game = new Chess();
let activeLessonIndex = 0;
let feedbackMessage = "";
let userSelectedElo = null;
let isEngineMatchMode = false;
let isEngineThinking = false;

const board = Chessboard("chess-board", {
  draggable: true,
  position: "start",
  onDragStart: handleDragStart,
  onDrop: handleMove,
});

stockfish.postMessage("uci");

stockfish.onmessage = function (event) {
  const message = typeof event.data === "string" ? event.data : "";
  if (!message.startsWith("bestmove")) {
    return;
  }

  const bestMoveToken = message.split(" ")[1];
  if (!bestMoveToken || bestMoveToken.length < 4 || bestMoveToken === "(none)" || !isEngineMatchMode) {
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

function setEngineDifficulty(elo) {
  const normalizedElo = Number.isFinite(elo) ? elo : MIN_ELO;
  const clampedElo = Math.min(MAX_ELO, Math.max(MIN_ELO, normalizedElo));
  const skillLevel = Math.round(((clampedElo - MIN_ELO) / ELO_RANGE) * MAX_SKILL_LEVEL);
  stockfish.postMessage(`setoption name Skill Level value ${skillLevel}`);
}

function getActiveLesson() {
  return lessons[activeLessonIndex];
}

function renderModeStatus() {
  modeStatusElement.textContent = isEngineMatchMode ? "Mode: Play vs. AI" : "Mode: Lesson";
}

function renderLessonInstructions() {
  if (isEngineMatchMode) {
    instructionsElement.innerHTML = `
      <div class="space-y-4">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Engine Match</p>
        <h3 class="text-lg font-semibold text-slate-100">Play vs. AI Mode</h3>
        <p>Make a legal move as White. The engine replies automatically at low depth for fast practice.</p>
        <p class="text-sm text-slate-400">Selected level: ${userSelectedElo || MIN_ELO} ELO</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-emerald-300">${feedbackMessage}</p>`
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
        <p class="text-sm text-slate-400">Drag the piece from the lesson position to practice the move.</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-amber-300">${feedbackMessage}</p>`
            : ""
        }
      </div>
    `
    : `
      <div class="space-y-4">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">${progressLabel}</p>
        <h3 class="text-lg font-semibold text-slate-100">Nice work!</h3>
        <p>You completed the first beginner lessons. Refresh the page to practice them again.</p>
        ${
          feedbackMessage
            ? `<p class="text-sm font-medium text-emerald-300">${feedbackMessage}</p>`
            : ""
        }
      </div>
    `;
}

function handleDragStart(source, piece) {
  if (isEngineThinking) {
    return false;
  }

  if (isEngineMatchMode) {
    return piece.startsWith("w") && game.turn() === "w";
  }

  return true;
}

function loadLesson(index) {
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

function enterEngineMatchMode() {
  isEngineMatchMode = true;
  isEngineThinking = false;
  feedbackMessage = "Engine match enabled. Your move as White.";
  game.reset();
  board.position("start");
  renderModeStatus();
  renderLessonInstructions();
}

function returnToLessonMode() {
  isEngineMatchMode = false;
  isEngineThinking = false;
  feedbackMessage = "";
  renderModeStatus();
  if (activeLessonIndex >= lessons.length) {
    renderLessonInstructions();
    board.position(game.fen());
    return;
  }
  loadLesson(activeLessonIndex);
}

function handleMove(source, target) {
  if (isEngineThinking) {
    return "snapback";
  }

  if (isEngineMatchMode) {
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

    isEngineThinking = true;
    feedbackMessage = `You played ${move.from}${move.to}. Engine is thinking...`;
    renderLessonInstructions();
    stockfish.postMessage("position fen " + game.fen());
    stockfish.postMessage("go depth 5");
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
    userSelectedElo = Number(cardElement.dataset.elo);
    setEngineDifficulty(userSelectedElo);
    onboardingModalElement.classList.add("hidden");
    interactiveDashboardElement.classList.remove("hidden");
    renderModeStatus();
    loadLesson(0);
  });
});

engineModeToggleButton.addEventListener("click", () => {
  if (isEngineMatchMode) {
    returnToLessonMode();
    return;
  }
  enterEngineMatchMode();
});
