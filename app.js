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

const boardElement = document.getElementById("chess-board");
const instructionsElement = document.getElementById("lesson-instructions");

if (!boardElement || !instructionsElement || typeof Chess === "undefined" || typeof Chessboard === "undefined") {
  throw new Error("MoRNChess could not load the chess lesson board.");
}

const game = new Chess();
let activeLessonIndex = 0;
let feedbackMessage = "";

const board = Chessboard("chess-board", {
  draggable: true,
  position: "start",
  onDrop: handleMove,
});

function getActiveLesson() {
  return lessons[activeLessonIndex];
}

function renderLessonInstructions() {
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

function handleMove(source, target) {
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

loadLesson(0);
