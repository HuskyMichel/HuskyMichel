
"use strict";

// ========================================
// BLOCK BLAST — HUSKYMICHEL
// ========================================

const SIZE = 8;
const BEST_KEY = "hm_blockblast_best_v1";
const THEME_KEY = "hm_blockblast_theme_v1";
const MUSIC_KEY = "hm_blockblast_music_enabled_v1";
const MUSIC_VOLUME_KEY = "hm_blockblast_music_volume_v1";

const $ = id => document.getElementById(id);

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
// ANIMATIONS ET STYLE
// Le CSS reste bien dans une chaîne JavaScript.
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
    transition: background-color .12s, transform .14s, box-shadow .14s;
  }

  .board-cell.filled {
    border-top: 2px solid rgba(255,255,255,.38) !important;
    border-left: 2px solid rgba(255,255,255,.2) !important;
    border-bottom: 4px solid rgba(0,0,0,.28) !important;
    box-shadow: inset 0 2px 0 rgba(255,255,255,.16),
                inset 0 -3px 0 rgba(0,0,0,.12),
                0 2px 0 rgba(0,0,0,.12);
  }

  .piece-option {
    position: relative;
    overflow: visible;
    border-radius: 15px !important;
    background: linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.025)) !important;
    box-shadow: 0 6px 0 rgba(0,0,0,.2),
                0 10px 20px rgba(0,0,0,.16),
                inset 0 1px 0 rgba(255,255,255,.12);
    animation: hmPieceFloat 1.65s ease-in-out infinite;
    transition: transform .18s, box-shadow .18s, border-color .18s;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .piece-option:nth-child(2) { animation-delay: -.8s; }
  .piece-option:nth-child(3) { animation-delay: -1.5s; }

  .piece-option:not(:disabled):hover {
    transform: translateY(-5px) scale(1.03);
    box-shadow: 0 10px 0 rgba(0,0,0,.2),
                0 16px 24px rgba(0,0,0,.24);
  }

  .piece-option:disabled {
    animation: hmPieceUsed .3s ease forwards;
  }

  .piece-grid span {
    border-radius: 4px;
    border-top: 2px solid rgba(255,255,255,.42);
    border-left: 1px solid rgba(255,255,255,.24);
    border-bottom: 4px solid rgba(0,0,0,.22);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25),
                0 2px 0 rgba(0,0,0,.12);
  }

  .board-cell.flip-clear {
    z-index: 5;
    animation: hmBlockBurst .48s ease forwards !important;
    pointer-events: none;
  }

  @keyframes hmPieceFloat {
    0%,100% { translate: 0 0; }
    50% { translate: 0 -5px; }
  }

  @keyframes hmPieceUsed {
    to { opacity: .15; transform: scale(.8) rotate(-4deg); }
  }

  @keyframes hmBlockBurst {
    0% { transform: rotateX(0) scale(1); opacity: 1; }
    35% { transform: rotateX(55deg) scale(1.12); opacity: 1; }
    70% { transform: rotateX(100deg) scale(.75); opacity: .65; }
    100% { transform: rotateX(160deg) scale(.1); opacity: 0; }
  }

  .hm-drag-ghost {
    position: fixed;
    z-index: 10002;
    display: grid;
    gap: 4px;
    pointer-events: none;
    transform: translate(-50%,-72%) scale(1.08);
    filter: drop-shadow(0 12px 10px rgba(0,0,0,.48));
    animation: hmGhostFloat .48s ease-in-out infinite alternate;
  }

  .hm-drag-ghost span {
    display: block;
    border-radius: 5px;
    border-top: 2px solid rgba(255,255,255,.55);
    border-left: 1px solid rgba(255,255,255,.3);
    border-bottom: 4px solid rgba(0,0,0,.28);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.28);
  }

  @keyframes hmGhostFloat {
    from { transform: translate(-50%,-72%) scale(1.04); }
    to { transform: translate(-50%,-82%) scale(1.1); }
  }

  .board-cell.hm-preview-valid {
    opacity: .72 !important;
    transform: scale(.92) !important;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.88),
                0 0 15px var(--preview-glow,rgba(70,166,255,.5)) !important;
  }

  .board-cell.hm-preview-invalid {
    opacity: .72 !important;
    transform: scale(.9) !important;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.65),
                0 0 10px rgba(255,83,100,.35) !important;
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
  }

  .hm-music-button {
    background: linear-gradient(145deg,#563d91,#302257);
  }

  .hm-music-button.hm-music-off {
    background: #383c48;
    opacity: .85;
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
  }

  .hm-combo-banner {
    position: fixed;
    z-index: 9999;
    top: 24%;
    left: 50%;
    transform: translate(-50%,12px) scale(.6);
    opacity: 0;
    pointer-events: none;
    padding: 12px 24px;
    border: 2px solid rgba(255,255,255,.6);
    border-radius: 16px;
    background: linear-gradient(135deg,#ffb347,#ff6685,#b16cff);
    color: white;
    font-size: clamp(22px,5vw,40px);
    font-weight: 1000;
    text-align: center;
    box-shadow: 0 8px 30px rgba(177,108,255,.4);
  }

  .hm-combo-banner.show {
    animation: hmComboPop .95s ease forwards;
  }

  @keyframes hmComboPop {
    0% { opacity: 0; transform: translate(-50%,20px) scale(.5); }
    20% { opacity: 1; transform: translate(-50%,0) scale(1.1); }
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
    animation: hmParticleFly .65s ease-out forwards;
  }

  @keyframes hmParticleFly {
    to {
      transform: translate(var(--dx),var(--dy)) rotate(240deg) scale(.1);
      opacity: 0;
    }
  }

  :fullscreen {
    background: #17213b;
  }

  :fullscreen .game-container.hm-fullscreen-layout,
  :-webkit-full-screen .game-container.hm-fullscreen-layout {
    width: 100vw !important;
    max-width: none !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 10px 18px !important;
    overflow: auto !important;
    display: grid !important;
    grid-template-columns: minmax(0,1fr) minmax(220px,28vw) !important;
    grid-template-areas:
      "header header"
      "score score"
      "board pieces"
      "settings settings"
      "footer footer" !important;
    align-content: start !important;
    gap: 10px 16px !important;
  }

  :fullscreen .game-container.hm-fullscreen-layout .top-header { grid-area: header; }
  :fullscreen .game-container.hm-fullscreen-layout .score-panel { grid-area: score; }
  :fullscreen .game-container.hm-fullscreen-layout .board-section { grid-area: board; }
  :fullscreen .game-container.hm-fullscreen-layout .pieces-section { grid-area: pieces; }
  :fullscreen .game-container.hm-fullscreen-layout .settings-panel { grid-area: settings; }
  :fullscreen .game-container.hm-fullscreen-layout .footer-note { grid-area: footer; }

  :fullscreen .game-container.hm-fullscreen-layout #board,
  :fullscreen .game-container.hm-fullscreen-layout .board {
    width: min(100%,62vh) !important;
    margin: auto !important;
  }

  @media (max-width: 700px) {
    :fullscreen .game-container.hm-fullscreen-layout {
      grid-template-columns: minmax(0,1fr) !important;
      grid-template-areas:
        "header" "score" "board" "pieces" "settings" "footer" !important;
    }

    :fullscreen .game-container.hm-fullscreen-layout #board,
    :fullscreen .game-container.hm-fullscreen-layout .board {
      width: min(100%,48vh,88vw) !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .piece-option { animation: none; }
    .board-cell.flip-clear { animation-duration: .2s !important; }
    .hm-combo-banner,.hm-particle { animation-duration: .2s !important; }
  }
`;

document.head.appendChild(style);

// ========================================
// MUSIQUE ARCADE
// ========================================

let audioContext = null;
let musicMaster = null;
let effectsMaster = null;
let musicTimer = null;
let nextMusicNoteTime = 0;
let musicStep = 0;
let musicEnabled = true;
let musicStarted = false;
let musicVolume = .25;

try {
  const savedEnabled = localStorage.getItem(MUSIC_KEY);
  if (savedEnabled !== null) musicEnabled = savedEnabled === "true";

  const savedVolume = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
  if (Number.isFinite(savedVolume) && localStorage.getItem(MUSIC_VOLUME_KEY) !== null) {
    musicVolume = Math.max(0,Math.min(1,savedVolume));
  }
} catch {}

const MELODY = [
  659.25,0,783.99,987.77,
  880,0,783.99,659.25,
  523.25,659.25,783.99,0,
  987.77,880,783.99,0
];

const BASS = [
  130.81,0,130.81,0,
  174.61,0,174.61,0,
  196,0,196,0,
  146.83,0,146.83,0
];

const STEP_DURATION = 60 / 120 / 2;

function createAudioContext() {
  if (audioContext) return true;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;

  audioContext = new AudioContextClass();
  musicMaster = audioContext.createGain();
  musicMaster.gain.value = 0;

  effectsMaster = audioContext.createGain();
  effectsMaster.gain.value = .75;

  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = .005;
  compressor.release.value = .18;

  musicMaster.connect(compressor);
  effectsMaster.connect(compressor);
  compressor.connect(audioContext.destination);

  return true;
}

function playSynthNote(frequency,time,duration,type,volume) {
  if (!audioContext || !musicMaster || frequency <= 0) return;

  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency,time);
  envelope.gain.setValueAtTime(.0001,time);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),time+.012);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);

  oscillator.connect(envelope);
  envelope.connect(musicMaster);
  oscillator.start(time);
  oscillator.stop(time+duration+.03);

  oscillator.addEventListener("ended",() => {
    oscillator.disconnect();
    envelope.disconnect();
  },{once:true});
}

function playKick(time) {
  if (!audioContext || !musicMaster) return;

  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(130,time);
  oscillator.frequency.exponentialRampToValueAtTime(45,time+.12);
  envelope.gain.setValueAtTime(.0001,time);
  envelope.gain.exponentialRampToValueAtTime(.22,time+.008);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+.14);

  oscillator.connect(envelope);
  envelope.connect(musicMaster);
  oscillator.start(time);
  oscillator.stop(time+.16);

  oscillator.addEventListener("ended",() => {
    oscillator.disconnect();
    envelope.disconnect();
  },{once:true});
}

function scheduleMusic() {
  if (!audioContext || !musicEnabled || !musicStarted) return;

  while (nextMusicNoteTime < audioContext.currentTime + .12) {
    const step = musicStep % MELODY.length;
    const time = nextMusicNoteTime;

    if (step % 4 === 0) playKick(time);
    if (MELODY[step] > 0) playSynthNote(MELODY[step],time,.14,"square",.075);
    if (BASS[step] > 0) playSynthNote(BASS[step],time,.2,"triangle",.12);
    if (step === 3 || step === 11) {
      playSynthNote(MELODY[step]*2,time,.08,"square",.025);
    }

    nextMusicNoteTime += STEP_DURATION;
    musicStep++;
  }
}

const musicButton = document.createElement("button");
musicButton.type = "button";
musicButton.className = "hm-music-button";

const musicControls = document.createElement("div");
musicControls.className = "hm-music-controls";

const volumeLabel = document.createElement("label");
volumeLabel.textContent = "Volume musique";

const musicVolumeSlider = document.createElement("input");
musicVolumeSlider.type = "range";
musicVolumeSlider.min = "0";
musicVolumeSlider.max = "100";
musicVolumeSlider.step = "5";
musicVolumeSlider.value = String(Math.round(musicVolume*100));
musicVolumeSlider.setAttribute("aria-label","Volume de la musique");

const musicVolumeValue = document.createElement("span");
musicVolumeValue.textContent = `${Math.round(musicVolume*100)} %`;

volumeLabel.append(musicVolumeSlider,musicVolumeValue);
musicControls.appendChild(volumeLabel);

function updateMusicButton() {
  musicButton.textContent = musicEnabled
    ? (musicStarted ? "♫ Musique : activée" : "♫ Activer la musique")
    : "♪ Musique : désactivée";

  musicButton.classList.toggle("hm-music-off",!musicEnabled);
  musicButton.setAttribute("aria-pressed",String(musicEnabled));
}

function setMusicVolume(value) {
  musicVolume = Math.max(0,Math.min(1,Number(value)));

  try {
    localStorage.setItem(MUSIC_VOLUME_KEY,String(musicVolume));
  } catch {}

  if (musicMaster && audioContext) {
    musicMaster.gain.setTargetAtTime(
      musicEnabled && musicStarted ? musicVolume : 0,
      audioContext.currentTime,.04
    );
  }

  musicVolumeValue.textContent = `${Math.round(musicVolume*100)} %`;
}

async function startMusic() {
  if (!musicEnabled || !createAudioContext()) return;

  try {
    await audioContext.resume();

    if (!musicStarted) {
      musicStarted = true;
      musicStep = 0;
      nextMusicNoteTime = audioContext.currentTime + .05;
      musicTimer = setInterval(scheduleMusic,25);
    }

    musicMaster.gain.setTargetAtTime(musicVolume,audioContext.currentTime,.12);
    updateMusicButton();
  } catch (error) {
    console.warn("Impossible de démarrer la musique :",error);
  }
}

function stopMusic() {
  musicEnabled = false;

  try {
    localStorage.setItem(MUSIC_KEY,"false");
  } catch {}

  if (audioContext && musicMaster) {
    musicMaster.gain.setTargetAtTime(0,audioContext.currentTime,.04);
  }

  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
  musicStarted = false;
  updateMusicButton();
}

async function toggleMusic() {
  if (musicEnabled) {
    stopMusic();
  } else {
    musicEnabled = true;
    try {
      localStorage.setItem(MUSIC_KEY,"true");
    } catch {}
    await startMusic();
  }

  updateMusicButton();
}

musicButton.addEventListener("click",toggleMusic);
musicVolumeSlider.addEventListener("input",() => {
  setMusicVolume(Number(musicVolumeSlider.value)/100);
});

const gameContainer =
  document.querySelector(".game-container") ||
  document.querySelector("#game-container") ||
  boardElement.closest("main") ||
  document.body;

const actionsContainer = document.querySelector(".game-actions");

if (!gameContainer.contains(modalElement)) gameContainer.appendChild(modalElement);

if (actionsContainer) {
  actionsContainer.prepend(musicControls);
  actionsContainer.prepend(musicButton);
} else {
  boardElement.parentElement.insertBefore(musicControls,boardElement);
  boardElement.parentElement.insertBefore(musicButton,musicControls);
}

updateMusicButton();
setMusicVolume(musicVolume);

document.addEventListener("pointerdown",event => {
  if (musicButton.contains(event.target)) return;
  if (musicEnabled && !musicStarted) startMusic();
},true);

document.addEventListener("keydown",event => {
  if (event.repeat || !musicEnabled || musicStarted) return;
  startMusic();
});

document.addEventListener("visibilitychange",async () => {
  if (!document.hidden && musicEnabled && musicStarted && audioContext) {
    try { await audioContext.resume(); } catch {}
  }
});

// ========================================
// PLEIN ÉCRAN
// ========================================

const fullscreenButton = document.createElement("button");
fullscreenButton.type = "button";
fullscreenButton.className = "hm-fullscreen-button";
fullscreenButton.textContent = "⛶ Plein écran";

if (actionsContainer) {
  actionsContainer.prepend(fullscreenButton);
} else {
  boardElement.parentElement.insertBefore(fullscreenButton,boardElement);
}

fullscreenButton.addEventListener("click",async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await gameContainer.requestFullscreen();
    }
  } catch {
    statusElement.textContent = "Le plein écran n'est pas disponible sur ce navigateur.";
  }
});

document.addEventListener("fullscreenchange",() => {
  const isFullscreen = document.fullscreenElement === gameContainer;
  fullscreenButton.textContent = isFullscreen
    ? "⛶ Quitter le plein écran"
    : "⛶ Plein écran";

  gameContainer.classList.toggle("hm-fullscreen-layout",isFullscreen);
  renderBoard();
  renderPieces();
});

// ========================================
// EFFETS SONORES ET VOIX
// ========================================

let lastAnnouncementTime = 0;

function playEffectTone(frequency,duration,type="sine",volume=.2) {
  if (!createAudioContext()) return;

  audioContext.resume().then(() => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(volume,now+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);

    oscillator.connect(gain);
    gain.connect(effectsMaster);
    oscillator.start(now);
    oscillator.stop(now+duration+.02);

    oscillator.addEventListener("ended",() => {
      oscillator.disconnect();
      gain.disconnect();
    },{once:true});
  }).catch(() => {});
}

function playPlaceSound() {
  playEffectTone(420,.07,"triangle",.18);
}

function playClearSound(lineCount=1) {
  playEffectTone(520,.12,"sine",.22);
  if (lineCount >= 2) setTimeout(() => playEffectTone(780,.16,"triangle",.25),90);
  if (lineCount >= 4) setTimeout(() => playEffectTone(1040,.22,"sine",.3),180);
}

function playPerfectClearSound() {
  [523.25,659.25,783.99,1046.5].forEach((frequency,index) => {
    setTimeout(() => playEffectTone(frequency,.3,"triangle",.3),index*110);
  });
}

function announceGameEvent(message) {
  if (!("speechSynthesis" in window)) return;

  const now = Date.now();
  if (now-lastAnnouncementTime < 900) return;
  lastAnnouncementTime = now;

  window.speechSynthesis.cancel();
  const announcement = new SpeechSynthesisUtterance(message);
  announcement.lang = "en-US";
  announcement.rate = 1.08;
  announcement.pitch = 1.12;
  announcement.volume = .85;
  window.speechSynthesis.speak(announcement);
}

// ========================================
// FORMES, COULEURS ET ÉTAT DU JEU
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
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],
  [[0,0],[0,1],[0,2],[1,1]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,1],[1,0],[1,1],[1,2]],
  [[0,1],[1,1],[2,1],[1,0]],
  [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[0,1],[0,2],[1,0]],
  [[0,0],[0,1],[1,1],[2,1]],
  [[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[1,1],[2,1]],
  [[0,1],[1,0],[1,1],[2,0]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2],[0,3],[0,4]],
  [[0,0],[1,0],[2,0],[3,0],[4,0]]
];

const COLORS = [
  "#46a6ff","#b16cff","#ffb347","#42d6a4",
  "#ff6685","#ffe066","#58d7e8"
];

let board = [];
let pieces = [];
let selectedPiece = -1;
let score = 0;
let bestScore = 0;
let busy = false;
let gameOver = false;
let dragging = false;
let dragGhost = null;
let comboCount = 0;
let comboBannerTimer = null;

const comboBanner = document.createElement("div");
comboBanner.className = "hm-combo-banner";
comboBanner.setAttribute("aria-live","polite");
document.body.appendChild(comboBanner);

// ========================================
// THÈMES ET SAUVEGARDE
// ========================================

function loadTheme() {
  let saved = "blue";

  try {
    saved = localStorage.getItem(THEME_KEY) || "blue";
  } catch {}

  if (!["blue","purple","green","orange"].includes(saved)) saved = "blue";

  themeSelect.value = saved;
  document.body.dataset.theme = saved;
  document.documentElement.style.setProperty("--arcade-blue",
    ({blue:"#46a6ff",purple:"#b16cff",green:"#42d6a4",orange:"#ffb347"})[saved]);
}

themeSelect.addEventListener("change",() => {
  const selected = ["blue","purple","green","orange"].includes(themeSelect.value)
    ? themeSelect.value : "blue";

  themeSelect.value = selected;
  document.body.dataset.theme = selected;
  document.documentElement.style.setProperty("--arcade-blue",
    ({blue:"#46a6ff",purple:"#b16cff",green:"#42d6a4",orange:"#ffb347"})[selected]);

  try {
    localStorage.setItem(THEME_KEY,selected);
  } catch {}
});

function readBestScore() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem(BEST_KEY,String(bestScore));
  } catch {}
}

function updateScore() {
  scoreElement.textContent = String(score);
  bestScoreElement.textContent = String(bestScore);
}

function addScore(points) {
  score += points;

  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }

  updateScore();
}

// ========================================
// NOUVELLE PARTIE ET PIÈCES
// ========================================

function randomPiece() {
  const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];

  return {
    cells: shape.map(([r,c]) => [r,c]),
    color: COLORS[Math.floor(Math.random()*COLORS.length)],
    used: false
  };
}

function createNewPieces() {
  pieces = [randomPiece(),randomPiece(),randomPiece()];
  selectedPiece = -1;
}

function startGame() {
  board = Array.from({length:SIZE},() => Array(SIZE).fill(null));
  pieces = [];
  selectedPiece = -1;
  score = 0;
  comboCount = 0;
  busy = false;
  gameOver = false;
  dragging = false;

  removeDragGhost();
  modalElement.classList.add("hidden");
  comboBanner.classList.remove("show");

  createNewPieces();
  updateScore();
  statusElement.textContent = "À toi de jouer !";

  renderBoard();
  renderPieces();
}

function getCell(row,col) {
  return boardElement.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
}

function canPlace(piece,row,col) {
  if (!piece) return false;

  return piece.cells.every(([dr,dc]) => {
    const r = row+dr;
    const c = col+dc;

    return r >= 0 && r < SIZE &&
      c >= 0 && c < SIZE &&
      board[r][c] === null;
  });
}

// ========================================
// DESSIN DU PLATEAU
// ========================================

function renderBoard() {
  boardElement.replaceChildren();
  boardElement.style.display = "grid";
  boardElement.style.gridTemplateColumns = `repeat(${SIZE},minmax(0,1fr))`;

  for (let r=0;r<SIZE;r++) {
    for (let c=0;c<SIZE;c++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "board-cell";
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      cell.setAttribute("aria-label",`Ligne ${r+1}, colonne ${c+1}`);
      cell.style.minWidth = "0";
      cell.style.aspectRatio = "1";
      cell.style.padding = "0";
      cell.style.touchAction = "none";

      const value = board[r][c];

      if (value) {
        cell.classList.add("filled");
        cell.style.backgroundColor = value.color;
      }

      cell.addEventListener("click",() => {
        if (!dragging) placeSelected(r,c);
      });

      cell.addEventListener("pointerenter",() => {
        if (selectedPiece !== -1 && !busy) showPreview(r,c);
      });

      boardElement.appendChild(cell);
    }
  }
}

function renderPieces() {
  piecesElement.replaceChildren();
  piecesElement.style.display = "grid";
  piecesElement.style.gridTemplateColumns = "repeat(3,minmax(0,1fr))";
  piecesElement.style.gap = "10px";

  pieces.forEach((piece,index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "piece-option";
    button.disabled = piece.used || gameOver;
    button.setAttribute("aria-label",`Sélectionner le bloc ${index+1}`);
    button.style.minWidth = "0";
    button.style.minHeight = "100px";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.style.padding = "8px";
    button.style.border = selectedPiece === index
      ? "2px solid white" : "2px solid rgba(255,255,255,.1)";
    button.style.background = selectedPiece === index
      ? "rgba(70,166,255,.22)" : "rgba(255,255,255,.04)";
    button.style.opacity = piece.used ? ".2" : "1";

    const maxRow = Math.max(...piece.cells.map(([r]) => r))+1;
    const maxCol = Math.max(...piece.cells.map(([,c]) => c))+1;

    const shape = document.createElement("div");
    shape.className = "piece-grid";
    shape.style.display = "grid";
    shape.style.gridTemplateColumns = `repeat(${maxCol},19px)`;
    shape.style.gridTemplateRows = `repeat(${maxRow},19px)`;
    shape.style.gap = "3px";
    shape.style.pointerEvents = "none";

    for (let r=0;r<maxRow;r++) {
      for (let c=0;c<maxCol;c++) {
        const block = document.createElement("span");
        const filled = piece.cells.some(([pr,pc]) => pr===r && pc===c);

        block.style.width = "19px";
        block.style.height = "19px";
        block.style.borderRadius = "4px";

        if (filled) {
          block.style.backgroundColor = piece.color;
        } else {
          block.style.visibility = "hidden";
          block.style.border = "none";
          block.style.boxShadow = "none";
        }

        shape.appendChild(block);
      }
    }

    button.appendChild(shape);

    button.addEventListener("click",() => {
      if (busy || gameOver || piece.used || dragging) return;

      selectedPiece = selectedPiece === index ? -1 : index;
      renderPieces();
      renderBoard();
      clearPreview();

      if (selectedPiece !== -1) {
        statusElement.textContent = "Place ton bloc sur le plateau !";
      }
    });

    button.addEventListener("pointerdown",event => {
      if (busy || gameOver || piece.used) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      selectedPiece = index;
      dragging = true;
      createDragGhost(piece,event.clientX,event.clientY);
      renderBoard();
      renderPieces();
    });

    piecesElement.appendChild(button);
  });
}

// ========================================
// GLISSER-DÉPOSER
// ========================================

function createDragGhost(piece,x,y) {
  removeDragGhost();

  const maxRow = Math.max(...piece.cells.map(([r]) => r))+1;
  const maxCol = Math.max(...piece.cells.map(([,c]) => c))+1;
  const rect = boardElement.getBoundingClientRect();
  const gap = Math.max(2,parseFloat(getComputedStyle(boardElement).gap)||4);
  const cellSize = Math.max(15,Math.min(34,(rect.width-14-gap*(SIZE-1))/SIZE));

  dragGhost = document.createElement("div");
  dragGhost.className = "hm-drag-ghost";
  dragGhost.style.gridTemplateColumns = `repeat(${maxCol},${cellSize}px)`;
  dragGhost.style.gridTemplateRows = `repeat(${maxRow},${cellSize}px)`;

  for (let r=0;r<maxRow;r++) {
    for (let c=0;c<maxCol;c++) {
      const block = document.createElement("span");
      const filled = piece.cells.some(([pr,pc]) => pr===r && pc===c);

      if (filled) {
        block.style.backgroundColor = piece.color;
      } else {
        block.style.visibility = "hidden";
      }

      dragGhost.appendChild(block);
    }
  }

  (document.fullscreenElement || gameContainer).appendChild(dragGhost);
  moveDragGhost(x,y);
}

function moveDragGhost(x,y) {
  if (!dragGhost) return;
  dragGhost.style.left = `${x}px`;
  dragGhost.style.top = `${y}px`;
}

function removeDragGhost() {
  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }
}

document.addEventListener("pointermove",event => {
  if (!dragging || selectedPiece < 0 || busy) return;

  moveDragGhost(event.clientX,event.clientY);

  const element = document.elementFromPoint(event.clientX,event.clientY);
  const target = element instanceof Element ? element.closest(".board-cell") : null;

  if (target && boardElement.contains(target)) {
    showPreview(Number(target.dataset.row),Number(target.dataset.col));
  } else {
    clearPreview();
  }
});

document.addEventListener("pointerup",event => {
  if (!dragging) return;

  const element = document.elementFromPoint(event.clientX,event.clientY);
  const target = element instanceof Element ? element.closest(".board-cell") : null;

  dragging = false;
  removeDragGhost();

  if (target && boardElement.contains(target)) {
    placeSelected(Number(target.dataset.row),Number(target.dataset.col));
  } else {
    clearPreview();
    renderBoard();
    renderPieces();
  }
});

document.addEventListener("pointercancel",() => {
  if (!dragging) return;

  dragging = false;
  removeDragGhost();
  clearPreview();
  renderBoard();
  renderPieces();
});

// ========================================
// APERÇU DE PLACEMENT ET DE LIGNES
// ========================================

function showPreview(row,col) {
  if (busy || gameOver || selectedPiece < 0) return;

  const piece = pieces[selectedPiece];
  if (!piece || piece.used) return;

  clearPreview();

  if (!canPlace(piece,row,col)) {
    piece.cells.forEach(([dr,dc]) => {
      const r = row+dr;
      const c = col+dc;
      if (r<0 || r>=SIZE || c<0 || c>=SIZE) return;

      const cell = getCell(r,c);
      if (!cell) return;

      cell.classList.add("hm-preview-invalid");
      cell.style.backgroundColor = "#ff5364";
    });

    statusElement.textContent = "Impossible ici : choisis une autre position.";
    return;
  }

  const simulated = board.map(line => line.slice());

  piece.cells.forEach(([dr,dc]) => {
    simulated[row+dr][col+dc] = {color:piece.color};
  });

  const rows = [];
  const cols = [];

  for (let r=0;r<SIZE;r++) {
    if (simulated[r].every(Boolean)) rows.push(r);
  }

  for (let c=0;c<SIZE;c++) {
    if (simulated.every(line => Boolean(line[c]))) cols.push(c);
  }

  piece.cells.forEach(([dr,dc]) => {
    const cell = getCell(row+dr,col+dc);
    if (!cell) return;

    cell.classList.add("hm-preview-valid");
    cell.style.backgroundColor = piece.color;
    cell.style.setProperty("--preview-glow",piece.color);
  });

  const highlighted = new Set();

  rows.forEach(r => {
    for (let c=0;c<SIZE;c++) highlighted.add(`${r},${c}`);
  });

  cols.forEach(c => {
    for (let r=0;r<SIZE;r++) highlighted.add(`${r},${c}`);
  });

  highlighted.forEach(key => {
    const [r,c] = key.split(",").map(Number);
    const cell = getCell(r,c);
    if (!cell) return;

    cell.style.backgroundColor = piece.color;
    cell.style.setProperty("--preview-glow",piece.color);
  });

  statusElement.textContent = highlighted.size
    ? `✨ ${rows.length+cols.length} ligne(s) prête(s) à être effacée(s) !`
    : "Tu peux poser ton bloc ici !";
}

function clearPreview() {
  boardElement.querySelectorAll(".board-cell").forEach(cell => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    const value = board[r][c];

    cell.classList.remove("flip-clear","hm-preview-valid","hm-preview-invalid");
    cell.style.removeProperty("--preview-glow");
    cell.style.backgroundColor = value ? value.color : "";
    cell.style.opacity = "1";
    cell.style.transform = "";
    cell.style.boxShadow = "";
  });
}

// ========================================
// SCORE, EFFACEMENT ET COMBOS
// ========================================

function showCombo(count,bonus) {
  comboBanner.textContent = count >= 4
    ? `INCREDIBLE! +${bonus}`
    : count >= 2
      ? `AMAZING! COMBO ×${count} +${bonus}`
      : "NICE! LINE CLEARED";

  comboBanner.classList.remove("show");
  void comboBanner.offsetWidth;
  comboBanner.classList.add("show");

  clearTimeout(comboBannerTimer);
  comboBannerTimer = setTimeout(() => {
    comboBanner.classList.remove("show");
  },1000);
}

function burstParticles(keys,color) {
  keys.forEach(key => {
    const [r,c] = key.split(",").map(Number);
    const cell = getCell(r,c);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();

    for (let i=0;i<2;i++) {
      const particle = document.createElement("span");
      particle.className = "hm-particle";
      particle.style.background = color;
      particle.style.left = `${rect.left+rect.width/2}px`;
      particle.style.top = `${rect.top+rect.height/2}px`;
      particle.style.setProperty("--dx",`${(Math.random()-.5)*100}px`);
      particle.style.setProperty("--dy",`${(Math.random()-.5)*100}px`);
      document.body.appendChild(particle);
      particle.addEventListener("animationend",() => particle.remove(),{once:true});
    }
  });
}

async function placeSelected(row,col) {
  if (busy || gameOver || selectedPiece < 0) return;

  const piece = pieces[selectedPiece];
  if (!piece || piece.used) return;

  if (!canPlace(piece,row,col)) {
    statusElement.textContent = "Impossible ici : choisis une autre position.";
    return;
  }

  busy = true;
  clearPreview();

  piece.cells.forEach(([dr,dc]) => {
    board[row+dr][col+dc] = {color:piece.color};
  });

  piece.used = true;
  selectedPiece = -1;
  addScore(piece.cells.length*5);
  playPlaceSound();

  const fullRows = [];
  const fullCols = [];

  for (let r=0;r<SIZE;r++) {
    if (board[r].every(Boolean)) fullRows.push(r);
  }

  for (let c=0;c<SIZE;c++) {
    if (board.every(line => Boolean(line[c]))) fullCols.push(c);
  }

  const cleared = new Set();

  fullRows.forEach(r => {
    for (let c=0;c<SIZE;c++) cleared.add(`${r},${c}`);
  });

  fullCols.forEach(c => {
    for (let r=0;r<SIZE;r++) cleared.add(`${r},${c}`);
  });

  renderBoard();
  renderPieces();

  if (cleared.size) {
    comboCount++;

    const lineCount = fullRows.length+fullCols.length;
    const lineBonus = lineCount*100;
    const multiBonus = lineCount>=2 ? (lineCount-1)*75 : 0;
    const comboBonus = comboCount>1 ? (comboCount-1)*25 : 0;
    const totalBonus = lineBonus+multiBonus+comboBonus;

    cleared.forEach(key => {
      const [r,c] = key.split(",").map(Number);
      const cell = getCell(r,c);
      if (!cell) return;

      cell.style.backgroundColor = piece.color;
      cell.style.boxShadow = `0 0 16px ${piece.color}, inset 0 0 0 2px rgba(255,255,255,.85)`;
      cell.style.transform = "scale(1.08)";
    });

    statusElement.textContent = `✨ ${lineCount} ligne(s) effacée(s) !`;
    burstParticles(cleared,piece.color);
    showCombo(lineCount,totalBonus);
    playClearSound(lineCount);

    announceGameEvent(
      lineCount>=4 ? "Incredible!" :
      lineCount>=2 ? "Amazing!" : "Nice!"
    );

    await new Promise(resolve => setTimeout(resolve,120));

    cleared.forEach(key => {
      const [r,c] = key.split(",").map(Number);
      const cell = getCell(r,c);
      if (cell) cell.classList.add("flip-clear");
    });

    await new Promise(resolve => setTimeout(resolve,480));

    cleared.forEach(key => {
      const [r,c] = key.split(",").map(Number);
      board[r][c] = null;
    });

    addScore(cleared.size*2+totalBonus);

    if (board.every(line => line.every(cell => cell===null))) {
      addScore(1000);
      statusElement.textContent = "PERFECT CLEAR! +1000 points !";
      playPerfectClearSound();
      announceGameEvent("Perfect Clear!");
    }
  } else {
    comboCount = 0;
    statusElement.textContent = "Bien joué ! Continue comme ça !";
  }

  if (pieces.every(p => p.used)) {
    createNewPieces();
    statusElement.textContent += " Nouveaux blocs disponibles !";
  }

  renderBoard();
  renderPieces();
  busy = false;

  if (!hasPossibleMove()) endGame();
}

// ========================================
// FIN DE PARTIE
// ========================================

function hasPossibleMove() {
  for (const piece of pieces) {
    if (!piece || piece.used) continue;

    for (let r=0;r<SIZE;r++) {
      for (let c=0;c<SIZE;c++) {
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
  removeDragGhost();

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

newGameButton.addEventListener("click",startGame);
restartButton.addEventListener("click",startGame);

loadTheme();
bestScore = readBestScore();
updateScore();
startGame();
