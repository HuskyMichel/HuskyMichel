
"use strict";

// ========================================
// NUMBER DROP — HUSKYMICHEL
// ========================================

const COLS = 5;
const ROWS = 8;
const TOTAL_CELLS = COLS * ROWS;

const BEST_KEY = "hm_numberdrop_best_v1";
const THEME_KEY = "hm_numberdrop_theme_v1";

const boardEl = document.getElementById("board");
const linksEl = document.getElementById("links");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const goalEl = document.getElementById("goal");
const nextEl = document.getElementById("next");

const restartBtn = document.getElementById("restartBtn");
const dropBtn = document.getElementById("dropBtn");

if (!boardEl) {
  throw new Error("La grille #board est introuvable dans number-drop.html");
}

const COLORS = {
  2: "#57b8ff",
  4: "#6385ff",
  8: "#9568ff",
  16: "#c566ff",
  32: "#ff65bd",
  64: "#ff7565",
  128: "#ffad55",
  256: "#f2d65c",
  512: "#65dba0",
  1024: "#42d9d0",
  2048: "#f5f5ff"
};

let grid = [];
let cells = [];

let score = 0;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;
let goal = 16;
let nextValue = 2;

let selected = [];
let isSelecting = false;
let gameOver = false;

// ========================================
// OUTILS
// ========================================

function randomValue() {
  return Math.random() < 0.75 ? 2 : 4;
}

function randomIndex() {
  return Math.floor(Math.random() * TOTAL_CELLS);
}

function rowOf(index) {
  return Math.floor(index / COLS);
}

function colOf(index) {
  return index % COLS;
}

function indexOf(row, col) {
  return row * COLS + col;
}

function areNeighbors(a, b) {
  const rowDifference = Math.abs(rowOf(a) - rowOf(b));
  const colDifference = Math.abs(colOf(a) - colOf(b));

  return rowDifference + colDifference === 1;
}

function formatNumber(value) {
  return value >= 1000000
    ? (value / 1000000).toFixed(1).replace(".0", "") + "M"
    : value >= 1000
      ? (value / 1000).toFixed(1).replace(".0", "") + "K"
      : String(value);
}

// ========================================
// CRÉATION DE LA GRILLE
// ========================================

function createBoard() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;

  cells = [];

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const cell = document.createElement("div");

    cell.className = "number-cell";
    cell.dataset.index = String(i);
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", "Case vide");

    boardEl.appendChild(cell);
    cells.push(cell);
  }

  boardEl.addEventListener("pointerdown", onPointerDown);
  boardEl.addEventListener("pointerover", onPointerOver);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", cancelSelection);

  // Empêche le défilement de la page pendant le glissement.
  boardEl.style.touchAction = "none";
}

// ========================================
// AFFICHAGE
// ========================================

function render() {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const cell = cells[i];
    const value = grid[i];

    cell.textContent = value ? formatNumber(value) : "";
    cell.style.background = value
      ? (COLORS[value] || "#e8a5ff")
      : "rgba(255,255,255,0.07)";

    cell.style.color = value ? "#ffffff" : "transparent";
    cell.style.opacity = value ? "1" : "0.35";

    cell.classList.toggle("selected", selected.includes(i));
    cell.classList.toggle("empty", !value);

    cell.setAttribute(
      "aria-label",
      value ? `Nombre ${value}` : "Case vide"
    );
  }

  if (scoreEl) scoreEl.textContent = formatNumber(score);
  if (bestEl) bestEl.textContent = formatNumber(best);
  if (goalEl) goalEl.textContent = formatNumber(goal);
  if (nextEl) nextEl.textContent = formatNumber(nextValue);

  drawLinks();
}

// ========================================
// TRAITS ENTRE LES NOMBRES
// ========================================

function drawLinks() {
  if (!linksEl) return;

  linksEl.innerHTML = "";

  const boardRect = boardEl.getBoundingClientRect();

  linksEl.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
  linksEl.setAttribute("preserveAspectRatio", "none");

  for (let i = 1; i < selected.length; i++) {
    const first = cells[selected[i - 1]].getBoundingClientRect();
    const second = cells[selected[i]].getBoundingClientRect();

    const x1 = first.left - boardRect.left + first.width / 2;
    const y1 = first.top - boardRect.top + first.height / 2;
    const x2 = second.left - boardRect.left + second.width / 2;
    const y2 = second.top - boardRect.top + second.height / 2;

    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#ffffff");
    line.setAttribute("stroke-width", "5");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("opacity", "0.9");

    linksEl.appendChild(line);
  }
}

// ========================================
// SÉLECTION À LA SOURIS OU AU DOIGT
// ========================================

function getCellFromEvent(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const cell = element && element.closest(".number-cell");

  if (!cell || !boardEl.contains(cell)) return null;

  const index = Number(cell.dataset.index);

  if (!Number.isInteger(index)) return null;

  return index;
}

function onPointerDown(event) {
  if (gameOver) return;

  const index = getCellFromEvent(event);

  if (index === null || !grid[index]) return;

  event.preventDefault();

  isSelecting = true;
  selected = [index];

  render();
}

function onPointerOver(event) {
  if (!isSelecting || gameOver) return;

  const index = getCellFromEvent(event);

  if (index === null) return;
  if (selected.includes(index)) return;

  const lastIndex = selected[selected.length - 1];

  if (!areNeighbors(lastIndex, index)) return;

  // Les nombres reliés doivent être identiques.
  if (grid[index] !== grid[selected[0]]) return;

  selected.push(index);
  render();
}

function onPointerUp() {
  if (!isSelecting) return;

  isSelecting = false;

  if (selected.length >= 2) {
    mergeSelected();
  } else {
    selected = [];
    render();
  }
}

function cancelSelection() {
  isSelecting = false;
  selected = [];
  render();
}

// ========================================
// FUSION ET BONUS
// ========================================

function mergeSelected() {
  const indices = [...selected];
  const count = indices.length;
  const baseValue = grid[indices[0]];

  if (count < 2) {
    selected = [];
    render();
    return;
  }

  // Fusion normale : valeur doublée.
  // Bonus : si le nombre de cases est impair,
  // la valeur est doublée une seconde fois.
  const mergedValue = baseValue * 2 * (count % 2 === 1 ? 2 : 1);

  // La case de destination est la case centrale
  // de la sélection.
  const destination = indices[Math.floor(count / 2)];

  for (const index of indices) {
    grid[index] = 0;
  }

  grid[destination] = mergedValue;

  score += mergedValue * count;

  if (mergedValue > best) {
    best = mergedValue;
  }

  // Le record est le meilleur score atteint.
  best = Math.max(best, score);
  localStorage.setItem(BEST_KEY, String(best));

  // L'objectif augmente lorsqu'il est atteint.
  while (mergedValue >= goal) {
    goal *= 2;
  }

  selected = [];

  applyGravity();
  refillBoard();
  render();

  checkGameOver();
}

// ========================================
// GRAVITÉ
// Les blocs descendent dans chaque colonne.
// ========================================

function applyGravity() {
  for (let col = 0; col < COLS; col++) {
    const values = [];

    // Lire les blocs du bas vers le haut.
    for (let row = ROWS - 1; row >= 0; row--) {
      const value = grid[indexOf(row, col)];

      if (value) values.push(value);
    }

    // Replacer les blocs en bas de la colonne.
    for (let row = ROWS - 1; row >= 0; row--) {
      const position = indexOf(row, col);
      const valueIndex = ROWS - 1 - row;

      grid[position] = values[valueIndex] || 0;
    }
  }
}

// ========================================
// REMPLISSAGE AUTOMATIQUE
// Les cases vides du haut sont remplies.
// Aucun bouton n'est nécessaire.
// ========================================

function refillBoard() {
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const index = indexOf(row, col);

      if (!grid[index]) {
        grid[index] = randomValue();
      }
    }
  }
}

// ========================================
// FIN DE PARTIE
// ========================================

function hasPossibleMerge() {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (!grid[i]) continue;

    const row = rowOf(i);
    const col = colOf(i);

    if (col + 1 < COLS && grid[indexOf(row, col + 1)] === grid[i]) {
      return true;
    }

    if (row + 1 < ROWS && grid[indexOf(row + 1, col)] === grid[i]) {
      return true;
    }
  }

  return false;
}

function checkGameOver() {
  if (hasPossibleMerge()) return;

  gameOver = true;

  const message = document.getElementById("gameOver");

  if (message) {
    message.hidden = false;
  } else {
    alert("Plus aucune fusion possible ! Clique sur Recommencer pour rejouer.");
  }
}

// ========================================
// NOUVELLE PARTIE
// ========================================

function newGame() {
  score = 0;
  goal = 16;
  selected = [];
  isSelecting = false;
  gameOver = false;

  const message = document.getElementById("gameOver");

  if (message) message.hidden = true;

  // Remplir les 40 cases dès le départ.
  grid = Array.from(
    { length: TOTAL_CELLS },
    () => randomValue()
  );

  nextValue = randomValue();

  render();
}

// ========================================
// ÉVÉNEMENTS
// ========================================

if (restartBtn) {
  restartBtn.addEventListener("click", newGame);
}

// L'ancien bouton de chute n'est plus utilisé.
if (dropBtn) {
  dropBtn.hidden = true;
  dropBtn.style.display = "none";
}

window.addEventListener("resize", drawLinks);

// ========================================
// DÉMARRAGE
// ========================================

createBoard();
newGame();
