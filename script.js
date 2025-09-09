// ============================================
// TIC-TAC-TOE GAME - COMPLETE IMPLEMENTATION
// ============================================

// ==========================================
// GAME STATE AND CONFIGURATION
// ==========================================

let gameState = {
  board: [],
  currentPlayer: "X",
  isGameOver: false,
  boardSize: 3,
  gameMode: "human-vs-ai",
  aiPlaysAs: "O",
  aiDifficulty: "medium",
  colors: {
    X: "#e74c3c",
    O: "#3498db",
  },
  sound: {
    theme: "classic",
    volume: 0.5,
    muted: false,
  },
  scores: {
    X: 0,
    O: 0,
    draws: 0,
  },
  winningCells: [],
  focusedCell: { row: 0, col: 0 },
};

// ==========================================
// AUDIO MANAGER
// ==========================================

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.backgroundMusic = null;
    this.currentTheme = "classic";
    this.initAudio();
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  playTone(frequency, duration, type = "sine", volume = null) {
    if (
      !this.audioContext ||
      gameState.sound.muted ||
      gameState.sound.volume === 0
    ) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime
      );
      oscillator.type = type;

      const actualVolume =
        volume !== null ? volume : gameState.sound.volume * 0.1;
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        actualVolume,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn("Error playing audio:", e);
    }
  }

  playSequence(notes, noteType = "square") {
    if (
      !this.audioContext ||
      gameState.sound.muted ||
      gameState.sound.volume === 0
    ) {
      return;
    }

    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playTone(
          note.frequency,
          note.duration,
          noteType,
          gameState.sound.volume * 0.15
        );
      }, note.time);
    });
  }

  playMove(player) {
    const themes = {
      classic: {
        X: [{ frequency: 440, duration: 0.1, time: 0 }],
        O: [{ frequency: 330, duration: 0.1, time: 0 }],
      },
      arcade: {
        X: [
          { frequency: 660, duration: 0.05, time: 0 },
          { frequency: 880, duration: 0.05, time: 50 },
        ],
        O: [
          { frequency: 440, duration: 0.05, time: 0 },
          { frequency: 554, duration: 0.05, time: 50 },
        ],
      },
      pacman: {
        X: [
          { frequency: 523, duration: 0.08, time: 0 },
          { frequency: 659, duration: 0.08, time: 80 },
          { frequency: 784, duration: 0.12, time: 160 },
        ],
        O: [
          { frequency: 392, duration: 0.08, time: 0 },
          { frequency: 494, duration: 0.08, time: 80 },
          { frequency: 587, duration: 0.12, time: 160 },
        ],
      },
      chime: {
        X: [{ frequency: 880, duration: 0.15, time: 0 }],
        O: [{ frequency: 554, duration: 0.15, time: 0 }],
      },
    };

    const notes = themes[gameState.sound.theme][player];
    this.playSequence(notes, "square");
  }

  playWin(player) {
    this.stopBackgroundMusic();

    const themes = {
      classic: {
        X: [
          { frequency: 440, duration: 0.3, time: 0 },
          { frequency: 554, duration: 0.3, time: 150 },
          { frequency: 659, duration: 0.5, time: 300 },
        ],
        O: [
          { frequency: 330, duration: 0.3, time: 0 },
          { frequency: 415, duration: 0.3, time: 150 },
          { frequency: 523, duration: 0.5, time: 300 },
        ],
      },
      arcade: {
        X: [
          { frequency: 660, duration: 0.2, time: 0 },
          { frequency: 831, duration: 0.2, time: 100 },
          { frequency: 988, duration: 0.2, time: 200 },
          { frequency: 1175, duration: 0.4, time: 300 },
        ],
        O: [
          { frequency: 440, duration: 0.2, time: 0 },
          { frequency: 554, duration: 0.2, time: 100 },
          { frequency: 659, duration: 0.2, time: 200 },
          { frequency: 880, duration: 0.4, time: 300 },
        ],
      },
      pacman: {
        X: [
          // Victory fanfare inspired by Pac-Man level complete
          { frequency: 523, duration: 0.15, time: 0 },
          { frequency: 659, duration: 0.15, time: 150 },
          { frequency: 784, duration: 0.15, time: 300 },
          { frequency: 1047, duration: 0.15, time: 450 },
          { frequency: 1319, duration: 0.15, time: 600 },
          { frequency: 1047, duration: 0.15, time: 750 },
          { frequency: 1319, duration: 0.3, time: 900 },
        ],
        O: [
          { frequency: 392, duration: 0.15, time: 0 },
          { frequency: 494, duration: 0.15, time: 150 },
          { frequency: 587, duration: 0.15, time: 300 },
          { frequency: 784, duration: 0.15, time: 450 },
          { frequency: 988, duration: 0.15, time: 600 },
          { frequency: 784, duration: 0.15, time: 750 },
          { frequency: 988, duration: 0.3, time: 900 },
        ],
      },
      chime: {
        X: [
          { frequency: 880, duration: 0.25, time: 0 },
          { frequency: 1109, duration: 0.25, time: 200 },
          { frequency: 1319, duration: 0.5, time: 400 },
        ],
        O: [
          { frequency: 554, duration: 0.25, time: 0 },
          { frequency: 698, duration: 0.25, time: 200 },
          { frequency: 831, duration: 0.5, time: 400 },
        ],
      },
    };

    const notes = themes[gameState.sound.theme][player];
    this.playSequence(notes, "triangle");

    // Play victory music after fanfare
    setTimeout(() => this.playVictoryMusic(), 1200);
  }

  playDraw() {
    this.stopBackgroundMusic();

    // Draw sound like Pac-Man death
    const drawNotes = [
      { frequency: 220, duration: 0.2, time: 0 },
      { frequency: 208, duration: 0.2, time: 200 },
      { frequency: 196, duration: 0.2, time: 400 },
      { frequency: 185, duration: 0.2, time: 600 },
      { frequency: 175, duration: 0.3, time: 800 },
    ];

    this.playSequence(drawNotes, "sawtooth");
  }

  playVictoryMusic() {
    if (!this.audioContext || gameState.sound.muted) return;

    // Pac-Man style victory melody
    const victoryMelody = [
      { frequency: 523, duration: 0.3, time: 0 }, // C5
      { frequency: 659, duration: 0.3, time: 300 }, // E5
      { frequency: 784, duration: 0.3, time: 600 }, // G5
      { frequency: 1047, duration: 0.3, time: 900 }, // C6
      { frequency: 784, duration: 0.3, time: 1200 }, // G5
      { frequency: 1047, duration: 0.6, time: 1500 }, // C6
    ];

    this.playSequence(victoryMelody, "square");
  }

  startBackgroundMusic() {
    if (gameState.sound.theme !== "pacman" || gameState.sound.muted) return;

    this.stopBackgroundMusic();
    this.showMusicIndicator(true);
    this.playBackgroundLoop();
  }

  playBackgroundLoop() {
    if (
      !this.audioContext ||
      gameState.sound.muted ||
      gameState.sound.theme !== "pacman"
    ) {
      return;
    }

    // Pac-Man style background melody (simplified)
    const backgroundMelody = [
      { frequency: 523, duration: 0.4, time: 0 }, // C5
      { frequency: 587, duration: 0.4, time: 400 }, // D5
      { frequency: 659, duration: 0.4, time: 800 }, // E5
      { frequency: 698, duration: 0.4, time: 1200 }, // F5
      { frequency: 784, duration: 0.4, time: 1600 }, // G5
      { frequency: 698, duration: 0.4, time: 2000 }, // F5
      { frequency: 659, duration: 0.4, time: 2400 }, // E5
      { frequency: 587, duration: 0.4, time: 2800 }, // D5
    ];

    this.playSequence(backgroundMelody, "square");

    // Schedule next loop
    this.backgroundMusic = setTimeout(() => {
      if (!gameState.isGameOver) {
        this.playBackgroundLoop();
      }
    }, 3200);
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      clearTimeout(this.backgroundMusic);
      this.backgroundMusic = null;
    }
    this.showMusicIndicator(false);
  }

  showMusicIndicator(show) {
    const indicator = document.getElementById("music-indicator");
    if (indicator) {
      if (
        show &&
        gameState.sound.theme === "pacman" &&
        !gameState.sound.muted
      ) {
        indicator.classList.add("active");
      } else {
        indicator.classList.remove("active");
      }
    }
  }

  playGameStart() {
    if (gameState.sound.theme === "pacman") {
      // Pac-Man game start sound
      const startNotes = [
        { frequency: 440, duration: 0.2, time: 0 },
        { frequency: 523, duration: 0.2, time: 200 },
        { frequency: 659, duration: 0.2, time: 400 },
        { frequency: 880, duration: 0.4, time: 600 },
      ];
      this.playSequence(startNotes, "square");

      // Start background music after start sound
      setTimeout(() => this.startBackgroundMusic(), 1000);
    }
  }

  playAIThinking() {
    if (gameState.sound.theme === "pacman" && !gameState.sound.muted) {
      // Subtle "AI thinking" beep
      this.playTone(330, 0.1, "sine", gameState.sound.volume * 0.05);
    }
  }

  setTheme(theme) {
    this.currentTheme = theme;
    if (theme === "pacman" && !gameState.isGameOver) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
  }
}

const audioManager = new AudioManager();

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function createEmptyBoard(size) {
  return Array(size)
    .fill()
    .map(() => Array(size).fill(""));
}

function getCellElement(row, col) {
  return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function updateCSSColors() {
  document.documentElement.style.setProperty("--color-x", gameState.colors.X);
  document.documentElement.style.setProperty("--color-o", gameState.colors.O);
}

// ==========================================
// GAME LOGIC
// ==========================================

function checkWin(board, lastRow, lastCol) {
  const size = board.length;
  const player = board[lastRow][lastCol];
  const winningCells = [];

  // Check row
  let count = 0;
  const rowCells = [];
  for (let col = 0; col < size; col++) {
    if (board[lastRow][col] === player) {
      count++;
      rowCells.push([lastRow, col]);
    }
  }
  if (count === size) {
    return { winner: player, cells: rowCells };
  }

  // Check column
  count = 0;
  const colCells = [];
  for (let row = 0; row < size; row++) {
    if (board[row][lastCol] === player) {
      count++;
      colCells.push([row, lastCol]);
    }
  }
  if (count === size) {
    return { winner: player, cells: colCells };
  }

  // Check main diagonal
  if (lastRow === lastCol) {
    count = 0;
    const diagCells = [];
    for (let i = 0; i < size; i++) {
      if (board[i][i] === player) {
        count++;
        diagCells.push([i, i]);
      }
    }
    if (count === size) {
      return { winner: player, cells: diagCells };
    }
  }

  // Check anti-diagonal
  if (lastRow + lastCol === size - 1) {
    count = 0;
    const antiDiagCells = [];
    for (let i = 0; i < size; i++) {
      if (board[i][size - 1 - i] === player) {
        count++;
        antiDiagCells.push([i, size - 1 - i]);
      }
    }
    if (count === size) {
      return { winner: player, cells: antiDiagCells };
    }
  }

  return null;
}

function isDraw(board) {
  return board.every((row) => row.every((cell) => cell !== ""));
}

function getEmptyCells(board) {
  const emptyCells = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === "") {
        emptyCells.push([row, col]);
      }
    }
  }
  return emptyCells;
}

// ==========================================
// AI IMPLEMENTATION
// ==========================================

function getBestMove(board, player, difficulty) {
  const emptyCells = getEmptyCells(board);

  if (emptyCells.length === 0) return null;

  switch (difficulty) {
    case "easy":
      return getRandomMove(emptyCells);
    case "medium":
      return getMediumMove(board, player, emptyCells);
    case "hard":
      if (board.length === 3) {
        return getMinimaxMove(board, player);
      } else {
        return getMediumMove(board, player, emptyCells);
      }
    default:
      return getRandomMove(emptyCells);
  }
}

function getRandomMove(emptyCells) {
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getMediumMove(board, player, emptyCells) {
  const opponent = player === "X" ? "O" : "X";

  // Try to win
  for (const [row, col] of emptyCells) {
    board[row][col] = player;
    if (checkWin(board, row, col)) {
      board[row][col] = "";
      return [row, col];
    }
    board[row][col] = "";
  }

  // Block opponent from winning
  for (const [row, col] of emptyCells) {
    board[row][col] = opponent;
    if (checkWin(board, row, col)) {
      board[row][col] = "";
      return [row, col];
    }
    board[row][col] = "";
  }

  // Prefer center and corners
  const size = board.length;
  const center = Math.floor(size / 2);

  // Try center
  if (board[center][center] === "") {
    return [center, center];
  }

  // Try corners
  const corners = [
    [0, 0],
    [0, size - 1],
    [size - 1, 0],
    [size - 1, size - 1],
  ];
  const availableCorners = corners.filter(
    ([row, col]) => board[row][col] === ""
  );
  if (availableCorners.length > 0) {
    return availableCorners[
      Math.floor(Math.random() * availableCorners.length)
    ];
  }

  // Random move
  return getRandomMove(emptyCells);
}

function getMinimaxMove(board, player) {
  let bestScore = -Infinity;
  let bestMove = null;
  const emptyCells = getEmptyCells(board);

  for (const [row, col] of emptyCells) {
    board[row][col] = player;
    const score = minimax(board, 0, false, player, -Infinity, Infinity);
    board[row][col] = "";

    if (score > bestScore) {
      bestScore = score;
      bestMove = [row, col];
    }
  }

  return bestMove;
}

function minimax(board, depth, isMaximizing, player, alpha, beta) {
  const opponent = player === "X" ? "O" : "X";

  // Check for terminal states
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] !== "") {
        const result = checkWin(board, row, col);
        if (result) {
          return result.winner === player ? 10 - depth : depth - 10;
        }
      }
    }
  }

  if (isDraw(board)) {
    return 0;
  }

  const emptyCells = getEmptyCells(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const [row, col] of emptyCells) {
      board[row][col] = player;
      const eval = minimax(board, depth + 1, false, player, alpha, beta);
      board[row][col] = "";
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const [row, col] of emptyCells) {
      board[row][col] = opponent;
      const eval = minimax(board, depth + 1, true, player, alpha, beta);
      board[row][col] = "";
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// ==========================================
// GAME ACTIONS
// ==========================================

function makeMove(row, col, player) {
  if (gameState.board[row][col] !== "" || gameState.isGameOver) {
    return false;
  }

  gameState.board[row][col] = player;
  audioManager.playMove(player);

  const winResult = checkWin(gameState.board, row, col);

  if (winResult) {
    gameState.isGameOver = true;
    gameState.winningCells = winResult.cells;
    gameState.scores[winResult.winner]++;
    audioManager.playWin(winResult.winner);
    saveState();
  } else if (isDraw(gameState.board)) {
    gameState.isGameOver = true;
    gameState.scores.draws++;
    audioManager.playDraw();
    saveState();
  } else {
    switchPlayer();
  }

  renderBoard();
  renderStatus();
  renderScores();

  return true;
}

function switchPlayer() {
  gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
}

function newGame() {
  gameState.board = createEmptyBoard(gameState.boardSize);
  gameState.currentPlayer = "X";
  gameState.isGameOver = false;
  gameState.winningCells = [];
  gameState.focusedCell = { row: 0, col: 0 };

  // Stop any background music and play game start sound
  audioManager.stopBackgroundMusic();
  audioManager.playGameStart();

  renderBoard();
  renderStatus();

  // If AI plays X, make AI move
  if (gameState.gameMode === "human-vs-ai" && gameState.aiPlaysAs === "X") {
    setTimeout(makeAIMove, 300);
  }
}

function makeAIMove() {
  if (gameState.isGameOver || gameState.gameMode !== "human-vs-ai") {
    return;
  }

  const aiPlayer = gameState.aiPlaysAs;
  if (gameState.currentPlayer !== aiPlayer) {
    return;
  }

  document.getElementById("ai-thinking").textContent = "AI is thinking...";
  audioManager.playAIThinking();

  setTimeout(() => {
    const move = getBestMove(gameState.board, aiPlayer, gameState.aiDifficulty);
    if (move) {
      makeMove(move[0], move[1], aiPlayer);
    }
    document.getElementById("ai-thinking").textContent = "";
  }, 500);
}

function resetScores() {
  gameState.scores = { X: 0, O: 0, draws: 0 };
  renderScores();
  saveState();
}

function setBoardSize(size) {
  gameState.boardSize = size;
  newGame();
  saveState();
}

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

function renderBoard() {
  const boardElement = document.getElementById("game-board");
  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${gameState.boardSize}, 1fr)`;

  // Apply Pac-Man theme class
  if (gameState.sound.theme === "pacman") {
    boardElement.classList.add("pacman-theme");
  } else {
    boardElement.classList.remove("pacman-theme");
  }

  for (let row = 0; row < gameState.boardSize; row++) {
    for (let col = 0; col < gameState.boardSize; col++) {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      cell.setAttribute("data-row", row);
      cell.setAttribute("data-col", col);
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Cell ${row + 1}, ${col + 1}`);

      const value = gameState.board[row][col];
      if (value) {
        // Use special characters for Pac-Man theme
        if (gameState.sound.theme === "pacman") {
          cell.textContent = value === "X" ? "●" : "👻";
        } else {
          cell.textContent = value;
        }
        cell.classList.add("occupied", value.toLowerCase());
        cell.setAttribute(
          "aria-label",
          `Cell ${row + 1}, ${col + 1}: ${value}`
        );
      }

      if (gameState.winningCells.some(([r, c]) => r === row && c === col)) {
        cell.classList.add("winning");
      }

      cell.addEventListener("click", () => handleCellClick(row, col));
      cell.addEventListener("keydown", (e) => handleCellKeydown(e, row, col));

      boardElement.appendChild(cell);
    }
  }
}

function renderStatus() {
  const statusElement = document.getElementById("game-status");

  if (gameState.isGameOver) {
    if (gameState.winningCells.length > 0) {
      const winner =
        gameState.board[gameState.winningCells[0][0]][
          gameState.winningCells[0][1]
        ];
      statusElement.textContent = `Player ${winner} wins!`;
    } else {
      statusElement.textContent = "It's a draw!";
    }
  } else {
    statusElement.textContent = `Player ${gameState.currentPlayer}'s turn`;
  }
}

function renderScores() {
  document.getElementById("score-x").textContent = gameState.scores.X;
  document.getElementById("score-o").textContent = gameState.scores.O;
  document.getElementById("score-draws").textContent = gameState.scores.draws;
}

function renderSettings() {
  document.getElementById("board-size").value = gameState.boardSize;
  document.getElementById("game-mode").value = gameState.gameMode;
  document.getElementById("ai-plays-as").value = gameState.aiPlaysAs;
  document.getElementById("ai-difficulty").value = gameState.aiDifficulty;
  document.getElementById("color-x").value = gameState.colors.X;
  document.getElementById("color-o").value = gameState.colors.O;
  document.getElementById("sound-theme").value = gameState.sound.theme;
  document.getElementById("volume").value = Math.round(
    gameState.sound.volume * 100
  );
  document.getElementById("volume-display").textContent = `${Math.round(
    gameState.sound.volume * 100
  )}%`;
  document.getElementById("mute-toggle").textContent = gameState.sound.muted
    ? "🔇"
    : "🔊";

  const aiControls = document.getElementById("ai-controls");
  if (gameState.gameMode === "human-vs-ai") {
    aiControls.classList.remove("hidden");
  } else {
    aiControls.classList.add("hidden");
  }

  updateCSSColors();
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function handleCellClick(row, col) {
  if (gameState.isGameOver) return;

  if (gameState.gameMode === "human-vs-ai") {
    const humanPlayer = gameState.aiPlaysAs === "X" ? "O" : "X";
    if (gameState.currentPlayer === humanPlayer) {
      if (makeMove(row, col, humanPlayer)) {
        setTimeout(makeAIMove, 300);
      }
    }
  } else {
    makeMove(row, col, gameState.currentPlayer);
  }
}

function handleCellKeydown(e, row, col) {
  switch (e.key) {
    case "Enter":
    case " ":
      e.preventDefault();
      handleCellClick(row, col);
      break;
    case "ArrowUp":
      e.preventDefault();
      moveFocus(row - 1, col);
      break;
    case "ArrowDown":
      e.preventDefault();
      moveFocus(row + 1, col);
      break;
    case "ArrowLeft":
      e.preventDefault();
      moveFocus(row, col - 1);
      break;
    case "ArrowRight":
      e.preventDefault();
      moveFocus(row, col + 1);
      break;
  }
}

function moveFocus(row, col) {
  if (
    row < 0 ||
    row >= gameState.boardSize ||
    col < 0 ||
    col >= gameState.boardSize
  ) {
    return;
  }

  gameState.focusedCell = { row, col };
  const cell = getCellElement(row, col);
  if (cell) {
    cell.focus();
  }
}

// ==========================================
// PERSISTENCE
// ==========================================

function saveState() {
  try {
    localStorage.setItem(
      "ticTacToeState",
      JSON.stringify({
        scores: gameState.scores,
        boardSize: gameState.boardSize,
        gameMode: gameState.gameMode,
        aiPlaysAs: gameState.aiPlaysAs,
        aiDifficulty: gameState.aiDifficulty,
        colors: gameState.colors,
        sound: gameState.sound,
      })
    );
  } catch (e) {
    console.warn("Could not save state to localStorage:", e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem("ticTacToeState");
    if (saved) {
      const parsedState = JSON.parse(saved);
      gameState.scores = parsedState.scores || { X: 0, O: 0, draws: 0 };
      gameState.boardSize = parsedState.boardSize || 3;
      gameState.gameMode = parsedState.gameMode || "human-vs-ai";
      gameState.aiPlaysAs = parsedState.aiPlaysAs || "O";
      gameState.aiDifficulty = parsedState.aiDifficulty || "medium";
      gameState.colors = parsedState.colors || { X: "#e74c3c", O: "#3498db" };
      gameState.sound = parsedState.sound || {
        theme: "classic",
        volume: 0.5,
        muted: false,
      };
    }
  } catch (e) {
    console.warn("Could not load state from localStorage:", e);
  }
}

// ==========================================
// UI BINDING
// ==========================================

function bindUI() {
  // Board size
  document.getElementById("board-size").addEventListener("change", (e) => {
    setBoardSize(parseInt(e.target.value));
  });

  // Game mode
  document.getElementById("game-mode").addEventListener("change", (e) => {
    gameState.gameMode = e.target.value;
    renderSettings();
    newGame();
    saveState();
  });

  // AI settings
  document.getElementById("ai-plays-as").addEventListener("change", (e) => {
    gameState.aiPlaysAs = e.target.value;
    newGame();
    saveState();
  });

  document.getElementById("ai-difficulty").addEventListener("change", (e) => {
    gameState.aiDifficulty = e.target.value;
    saveState();
  });

  // Colors
  document.getElementById("color-x").addEventListener("change", (e) => {
    gameState.colors.X = e.target.value;
    updateCSSColors();
    saveState();
  });

  document.getElementById("color-o").addEventListener("change", (e) => {
    gameState.colors.O = e.target.value;
    updateCSSColors();
    saveState();
  });

  // Sound controls
  document.getElementById("sound-theme").addEventListener("change", (e) => {
    gameState.sound.theme = e.target.value;
    audioManager.setTheme(e.target.value);
    saveState();
  });

  document.getElementById("volume").addEventListener("input", (e) => {
    gameState.sound.volume = e.target.value / 100;
    document.getElementById(
      "volume-display"
    ).textContent = `${e.target.value}%`;
    saveState();
  });

  document.getElementById("mute-toggle").addEventListener("click", () => {
    gameState.sound.muted = !gameState.sound.muted;
    document.getElementById("mute-toggle").textContent = gameState.sound.muted
      ? "🔇"
      : "🔊";
    saveState();
  });

  // Game controls
  document.getElementById("new-game").addEventListener("click", newGame);
  document
    .getElementById("reset-scores")
    .addEventListener("click", resetScores);

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("board-cell")) {
      document.body.classList.add("keyboard-nav");
    }
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.remove("keyboard-nav");
  });
}

// ==========================================
// INITIALIZATION
// ==========================================

function init() {
  loadState();
  gameState.board = createEmptyBoard(gameState.boardSize);

  bindUI();
  renderSettings();
  renderBoard();
  renderStatus();
  renderScores();

  // Initialize audio context on first user interaction
  document.addEventListener(
    "click",
    () => {
      if (
        audioManager.audioContext &&
        audioManager.audioContext.state === "suspended"
      ) {
        audioManager.audioContext.resume();
      }
    },
    { once: true }
  );

  // If AI plays X, make first move
  if (gameState.gameMode === "human-vs-ai" && gameState.aiPlaysAs === "X") {
    setTimeout(makeAIMove, 500);
  }
}

// Start the game when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
