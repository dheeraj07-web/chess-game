const game = new Chess();
const squares = document.querySelectorAll('.chess-board > div');
let draggedPiece = null;

// Drag start
document.querySelectorAll('.chess-board img').forEach(piece => {
  piece.addEventListener('dragstart', e => {
    draggedPiece = e.target;
    draggedPiece.style.opacity = 0.5;
  });

  piece.addEventListener('dragend', e => {
    draggedPiece.style.opacity = 1;
    draggedPiece = null;
  });
});

// Drag over + drop
squares.forEach(square => {
  square.addEventListener('dragover', e => e.preventDefault());
  square.addEventListener('drop', e => {
    e.preventDefault();
    if (!draggedPiece) return;

    const existingPiece = square.querySelector('img');
    if (existingPiece) existingPiece.remove(); // capture

    square.appendChild(draggedPiece);
  });
});