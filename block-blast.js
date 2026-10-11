
"use strict";

// ========================================
// BLOCK BLAST — HUSKYMICHEL
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
  throw new Error(
    "Un élément du jeu manque dans block-blast.html."
  );
}

// ========================================
// FORMES DES BLOCS
// ========================================

const SHAPES = [
  [[0, 0]],

  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],

  [[0, 0], [0, 1], [1, 0], [1, 1]],

  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],

  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],

  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],

  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [2, 0]],

  [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2]
  ],

  [
    [0, 0], [0, 1],
    [1, 0], [1, 1],
    [2, 0], [2, 1]
  ]
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

// ========================================
// SAUVEGARDE
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
    // Le jeu reste jouable si le stockage est indisponible.
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // La personnalisation reste utilisable pendant la partie.
  }
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const validThemes = ["blue", "purple", "green", "orange"];

    if (saved && validThemes.includes(saved)) {
      themeSelect.value = saved;
    }
  } catch {
    // Thème bleu par défaut.
  }

  document.body.dataset.theme = themeSelect.value;
}

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

  modalElement.classList.add("hidden");

  updateScore();
  statusElement.textContent = "À toi de jouer !";

  createNewPieces();
  renderBoard();
  renderPieces();
}

function createNewPieces() {
  pieces = Array.from({ length: 3 }, () => {
    // Une petite chance d'obtenir une bombe.
    if (Math.random() < 0.09) {
      return {
        cells: [[0, 0]],
        color: "#ff5364",
        bomb: true,
        used: false
      };
    }

    const shape =
      SHAPES[Math.floor(Math.random() * SHAPES.length)];

    return {
      cells: shape.map(([r, c]) => [r, c]),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      bomb: false,
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
      cell.style.cursor = gameOver ? "default" : "pointer";

      const value = board[r][c];

      if (value) {
        cell.classList.add("filled");
        cell.style.background = value.color;
        cell.style.boxShadow =
          "inset 0 -3px 0 rgba(0,0,0,0.16)";

        if (value.bomb) {
          cell.classList.add("bomb");
          cell.textContent = "💣";
          cell.style.display = "grid";
          cell.style.placeItems = "center";
          cell.style.fontSize = "clamp(12px, 3vw, 22px)";
        }
      }

      cell.addEventListener("click", () => {
        placeSelected(r, c);
      });

      cell.addEventListener("mouseenter", () => {
        showPreview(r, c);
      });

      cell.addEventListener("focus", () => {
        showPreview(r, c);
      });

      boardElement.appendChild(cell);
    }
  }
}

// ========================================
// AFFICHAGE DES BLOCS DISPONIBLES
// ========================================

function renderPieces() {
  piecesElement.replaceChildren();

  piecesElement.style.display = "grid";
  piecesElement.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  piecesElement.style.gap = "10px";

  pieces.forEach((piece, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "piece-option";
    button.setAttribute(
      "aria-label",
      piece.bomb
        ? `Bloc ${index + 1} : bombe`
        : `Sélectionner le bloc ${index + 1}`
    );

    button.style.minWidth = "0";
    button.style.minHeight = "90px";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.style.padding = "8px";
    button.style.borderRadius = "12px";
    button.style.border =
      selectedPiece === index
        ? "2px solid #ffffff"
        : "2px solid rgba(255,255,255,0.10)";
    button.style.background =
      selectedPiece === index
        ? "rgba(70,166,255,0.22)"
        : "rgba(255,255,255,0.04)";
    button.style.cursor = "pointer";
    button.style.opacity = piece.used ? "0.22" : "1";

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

    for (let r = 0; r < maxRow; r++) {
      for (let c = 0; c < maxCol; c++) {
        const block = document.createElement("span");
        const containsBlock = piece.cells.some(
          ([pr, pc]) => pr === r && pc === c
        );

        block.className = "piece-cell";

        block.style.width = "19px";
        block.style.height = "19px";
        block.style.borderRadius = "4px";

        if (containsBlock) {
          block.style.background = piece.bomb
            ? "#ff5364"
            : piece.color;
          block.style.boxShadow =
            "inset 0 -2px 0 rgba(0,0,0,0.16)";

          if (piece.bomb) {
            block.textContent = "💣";
            block.style.display = "grid";
            block.style.placeItems = "center";
            block.style.fontSize = "14px";
          }
        } else {
          block.style.background = "transparent";
        }

        shape.appendChild(block);
      }
    }

    button.appendChild(shape);

    if (piece.bomb) {
      const label = document.createElement("span");
      label.textContent = "BOMBE";
      label.style.fontSize = "10px";
      label.style.fontWeight = "bold";
      label.style.marginTop = "4px";
      button.appendChild(label);
    }

    button.addEventListener("click", () => {
      if (busy || gameOver || piece.used) return;

      selectedPiece = index;
      statusElement.textContent = piece.bomb
        ? "Choisis où placer la bombe !"
        : "Choisis une case du plateau !";

      renderPieces();
      renderBoard();
    });

    piecesElement.appendChild(button);
  });
}

// ========================================
// PRÉVISUALISATION DU PLACEMENT
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

  piece.cells.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;

    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
      return;
    }

    const cell = getCell(r, c);

    if (!cell || board[r][c]) return;

    cell.classList.add(
      valid ? "preview-valid" : "preview-invalid"
    );

    cell.style.background = valid
      ? (piece.bomb ? "#ff5364" : piece.color)
      : "rgba(255, 83, 100, 0.45)";
  });
}

function clearPreview() {
  boardElement.querySelectorAll(".preview-valid, .preview-invalid")
    .forEach((cell) => {
      cell.classList.remove("preview-valid", "preview-invalid");

      const r = Number(cell.dataset.row);
      const c = Number(cell.dataset.col);

      if (!board[r][c]) {
        cell.style.background = "";
      }
    });
}

function getCell(row, col) {
  return boardElement.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
}

// ========================================
// VÉRIFICATION DU PLACEMENT
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
// PLACER UN BLOC
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
    statusElement.textContent = "Impossible ici : choisis une autre case.";
    return;
  }

  busy = true;
  clearPreview();

  piece.cells.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;

    board[r][c] = {
      color: piece.color,
      bomb: piece.bomb
    };
  });

  piece.used = true;
  selectedPiece = -1;

  // Points gagnés pour les blocs posés.
  addScore(piece.cells.length);

  // La bombe détruit les blocs dans une zone de 3 x 3.
  if (piece.bomb) {
    const removed = [];

    for (let r = Math.max(0, row - 1); r <= Math.min(SIZE - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(SIZE - 1, col + 1); c++) {
        if (board[r][c]) {
          removed.push([r, c]);
        }
      }
    }

    removed.forEach(([r, c]) => {
      board[r][c] = null;
    });

    addScore(removed.length * 2);
    statusElement.textContent = "💥 BOUM ! La bombe a nettoyé la zone !";
  } else {
    statusElement.textContent = "Bien joué !";
  }

  renderBoard();
  renderPieces();

  // Repérer les lignes et colonnes complètes.
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

  // Éviter de compter deux fois une case située
  // à l'intersection d'une ligne et d'une colonne.
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

  if (clearedCells.size > 0) {
    clearedCells.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const cell = getCell(r, c);

      if (cell) cell.classList.add("clearing");
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    clearedCells.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      board[r][c] = null;
    });

    addScore(clearedCells.size * 2);

    const lineCount = completedRows.length + completedCols.length;
    statusElement.textContent =
      `✨ ${lineCount} ligne${lineCount > 1 ? "s" : ""} nettoyée${lineCount > 1 ? "s" : ""} !`;

    renderBoard();
  }

  // Quand les trois blocs sont utilisés, en donner trois autres.
  if (pieces.every((p) => p.used)) {
    createNewPieces();
    statusElement.textContent += " Nouveaux blocs disponibles !";
  }

  renderPieces();
  renderBoard();

  busy = false;

  // Vérifier si au moins un bloc peut encore être placé.
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

  statusElement.textContent = "Partie terminée !";

  modalMessage.textContent =
    `Ton score : ${score} points. Meilleur score : ${bestScore} points.`;

  modalElement.classList.remove("hidden");
  renderPieces();
  renderBoard();
}

// ========================================
// THÈMES ET BOUTONS
// ========================================

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
  saveTheme(themeSelect.value);
});

newGameButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// ========================================
// DÉMARRAGE
// ========================================

loadTheme();
updateScore();
startGame();
