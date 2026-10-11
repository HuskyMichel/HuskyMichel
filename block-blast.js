"use strict";

// ========================================
// BLOCK BLAST — HUSKYMICHEL
// 3D ARCADE + MUSIQUE ÉLECTRONIQUE
// ========================================

const SIZE = 8;
const BEST_KEY = "hm_blockblast_best_v1";
const THEME_KEY = "hm_blockblast_theme_v1";
const MUSIC_KEY = "hm_blockblast_music_enabled_v1";
const MUSIC_VOLUME_KEY = "hm_blockblast_music_volume_v1";

const $ = (id) => document.getElementById(id);

const boardElement = $("board");
const piecesElement = $("pieces");
const scoreElement = $("score");
const bestScoreElement = $("best-score");
const statusElement = $("status");
const themeSelect = $("theme");
const modalElement = $("game-modal");
const modalMessage = $("modal-message");
const newGameButton = $("new-game");
const restartButton = $("restart-button");

if (
  !boardElement || !piecesElement || !scoreElement ||
  !bestScoreElement || !statusElement || !themeSelect ||
  !modalElement || !modalMessage || !newGameButton ||
  !restartButton
) {
  throw new Error("Un élément du jeu manque dans block-blast.html.");
}

// ========================================
// STYLE 3D, ANIMATIONS ET MUSIQUE
// ========================================

const style = document.createElement("style");

style.textContent = `
  :root {
    --arcade-blue: #46a6ff;
    --arcade-glow: rgba(70,166,255,.45);
  }

  #board {
    perspective: 1000px;
    isolation: isolate;
  }

  .board-cell {
    position: relative;
    overflow: visible;
    border-radius: 5px !important;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      background-color 120ms ease,
      transform 140ms ease,
      box-shadow 140ms ease;
  }

  .board-cell.filled {
    border-top: 2px solid rgba(255,255,255,.38) !important;
    border-left: 2px solid rgba(255,255,255,.20) !important;
    border-bottom: 4px solid rgba(0,0,0,.28) !important;
    box-shadow:
      inset 0 2px 0 rgba(255,255,255,.16),
      inset 0 -3px 0 rgba(0,0,0,.12),
      0 2px 0 rgba(0,0,0,.12);
  }

  .piece-option {
    position: relative;
    overflow: visible;
    border-radius: 15px !important;
    background:
      linear-gradient(145deg,
        rgba(255,255,255,.10),
        rgba(255,255,255,.025)) !important;
    box-shadow:
      0 6px 0 rgba(0,0,0,.20),
      0 10px 20px rgba(0,0,0,.16),
      inset 0 1px 0 rgba(255,255,255,.12);
    transform: translateY(0);
    animation: hmPieceFloat 2.5s ease-in-out infinite;
    transition:
      transform 180ms ease,
      box-shadow 180ms ease,
      border-color 180ms ease,
      background 180ms ease;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .piece-option:nth-child(2) { animation-delay: -.8s; }
  .piece-option:nth-child(3) { animation-delay: -1.5s; }

  .piece-option:not(:disabled):hover {
    transform: translateY(-7px) scale(1.045);
    box-shadow:
      0 11px 0 rgba(0,0,0,.20),
      0 17px 25px rgba(0,0,0,.24),
      0 0 20px rgba(70,166,255,.15),
      inset 0 1px 0 rgba(255,255,255,.20);
    border-color: rgba(255,255,255,.5) !important;
  }

  .piece-option:active {
    animation: none;
    transform: translateY(2px) scale(.97);
    box-shadow:
      0 2px 0 rgba(0,0,0,.25),
      inset 0 2px 5px rgba(0,0,0,.15);
  }

  .piece-option:disabled {
    animation: hmPieceUsed .3s ease forwards;
  }

  .piece-grid span {
    border-radius: 5px !important;
    border-top: 2px solid rgba(255,255,255,.42);
    border-left: 1px solid rgba(255,255,255,.24);
    border-bottom: 4px solid rgba(0,0,0,.22);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.25),
      0 2px 0 rgba(0,0,0,.12);
  }

  .board-cell.flip-clear {
    z-index: 5;
    animation: hmBlockBurst .48s cubic-bezier(.2,.75,.25,1) forwards !important;
    pointer-events: none;
  }

  @keyframes hmPieceFloat {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -5px; }
  }

  @keyframes hmPieceUsed {
    to {
      opacity: .15;
      transform: scale(.8) rotate(-4deg);
    }
  }

  @keyframes hmBlockBurst {
    0% {
      transform: rotateX(0) rotateY(0) scale(1);
      opacity: 1;
      filter: brightness(1.5);
    }
    35% {
      transform: rotateX(55deg) rotateY(20deg) scale(1.12);
      opacity: 1;
      filter: brightness(1.8);
    }
    70% {
      transform: rotateX(100deg) rotateY(-18deg) scale(.75);
      opacity: .65;
      filter: brightness(1.5);
    }
    100% {
      transform: rotateX(160deg) rotateY(30deg) scale(.1);
      opacity: 0;
      filter: brightness(2);
    }
  }

  .hm-fullscreen-button,
  .hm-music-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin: 8px 5px 14px 0;
    padding: 10px 16px;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 11px;
    background: linear-gradient(145deg,#304c78,#1c2c49);
    color: white;
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 0 #101a2b, 0 7px 14px rgba(0,0,0,.22);
    transition: transform .15s, box-shadow .15s, background .2s;
  }

  .hm-music-button {
    background: linear-gradient(145deg,#563d91,#302257);
  }

  .hm-music-button.hm-music-off {
    background: linear-gradient(145deg,#454957,#292d38);
    opacity: .85;
  }

  .hm-fullscreen-button:hover,
  .hm-music-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #101a2b, 0 10px 18px rgba(0,0,0,.24);
  }

  .hm-fullscreen-button:active,
  .hm-music-button:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #101a2b;
  }

  .hm-music-controls {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin: 4px 0 12px;
    padding: 9px 12px;
    border: 1px solid rgba(177,108,255,.3);
    border-radius: 12px;
    background: rgba(35,28,59,.65);
    color: white;
    font: inherit;
    font-size: 13px;
  }

  .hm-music-controls label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .hm-music-controls input[type="range"] {
    width: 100px;
    accent-color: #b16cff;
    cursor: pointer;
  }

  .hm-music-volume-value {
    min-width: 34px;
    font-weight: 800;
    color: #d9b9ff;
  }

  :fullscreen {
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

  .hm-combo-banner {
    position: fixed;
    z-index: 9999;
    top: 24%;
    left: 50%;
    transform: translate(-50%, 12px) scale(.6);
    opacity: 0;
    pointer-events: none;
    padding: 12px 24px;
    border: 2px solid rgba(255,255,255,.6);
    border-radius: 16px;
    background: linear-gradient(135deg,#ffb347,#ff6685,#b16cff);
    color: white;
    font-size: clamp(22px,5vw,40px);
    font-weight: 1000;
    font-style: italic;
    text-align: center;
    text-shadow: 0 3px 0 rgba(0,0,0,.22);
    box-shadow: 0 8px 30px rgba(177,108,255,.4);
  }

  .hm-combo-banner.show {
    animation: hmComboPop 950ms cubic-bezier(.15,.8,.25,1) forwards;
  }

  @keyframes hmComboPop {
    0% { opacity: 0; transform: translate(-50%,20px) scale(.5) rotate(-5deg); }
    20% { opacity: 1; transform: translate(-50%,0) scale(1.15) rotate(2deg); }
    35% { transform: translate(-50%,0) scale(1) rotate(0); }
    75% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%,-35px) scale(.9); }
  }

  .hm-particle {
    position: fixed;
    z-index: 9998;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    pointer-events: none;
    animation: hmParticleFly 650ms ease-out forwards;
  }

  @keyframes hmParticleFly {
    0% {
      transform: translate(0,0) rotate(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(var(--dx),var(--dy)) rotate(240deg) scale(.1);
      opacity: 0;
    }
  }

  @media (max-width: 600px) {
    .piece-option { min-height: 85px !important; }
    :fullscreen .board { max-width: min(94vw,58vh); }

    .hm-music-controls {
      display: flex;
      width: fit-content;
      max-width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .piece-option { animation: none; }
    .board-cell.flip-clear { animation-duration: .2s !important; }
    .hm-combo-banner, .hm-particle { animation-duration: .2s !important; }
  }
`;

document.head.appendChild(style);

// ========================================
// MUSIQUE ARCADE ÉLECTRONIQUE
// ========================================

// La musique est synthétisée par le navigateur.
// Aucun fichier audio externe n'est nécessaire.

let audioContext = null;
let musicMaster = null;
let musicTimer = null;
let nextMusicNoteTime = 0;
let musicStep = 0;
let musicEnabled = true;
let musicStarted = false;
let musicVolume = 0.25;

try {
  const savedEnabled = localStorage.getItem(MUSIC_KEY);
  if (savedEnabled !== null) musicEnabled = savedEnabled === "true";

  const savedVolume = localStorage.getItem(MUSIC_VOLUME_KEY);
  if (savedVolume !== null) {
    const parsed = Number(savedVolume);
    if (Number.isFinite(parsed)) {
      musicVolume = Math.max(0, Math.min(1, parsed));
    }
  }
} catch {}

// Mélodie originale en boucle : 16 pas, ambiance arcade.
const MELODY = [
  659.25, 0, 783.99, 987.77,
  880.00, 0, 783.99, 659.25,
  523.25, 659.25, 783.99, 0,
  987.77, 880.00, 783.99, 0
];

const BASS = [
  130.81, 0, 130.81, 0,
  174.61, 0, 174.61, 0,
  196.00, 0, 196.00, 0,
  146.83, 0, 146.83, 0
];

const STEP_DURATION = 60 / 120 / 2; // 120 BPM, croches

function createAudioContext() {
  if (audioContext) return true;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    statusElement.textContent =
      "La musique n'est pas prise en charge par ce navigateur.";
    return false;
  }

  audioContext = new AudioContextClass();

  musicMaster = audioContext.createGain();
  musicMaster.gain.value = 0;

  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.18;

  musicMaster.connect(compressor);
  compressor.connect(audioContext.destination);

  return true;
}

function playSynthNote(frequency, startTime, duration, type, volume) {
  if (!audioContext || !musicMaster || frequency <= 0) return;

  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, volume),
    startTime + 0.012
  );
  envelope.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + duration
  );

  oscillator.connect(envelope);
  envelope.connect(musicMaster);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);

  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    envelope.disconnect();
  }, { once: true });
}

function playKick(startTime) {
  if (!audioContext || !musicMaster) return;

  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(130, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(45, startTime + 0.12);

  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(0.22, startTime + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

  oscillator.connect(envelope);
  envelope.connect(musicMaster);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.16);

  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    envelope.disconnect();
  }, { once: true });
}

function scheduleMusic() {
  if (!audioContext || !musicEnabled || !musicStarted) return;

  // Programmer les notes légèrement à l'avance évite les coupures.
  while (nextMusicNoteTime < audioContext.currentTime + 0.12) {
    const step = musicStep % MELODY.length;
    const time = nextMusicNoteTime;

    if (step % 4 === 0) playKick(time);

    if (MELODY[step] > 0) {
      playSynthNote(MELODY[step], time, 0.14, "square", 0.075);
    }

    if (BASS[step] > 0) {
      playSynthNote(BASS[step], time, 0.20, "triangle", 0.12);
    }

    // Petite note aiguë occasionnelle pour un effet arcade.
    if (step === 3 || step === 11) {
      playSynthNote(MELODY[step] * 2, time, 0.08, "square", 0.025);
    }

    nextMusicNoteTime += STEP_DURATION;
    musicStep++;
  }
}

function updateMusicButton() {
  if (!musicButton) return;

  musicButton.textContent = musicEnabled
    ? (musicStarted ? "♫ Musique : activée" : "♫ Activer la musique")
    : "♪ Musique : désactivée";

  musicButton.classList.toggle("hm-music-off", !musicEnabled);
  musicButton.setAttribute("aria-pressed", String(musicEnabled));
}

function setMusicVolume(value) {
  musicVolume = Math.max(0, Math.min(1, Number(value)));

  try {
    localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
  } catch {}

  if (musicMaster && audioContext) {
    musicMaster.gain.setTargetAtTime(
      musicEnabled && musicStarted ? musicVolume : 0,
      audioContext.currentTime,
      0.04
    );
  }

  if (musicVolumeValue) {
    musicVolumeValue.textContent = `${Math.round(musicVolume * 100)} %`;
  }
}

async function startMusic() {
  if (!musicEnabled) return;
  if (!createAudioContext()) return;

  try {
    await audioContext.resume();

    if (!musicStarted) {
      musicStarted = true;
      musicStep = 0;
      nextMusicNoteTime = audioContext.currentTime + 0.05;
      musicTimer = window.setInterval(scheduleMusic, 25);
    }

    musicMaster.gain.setTargetAtTime(
      musicVolume,
      audioContext.currentTime,
      0.12
    );

    updateMusicButton();
  } catch (error) {
    console.warn("Impossible de démarrer la musique :", error);
  }
}

function stopMusic() {
  musicEnabled = false;

  try {
    localStorage.setItem(MUSIC_KEY, "false");
  } catch {}

  if (audioContext && musicMaster) {
    musicMaster.gain.setTargetAtTime(
      0,
      audioContext.currentTime,
      0.04
    );
  }

  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }

  musicStarted = false;
  updateMusicButton();
}

async function toggleMusic() {
  if (musicEnabled) {
    stopMusic();
  } else {
    musicEnabled = true;

    try {
      localStorage.setItem(MUSIC_KEY, "true");
    } catch {}

    await startMusic();
  }

  updateMusicButton();
}

// Bouton musique
const musicButton = document.createElement("button");
musicButton.type = "button";
musicButton.className = "hm-music-button";
musicButton.addEventListener("click", toggleMusic);

// Contrôle de volume
const musicControls = document.createElement("div");
musicControls.className = "hm-music-controls";

const volumeLabel = document.createElement("label");
volumeLabel.textContent = "Volume musique";

const musicVolumeSlider = document.createElement("input");
musicVolumeSlider.type = "range";
musicVolumeSlider.min = "0";
musicVolumeSlider.max = "100";
musicVolumeSlider.step = "5";
musicVolumeSlider.value = String(Math.round(musicVolume * 100));
musicVolumeSlider.setAttribute("aria-label", "Volume de la musique");

const musicVolumeValue = document.createElement("span");
musicVolumeValue.className = "hm-music-volume-value";
musicVolumeValue.textContent = `${Math.round(musicVolume * 100)} %`;

musicVolumeSlider.addEventListener("input", () => {
  setMusicVolume(Number(musicVolumeSlider.value) / 100);
});

volumeLabel.append(musicVolumeSlider, musicVolumeValue);
musicControls.appendChild(volumeLabel);

// Ajout des commandes dans la page
const gameContainer =
  document.querySelector(".game-container") ||
  document.querySelector("#game-container") ||
  boardElement.closest("main") ||
  document.body;

const actionsContainer = document.querySelector(".game-actions");

if (actionsContainer) {
  actionsContainer.prepend(musicControls);
  actionsContainer.prepend(musicButton);
} else {
  boardElement.parentElement.insertBefore(musicControls, boardElement);
  boardElement.parentElement.insertBefore(musicButton, musicControls);
}

updateMusicButton();
setMusicVolume(musicVolume);

// Démarrage uniquement après une interaction de l'utilisateur.
// Le clic sur le bouton musique est géré séparément.
document.addEventListener("pointerdown", (event) => {
  if (musicButton.contains(event.target)) return;
  if (musicEnabled && !musicStarted) startMusic();
}, true);

document.addEventListener("keydown", (event) => {
  if (event.repeat || !musicEnabled || musicStarted) return;
  if (event.target === musicButton) return;
  startMusic();
});

// Si l'onglet revient au premier plan, reprendre la lecture si nécessaire.
document.addEventListener("visibilitychange", async () => {
  if (!document.hidden && musicEnabled && musicStarted && audioContext) {
    try {
      await audioContext.resume();
    } catch {}
  }
});

// ========================================
// BOUTON PLEIN ÉCRAN
// ========================================

const fullscreenButton = document.createElement("button");
fullscreenButton.type = "button";
fullscreenButton.className = "hm-fullscreen-button";
fullscreenButton.textContent = "⛶ Plein écran";

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
  } catch {
    statusElement.textContent =
      "Le plein écran n'est pas disponible sur ce navigateur.";
  }
});

document.addEventListener("fullscreenchange", () => {
  fullscreenButton.textContent = document.fullscreenElement
    ? "⛶ Quitter le plein écran"
    : "⛶ Plein écran";
});

// Bannière de combo
const comboBanner = document.createElement("div");
comboBanner.className = "hm-combo-banner";
comboBanner.setAttribute("aria-live", "polite");
document.body.appendChild(comboBanner);

let comboCount = 0;
let comboBannerTimer = null;

// ========================================
// FORMES DES BLOCS
// ========================================

const SHAPES = [
  [[0,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,0]],
  [[0,0],[0,1],[1,1]],
  [[0,0],[1,0],[1,1]],
  [[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[1,0],[1,1]],

  // Carré 3 × 3
  [
    [0,0],[0,1],[0,2],
    [1,0],[1,1],[1,2],
    [2,0],[2,1],[2,2]
  ],

  // T
  [[0,0],[0,1],[0,2],[1,1]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,1],[1,0],[1,1],[1,2]],
  [[0,1],[1,1],[2,1],[1,0]],

  // L
  [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[0,1],[0,2],[1,0]],
  [[0,0],[0,1],[1,1],[2,1]],
  [[0,2],[1,0],[1,1],[1,2]],

  // Zigzags
  [[0,0],[1,0],[1,1],[2,1]],
  [[0,1],[1,0],[1,1],[2,0]],

  // Barres
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2],[0,3],[0,4]],
  [[0,0],[1,0],[2,0],[3,0],[4,0]]
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
// ÉTAT
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
// SAUVEGARDE ET THÈMES
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
  } catch {}
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (["blue","purple","green","orange"].includes(saved)) {
      themeSelect.value = saved;
    }
  } catch {}

  document.body.dataset.theme = themeSelect.value;
}

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
  try {
    localStorage.setItem(THEME_KEY, themeSelect.value);
  } catch {}
});

// ========================================
// NOUVELLE PARTIE
// ========================================

function startGame() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  pieces = [];
  selectedPiece = -1;
  score = 0;
  comboCount = 0;
  busy = false;
  gameOver = false;
  dragging = false;

  modalElement.classList.add("hidden");
  comboBanner.classList.remove("show");

  updateScore();
  statusElement.textContent = "À toi de jouer !";

  createNewPieces();
  renderBoard();
  renderPieces();
}

function createNewPieces() {
  pieces = Array.from({ length: 3 }, () => ({
    cells: SHAPES[Math.floor(Math.random() * SHAPES.length)]
      .map(([r,c]) => [r,c]),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    used: false
  }));

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
      cell.setAttribute("aria-label", `Ligne ${r+1}, colonne ${c+1}`);

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
      }

      cell.addEventListener("click", () => {
        if (!dragging) placeSelected(r, c);
      });

      cell.addEventListener("pointerenter", () => {
        if (selectedPiece !== -1 && !busy) showPreview(r, c);
      });

      cell.addEventListener("focus", () => {
        if (selectedPiece !== -1 && !busy) showPreview(r, c);
      });

      boardElement.appendChild(cell);
    }
  }
}

// ========================================
// AFFICHAGE DES PIÈCES
// ========================================

function renderPieces() {
  piecesElement.replaceChildren();
  piecesElement.style.display = "grid";
  piecesElement.style.gridTemplateColumns = "repeat(3,minmax(0,1fr))";
  piecesElement.style.gap = "10px";

  pieces.forEach((piece, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "piece-option";
    button.setAttribute("aria-label", `Sélectionner le bloc ${index+1}`);

    button.style.minWidth = "0";
    button.style.minHeight = "100px";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.style.padding = "8px";
    button.style.borderRadius = "12px";
    button.style.border = selectedPiece === index
      ? "2px solid #fff"
      : "2px solid rgba(255,255,255,.10)";
    button.style.background = selectedPiece === index
      ? "rgba(70,166,255,.22)"
      : "rgba(255,255,255,.04)";
    button.style.cursor = piece.used ? "default" : "grab";
    button.style.opacity = piece.used ? ".2" : "1";

    if (piece.used) button.disabled = true;

    const maxRow = Math.max(...piece.cells.map(([r]) => r)) + 1;
    const maxCol = Math.max(...piece.cells.map(([,c]) => c)) + 1;

    const shape = document.createElement("div");
    shape.className = "piece-grid";
    shape.style.display = "grid";
    shape.style.gridTemplateColumns = `repeat(${maxCol},19px)`;
    shape.style.gridTemplateRows = `repeat(${maxRow},19px)`;
    shape.style.gap = "3px";
    shape.style.pointerEvents = "none";

    for (let r = 0; r < maxRow; r++) {
      for (let c = 0; c < maxCol; c++) {
        const block = document.createElement("span");
        const filled = piece.cells.some(([pr,pc]) => pr === r && pc === c);

        block.style.width = "19px";
        block.style.height = "19px";
        block.style.borderRadius = "4px";

        if (filled) {
          block.style.backgroundColor = piece.color;
        } else {
          block.style.backgroundColor = "transparent";
          block.style.border = "none";
          block.style.boxShadow = "none";
        }

        shape.appendChild(block);
      }
    }

    button.appendChild(shape);

    button.addEventListener("click", () => {
      if (busy || gameOver || piece.used || dragging) return;

      selectedPiece = index;
      statusElement.textContent = "Place ton bloc sur le plateau !";
      renderPieces();
      renderBoard();
    });

    button.addEventListener("pointerdown", (event) => {
      if (busy || gameOver || piece.used) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();

      selectedPiece = index;
      dragging = true;
      statusElement.textContent = "Déplace le bloc sur le plateau !";

      piecesElement.querySelectorAll(".piece-option").forEach((item, i) => {
        item.style.border = i === index
          ? "2px solid #fff"
          : "2px solid rgba(255,255,255,.10)";
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

  const element = document.elementFromPoint(event.clientX, event.clientY);
  const target = element instanceof Element
    ? element.closest(".board-cell")
    : null;

  if (target && boardElement.contains(target)) {
    showPreview(Number(target.dataset.row), Number(target.dataset.col));
  } else {
    clearPreview();
  }
});

document.addEventListener("pointerup", (event) => {
  if (!dragging) return;

  const element = document.elementFromPoint(event.clientX, event.clientY);
  const target = element instanceof Element
    ? element.closest(".board-cell")
    : null;

  dragging = false;

  if (target && boardElement.contains(target)) {
    placeSelected(Number(target.dataset.row), Number(target.dataset.col));
  } else {
    clearPreview();
    if (!gameOver) {
      statusElement.textContent = "Choisis une position sur le plateau !";
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
// APERÇU DES LIGNES
// ========================================

function showPreview(row, col) {
  if (
    busy || gameOver || selectedPiece < 0 ||
    !pieces[selectedPiece] || pieces[selectedPiece].used
  ) return;

  clearPreview();

  const piece = pieces[selectedPiece];

  if (!canPlace(piece, row, col)) {
    piece.cells.forEach(([dr,dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;

      const cell = getCell(r,c);
      if (cell) {
        cell.style.backgroundColor = "#ff5364";
        cell.style.opacity = ".65";
      }
    });

    statusElement.textContent = "Impossible ici : choisis une autre position.";
    return;
  }

  const simulated = board.map((line) => line.slice());

  piece.cells.forEach(([dr,dc]) => {
    simulated[row+dr][col+dc] = { color: piece.color };
  });

  const rows = [];
  const cols = [];

  for (let r = 0; r < SIZE; r++) {
    if (simulated[r].every((cell) => cell !== null)) rows.push(r);
  }

  for (let c = 0; c < SIZE; c++) {
    if (simulated.every((line) => line[c] !== null)) cols.push(c);
  }

  piece.cells.forEach(([dr,dc]) => {
    const cell = getCell(row+dr,col+dc);
    if (cell) {
      cell.style.backgroundColor = piece.color;
      cell.style.transform = "scale(.94)";
    }
  });

  const highlighted = new Set();

  rows.forEach((r) => {
    for (let c = 0; c < SIZE; c++) highlighted.add(`${r},${c}`);
  });

  cols.forEach((c) => {
    for (let r = 0; r < SIZE; r++) highlighted.add(`${r},${c}`);
  });

  highlighted.forEach((key) => {
    const [r,c] = key.split(",").map(Number);
    const cell = getCell(r,c);
    if (!cell) return;

    cell.style.backgroundColor = piece.color;
    cell.style.opacity = "1";
    cell.style.transform = "scale(.94)";
    cell.style.boxShadow =
      `inset 0 0 0 2px rgba(255,255,255,.8), 0 0 12px ${piece.color}`;
  });

  statusElement.textContent = highlighted.size
    ? `✨ ${rows.length + cols.length} ligne(s) prête(s) à être effacée(s) !`
    : "Tu peux poser ton bloc ici !";
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
    cell.style.boxShadow = "";
  });
}

function getCell(row, col) {
  return boardElement.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
}

// ========================================
// VALIDATION
// ========================================

function canPlace(piece, row, col) {
  return piece.cells.every(([dr,dc]) => {
    const r = row + dr;
    const c = col + dc;

    return r >= 0 && r < SIZE &&
      c >= 0 && c < SIZE &&
      board[r][c] === null;
  });
}

// ========================================
// PARTICULES ET COMBOS
// ========================================

function burstParticles(cells, color) {
  cells.forEach((key) => {
    const [r,c] = key.split(",").map(Number);
    const cell = getCell(r,c);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();

    for (let i = 0; i < 2; i++) {
      const particle = document.createElement("span");
      particle.className = "hm-particle";
      particle.style.background = color;
      particle.style.left = `${rect.left + rect.width/2}px`;
      particle.style.top = `${rect.top + rect.height/2}px`;
      particle.style.setProperty("--dx", `${(Math.random()-.5)*100}px`);
      particle.style.setProperty("--dy", `${(Math.random()-.5)*100}px`);
      document.body.appendChild(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }
  });
}

function showCombo(count, bonus) {
  if (count >= 2) {
    comboBanner.textContent = `🔥 COMBO ×${count}  +${bonus}`;
  } else {
    comboBanner.textContent = "✨ LIGNE EFFACÉE !";
  }

  comboBanner.classList.remove("show");
  void comboBanner.offsetWidth;
  comboBanner.classList.add("show");

  clearTimeout(comboBannerTimer);
  comboBannerTimer = setTimeout(() => {
    comboBanner.classList.remove("show");
  }, 1000);
}

// ========================================
// POSER UN BLOC
// ========================================

async function placeSelected(row, col) {
  if (
    busy || gameOver || selectedPiece < 0 ||
    !pieces[selectedPiece] || pieces[selectedPiece].used
  ) return;

  const piece = pieces[selectedPiece];

  if (!canPlace(piece,row,col)) {
    statusElement.textContent = "Impossible ici : choisis une autre position.";
    return;
  }

  busy = true;
  clearPreview();

  piece.cells.forEach(([dr,dc]) => {
    board[row+dr][col+dc] = { color: piece.color };
  });

  piece.used = true;
  selectedPiece = -1;
  addScore(piece.cells.length);

  const completedRows = [];
  const completedCols = [];

  for (let r = 0; r < SIZE; r++) {
    if (board[r].every((cell) => cell !== null)) completedRows.push(r);
  }

  for (let c = 0; c < SIZE; c++) {
    if (board.every((line) => line[c] !== null)) completedCols.push(c);
  }

  const clearedCells = new Set();

  completedRows.forEach((r) => {
    for (let c = 0; c < SIZE; c++) clearedCells.add(`${r},${c}`);
  });

  completedCols.forEach((c) => {
    for (let r = 0; r < SIZE; r++) clearedCells.add(`${r},${c}`);
  });

  renderBoard();
  renderPieces();

  if (clearedCells.size > 0) {
    comboCount++;

    const lineCount = completedRows.length + completedCols.length;
    const comboBonus = comboCount > 1 ? (comboCount - 1) * 5 : 0;

    clearedCells.forEach((key) => {
      const [r,c] = key.split(",").map(Number);
      const cell = getCell(r,c);
      if (!cell) return;

      cell.style.backgroundColor = piece.color;
      cell.style.boxShadow =
        `0 0 16px ${piece.color}, inset 0 0 0 2px rgba(255,255,255,.85)`;
      cell.style.transform = "scale(1.08)";
    });

    statusElement.textContent =
      `✨ ${lineCount} ligne(s) effacée(s) !` +
      (comboBonus ? ` Bonus combo : +${comboBonus}` : "");

    burstParticles(clearedCells, piece.color);
    showCombo(lineCount, comboBonus);

    await new Promise((resolve) => setTimeout(resolve, 120));

    clearedCells.forEach((key) => {
      const [r,c] = key.split(",").map(Number);
      const cell = getCell(r,c);
      if (cell) cell.classList.add("flip-clear");
    });

    await new Promise((resolve) => setTimeout(resolve, 480));

    clearedCells.forEach((key) => {
      const [r,c] = key.split(",").map(Number);
      board[r][c] = null;
    });

    addScore(clearedCells.size * 2 + comboBonus);
    renderBoard();
  } else {
    comboCount = 0;
    statusElement.textContent = "Bien joué ! Continue comme ça !";
  }

  if (pieces.every((p) => p.used)) {
    createNewPieces();
    renderPieces();
    statusElement.textContent += " Nouveaux blocs disponibles !";
  }

  renderBoard();
  busy = false;

  if (!hasPossibleMove()) endGame();
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
        if (canPlace(piece,r,c)) return true;
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
// BOUTONS ET DÉMARRAGE
// ========================================

newGameButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

loadTheme();
updateScore();
startGame();