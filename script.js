console.log("JS LOADED");

let game;
let board;

let draggedPiece = null;
let fromSquare = null;

let isFlipped = false;
let selectedSquare = null;

let whiteCaptured = [];
let blackCaptured = [];
let moveList = [];

// ==========================
// CAPTURE SYSTEM (SAFE FIXED)
// ==========================
function addCapturedPiece(move) {

  if (!move || !move.captured) return;

  const piece = document.createElement("img");

  const color = move.color === "w" ? "b" : "w";
  const type = move.captured;

  piece.src =
    color === "w"
      ? `lit_top_pices/Chess_${type}lt45.svg`
      : `dark_top_pices/Chess_${type}dt45.svg`;

  piece.alt = `${color}-${type}`;

  if (color === "w") {
    whiteCaptured.push(piece);
    document.getElementById("whiteCaptured")?.appendChild(piece);
  } else {
    blackCaptured.push(piece);
    document.getElementById("blackCaptured")?.appendChild(piece);
  }
}

let gameMode = localStorage.getItem("gameMode") || "pvp";

document.addEventListener("DOMContentLoaded", () => {

  const pvpBtn = document.getElementById("pvpBtn");
  const botBtn = document.getElementById("botBtn");

  if (pvpBtn && botBtn) {
    pvpBtn.addEventListener("click", () => {
      localStorage.setItem("gameMode", "pvp");
      window.location.href = "new_game.html";
    });

    botBtn.addEventListener("click", () => {
      localStorage.setItem("gameMode", "bot");
      window.location.href = "new_game.html";
    });

    return;
  }

  game = new Chess();
  board = document.querySelector(".chess-board");

  if (!board) return;

  renderBoard();

  // ==========================
  // FLIP BUTTON
  // ==========================
  document.getElementById("flipBtn")?.addEventListener("click", () => {
    isFlipped = !isFlipped;
    renderBoard();
  });

  // ==========================
  // CLICK TO MOVE
  // ==========================
  board.addEventListener("click", (e) => {

    const square = e.target.closest(".white, .black");
    if (!square) return;

    clearHighlights();

    const piece = square.querySelector("img");

    // STEP 1: select piece
    if (!selectedSquare) {

      if (!piece) return;

      const type = piece.dataset.piece;
      if (!type) return;

      if (type[0] !== game.turn()) return;

      selectedSquare = square.id;

      square.classList.add("selected");

      const moves = game.moves({
        square: selectedSquare,
        verbose: true
      });

      moves.forEach(m => {
        const t = document.getElementById(m.to);
        if (t) t.classList.add("highlight");
      });

      return;
    }

    // STEP 2: move
    const move = game.move({
      from: selectedSquare,
      to: square.id,
      promotion: "q"
    });

    if (move) {

      addCapturedPiece(move);

      // ✅ ADD MOVE HISTORY
      recordMove(move.from, move.to, move.piece, move.captured);

      selectedSquare = null;
      renderBoard();
      checkGameStatus();

      if (gameMode === "bot") {
        setTimeout(botMove, 400);
      }
    } else {
      selectedSquare = null;
      renderBoard();
    }
  });

  // ==========================
  // DRAG START
  // ==========================
  board.addEventListener("dragstart", (e) => {

    const piece = e.target;
    if (piece.tagName !== "IMG") return;

    const type = piece.dataset.piece;
    if (!type) return;

    const color = type[0];

    if (gameMode === "bot" && game.turn() === "b") {
      e.preventDefault();
      return;
    }

    if (color !== game.turn()) {
      e.preventDefault();
      return;
    }

    draggedPiece = piece;
    fromSquare = piece.parentElement.id;

    piece.style.opacity = "0.5";
  });

  // ==========================
  // DRAG END
  // ==========================
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

    addCapturedPiece(move);

    // ✅ ADD MOVE HISTORY
    recordMove(move.from, move.to, move.piece, move.captured);

    renderBoard();
    checkGameStatus();

    if (gameMode === "bot") {
      setTimeout(botMove, 400);
    }
  });

  // ==========================
  // UNDO
  // ==========================
  document.getElementById("undoBtn")?.addEventListener("click", () => {

    const undone = game.undo();

    if (gameMode === "bot") {
      game.undo();
      moveList.pop();
    }

    if (undone) {
      moveList.pop();
      updateHistory();
    }

    renderBoard();
  });

  // ==========================
  // RESET
  // ==========================
  document.getElementById("resetBtn")?.addEventListener("click", () => {
    game.reset();
    moveList = [];
    updateHistory();
    renderBoard();
  });

});

// ==========================
// BOT MOVE
// ==========================
function botMove() {

  if (game.game_over()) return;
  if (game.turn() !== "b") return;

  const moves = game.moves();
  if (moves.length === 0) return;

  const move = game.moves({ verbose: true })[
    Math.floor(Math.random() * game.moves().length)
  ];

  const result = game.move(move);

  if (result) {

    addCapturedPiece(result);

    // ✅ ADD MOVE HISTORY
    recordMove(result.from, result.to, result.piece, result.captured);
  }

  renderBoard();
  checkGameStatus();
}

// ==========================
// STATUS
// ==========================
function checkGameStatus() {
  if (game.in_checkmate()) alert("Checkmate!");
  else if (game.in_check()) console.log("Check!");
  else if (game.in_draw()) alert("Draw!");
}

// ==========================
// CLEAR HIGHLIGHTS
// ==========================
function clearHighlights() {
  document.querySelectorAll(".highlight, .selected")
    .forEach(el => el.classList.remove("highlight", "selected"));
}

// ==========================
// RENDER BOARD
// ==========================
function renderBoard() {

  const boardState = game.board();
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  document.querySelectorAll(".chess-board img").forEach(img => img.remove());

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = boardState[r][c];
      if (!piece) continue;

      const squareId = files[c] + (8 - r);
      const square = document.getElementById(squareId);
      if (!square) continue;

      const img = document.createElement("img");

      img.src =
        piece.color === "w"
          ? `lit_top_pices/Chess_${piece.type}lt45.svg`
          : `dark_top_pices/Chess_${piece.type}dt45.svg`;

      img.setAttribute("draggable", "true");
      img.setAttribute("data-piece", `${piece.color}_${piece.type}`);

      square.appendChild(img);
    }
  }

  board.style.transform = isFlipped ? "rotate(180deg)" : "rotate(0deg)";

  document.querySelectorAll(".chess-board img").forEach(img => {
    img.style.transform = isFlipped ? "rotate(180deg)" : "rotate(0deg)";
  });
}

// ==========================
// RATING FEATURE (UNCHANGED)
// ==========================
const stars = document.querySelectorAll(".stars span");
const ratingText = document.getElementById("rating-text");
const submitBtn = document.getElementById("submitBtn");

let rating = 0;

stars.forEach((star, index) => {

  star.addEventListener("mouseover", () => {
    highlightStars(index);
  });

  star.addEventListener("mouseout", () => {
    highlightStars(rating - 1);
  });

  star.addEventListener("click", () => {
    rating = index + 1;
    updateText(rating);
  });
});

function highlightStars(index) {
  stars.forEach((star, i) => {
    if (i <= index) star.classList.add("active");
    else star.classList.remove("active");
  });
}

function updateText(value) {
  const messages = [
    "Very Bad ",
    "Bad",
    "Okay",
    "Good ",
    "Excellent"
  ];
  ratingText.textContent = messages[value - 1];
}

submitBtn?.addEventListener("click", () => {
  if (rating === 0) {
    alert("Please select a rating!");
  } else {
    alert("You rated " + rating + " star(s). Thank you!");
  }
});

// ==========================
// MOVE HISTORY SYSTEM
// ==========================
function recordMove(from, to, piece, captured = null) {
  let moveText = `${piece} ${from} → ${to}`;

  if (captured) {
    moveText += ` x ${captured}`;
  }

  moveList.push(moveText);
  updateHistory();
}

function updateHistory() {
  const historyDiv = document.getElementById("history");
  if (!historyDiv) return;

  historyDiv.innerHTML = "";

  for (let i = 0; i < moveList.length; i += 2) {

    let row = document.createElement("div");

    let whiteMove = moveList[i] || "";
    let blackMove = moveList[i + 1] || "";

    row.innerHTML = `
      <strong>${(i / 2) + 1}.</strong>
      ${whiteMove} &nbsp;&nbsp; ${blackMove}
    `;

    historyDiv.appendChild(row);
  }
}