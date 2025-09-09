// ============================================
// TIC-TAC-TOE GAME - COMPLETE IMPLEMENTATION
// ============================================

// ==========================================
// GAME STATE AND CONFIGURATION
// ==========================================

let gameState = {
    board: [],
    currentPlayer: 'X',
    isGameOver: false,
    boardSize: 3,
    gameMode: 'human-vs-ai',
    aiPlaysAs: 'O',
    aiDifficulty: 'medium',
    colors: {
        X: '#e74c3c',
        O: '#3498db'
    },
    sound: {
        theme: 'classic',
        volume: 0.5,
        muted: false
    },
    scores: {
        X: 0,
        O: 0,
        draws: 0
    },
    winningCells: [],
    focusedCell: { row: 0, col: 0 }
};

// ==========================================
// AUDIO MANAGER
// ==========================================

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || gameState.sound.muted || gameState.sound.volume === 0) {
            return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(gameState.sound.volume * 0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Error playing audio:', e);
        }
    }

    playMove(player) {
        const themes = {
            classic: { X: 440, O: 330 },
            arcade: { X: 660, O: 440 },
            chime: { X: 880, O: 554 }
        };
        
        const frequency = themes[gameState.sound.theme][player];
        this.playTone(frequency, 0.1);
    }

    playWin(player) {
        const themes = {
            classic: { X: [440, 554, 659], O: [330, 415, 523] },
            arcade: { X: [660, 831, 988], O: [440, 554, 659] },
            chime: { X: [880, 1109, 1319], O: [554, 698, 831] }
        };

        const frequencies = themes[gameState.sound.theme][player];
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, 0.3), index * 150);
        });
    }

    playDraw() {
        const frequencies = [220, 247, 262, 220];
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, 0.2), index * 100);
        });
    }
}

const audioManager = new AudioManager();

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function createEmptyBoard(size) {
    return Array(size).fill().map(() => Array(size).fill(''));
}

function getCellElement(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function updateCSSColors() {
    document.documentElement.style.setProperty('--color-x', gameState.colors.X);
    document.documentElement.style.setProperty('--color-o', gameState.colors.O);
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
    return board.every(row => row.every(cell => cell !== ''));
}

function getEmptyCells(board) {
    const emptyCells = [];
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (board[row][col] === '') {
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
        case 'easy':
            return getRandomMove(emptyCells);
        case 'medium':
            return getMediumMove(board, player, emptyCells);
        case 'hard':
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
    const opponent = player === 'X' ? 'O' : 'X';

    // Try to win
    for (const [row, col] of emptyCells) {
        board[row][col] = player;
        if (checkWin(board, row, col)) {
            board[row][col] = '';
            return [row, col];
        }
        board[row][col] = '';
    }

    // Block opponent from winning
    for (const [row, col] of emptyCells) {
        board[row][col] = opponent;
        if (checkWin(board, row, col)) {
            board[row][col] = '';
            return [row, col];
        }
        board[row][col] = '';
    }

    // Prefer center and corners
    const size = board.length;
    const center = Math.floor(size / 2);
    
    // Try center
    if (board[center][center] === '') {
        return [center, center];
    }

    // Try corners
    const corners = [[0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1]];
    const availableCorners = corners.filter(([row, col]) => board[row][col] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
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
        board[row][col] = '';

        if (score > bestScore) {
            bestScore = score;
            bestMove = [row, col];
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing, player, alpha, beta) {
    const opponent = player === 'X' ? 'O' : 'X';
    
    // Check for terminal states
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (board[row][col] !== '') {
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
            board[row][col] = '';
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
            board[row][col] = '';
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
    if (gameState.board[row][col] !== '' || gameState.isGameOver) {
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
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
}

function newGame() {
    gameState.board = createEmptyBoard(gameState.boardSize);
    gameState.currentPlayer = 'X';
    gameState.isGameOver = false;
    gameState.winningCells = [];
    gameState.focusedCell = { row: 0, col: 0 };
    
    renderBoard();
    renderStatus();
    
    // If AI plays X, make AI move
    if (gameState.gameMode === 'human-vs-ai' && gameState.aiPlaysAs === 'X') {
        setTimeout(makeAIMove, 300);
    }
}

function makeAIMove() {
    if (gameState.isGameOver || gameState.gameMode !== 'human-vs-ai') {
        return;
    }

    const aiPlayer = gameState.aiPlaysAs;
    if (gameState.currentPlayer !== aiPlayer) {
        return;
    }

    document.getElementById('ai-thinking').textContent = 'AI is thinking...';
    
    setTimeout(() => {
        const move = getBestMove(gameState.board, aiPlayer, gameState.aiDifficulty);
        if (move) {
            makeMove(move[0], move[1], aiPlayer);
        }
        document.getElementById('ai-thinking').textContent = '';
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
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${gameState.boardSize}, 1fr)`;

    for (let row = 0; row < gameState.boardSize; row++) {
        for (let col = 0; col < gameState.boardSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', `Cell ${row + 1}, ${col + 1}`);

            const value = gameState.board[row][col];
            if (value) {
                cell.textContent = value;
                cell.classList.add('occupied', value.toLowerCase());
                cell.setAttribute('aria-label', `Cell ${row + 1}, ${col + 1}: ${value}`);
            }

            if (gameState.winningCells.some(([r, c]) => r === row && c === col)) {
                cell.classList.add('winning');
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            cell.addEventListener('keydown', (e) => handleCellKeydown(e, row, col));

            boardElement.appendChild(cell);
        }
    }
}

function renderStatus() {
    const statusElement = document.getElementById('game-status');
    
    if (gameState.isGameOver) {
        if (gameState.winningCells.length > 0) {
            const winner = gameState.board[gameState.winningCells[0][0]][gameState.winningCells[0][1]];
            statusElement.textContent = `Player ${winner} wins!`;
        } else {
            statusElement.textContent = "It's a draw!";
        }
    } else {
        statusElement.textContent = `Player ${gameState.currentPlayer}'s turn`;
    }
}

function renderScores() {
    document.getElementById('score-x').textContent = gameState.scores.X;
    document.getElementById('score-o').textContent = gameState.scores.O;
    document.getElementById('score-draws').textContent = gameState.scores.draws;
}

function renderSettings() {
    document.getElementById('board-size').value = gameState.boardSize;
    document.getElementById('game-mode').value = gameState.gameMode;
    document.getElementById('ai-plays-as').value = gameState.aiPlaysAs;
    document.getElementById('ai-difficulty').value = gameState.aiDifficulty;
    document.getElementById('color-x').value = gameState.colors.X;
    document.getElementById('color-o').value = gameState.colors.O;
    document.getElementById('sound-theme').value = gameState.sound.theme;
    document.getElementById('volume').value = Math.round(gameState.sound.volume * 100);
    document.getElementById('volume-display').textContent = `${Math.round(gameState.sound.volume * 100)}%`;
    document.getElementById('mute-toggle').textContent = gameState.sound.muted ? '🔇' : '🔊';

    const aiControls = document.getElementById('ai-controls');
    if (gameState.gameMode === 'human-vs-ai') {
        aiControls.classList.remove('hidden');
    } else {
        aiControls.classList.add('hidden');
    }

    updateCSSColors();
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function handleCellClick(row, col) {
    if (gameState.isGameOver) return;
    
    if (gameState.gameMode === 'human-vs-ai') {
        const humanPlayer = gameState.aiPlaysAs === 'X' ? 'O' : 'X';
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
        case 'Enter':
        case ' ':
            e.preventDefault();
            handleCellClick(row, col);
            break;
        case 'ArrowUp':
            e.preventDefault();
            moveFocus(row - 1, col);
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveFocus(row + 1, col);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            moveFocus(row, col - 1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveFocus(row, col + 1);
            break;
    }
}

function moveFocus(row, col) {
    if (row < 0 || row >= gameState.boardSize || col < 0 || col >= gameState.boardSize) {
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
        localStorage.setItem('ticTacToeState', JSON.stringify({
            scores: gameState.scores,
            boardSize: gameState.boardSize,
            gameMode: gameState.gameMode,
            aiPlaysAs: gameState.aiPlaysAs,
            aiDifficulty: gameState.aiDifficulty,
            colors: gameState.colors,
            sound: gameState.sound
        }));
    } catch (e) {
        console.warn('Could not save state to localStorage:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('ticTacToeState');
        if (saved) {
            const parsedState = JSON.parse(saved);
            gameState.scores = parsedState.scores || { X: 0, O: 0, draws: 0 };
            gameState.boardSize = parsedState.boardSize || 3;
            gameState.gameMode = parsedState.gameMode || 'human-vs-ai';
            gameState.aiPlaysAs = parsedState.aiPlaysAs || 'O';
            gameState.aiDifficulty = parsedState.aiDifficulty || 'medium';
            gameState.colors = parsedState.colors || { X: '#e74c3c', O: '#3498db' };
            gameState.sound = parsedState.sound || { theme: 'classic', volume: 0.5, muted: false };
        }
    } catch (e) {
        console.warn('Could not load state from localStorage:', e);
    }
}

// ==========================================
// UI BINDING
// ==========================================

function bindUI() {
    // Board size
    document.getElementById('board-size').addEventListener('change', (e) => {
        setBoardSize(parseInt(e.target.value));
    });

    // Game mode
    document.getElementById('game-mode').addEventListener('change', (e) => {
        gameState.gameMode = e.target.value;
        renderSettings();
        newGame();
        saveState();
    });

    // AI settings
    document.getElementById('ai-plays-as').addEventListener('change', (e) => {
        gameState.aiPlaysAs = e.target.value;
        newGame();
        saveState();
    });

    document.getElementById('ai-difficulty').addEventListener('change', (e) => {
        gameState.aiDifficulty = e.target.value;
        saveState();
    });

    // Colors
    document.getElementById('color-x').addEventListener('change', (e) => {
        gameState.colors.X = e.target.value;
        updateCSSColors();
        saveState();
    });

    document.getElementById('color-o').addEventListener('change', (e) => {
        gameState.colors.O = e.target.value;
        updateCSSColors();
        saveState();
    });

    // Sound controls
    document.getElementById('sound-theme').addEventListener('change', (e) => {
        gameState.sound.theme = e.target.value;
        saveState();
    });

    document.getElementById('volume').addEventListener('input', (e) => {
        gameState.sound.volume = e.target.value / 100;
        document.getElementById('volume-display').textContent = `${e.target.value}%`;
        saveState();
    });

    document.getElementById('mute-toggle').addEventListener('click', () => {
        gameState.sound.muted = !gameState.sound.muted;
        document.getElementById('mute-toggle').textContent = gameState.sound.muted ? '🔇' : '🔊';
        saveState();
    });

    // Game controls
    document.getElementById('new-game').addEventListener('click', newGame);
    document.getElementById('reset-scores').addEventListener('click', resetScores);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('board-cell')) {
            document.body.classList.add('keyboard-nav');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-nav');
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
    document.addEventListener('click', () => {
        if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
            audioManager.audioContext.resume();
        }
    }, { once: true });

    // If AI plays X, make first move
    if (gameState.gameMode === 'human-vs-ai' && gameState.aiPlaysAs === 'X') {
        setTimeout(makeAIMove, 500);
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
