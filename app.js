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
const ENGINE_FALLBACK_DELAY_MS = 450;
const DEFAULT_PROMOTION_PIECE = "q";
const PIECE_THEME_URL = "https://cdn.jsdelivr.net/npm/chessboardjs@1.0.0/www/img/chesspieces/neo/{piece}.png";

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
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FILE_NAMES = "abcdefgh";
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

function getSquareName(fileIndex, rankIndex) {
  return `${FILE_NAMES[fileIndex]}${8 - rankIndex}`;
}

function parseSquare(square) {
  if (!square || square.length !== 2) {
    return null;
  }
  const fileIndex = FILE_NAMES.indexOf(square[0]);
  const rank = Number(square[1]);
  if (fileIndex < 0 || !Number.isInteger(rank) || rank < 1 || rank > 8) {
    return null;
  }
  return { x: fileIndex, y: 8 - rank };
}

function createFallbackChessGame() {
  const pieceValues = new Set(["p", "n", "b", "r", "q", "k"]);
  let boardState = [];
  let turnColor = "w";
  let castlingRights = "KQkq";
  let halfmoveClock = 0;
  let fullmoveNumber = 1;
  let history = [];

  function parseFenBoard(boardFen) {
    const rows = boardFen.split("/");
    if (rows.length !== 8) {
      throw new Error("Invalid board FEN.");
    }
    return rows.map((row) => {
      const parsedRow = [];
      row.split("").forEach((char) => {
        const emptyCount = Number(char);
        if (Number.isInteger(emptyCount) && emptyCount > 0) {
          for (let i = 0; i < emptyCount; i += 1) {
            parsedRow.push(null);
          }
        } else {
          parsedRow.push(char);
        }
      });
      if (parsedRow.length !== 8) {
        throw new Error("Invalid board FEN row.");
      }
      return parsedRow;
    });
  }

  function serializeFenBoard() {
    return boardState
      .map((row) => {
        let empty = 0;
        let text = "";
        row.forEach((piece) => {
          if (!piece) {
            empty += 1;
            return;
          }
          if (empty > 0) {
            text += String(empty);
            empty = 0;
          }
          text += piece;
        });
        if (empty > 0) {
          text += String(empty);
        }
        return text;
      })
      .join("/");
  }

  function isInBounds(x, y) {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  function getPieceAt(x, y) {
    if (!isInBounds(x, y)) {
      return null;
    }
    return boardState[y][x];
  }

  function getPieceColor(piece) {
    if (!piece) {
      return null;
    }
    return piece === piece.toUpperCase() ? "w" : "b";
  }

  function isPathClear(fromX, fromY, toX, toY) {
    const xStep = Math.sign(toX - fromX);
    const yStep = Math.sign(toY - fromY);
    let x = fromX + xStep;
    let y = fromY + yStep;
    while (x !== toX || y !== toY) {
      if (getPieceAt(x, y)) {
        return false;
      }
      x += xStep;
      y += yStep;
    }
    return true;
  }

  function removeCastlingRight(flag) {
    castlingRights = castlingRights.replace(flag, "");
    if (!castlingRights) {
      castlingRights = "-";
    }
  }

  function updateCastlingRightsOnMove(piece, fromX, fromY, toX, toY, capturedPiece) {
    if (piece === "K") {
      removeCastlingRight("K");
      removeCastlingRight("Q");
    } else if (piece === "k") {
      removeCastlingRight("k");
      removeCastlingRight("q");
    } else if (piece === "R") {
      if (fromX === 0 && fromY === 7) {
        removeCastlingRight("Q");
      } else if (fromX === 7 && fromY === 7) {
        removeCastlingRight("K");
      }
    } else if (piece === "r") {
      if (fromX === 0 && fromY === 0) {
        removeCastlingRight("q");
      } else if (fromX === 7 && fromY === 0) {
        removeCastlingRight("k");
      }
    }

    if (capturedPiece === "R") {
      if (toX === 0 && toY === 7) {
        removeCastlingRight("Q");
      } else if (toX === 7 && toY === 7) {
        removeCastlingRight("K");
      }
    } else if (capturedPiece === "r") {
      if (toX === 0 && toY === 0) {
        removeCastlingRight("q");
      } else if (toX === 7 && toY === 0) {
        removeCastlingRight("k");
      }
    }
  }

  function isPseudoLegalMove(piece, fromX, fromY, toX, toY, promotion, allowCastling = true) {
    const targetPiece = getPieceAt(toX, toY);
    const color = getPieceColor(piece);
    const targetColor = getPieceColor(targetPiece);
    if (color !== turnColor || targetColor === color) {
      return { legal: false, flags: "" };
    }

    const pieceType = piece.toLowerCase();
    const dx = toX - fromX;
    const dy = toY - fromY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    let flags = targetPiece ? "c" : "";

    if (pieceType === "p") {
      const forward = color === "w" ? -1 : 1;
      const startRank = color === "w" ? 6 : 1;
      const promotionRank = color === "w" ? 0 : 7;
      const isForwardMove = dx === 0 && dy === forward && !targetPiece;
      const isDoubleMove =
        dx === 0 &&
        dy === 2 * forward &&
        fromY === startRank &&
        !targetPiece &&
        !getPieceAt(fromX, fromY + forward);
      const isCaptureMove = absDx === 1 && dy === forward && targetPiece && targetColor !== color;

      if (!isForwardMove && !isDoubleMove && !isCaptureMove) {
        return { legal: false, flags: "" };
      }

      if (toY === promotionRank) {
        const nextPiece = (promotion || DEFAULT_PROMOTION_PIECE).toLowerCase();
        if (!pieceValues.has(nextPiece) || nextPiece === "k") {
          return { legal: false, flags: "" };
        }
        flags += "p";
      }
      return { legal: true, flags };
    }

    if (pieceType === "n") {
      if (!((absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1))) {
        return { legal: false, flags: "" };
      }
      return { legal: true, flags };
    }

    if (pieceType === "b") {
      if (absDx !== absDy || !isPathClear(fromX, fromY, toX, toY)) {
        return { legal: false, flags: "" };
      }
      return { legal: true, flags };
    }

    if (pieceType === "r") {
      if ((dx !== 0 && dy !== 0) || !isPathClear(fromX, fromY, toX, toY)) {
        return { legal: false, flags: "" };
      }
      return { legal: true, flags };
    }

    if (pieceType === "q") {
      const isStraight = dx === 0 || dy === 0;
      const isDiagonal = absDx === absDy;
      if ((!isStraight && !isDiagonal) || !isPathClear(fromX, fromY, toX, toY)) {
        return { legal: false, flags: "" };
      }
      return { legal: true, flags };
    }

    if (pieceType === "k") {
      if (allowCastling && absDy === 0 && absDx === 2) {
        const isWhite = color === "w";
        const kingSide = dx === 2;
        const rights = kingSide ? (isWhite ? "K" : "k") : isWhite ? "Q" : "q";
        const y = isWhite ? 7 : 0;
        const rookX = kingSide ? 7 : 0;
        const throughSquares = kingSide ? [5, 6] : [1, 2, 3];
        const rook = getPieceAt(rookX, y);
        const expectedRook = isWhite ? "R" : "r";
        const canCastle =
          castlingRights.includes(rights) &&
          fromX === 4 &&
          fromY === y &&
          toY === y &&
          toX === (kingSide ? 6 : 2) &&
          rook === expectedRook &&
          throughSquares.every((x) => !getPieceAt(x, y));
        if (!canCastle) {
          return { legal: false, flags: "" };
        }
        return { legal: true, flags: flags + (kingSide ? "k" : "q") };
      }
      if (absDx <= 1 && absDy <= 1) {
        return { legal: true, flags };
      }
    }

    return { legal: false, flags: "" };
  }

  function formatSan(piece, from, to, flags, promotionPiece) {
    const pieceType = piece.toLowerCase();
    const pieceLabel = pieceType === "p" ? "" : pieceType.toUpperCase();
    const captureMarker = flags.includes("c") ? "x" : "";
    const promotionLabel = flags.includes("p") ? `=${(promotionPiece || DEFAULT_PROMOTION_PIECE).toUpperCase()}` : "";
    if (flags.includes("k")) {
      return "O-O";
    }
    if (flags.includes("q")) {
      return "O-O-O";
    }
    return `${pieceLabel}${captureMarker}${to}${promotionLabel}`;
  }

  function applyMove(from, to, promotion) {
    const fromSquare = parseSquare(from);
    const toSquare = parseSquare(to);
    if (!fromSquare || !toSquare) {
      return null;
    }
    const piece = getPieceAt(fromSquare.x, fromSquare.y);
    if (!piece) {
      return null;
    }

    const validation = isPseudoLegalMove(
      piece,
      fromSquare.x,
      fromSquare.y,
      toSquare.x,
      toSquare.y,
      promotion
    );
    if (!validation.legal) {
      return null;
    }

    const snapshot = {
      boardState: boardState.map((row) => [...row]),
      turnColor,
      castlingRights,
      halfmoveClock,
      fullmoveNumber,
    };
    history.push(snapshot);

    const originalTarget = getPieceAt(toSquare.x, toSquare.y);
    boardState[fromSquare.y][fromSquare.x] = null;
    let movedPiece = piece;
    if (validation.flags.includes("p")) {
      const nextPiece = (promotion || DEFAULT_PROMOTION_PIECE).toLowerCase();
      movedPiece = turnColor === "w" ? nextPiece.toUpperCase() : nextPiece;
    }
    boardState[toSquare.y][toSquare.x] = movedPiece;

    if (validation.flags.includes("k")) {
      const rookFromX = 7;
      const rookToX = 5;
      boardState[fromSquare.y][rookToX] = boardState[fromSquare.y][rookFromX];
      boardState[fromSquare.y][rookFromX] = null;
    } else if (validation.flags.includes("q")) {
      const rookFromX = 0;
      const rookToX = 3;
      boardState[fromSquare.y][rookToX] = boardState[fromSquare.y][rookFromX];
      boardState[fromSquare.y][rookFromX] = null;
    }

    updateCastlingRightsOnMove(piece, fromSquare.x, fromSquare.y, toSquare.x, toSquare.y, originalTarget);
    if (piece.toLowerCase() === "p" || originalTarget) {
      halfmoveClock = 0;
    } else {
      halfmoveClock += 1;
    }
    if (turnColor === "b") {
      fullmoveNumber += 1;
    }
    turnColor = turnColor === "w" ? "b" : "w";

    const san = formatSan(piece, from, to, validation.flags, promotion);
    return {
      from,
      to,
      piece: piece.toLowerCase(),
      captured: originalTarget ? originalTarget.toLowerCase() : undefined,
      promotion: validation.flags.includes("p") ? (promotion || DEFAULT_PROMOTION_PIECE).toLowerCase() : undefined,
      flags: validation.flags,
      san,
    };
  }

  function move(input, to, promotion) {
    if (typeof input === "object" && input !== null) {
      return applyMove(input.from, input.to, input.promotion);
    }
    return applyMove(input, to, promotion);
  }

  function generateMoves() {
    const legalMoves = [];
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const piece = getPieceAt(x, y);
        if (!piece || getPieceColor(piece) !== turnColor) {
          continue;
        }
        for (let toY = 0; toY < 8; toY += 1) {
          for (let toX = 0; toX < 8; toX += 1) {
            if (toX === x && toY === y) {
              continue;
            }
            const from = getSquareName(x, y);
            const to = getSquareName(toX, toY);
            const validation = isPseudoLegalMove(piece, x, y, toX, toY, DEFAULT_PROMOTION_PIECE);
            if (!validation.legal) {
              continue;
            }
            legalMoves.push({
              from,
              to,
              piece: piece.toLowerCase(),
              captured: getPieceAt(toX, toY)?.toLowerCase(),
              promotion: validation.flags.includes("p") ? DEFAULT_PROMOTION_PIECE : undefined,
              flags: validation.flags,
              san: formatSan(piece, from, to, validation.flags, DEFAULT_PROMOTION_PIECE),
            });
          }
        }
      }
    }
    return legalMoves;
  }

  function reset() {
    load(START_FEN);
  }

  function load(fen) {
    const tokens = String(fen || "").trim().split(/\s+/);
    if (tokens.length < 2) {
      return false;
    }
    try {
      boardState = parseFenBoard(tokens[0]);
    } catch (error) {
      return false;
    }
    turnColor = tokens[1] === "b" ? "b" : "w";
    castlingRights = tokens[2] && tokens[2] !== "-" ? tokens[2] : "-";
    halfmoveClock = Number(tokens[4]) || 0;
    fullmoveNumber = Number(tokens[5]) || 1;
    history = [];
    return true;
  }

  function fen() {
    return `${serializeFenBoard()} ${turnColor} ${castlingRights || "-"} - ${halfmoveClock} ${fullmoveNumber}`;
  }

  function turn() {
    return turnColor;
  }

  function undo() {
    const previousState = history.pop();
    if (!previousState) {
      return null;
    }
    boardState = previousState.boardState.map((row) => [...row]);
    turnColor = previousState.turnColor;
    castlingRights = previousState.castlingRights;
    halfmoveClock = previousState.halfmoveClock;
    fullmoveNumber = previousState.fullmoveNumber;
    return true;
  }

  function moves(options = {}) {
    const moveList = generateMoves();
    if (options.verbose) {
      return moveList;
    }
    return moveList.map((item) => item.san);
  }

  function game_over() {
    return generateMoves().length === 0;
  }

  reset();

  return {
    reset,
    load,
    fen,
    turn,
    move,
    undo,
    moves,
    game_over,
  };
}

function createFallbackBoard(targetElement) {
  const unicodePieces = {
    P: "♙",
    N: "♘",
    B: "♗",
    R: "♖",
    Q: "♕",
    K: "♔",
    p: "♟",
    n: "♞",
    b: "♝",
    r: "♜",
    q: "♛",
    k: "♚",
  };

  let currentFen = START_FEN;
  let selectedSquare = null;
  let renderedBoard = [];

  function parseBoardForRender(fen) {
    const boardFen = String(fen).split(" ")[0];
    return boardFen.split("/").map((row) => {
      const parsedRow = [];
      row.split("").forEach((char) => {
        const emptyCount = Number(char);
        if (Number.isInteger(emptyCount) && emptyCount > 0) {
          for (let i = 0; i < emptyCount; i += 1) {
            parsedRow.push(null);
          }
        } else {
          parsedRow.push(char);
        }
      });
      return parsedRow;
    });
  }

  function render() {
    renderedBoard = parseBoardForRender(currentFen);
    targetElement.innerHTML = "";
    targetElement.classList.add("fallback-chessboard");

    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const square = getSquareName(x, y);
        const piece = renderedBoard[y][x];
        const squareButton = document.createElement("button");
        squareButton.type = "button";
        squareButton.dataset.square = square;
        squareButton.className = `fallback-square ${(x + y) % 2 === 0 ? "fallback-light" : "fallback-dark"}${
          selectedSquare === square ? " fallback-selected" : ""
        }`;
        const pieceSpan = document.createElement("span");
        pieceSpan.className = "fallback-piece";
        pieceSpan.textContent = piece ? unicodePieces[piece] : "";
        squareButton.appendChild(pieceSpan);

        if (y === 7) {
          const fileLabel = document.createElement("span");
          fileLabel.className = "fallback-file-label";
          fileLabel.textContent = FILE_NAMES[x];
          squareButton.appendChild(fileLabel);
        }

        if (x === 0) {
          const rankLabel = document.createElement("span");
          rankLabel.className = "fallback-rank-label";
          rankLabel.textContent = String(8 - y);
          squareButton.appendChild(rankLabel);
        }

        squareButton.setAttribute("aria-label", `Square ${square}`);
        squareButton.addEventListener("click", () => {
          if (!game) {
            return;
          }
          const selected = parseSquare(selectedSquare || "");
          const sourcePiece =
            selected && renderedBoard[selected.y] && renderedBoard[selected.y][selected.x]
              ? renderedBoard[selected.y][selected.x]
              : null;
          if (!selectedSquare || !sourcePiece) {
            if (!piece) {
              return;
            }
            const colorCode = piece === piece.toUpperCase() ? "w" : "b";
            const pieceCode = `${colorCode}${piece.toUpperCase()}`;
            if (handleDragStart(square, pieceCode) === false) {
              return;
            }
            selectedSquare = square;
            render();
            return;
          }

          if (selectedSquare === square) {
            selectedSquare = null;
            render();
            return;
          }

          const result = handleMove(selectedSquare, square);
          selectedSquare = null;
          if (result === "snapback") {
            render();
            return;
          }
          board.position(game.fen());
        });
        targetElement.appendChild(squareButton);
      }
    }
  }

  return {
    position(fen) {
      currentFen = fen === "start" ? START_FEN : fen;
      render();
    },
    resize() {},
  };
}

const game = hasChessRuntime ? new Chess() : createFallbackChessGame();
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
  return Boolean(game);
}

function showRuntimeError(message) {
  feedbackMessage = message;
  renderLessonInstructions();
}

function ensureBoardReady() {
  if (board) {
    return;
  }

  if (hasChessboardRuntime) {
    board = Chessboard("chess-board", {
      draggable: true,
      position: "start",
      showNotation: true,
      pieceTheme: PIECE_THEME_URL,
      onDragStart: handleDragStart,
      onDrop: handleMove,
    });
  } else {
    board = createFallbackBoard(boardElement);
    board.position(game?.fen?.() || "start");
  }

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
      promotion: bestMoveToken.length > 4 ? bestMoveToken.slice(4, 5) : DEFAULT_PROMOTION_PIECE,
    });

    if (engineMove) {
      board.position(game.fen());
      feedbackMessage = `Engine played ${bestMoveToken}. Your turn.`;
      renderLessonInstructions();
    }

    isEngineThinking = false;
  };

  stockfish.onerror = function () {
    stockfish = null;
    isEngineThinking = false;
    if (currentMode === "play-ai") {
      feedbackMessage = "Engine worker is unavailable. Continuing with built-in AI.";
      renderLessonInstructions();
    }
  };
}

function getFallbackEngineMove() {
  if (!hasFullChessRuntime()) {
    return null;
  }

  const legalMoves = game.moves({ verbose: true });
  if (!legalMoves.length) {
    return null;
  }

  const pieceValues = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves = [];

  legalMoves.forEach((move) => {
    let score = 0;

    if (move.captured) {
      score += pieceValues[move.captured] ?? 0;
    }
    if (move.flags.includes("p")) {
      score += (pieceValues[move.promotion] ?? pieceValues.q) - pieceValues.p;
    }
    if (move.san.includes("+")) {
      score += 0.5;
    }
    if (move.san.includes("#")) {
      score += 100;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  });

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function playFallbackEngineMove() {
  const fallbackMove = getFallbackEngineMove();
  if (!fallbackMove) {
    feedbackMessage = "No legal engine move is available.";
    renderLessonInstructions();
    isEngineThinking = false;
    return;
  }

  const playedMove = game.move({
    from: fallbackMove.from,
    to: fallbackMove.to,
    promotion: fallbackMove.promotion || DEFAULT_PROMOTION_PIECE,
  });

  if (!playedMove) {
    feedbackMessage = "Built-in AI could not make a legal move.";
    renderLessonInstructions();
    isEngineThinking = false;
    return;
  }

  board.position(game.fen());
  feedbackMessage = `AI played ${playedMove.san}. Your turn.`;
  renderLessonInstructions();
  isEngineThinking = false;
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

function getTurnPlayerName() {
  return game.turn() === "w" ? "White" : "Black";
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
        <p class="text-sm text-slate-400">Move the piece from the lesson position to complete this step.</p>
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

  if (currentMode === "play-local") {
    return piece.startsWith(game.turn());
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
  resizeBoardWhenVisible();
  if (!stockfish) {
    try {
      initStockfish(selectedElo);
    } catch (error) {
      stockfish = null;
    }
  }
  currentMode = "play-ai";
  isEngineThinking = false;
  feedbackMessage = stockfish
    ? "Engine match enabled. Your move as White."
    : "Engine match enabled with built-in AI. Your move as White.";
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
  resizeBoardWhenVisible();
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
    feedbackMessage = "Built-in AI is thinking...";
    renderLessonInstructions();
    isEngineThinking = true;
    window.setTimeout(() => {
      if (currentMode !== "play-ai" || game.turn() !== BLACK_TURN) {
        isEngineThinking = false;
        return;
      }
      playFallbackEngineMove();
    }, ENGINE_FALLBACK_DELAY_MS);
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
      promotion: DEFAULT_PROMOTION_PIECE,
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
      promotion: DEFAULT_PROMOTION_PIECE,
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

    feedbackMessage = `Move played: ${move.san}. ${getTurnPlayerName()} to move.`;
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
    promotion: DEFAULT_PROMOTION_PIECE,
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
