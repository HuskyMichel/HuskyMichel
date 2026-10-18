
"use strict";

// ========================================
// NUMBER DROP — HUSKYMICHEL
// Grille 5 x 8, fusions, gravité et thèmes
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
const goalStatusEl = document.getElementById("goalStatus");
const progressEl = document.getElementById("progress");
const toastEl = document.getElementById("toast");

const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const themeSelect = document.getElementById("themeSelect");
const overlayEl = document.getElementById("overlay");
const endTextEl = document.getElementById("endText");

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
let lastMergedValue = 0;

// ========================================
// OUTILS
// ========================================

function randomValue() {
    return Math.random() < 0.75 ? 2 : 4;
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
    return Math.abs(rowOf(a) - rowOf(b)) +
           Math.abs(colOf(a) - colOf(b)) === 1;
}

function formatNumber(value) {
    if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(1).replace(".0", "") + "M";
    }

    if (value >= 1_000) {
        return (value / 1_000).toFixed(1).replace(".0", "") + "K";
    }

    return String(value);
}

function showToast(message) {
    if (toastEl) toastEl.textContent = message;
}

// ========================================
// CRÉATION DE LA GRILLE
// ========================================

function createBoard() {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
    boardEl.style.gridTemplateRows = `repeat(${ROWS}, minmax(0, 1fr))`;

    cells = [];

    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement("div");

        // IMPORTANT : cette classe correspond au CSS.
        cell.className = "cell";
        cell.dataset.index = String(i);
        cell.setAttribute("role", "gridcell");

        boardEl.appendChild(cell);
        cells.push(cell);
    }

    // On suit le pointeur sur le document pour éviter que
    // le déplacement soit interrompu pendant la sélection.
    boardEl.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", cancelSelection);

    boardEl.addEventListener("contextmenu", event => event.preventDefault());
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
            : "var(--cell)";

        cell.style.color = "#ffffff";
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

    if (progressEl) {
        const progress = Math.min(100, (lastMergedValue / goal) * 100);
        progressEl.style.width = `${progress}%`;
    }

    drawLinks();
}

// ========================================
// TRAITS DE LIAISON
// ========================================

function drawLinks() {
    if (!linksEl || !boardEl) return;

    linksEl.innerHTML = "";

    const boardRect = boardEl.getBoundingClientRect();

    if (!boardRect.width || !boardRect.height) return;

    linksEl.setAttribute(
        "viewBox",
        `0 0 ${boardRect.width} ${boardRect.height}`
    );
    linksEl.setAttribute("preserveAspectRatio", "none");

    for (let i = 1; i < selected.length; i++) {
        const first = cells[selected[i - 1]].getBoundingClientRect();
        const second = cells[selected[i]].getBoundingClientRect();

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.setAttribute("x1", first.left - boardRect.left + first.width / 2);
        line.setAttribute("y1", first.top - boardRect.top + first.height / 2);
        line.setAttribute("x2", second.left - boardRect.left + second.width / 2);
        line.setAttribute("y2", second.top - boardRect.top + second.height / 2);
        line.setAttribute("stroke", "#ffffff");
        line.setAttribute("stroke-width", "5");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("opacity", "0.95");

        linksEl.appendChild(line);
    }
}

// ========================================
// SÉLECTION À LA SOURIS OU AU DOIGT
// ========================================

function getCellFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    const cell = element && element.closest(".cell");

    if (!cell || !boardEl.contains(cell)) return null;

    const index = Number(cell.dataset.index);

    return Number.isInteger(index) ? index : null;
}

function onPointerDown(event) {
    if (gameOver || event.button === 2) return;

    const index = getCellFromPoint(event.clientX, event.clientY);

    if (index === null || !grid[index]) return;

    event.preventDefault();

    isSelecting = true;
    selected = [index];

    showToast("Continue à relier les nombres identiques.");
    render();
}

function onPointerMove(event) {
    if (!isSelecting || gameOver) return;

    const index = getCellFromPoint(event.clientX, event.clientY);

    if (index === null || selected.includes(index)) return;

    const lastIndex = selected[selected.length - 1];

    // On ne peut relier que des cases voisines.
    if (!areNeighbors(lastIndex, index)) return;

    // Tous les nombres sélectionnés doivent être identiques.
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
        showToast("Relie au moins deux nombres identiques.");
    }
}

function cancelSelection() {
    if (!isSelecting) return;

    isSelecting = false;
    selected = [];
    render();
}

// ========================================
// FUSION ET BONUS IMPAIR
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

    // Fusion normale : valeur x 2.
    // Bonus impair : valeur x 4 au total.
    const hasBonus = count % 2 === 1;
    const mergedValue = baseValue * (hasBonus ? 8 : 2);

    // Choisir une case centrale pour recevoir le résultat.
    const destination = indices[Math.floor(count / 2)];

    for (const index of indices) {
        grid[index] = 0;
    }

    grid[destination] = mergedValue;

    score += mergedValue * count;
    best = Math.max(best, score);
    localStorage.setItem(BEST_KEY, String(best));

    lastMergedValue = mergedValue;

    if (hasBonus) {
        showToast(`✨ Bonus ! ${count} blocs fusionnent en ${formatNumber(mergedValue)} !`);
    } else {
        showToast(`${count} blocs fusionnent en ${formatNumber(mergedValue)}.`);
    }

    // L'objectif double quand le nombre obtenu atteint l'objectif.
    while (mergedValue >= goal) {
        goal *= 2;
        showToast(`🎯 Objectif atteint ! Le prochain objectif est ${formatNumber(goal)}.`);
    }

    selected = [];

    // D'abord, les blocs restants descendent.
    applyGravity();

    // Ensuite, les trous du haut sont remplis automatiquement.
    refillBoard();

    render();
    checkGameOver();
}

// ========================================
// GRAVITÉ : LES BLOCS DESCENDENT
// ========================================

function applyGravity() {
    for (let col = 0; col < COLS; col++) {
        const values = [];

        // Récupérer les nombres de bas en haut.
        for (let row = ROWS - 1; row >= 0; row--) {
            const value = grid[indexOf(row, col)];

            if (value !== 0) values.push(value);
        }

        // Nettoyer la colonne, puis replacer les blocs en bas.
        for (let row = 0; row < ROWS; row++) {
            grid[indexOf(row, col)] = 0;
        }

        for (let i = 0; i < values.length; i++) {
            const row = ROWS - 1 - i;
            grid[indexOf(row, col)] = values[i];
        }
    }
}

// ========================================
// REMPLISSAGE AUTOMATIQUE DES CASES VIDES
// ========================================

function refillBoard() {
    let nextUsed = false;

    // Les cases vides sont au-dessus des blocs après la gravité.
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            const index = indexOf(row, col);

            if (grid[index] === 0) {
                if (!nextUsed) {
                    grid[index] = nextValue;
                    nextValue = randomValue();
                    nextUsed = true;
                } else {
                    grid[index] = randomValue();
                }
            }
        }
    }

    if (!nextUsed) {
        nextValue = randomValue();
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

        if (
            col + 1 < COLS &&
            grid[indexOf(row, col + 1)] === grid[i]
        ) {
            return true;
        }

        if (
            row + 1 < ROWS &&
            grid[indexOf(row + 1, col)] === grid[i]
        ) {
            return true;
        }
    }

    return false;
}

function checkGameOver() {
    if (hasPossibleMerge()) return;

    gameOver = true;

    if (endTextEl) {
        endTextEl.textContent =
            `Score final : ${formatNumber(score)}. Il n'y a plus de fusion possible.`;
    }

    if (overlayEl) overlayEl.hidden = false;
}

// ========================================
// THÈMES
// ========================================

function setTheme(theme) {
    const allowedThemes = ["blue", "purple", "green", "orange"];

    if (!allowedThemes.includes(theme)) theme = "blue";

    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);

    if (themeSelect) themeSelect.value = theme;
}

if (themeSelect) {
    themeSelect.addEventListener("change", () => {
        setTheme(themeSelect.value);
    });
}

// ========================================
// PLEIN ÉCRAN
// ========================================

if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                fullscreenBtn.textContent = "⛶ Réduire";
            } else {
                await document.exitFullscreen();
                fullscreenBtn.textContent = "⛶ Agrandir";
            }
        } catch (error) {
            showToast("Le plein écran n'est pas disponible dans ce navigateur.");
        }
    });
}

document.addEventListener("fullscreenchange", () => {
    if (fullscreenBtn) {
        fullscreenBtn.textContent = document.fullscreenElement
            ? "⛶ Réduire"
            : "⛶ Agrandir";
    }

    drawLinks();
});

// ========================================
// NOUVELLE PARTIE
// ========================================

function newGame() {
    score = 0;
    goal = 16;
    selected = [];
    isSelecting = false;
    gameOver = false;
    lastMergedValue = 0;

    if (overlayEl) overlayEl.hidden = true;

    // Les 40 cases sont remplies au démarrage.
    grid = Array.from({ length: TOTAL_CELLS }, randomValue);
    nextValue = randomValue();

    showToast("Maintiens le clic et relie les nombres identiques !");
    render();
    checkGameOver();
}

if (restartBtn) restartBtn.addEventListener("click", newGame);
if (playAgainBtn) playAgainBtn.addEventListener("click", newGame);

window.addEventListener("resize", drawLinks);

// ========================================
// DÉMARRAGE
// ========================================

setTheme(localStorage.getItem(THEME_KEY) || "blue");
createBoard();
newGame();
