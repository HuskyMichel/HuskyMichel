
"use strict";

// ========================================
// NUMBER DROP — HUSKYMICHEL
// ========================================

const COLS = 5;
const ROWS = 8;
const CELL_COUNT = COLS * ROWS;

const BEST_KEY = "hm_numberdrop_best_v1";
const THEME_KEY = "hm_numberdrop_theme_v1";

const board = document.getElementById("board");
const boardWrap = document.querySelector(".board-wrap");
const links = document.getElementById("links");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const nextElement = document.getElementById("next");
const goalElement = document.getElementById("goal");
const goalStatus = document.getElementById("goalStatus");
const progressElement = document.getElementById("progress");
const toast = document.getElementById("toast");

const restartBtn = document.getElementById("restartBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const overlay = document.getElementById("overlay");
const endText = document.getElementById("endText");
const themeSelect = document.getElementById("themeSelect");

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

let grid = [];
let cells = [];
let selected = [];
let score = 0;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;
let goal = 16;
let nextValue = 2;
let isAnimating = false;
let gameOver = false;
let pointerIsDown = false;

// ========================================
// INITIALISATION DE LA GRILLE
// ========================================

function randomValue() {
    // Les petits nombres sont plus fréquents.
    const roll = Math.random();

    if (roll < 0.68) return 2;
    if (roll < 0.94) return 4;
    return 8;
}

function randomNextValue() {
    return Math.random() < 0.75 ? 2 : 4;
}

function newGame() {
    grid = Array(CELL_COUNT).fill(0);
    selected = [];
    score = 0;
    goal = 16;
    nextValue = randomNextValue();
    isAnimating = false;
    pointerIsDown = false;
    gameOver = false;

    overlay.hidden = true;
    board.classList.remove("animating");
    clearMovingTiles();
    createCells();

    // Toutes les cases sont remplies dès le début.
    for (let i = 0; i < CELL_COUNT; i++) {
        grid[i] = randomValue();
    }

    updateStats();
    render();
    setToast("Relie les nombres identiques !");
    checkGameOver();
}

function createCells() {
    board.innerHTML = "";
    cells = [];

    for (let i = 0; i < CELL_COUNT; i++) {
        const cell = document.createElement("div");

        cell.className = "cell";
        cell.dataset.index = String(i);
        cell.setAttribute("role", "gridcell");
        cell.addEventListener("pointerdown", onCellPointerDown);

        board.appendChild(cell);
        cells.push(cell);
    }
}

// ========================================
// AFFICHAGE
// ========================================

function render() {
    for (let i = 0; i < CELL_COUNT; i++) {
        const cell = cells[i];
        const value = grid[i];

        cell.classList.remove(
            "selected",
            "explode",
            "merging-result"
        );

        cell.textContent = value ? String(value) : "";

        cell.dataset.value = String(value);
        cell.setAttribute(
            "aria-label",
            value ? `Nombre ${value}` : "Case vide"
        );

        if (selected.includes(i)) {
            cell.classList.add("selected");
        }
    }

    drawLinks();
    updateStats();
}

function updateStats() {
    scoreElement.textContent = score.toLocaleString("fr-FR");
    bestElement.textContent = best.toLocaleString("fr-FR");
    nextElement.textContent = nextValue;
    goalElement.textContent = goal.toLocaleString("fr-FR");

    const largest = Math.max(0, ...grid);
    const percentage = Math.min(100, (largest / goal) * 100);

    progressElement.style.width = `${percentage}%`;
}

function setToast(message) {
    toast.textContent = message;
}

// ========================================
// SÉLECTION DES BLOCS
// ========================================

function onCellPointerDown(event) {
    if (isAnimating || gameOver || event.button > 0) return;

    const index = Number(event.currentTarget.dataset.index);

    if (!grid[index]) return;

    event.preventDefault();

    pointerIsDown = true;
    selected = [index];

    try {
        board.setPointerCapture(event.pointerId);
    } catch (_) {
        // Le navigateur peut refuser la capture.
    }

    render();
    setToast("Continue à relier les nombres identiques !");
}

document.addEventListener("pointermove", (event) => {
    if (!pointerIsDown || isAnimating || gameOver) return;

    const element = document.elementFromPoint(
        event.clientX,
        event.clientY
    );

    const cell = element?.closest(".cell");

    if (!cell || !board.contains(cell)) return;

    const index = Number(cell.dataset.index);
    addCellToSelection(index);
});

document.addEventListener("pointerup", async () => {
    if (!pointerIsDown) return;

    pointerIsDown = false;

    if (selected.length >= 2) {
        await mergeSelected();
    } else {
        selected = [];
        render();
        setToast("Relie au moins deux nombres identiques.");
    }
});

function addCellToSelection(index) {
    if (selected.includes(index)) {
        // Permet de revenir au bloc précédent en retraçant le chemin.
        if (
            selected.length >= 2 &&
            selected[selected.length - 2] === index
        ) {
            selected.pop();
            render();
        }
        return;
    }

    const lastIndex = selected[selected.length - 1];
    if (lastIndex === undefined) return;

    const firstValue = grid[selected[0]];

    if (grid[index] !== firstValue) return;
    if (!areAdjacent(lastIndex, index)) return;

    selected.push(index);
    render();
}


function areAdjacent(a, b) {
    const rowA = Math.floor(a / COLS);
    const colA = a % COLS;
    const rowB = Math.floor(b / COLS);
    const colB = b % COLS;

    // Horizontalement, verticalement ou en diagonale.
    // Les deux cases doivent se toucher.
    return (
        Math.abs(rowA - rowB) <= 1 &&
        Math.abs(colA - colB) <= 1 &&
        (rowA !== rowB || colA !== colB)
    );
}


// ========================================
// LIGNE ENTRE LES BLOCS SÉLECTIONNÉS
// ========================================

function drawLinks() {
    if (!links || !boardWrap) return;

    const wrapRect = boardWrap.getBoundingClientRect();

    links.setAttribute("width", wrapRect.width);
    links.setAttribute("height", wrapRect.height);
    links.setAttribute(
        "viewBox",
        `0 0 ${wrapRect.width} ${wrapRect.height}`
    );

    links.innerHTML = "";

    if (selected.length < 2) return;

    const points = selected.map((index) => {
        const rect = cells[index].getBoundingClientRect();

        return {
            x: rect.left - wrapRect.left + rect.width / 2,
            y: rect.top - wrapRect.top + rect.height / 2
        };
    });

    const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polyline"
    );

    line.setAttribute(
        "points",
        points.map((point) => `${point.x},${point.y}`).join(" ")
    );
    line.setAttribute("class", "selection-line");

    links.appendChild(line);
}

window.addEventListener("resize", drawLinks);

// ========================================
// FUSION ET EXPLOSION
// ========================================

async function mergeSelected() {
    if (isAnimating || selected.length < 2) return;

    const indices = [...selected];
    const count = indices.length;
    const baseValue = grid[indices[0]];

    if (!indices.every((index) => grid[index] === baseValue)) {
        selected = [];
        render();
        return;
    }

    isAnimating = true;
    pointerIsDown = false;

    // Le dernier bloc relié reste comme destination de la fusion.
    const destination = indices[count - 1];

    // Bonus demandé : nombre impair de blocs = x8 ; sinon = x2.
    const hasBonus = count % 2 === 1;
    const mergedValue = baseValue * (hasBonus ? 8 : 2);

    // Animation d'explosion sur tous les blocs sauf la destination.
    selected = indices;
    drawLinks();

    for (const index of indices) {
        if (index !== destination) {
            cells[index].classList.add("explode");
        } else {
            cells[index].classList.add("merging-result");
        }
    }

    setToast(
        hasBonus
            ? `BONUS ! ${count} blocs reliés !`
            : `${count} blocs fusionnés !`
    );

    await sleep(450);

    // Les blocs explosés disparaissent. Le dernier reste et évolue.
    for (const index of indices) {
        if (index !== destination) {
            grid[index] = 0;
        }
    }

    grid[destination] = mergedValue;
    selected = [];

    score += mergedValue * count;

    if (score > best) {
        best = score;
        localStorage.setItem(BEST_KEY, String(best));
    }

    // Si l'objectif est atteint, il double.
    if (mergedValue >= goal) {
        goal *= 2;
        goalStatus.textContent = "Objectif atteint !";
        setToast(`Objectif atteint ! Le prochain est ${goal}.`);
    } else {
        goalStatus.textContent = "Continue !";
    }

    updateStats();

    // Les blocs tombent, puis de nouveaux arrivent du haut.
    await animateGravityAndRefill();

    isAnimating = false;

    setToast("À toi de jouer !");
    checkGameOver();
}

// ========================================
// CHUTE VISIBLE DES BLOCS
// ========================================

async function animateGravityAndRefill() {
    const before = [...grid];
    const finalGrid = Array(CELL_COUNT).fill(0);
    const movements = [];
    const spawned = [];

    // Pour chaque colonne, les blocs existants descendent.
    for (let col = 0; col < COLS; col++) {
        const existing = [];

        // On parcourt du bas vers le haut.
        for (let row = ROWS - 1; row >= 0; row--) {
            const index = row * COLS + col;

            if (before[index] !== 0) {
                existing.push({
                    value: before[index],
                    from: index
                });
            }
        }

        // Ils se replacent en partant du bas.
        let targetRow = ROWS - 1;

        for (const tile of existing) {
            const to = targetRow * COLS + col;

            finalGrid[to] = tile.value;

            movements.push({
                value: tile.value,
                from: tile.from,
                to
            });

            targetRow--;
        }

        // Les cases restantes sont remplies par des blocs venant du haut.
        while (targetRow >= 0) {
            const value = nextValue || randomValue();

            finalGrid[targetRow * COLS + col] = value;

            spawned.push({
                value,
                to: targetRow * COLS + col
            });

            nextValue = randomNextValue();
            targetRow--;
        }
    }

    // Crée une couche visuelle au-dessus de la grille.
    const layer = getMovingLayer();

    // Les blocs existants sont copiés à leur position de départ.
    for (const movement of movements) {
        createMovingTile(
            movement.value,
            movement.from,
            movement.to,
            false,
            layer
        );
    }

    // Les nouveaux blocs commencent au-dessus de la grille.
    for (const tile of spawned) {
        createMovingTile(
            tile.value,
            tile.to,
            tile.to,
            true,
            layer
        );
    }

    // Met à jour la vraie grille sans montrer les changements instantanés.
    grid = finalGrid;
    board.classList.add("animating");
    render();

    // Force le navigateur à appliquer la nouvelle mise en page.
    board.getBoundingClientRect();

    const animations = [];

    for (const tile of layer.querySelectorAll(".moving-tile")) {
        const dx = Number(tile.dataset.dx);
        const dy = Number(tile.dataset.dy);

        const targetIndex = Number(tile.dataset.to);
const targetRow = Math.floor(targetIndex / COLS);
const targetCol = targetIndex % COLS;

const delay = tile.dataset.spawn === "true"
    ? targetCol * 45 + targetRow * 25
    : 0;

animations.push(
    tile.animate(
        [
            { transform: "translate(0px, 0px) scale(1)" },
            {
                transform: `translate(${dx}px, ${dy}px) scale(1)`
            }
        ],
        {
            duration: tile.dataset.spawn === "true" ? 1000 : 850,
            delay,
            easing: "cubic-bezier(0.22, 0.75, 0.25, 1)",
            fill: "forwards"
        }
    ).finished.catch(() => {})
);
    }

    await Promise.all(animations);

    clearMovingTiles();
    board.classList.remove("animating");

    render();
}

function getMovingLayer() {
    let layer = boardWrap.querySelector(".falling-layer");

    if (!layer) {
        layer = document.createElement("div");
        layer.className = "falling-layer";
        boardWrap.appendChild(layer);
    }

    layer.innerHTML = "";
    return layer;
}

function createMovingTile(value, fromIndex, toIndex, spawn, layer) {
    const targetRect = cells[toIndex].getBoundingClientRect();
    const wrapRect = boardWrap.getBoundingClientRect();

    let startX;
    let startY;

    if (spawn) {
        startX = targetRect.left - wrapRect.left;
        startY = targetRect.top - wrapRect.top - targetRect.height - 10;
    } else {
        const sourceRect = cells[fromIndex].getBoundingClientRect();

        startX = sourceRect.left - wrapRect.left;
        startY = sourceRect.top - wrapRect.top;
    }

    const targetX = targetRect.left - wrapRect.left;
    const targetY = targetRect.top - wrapRect.top;

    const tile = document.createElement("div");
    tile.className = "moving-tile";
    tile.textContent = String(value);
    tile.dataset.spawn = String(spawn);
	tile.dataset.to = String(toIndex);
tile.dataset.value = String(value);
    tile.dataset.dx = String(targetX - startX);
    tile.dataset.dy = String(targetY - startY);

    tile.style.left = `${startX}px`;
    tile.style.top = `${startY}px`;
    tile.style.width = `${targetRect.width}px`;
    tile.style.height = `${targetRect.height}px`;

    // Reprend l'apparence du bloc d'origine.
    const sourceCell = cells[spawn ? toIndex : fromIndex];
    const computed = window.getComputedStyle(sourceCell);

    tile.style.borderRadius = computed.borderRadius;
    tile.style.color = computed.color;
    tile.style.fontSize = computed.fontSize;
    tile.style.fontWeight = computed.fontWeight;

    layer.appendChild(tile);
}

function clearMovingTiles() {
    const layer = boardWrap?.querySelector(".falling-layer");

    if (layer) layer.innerHTML = "";
}

// ========================================
// FIN DE PARTIE
// ========================================

function hasPossibleMerge() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const index = row * COLS + col;
            const value = grid[index];

            if (!value) return true;

            if (col < COLS - 1 && grid[index + 1] === value) {
                return true;
            }

            if (row < ROWS - 1 && grid[index + COLS] === value) {
                return true;
            }
        }
    }

    return false;
}

function checkGameOver() {
    if (isAnimating || hasPossibleMerge()) return;

    gameOver = true;
    endText.textContent =
        `Score final : ${score.toLocaleString("fr-FR")}. ` +
        "Il n'y a plus de nombres identiques côte à côte.";
    overlay.hidden = false;
}

// ========================================
// THÈMES
// ========================================

function applyTheme(theme) {
    const allowedThemes = ["blue", "purple", "green", "orange"];

    if (!allowedThemes.includes(theme)) {
        theme = "blue";
    }

    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);

    if (themeSelect) {
        themeSelect.value = theme;
    }
}

applyTheme(localStorage.getItem(THEME_KEY) || "blue");

if (themeSelect) {
    themeSelect.addEventListener("change", () => {
        applyTheme(themeSelect.value);
    });
}

// ========================================
// BOUTONS
// ========================================

restartBtn?.addEventListener("click", newGame);
playAgainBtn?.addEventListener("click", newGame);

fullscreenBtn?.addEventListener("click", async () => {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            fullscreenBtn.textContent = "⛶ Réduire";
        } else {
            await document.exitFullscreen();
            fullscreenBtn.textContent = "⛶ Agrandir";
        }
    } catch (_) {
        setToast("Le plein écran n'est pas disponible dans ce navigateur.");
    }
});

document.addEventListener("fullscreenchange", () => {
    if (fullscreenBtn) {
        fullscreenBtn.textContent = document.fullscreenElement
            ? "⛶ Réduire"
            : "⛶ Agrandir";
    }

    drawLinks();
});

// ========================================
// LANCEMENT
// ========================================

newGame();