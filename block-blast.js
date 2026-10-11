
"use strict";

// ========================================
// BLOCK BLAST — HUSKYMICHEL
// Version complète : aperçu, glisser-déposer,
// animation de disparition et plein écran
// ========================================

const SIZE = 8;
const BEST_KEY = "hm_blockblast_best_v1";
const THEME_KEY = "hm_blockblast_theme_v1";

const boardElement = document.getElementById("board");
const piecesElement = document.getElementById("pieces");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const statusElement = document.getElementById("status");
const themeSelect = document.getElementById("theme");
const modalElement = document.getElementById("game-modal");
const modalMessage = document.getElementById("modal-message");
const newGameButton = document.getElementById("new-game");
const restartButton = document.getElementById("restart-button");

if (
  !boardElement ||
  !piecesElement ||
  !scoreElement ||
  !bestScoreElement ||
  !statusElement ||
  !themeSelect ||
  !modalElement ||
  !modalMessage ||
  !newGameButton ||
  !restartButton
) {
  throw new Error("Un élément du jeu manque dans block-blast.html.");
}

// ========================================
// STYLES AJOUTÉS PAR JAVASCRIPT
// ========================================

const extraStyles = document.createElement("style");

extraStyles.textContent = `
  .board-cell,
  .piece-option {
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .board-cell {
    perspective: 500px;
  }

  .board-cell.flip-clear {
    animation: hmBlockFlipClear 450ms ease-in forwards;
    transform-origin: center;
    pointer-events: none;
  }

  @keyframes hmBlockFlipClear {
    0% {
      transform: rotateX(0deg) scale(1);
      opacity: 1;
    }
    45% {
      transform: rotateX(90deg) scale(.9);
      opacity: 1;
    }
    75% {
      transform: rotateX(90deg) scale(.65);
      opacity: .6;
    }
    100% {
      transform: rotateX(0deg) scale(.15);
      opacity: 0;
    }
  }

  .hm-fullscreen-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 8px 0 14px;
    padding: 10px 16px;
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 10px;
    background: #263858;
    color: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
  }

  .hm-fullscreen-button:hover {
    background: #354c72;
  }

  .hm-fullscreen-button:focus-visible {
    outline: 2px solid #46a6ff;
    outline-offset: 3px;
  }

  .game-container:fullscreen,
  #game-container:fullscreen,
  main:fullscreen {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    max-width: none;
    overflow-y: auto;
    padding: 20px;
    background: #17213b;
    color: white;
  }

  :root:fullscreen {
    overflow: auto;
    background: #17213b;
  }

  :root:fullscreen body {
    min-height: 100%;
    background: #17213b;
  }

  :fullscreen .board {
    max-width: min(75vw, 65vh);
    margin-left: auto;
    margin-right: auto;
  }

  :fullscreen #pieces {
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 600px) {
    .hm-fullscreen-button {
      padding: 9px 12px;
    }

    :fullscreen .board {
      max-width: min(94vw, 58vh);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .board-cell.flip-clear {
      animation-duration: 150ms;
    }
  }
`;

document.head.appendChild(extraStyles);

// ========================================
// BOUTON PLEIN ÉCRAN
// ========================================

const fullscreenButton = document.createElement("button");

fullscreenButton.type = "button";
fullscreenButton.className = "hm-fullscreen-button";
fullscreenButton.textContent = "⛶ Plein écran";
fullscreenButton.setAttribute("aria-label", "Activer le plein écran");

const gameContainer =
  document.querySelector(".game-container") ||
  document.querySelector("#game-container") ||
  boardElement.closest("main") ||
  document.documentElement;

const actionsContainer = document.querySelector(".game-actions");

if (actionsContainer) {
  actionsContainer.prepend(fullscreenButton);
} else {
  boardElement.parentElement.insertBefore(fullscreenButton, boardElement);
}

fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await gameContainer.requestFullscreen();
    }
  } catch (error) {
    statusElement.textContent =
      "Le plein écran n'est pas disponible sur ce navigateur.";
  }
});

document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);

  fullscreenButton.textContent = active
    ? "⛶ Quitter le plein écran"
    : "⛶ Plein écran";

  fullscreenButton.setAttribute(
    "aria-label",
    active ? "Quitter le plein écran" : "Activer le plein écran"
  );
});

// ========================================
// FORMES DES BLOCS
// ========================================

const SHAPES = [
  // Bloc simple
  [[0, 0]],

  // Blocs de 2
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],

  // Blocs de 3
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1]],

  // Carré 2 × 2
  [
    [0, 0], [0, 1],
    [1, 0], [1, 1]
  ],

  // Carré 3 × 3
  [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2]
  ],

  // Blocs en T
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2]],
  [[0, 1], [1, 1], [2, 1], [1, 0]],

  // Blocs en L
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 0], [1, 1], [1, 2]],

  // Blocs en zigzag
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [2, 0]],

  // Grandes barres
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]
];

const COLORS = [
  "#46a6ff",
  "#b16cff",
  "#ffb347",
  "#42d6a4",
  "#ff6685",
  "#ffe066",
  "#58d7e8"
];

// ========================================
// ÉTAT DU JEU
// ========================================

let board = [];
let pieces = [];
let selectedPiece = -1;
let score = 0;
let bestScore = readBestScore();
let busy = false;
let gameOver = false;
let dragging = false;

// ========================================
// SAUVEGARDE DU RECORD
// ========================================

function readBestScore() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem(BEST_KEY, String(bestScore));
  } catch {
    // Le jeu reste jouable sans sauvegarde.
  }
}

// ========================================
// THÈMES
// ========================================

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const validThemes = ["blue", "purple", "green", "orange"];

    if (saved && validThemes.includes(saved)) {
      themeSelect.value = saved;
    }
  } catch {
    // Le thème par défaut reste disponible.
  }

  document.body.dataset.theme = themeSelect.value;
}

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;

  try {
    localStorage.setItem(THEME_KEY, themeSelect.value);
  } catch {
    // Le thème reste actif pendant la partie.
  }
});

// ========================================
// NOUVELLE PARTIE
// ========================================

function startGame() {
  board = Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(null)
  );

  pieces = [];
  selectedPiece = -1;
  score = 0;
  busy = false;
  gameOver = false;
  dragging = false;

  modalElement.classList.add("hidden");

  updateScore();
  statusElement.textContent = "À toi de jouer !";

  createNewPieces();
  renderBoard();
  renderPieces();
}

function createNewPieces() {
  pieces = Array.from({ length: 3 }, () => {
    const shape = SHAPES[
      Math.floor(Math.random() * SHAPES.length)
    ];

    return {
      cells: shape.map(([r, c]) => [r, c]),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      used: false
    };
  });

  selectedPiece = -1;
}

// ========================================
// AFFICHAGE DU PLATEAU
// ========================================

function renderBoard() {
  boardElement.replaceChildren();

  boardElement.style.display = "grid";
  boardElement.style.gridTemplateColumns =
    `repeat(${SIZE}, minmax(0, 1fr))`;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("button");

      cell.type = "button";
      cell.className = "cell board-cell";
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);

      cell.setAttribute(
        "aria-label",
        `Ligne ${r + 1}, colonne ${c + 1}`
      );

      cell.style.minWidth = "0";
      cell.style.aspectRatio = "1";
      cell.style.padding = "0";
      cell.style.border = "0";
      cell.style.touchAction = "none";
      cell.style.cursor = gameOver ? "default" : "pointer";

      const value = board[r][c];

      if (value) {
        cell.classList.add("filled");
        cell.style.backgroundColor = value.color;
        cell.style.boxShadow =
          "inset 0 -3px 0 rgba(0,0,0,0.16)";
      }

      cell.addEventListener("click", () => {
        if (!dragging) {
          placeSelected(r, c);
        }
      });

      cell.addEventListener("pointerenter", () => {
        if (selectedPiece !== -1 && !busy) {
          showPreview(r, c);
        }
      });

      cell.addEventListener("focus", () => {
        if (selectedPiece !== -1 && !busy) {
          showPreview(r, c);
        }
      });

      boardElement.appendChild(cell);
    }
  }
}

// ========================================
// AFFICHAGE DES TROIS BLOCS
// ========================================

function renderPieces() {
  piecesElement.replaceChildren();

  piecesElement.style.display = "grid";
  piecesElement.style.gridTemplateColumns =
    "repeat(3, minmax(0, 1fr))";
  piecesElement.style.gap = "10px";

  pieces.forEach((piece, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "piece-option";

    button.setAttribute(
      "aria-label",
      `Sélectionner le bloc ${index + 1}`
    );

    button.style.minWidth = "0";
    button.style.minHeight = "100px";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.style.padding = "8px";
    button.style.borderRadius = "12px";
    button.style.touchAction = "none";

    button.style.border =
      selectedPiece === index
        ? "2px solid #ffffff"
        : "2px solid rgba(255,255,255,0.10)";

    button.style.background =
      selectedPiece === index
        ? "rgba(70,166,255,0.22)"
        : "rgba(255,255,255,0.04)";

    button.style.cursor = piece.used ? "default" : "grab";
    button.style.opacity = piece.used ? "0.2" : "1";

    if (piece.used) {
      button.disabled = true;
    }

    const maxRow = Math.max(...piece.cells.map(([r]) => r)) + 1;
    const maxCol = Math.max(...piece.cells.map(([, c]) => c)) + 1;

    const shape = document.createElement("div");

    shape.className = "piece-grid";
    shape.style.display = "grid";
    shape.style.gridTemplateColumns =
      `repeat(${maxCol}, 19px)`;
    shape.style.gridTemplateRows =
      `repeat(${maxRow}, 19px)`;
    shape.style.gap = "3px";
    shape.style.justifyContent = "center";
    shape.style.alignContent = "center";
    shape.style.pointerEvents = "none";

    for (let r = 0; r < maxRow; r++) {
      for (let c = 0; c < maxCol; c++) {
        const block = document.createElement("span");

        const containsBlock = piece.cells.some(
          ([pr, pc]) => pr === r && pc === c
        );

        block.style.width = "19px";
        block.style.height = "19px";
        block.style.borderRadius = "4px";

        if (containsBlock) {
          block.style.backgroundColor = piece.color;
          block.style.boxShadow =
            "inset 0 -2px 0 rgba(0,0,0,0.16)";
        } else {
          block.style.backgroundColor = "transparent";
        }

        shape.appendChild(block);
      }
    }

    button.appendChild(shape);

    // Cliquer pour sélectionner un bloc.
    button.addEventListener("click", () => {
      if (busy || gameOver || piece.used || dragging) return;

      selectedPiece = index;
      statusElement.textContent =
        "Place ton bloc sur le plateau !";

      renderPieces();
      renderBoard();
    });

    // Prendre un bloc sans provoquer le défilement de la page.
    button.addEventListener("pointerdown", (event) => {
      if (busy || gameOver || piece.used) return;

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      event.preventDefault();

      selectedPiece = index;
      dragging = true;

      button.style.cursor = "grabbing";
      button.style.transform = "scale(1.04)";

      statusElement.textContent =
        "Déplace le bloc sur le plateau !";

      // Ne pas recréer les boutons ici :
      // cela évite d'interrompre le glisser-déposer.
      piecesElement.querySelectorAll(".piece-option")
        .forEach((item, itemIndex) => {
          item.style.border =
            itemIndex === index
              ? "2px solid #ffffff"
              : "2px solid rgba(255,255,255,0.10)";

          item.style.background =
            itemIndex === index
              ? "rgba(70,166,255,0.22)"
              : "rgba(255,255,255,0.04)";
        });

      renderBoard();
    });

    piecesElement.appendChild(button);
  });
}

// ========================================
// GLISSER-DÉPOSER
// ========================================

document.addEventListener("pointermove", (event) => {
  if (!dragging || selectedPiece < 0 || busy) return;

  const element = document.elementFromPoint(
    event.clientX,
    event.clientY
  );

  const target = element instanceof Element
    ? element.closest(".board-cell")
    : null;

  if (!target || !boardElement.contains(target)) {
    clearPreview();

    statusElement.textContent =
      "Dépose ton bloc sur le plateau !";

    return;
  }

  showPreview(
    Number(target.dataset.row),
    Number(target.dataset.col)
  );
});

document.addEventListener("pointerup", (event) => {
  if (!dragging) return;

  const element = document.elementFromPoint(
    event.clientX,
    event.clientY
  );

  const target = element instanceof Element
    ? element.closest(".board-cell")
    : null;

  dragging = false;

  if (target && boardElement.contains(target)) {
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);

    placeSelected(row, col);
  } else {
    clearPreview();

    if (!gameOver) {
      statusElement.textContent =
        "Bloc sélectionné : dépose-le sur le plateau !";

      renderPieces();
      renderBoard();
    }
  }
});

document.addEventListener("pointercancel", () => {
  if (!dragging) return;

  dragging = false;
  clearPreview();

  renderPieces();
  renderBoard();
});

// ========================================
// APERÇU DES PLACEMENTS ET DES LIGNES
// ========================================

function showPreview(row, col) {
  if (
    busy ||
    gameOver ||
    selectedPiece < 0 ||
    !pieces[selectedPiece] ||
    pieces[selectedPiece].used
  ) {
    return;
  }

  clearPreview();

  const piece = pieces[selectedPiece];
  const valid = canPlace(piece, row, col);

  // Position impossible : cases rouges.
  if (!valid) {
    piece.cells.forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;

      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
        return;
      }

      const cell = getCell(r, c);

      if (cell) {
        cell.style.backgroundColor = "#ff5364";
        cell.style.opacity = "0.65";
      }
    });

    statusElement.textContent =
      "Impossible ici : choisis une autre position.";

    return;
  }

  // Simuler le placement.
  const simulated = board.map((line) => line.slice());

  piece.cells.forEach(([dr, dc]) => {
    simulated[row + dr][col + dc] = {
      color: piece.color
    };
  });

  const completedRows = [];
  const completedCols = [];

  for (let r = 0; r < SIZE; r++) {
    if (simulated[r].every((cell) => cell !== null)) {
      completedRows.push(r);
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let full = true;

    for (let r = 0; r < SIZE; r++) {
      if (!simulated[r][c]) {
        full = false;
        break;
      }
    }

    if (full) completedCols.push(c);
  }

  // Afficher les blocs à poser.
  piece.cells.forEach(([dr, dc]) => {
    const cell = getCell(row + dr, col + dc);

    if (cell) {
      cell.style.backgroundColor = piece.color;
      cell.style.transform = "scale(0.94)";
      cell.style.opacity = "1";
    }
  });

  // Identifier les cases des lignes complètes.
  const highlighted = new Set();

  completedRows.forEach((r) => {
    for (let c = 0; c < SIZE; c++) {
      highlighted.add(`${r},${c}`);
    }
  });

  completedCols.forEach((c) => {
    for (let r = 0; r < SIZE; r++) {
      highlighted.add(`${r},${c}`);
    }
  });

  // Montrer les lignes dans la couleur du bloc sélectionné.
  highlighted.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    const cell = getCell(r, c);

    if (!cell) return;

    cell.style.backgroundColor = piece.color;
    cell.style.opacity = "1";
    cell.style.transform = "scale(0.94)";
    cell.style.boxShadow =
      `inset 0 0 0 2px rgba(255,255,255,0.75), 0 0 8px ${piece.color}`;
  });

  if (highlighted.size > 0) {
    const count = completedRows.length + completedCols.length;

    statusElement.textContent =
      `✨ ${count} ligne${count > 1 ? "s" : ""} prête${count > 1 ? "s" : ""} à être effacée${count > 1 ? "s" : ""} !`;
  } else {
    statusElement.textContent = "Tu peux poser ton bloc ici !";
  }
}

function clearPreview() {
  boardElement.querySelectorAll(".board-cell").forEach((cell) => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    const value = board[r][c];

    cell.classList.remove("flip-clear");
    cell.style.backgroundColor = value ? value.color : "";
    cell.style.opacity = "1";
    cell.style.transform = "";
    cell.style.boxShadow = value
      ? "inset 0 -3px 0 rgba(0,0,0,0.16)"
      : "";
  });
}

function getCell(row, col) {
  return boardElement.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
}

// ========================================
// VÉRIFIER SI UN BLOC PEUT ÊTRE POSÉ
// ========================================

function canPlace(piece, row, col) {
  return piece.cells.every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;

    return (
      r >= 0 &&
      r < SIZE &&
      c >= 0 &&
      c < SIZE &&
      board[r][c] === null
    );
  });
}

// ========================================
// POSER UN BLOC
// ========================================

async function placeSelected(row, col) {
  if (
    busy ||
    gameOver ||
    selectedPiece < 0 ||
    !pieces[selectedPiece] ||
    pieces[selectedPiece].used
  ) {
    return;
  }

  const piece = pieces[selectedPiece];

  if (!canPlace(piece, row, col)) {
    statusElement.textContent =
      "Impossible ici : choisis une autre position.";
    return;
  }

  busy = true;
  clearPreview();

  // Placer les blocs.
  piece.cells.forEach(([dr, dc]) => {
    board[row + dr][col + dc] = {
      color: piece.color
    };
  });

  piece.used = true;
  selectedPiece = -1;

  addScore(piece.cells.length);

  // Détecter les lignes complètes.
  const completedRows = [];
  const completedCols = [];

  for (let r = 0; r < SIZE; r++) {
    if (board[r].every((cell) => cell !== null)) {
      completedRows.push(r);
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let full = true;

    for (let r = 0; r < SIZE; r++) {
      if (!board[r][c]) {
        full = false;
        break;
      }
    }

    if (full) completedCols.push(c);
  }

  // Regrouper les cases à effacer sans doublons.
  const clearedCells = new Set();

  completedRows.forEach((r) => {
    for (let c = 0; c < SIZE; c++) {
      clearedCells.add(`${r},${c}`);
    }
  });

  completedCols.forEach((c) => {
    for (let r = 0; r < SIZE; r++) {
      clearedCells.add(`${r},${c}`);
    }
  });

  renderBoard();
  renderPieces();

  if (clearedCells.size > 0) {
    // Colorer les cases qui vont disparaître.
    clearedCells.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const cell = getCell(r, c);

      if (cell) {
        cell.style.backgroundColor = piece.color;
        cell.style.boxShadow =
          `0 0 10px ${piece.color}, inset 0 0 0 2px rgba(255,255,255,0.7)`;
        cell.style.transform = "scale(0.94)";
      }
    });

    const lineCount = completedRows.length + completedCols.length;

    statusElement.textContent =
      `✨ ${lineCount} ligne${lineCount > 1 ? "s" : ""} complétée${lineCount > 1 ? "s" : ""} !`;

    // Laisser voir la couleur avant l'animation.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Animation de rotation et de disparition.
    clearedCells.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const cell = getCell(r, c);

      if (cell) {
        cell.classList.add("flip-clear");
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 450));

    // Effacer les cases du plateau après l'animation.
    clearedCells.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      board[r][c] = null;
    });

    addScore(clearedCells.size * 2);
    renderBoard();
  } else {
    statusElement.textContent = "Bien joué !";
  }

  // Donner trois nouveaux blocs quand les trois sont utilisés.
  if (pieces.every((p) => p.used)) {
    createNewPieces();
    renderPieces();
    statusElement.textContent += " Nouveaux blocs disponibles !";
  }

  renderBoard();
  busy = false;

  if (!hasPossibleMove()) {
    endGame();
  }
}

// ========================================
// SCORE ET RECORD
// ========================================

function addScore(points) {
  score += points;

  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }

  updateScore();
}

function updateScore() {
  scoreElement.textContent = String(score);
  bestScoreElement.textContent = String(bestScore);
}

// ========================================
// FIN DE PARTIE
// ========================================

function hasPossibleMove() {
  for (const piece of pieces) {
    if (!piece || piece.used) continue;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (canPlace(piece, r, c)) {
          return true;
        }
      }
    }
  }

  return false;
}

function endGame() {
  gameOver = true;
  selectedPiece = -1;
  dragging = false;

  statusElement.textContent = "Partie terminée !";

  modalMessage.textContent =
    `Ton score : ${score} points. Meilleur score : ${bestScore} points.`;

  modalElement.classList.remove("hidden");

  renderPieces();
  renderBoard();
}

// ========================================
// BOUTONS DU JEU
// ========================================

newGameButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// ========================================
// DÉMARRAGE
// ========================================

loadTheme();
updateScore();
startGame();
