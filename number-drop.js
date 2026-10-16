
"use strict";

/* =========================================
   NUMBER DROP — HUSKYMICHEL
   MOTEUR DU JEU
========================================= */

(() => {
    const COLS = 6;
    const ROWS = 8;
    const SIZE = COLS * ROWS;
    const BEST_KEY = "hm_numberdrop_best_v1";

    const COLORS = {
        2: "#4b83e6",
        4: "#28a9c9",
        8: "#28b887",
        16: "#84b83d",
        32: "#e2ad35",
        64: "#ef8740",
        128: "#e45e75",
        256: "#ba6be8",
        512: "#8d7df5",
        1024: "#e85bb9",
        2048: "#f0d34e"
    };

    const boardEl = document.getElementById("board");
    const linksEl = document.getElementById("links");

    const scoreEl = document.getElementById("score");
    const bestEl = document.getElementById("best");
    const nextEl = document.getElementById("next");

    const goalEl = document.getElementById("goal");
    const goalStatus = document.getElementById("goalStatus");
    const progressEl = document.getElementById("progress");

    const toast = document.getElementById("toast");
    const overlay = document.getElementById("overlay");
    const endText = document.getElementById("endText");

    let cells = Array(SIZE).fill(0);

    let score = 0;
    let best = readBest();
    let goal = 16;
    let nextValue = 2;

    let selected = [];
    let dragging = false;
    let gameOver = false;
    let dropTimer = null;

    bestEl.textContent = best;

    /* =====================================
       SAUVEGARDE
    ===================================== */

    function readBest() {
        try {
            return Number(localStorage.getItem(BEST_KEY)) || 0;
        } catch {
            return 0;
        }
    }

    function saveBest() {
        if (score > best) {
            best = score;
            bestEl.textContent = format(best);

            try {
                localStorage.setItem(BEST_KEY, String(best));
            } catch {
                // Le jeu fonctionne aussi sans sauvegarde.
            }
        }
    }

    /* =====================================
       OUTILS
    ===================================== */

    function format(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + " M";
        }

        if (value >= 10000) {
            return Math.round(value / 1000) + " k";
        }

        return String(value);
    }

    function colorFor(value) {
        if (COLORS[value]) {
            return COLORS[value];
        }

        const hue = (Math.log2(value) * 43) % 360;
        return `hsl(${hue} 72% 56%)`;
    }

    function neighbors(index) {
        const row = Math.floor(index / COLS);
        const col = index % COLS;

        return [
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1]
        ]
            .filter(([r, c]) =>
                r >= 0 &&
                r < ROWS &&
                c >= 0 &&
                c < COLS
            )
            .map(([r, c]) => r * COLS + c);
    }

    function emptyIndexes() {
        return cells
            .map((value, index) => value === 0 ? index : -1)
            .filter(index => index !== -1);
    }

    /* =====================================
       AFFICHAGE
    ===================================== */

    function render() {
        boardEl.innerHTML = "";

        cells.forEach((value, index) => {
            const cell = document.createElement("div");

            cell.className = "cell" + (
                value === 0 ? " empty" : ""
            );

            cell.dataset.index = index;
            cell.setAttribute("role", "gridcell");

            if (value > 0) {
                cell.textContent = format(value);

                const color = colorFor(value);

                cell.style.background =
                    `linear-gradient(145deg, ${color}, ${color}bb)`;

                cell.style.color =
                    value >= 1024 ? "#231a05" : "#ffffff";

                cell.style.textShadow = "0 1px 3px #0005";
            }

            if (selected.includes(index)) {
                cell.classList.add("selected");
            }

            cell.addEventListener("pointerdown", event => {
                startSelect(event, index);
            });

            cell.addEventListener("pointerenter", () => {
                if (dragging) {
                    extendSelect(index);
                }
            });

            boardEl.appendChild(cell);
        });

        scoreEl.textContent = format(score);
        bestEl.textContent = format(best);
        nextEl.textContent = format(nextValue);
        goalEl.textContent = format(goal);

        const percentage = Math.min(
            100,
            score / goal * 100
        );

        progressEl.style.width = percentage + "%";

        goalStatus.textContent =
            score >= goal
                ? "Objectif atteint !"
                : "Atteins l'objectif !";

        drawLinks();
    }

    /* =====================================
       TRAITS LUMINEUX
    ===================================== */

    function drawLinks() {
        linksEl.innerHTML = "";

        if (selected.length < 2) {
            return;
        }

        const svgRect = linksEl.getBoundingClientRect();

        linksEl.setAttribute(
            "viewBox",
            `0 0 ${svgRect.width} ${svgRect.height}`
        );

        const points = selected.map(index => {
            const rect = boardEl.children[index]
                .getBoundingClientRect();

            return {
                x: rect.left + rect.width / 2 - svgRect.left,
                y: rect.top + rect.height / 2 - svgRect.top
            };
        });

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polyline"
        );

        line.setAttribute(
            "points",
            points.map(p => `${p.x},${p.y}`).join(" ")
        );

        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "#b7f4ff");
        line.setAttribute("stroke-width", "5");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-linejoin", "round");

        line.style.filter =
            "drop-shadow(0 0 5px #5adfff)";

        linksEl.appendChild(line);
    }

    /* =====================================
       SÉLECTION DES NOMBRES
    ===================================== */

    function startSelect(event, index) {
        if (gameOver || !cells[index]) {
            return;
        }

        event.preventDefault();

        dragging = true;
        selected = [index];

        try {
            boardEl.setPointerCapture(event.pointerId);
        } catch {
            // Capture non disponible : la sélection reste utilisable.
        }

        render();
    }

    function extendSelect(index) {
        if (
            !dragging ||
            selected.includes(index) ||
            !cells[index]
        ) {
            return;
        }

        const last = selected[selected.length - 1];
        const firstValue = cells[selected[0]];

        if (cells[index] !== firstValue) {
            return;
        }

        if (!neighbors(last).includes(index)) {
            return;
        }

        selected.push(index);
        render();
    }

    boardEl.addEventListener("pointerup", () => {
        if (!dragging) {
            return;
        }

        dragging = false;
        mergeSelected();
    });

    boardEl.addEventListener("pointercancel", () => {
        dragging = false;
        selected = [];
        render();
    });

    /* =====================================
       FUSION
    ===================================== */

    function mergeSelected() {
        if (selected.length < 2) {
            selected = [];
            render();
            return;
        }

        const indexes = [...selected];
        const value = cells[indexes[0]];
        const mergedValue = value * 2;

        // Retire les nombres utilisés.
        indexes.forEach(index => {
            cells[index] = 0;
        });

        // Le nouveau nombre apparaît au milieu du groupe.
        const target = indexes[
            Math.floor((indexes.length - 1) / 2)
        ];

        cells[target] = mergedValue;

        // Plus on relie de nombres, plus le bonus est élevé.
        const gained = mergedValue * indexes.length;

        score += gained;
        saveBest();

        selected = [];

        toast.textContent =
            `${indexes.length} nombres fusionnés ! ` +
            `${format(mergedValue)} obtenu : +${format(gained)} points.`;

        // Vérifie les objectifs atteints.
        let reachedGoal = false;

        while (score >= goal) {
            goal *= 2;
            reachedGoal = true;
        }

        if (reachedGoal) {
            toast.textContent +=
                ` Nouvel objectif : ${format(goal)} !`;

            toast.style.color = "#6af2d1";
        } else {
            toast.style.color = "";
        }

        render();

        // Un nouveau nombre apparaît après la fusion.
        clearTimeout(dropTimer);

        dropTimer = setTimeout(() => {
            if (!gameOver) {
                dropNumber();
            }
        }, 180);
    }

    /* =====================================
       APPARITION DES NOMBRES
    ===================================== */

    function dropNumber() {
        if (gameOver || dragging) {
            return;
        }

        const empty = emptyIndexes();

        if (empty.length === 0) {
            endGame();
            return;
        }

        // Favorise le haut de la grille.
        const topOpen = empty.filter(
            index => Math.floor(index / COLS) < 3
        );

        const pool = topOpen.length > 0
            ? topOpen
            : empty;

        const index = pool[
            Math.floor(Math.random() * pool.length)
        ];

        cells[index] = nextValue;

        toast.style.color = "";
        toast.textContent =
            `Un ${format(nextValue)} apparaît dans la grille.`;

        // Les prochains nombres sont principalement des 2,
        // avec quelques 4 pour varier les possibilités.
        nextValue = Math.random() < 0.75 ? 2 : 4;

        render();

        // Fin de partie si la grille est pleine.
        if (emptyIndexes().length === 0) {
            endGame();
        }
    }

    /* =====================================
       FIN DE PARTIE
    ===================================== */

    function endGame() {
        gameOver = true;
        clearTimeout(dropTimer);

        endText.textContent =
            `Score final : ${format(score)}. ` +
            `Record : ${format(best)}.`;

        overlay.classList.add("show");
    }

    /* =====================================
       NOUVELLE PARTIE
    ===================================== */

    function newGame() {
        clearTimeout(dropTimer);

        cells = Array(SIZE).fill(0);
        score = 0;
        goal = 16;
        nextValue = 2;

        selected = [];
        dragging = false;
        gameOver = false;

        overlay.classList.remove("show");
        toast.style.color = "";
        toast.textContent =
            "Nouvelle partie ! Relie les nombres identiques.";

        // Quelques nombres de départ.
        for (let i = 0; i < 5; i++) {
            const empty = emptyIndexes();

            const index = empty[
                Math.floor(Math.random() * empty.length)
            ];

            cells[index] = Math.random() < 0.8 ? 2 : 4;
        }

        render();
    }

    /* =====================================
       BOUTONS
    ===================================== */

    document
        .getElementById("dropBtn")
        .addEventListener("click", dropNumber);

    document
        .getElementById("restartBtn")
        .addEventListener("click", () => {
            if (confirm("Commencer une nouvelle partie ?")) {
                newGame();
            }
        });

    document
        .getElementById("playAgainBtn")
        .addEventListener("click", newGame);

    document
        .getElementById("fullscreenBtn")
        .addEventListener("click", async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                } else {
                    await document.exitFullscreen();
                }
            } catch {
                toast.textContent =
                    "Le plein écran n'est pas disponible ici.";
            }
        });

    window.addEventListener("resize", drawLinks);

    /* =====================================
       DÉMARRAGE
    ===================================== */

    newGame();
})();
