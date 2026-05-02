console.log("CHESS JS LOADED");

let game;
let board;

let draggedPiece = null;
let fromSquare = null;
let isFlipped = false;
let gameMode = localStorage.getItem("gameMode") || "pvp";

document.addEventListener("DOMContentLoaded", () => {

  game = new Chess();
  board = document.querySelector(".chess-board");

  if (!board) {
    console.error("Chess board not found!");
    return;
  }

  renderBoard();

  // ==========================
  // SAFE BUTTONS (NO CRASH)
  // ==========================
  const pvpBtn = document.getElementById("pvpBtn");
  const botBtn = document.getElementById("botBtn");
  const undoBtn = document.getElementById("undoBtn");
  const resetBtn = document.getElementById("resetBtn");
  const flipBtn = document.getElementById("flipBtn");

  if (pvpBtn && botBtn) {
    pvpBtn.addEventListener("click", () => {
      localStorage.setItem("gameMode", "pvp");
      window.location.href = "new_game.html";
    });

    botBtn.addEventListener("click", () => {
      localStorage.setItem("gameMode", "bot");
      window.location.href = "new_game.html";
    });
  }

  // ==========================
  // DRAG START
  // ==========================
  board.addEventListener("dragstart", (e) => {

    const piece = e.target;
    if (piece.tagName !== "IMG") return;

    const type = piece.dataset.piece;
    if (!type) return;

    const color = type[0];

    if (color !== game.turn()) {
      e.preventDefault();
      return;
    }

    draggedPiece = piece;
    fromSquare = piece.parentElement.id;

    piece.style.opacity = "0.5";
  });

  board.addEventListener("dragend", () => {
    if (draggedPiece) draggedPiece.style.opacity = "1";
    draggedPiece = null;
    fromSquare = null;
  });

  board.addEventListener("dragover", (e) => e.preventDefault());

  // ==========================
  // DROP
  // ==========================
  board.addEventListener("drop", (e) => {

    e.preventDefault();
    if (!draggedPiece || !fromSquare) return;

    let target = e.target;
    if (target.tagName === "IMG") target = target.parentElement;

    if (!target.id) return;

    const move = game.move({
      from: fromSquare,
      to: target.id,
      promotion: "q"
    });

    if (!move) return;

    renderBoard();
    checkGameStatus();

    if (gameMode === "bot") {
      setTimeout(botMove, 400);
    }
  });

  // ==========================
  // CLICK HIGHLIGHT
  // ==========================
  board.addEventListener("click", (e) => {

    const square = e.target.closest(".white, .black");
    if (!square) return;

    clearHighlights();

    const piece = square.querySelector("img");
    if (!piece) return;

    const type = piece.dataset.piece;
    if (!type) return;

    if (type[0] !== game.turn()) return;

    square.classList.add("selected");

    const moves = game.moves({
      square: square.id,
      verbose: true
    });

    moves.forEach(m => {
      const t = document.getElementById(m.to);
      if (t) t.classList.add("highlight");
    });
  });

  // ==========================
  // UNDO
  // ==========================
  undoBtn?.addEventListener("click", () => {

    game.undo();

    if (gameMode === "bot") {
      game.undo(); // undo bot move too
    }

    renderBoard();
  });

  // ==========================
  // RESET
  // ==========================
  resetBtn?.addEventListener("click", () => {
    game.reset();
    renderBoard();
  });

  // ==========================
  // FLIP
  // ==========================
  flipBtn?.addEventListener("click", () => {
    isFlipped = !isFlipped;
    renderBoard();
  });

});

// ==========================
// BOT (RANDOM MOVE)
// ==========================
function botMove() {

  if (game.game_over()) return;
  if (game.turn() !== "b") return;

  const moves = game.moves();
  if (moves.length === 0) return;

  const move = moves[Math.floor(Math.random() * moves.length)];

  game.move(move);

  renderBoard();
  checkGameStatus();
}

// ==========================
// GAME STATUS
// ==========================
function checkGameStatus() {
  if (game.in_checkmate()) alert("Checkmate!");
  else if (game.in_draw()) alert("Draw!");
}

// ==========================
// CLEAR HIGHLIGHTS
// ==========================
function clearHighlights() {
  document.querySelectorAll(".highlight, .selected").forEach(el => {
    el.classList.remove("highlight", "selected");
  });
}

// ==========================
// RENDER BOARD
// ==========================
function renderBoard() {

  document.querySelectorAll(".chess-board div").forEach(square => {
    square.innerHTML = "";
  });

  const boardState = game.board();
  const files = ["a","b","c","d","e","f","g","h"];

  const rows = isFlipped ? [...boardState].reverse() : boardState;

  rows.forEach((row, r) => {

    const cols = isFlipped ? [...row].reverse() : row;

    cols.forEach((piece, c) => {

      if (!piece) return;

      const rr = isFlipped ? 7 - r : r;
      const cc = isFlipped ? 7 - c : c;

      const squareId = files[cc] + (8 - rr);
      const square = document.getElementById(squareId);

      if (!square) return;

      const img = document.createElement("img");

      img.src =
        piece.color === "w"
          ? `lit_top_pices/Chess_${piece.type}lt45.svg`
          : `dark_top_pices/Chess_${piece.type}dt45.svg`;

      img.setAttribute("draggable", "true");
      img.setAttribute("data-piece", `${piece.color}_${piece.type}`);

      square.appendChild(img);
    });
  });
}