(function() {
    const canvas = document.getElementById('boardCanvas');
    const ctx = canvas.getContext('2d');
    const turnIndicator = document.getElementById('turnIndicator');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const newGameBtn = document.getElementById('newGameBtn');
    const BOARD_SIZE = 8;
    const CELL_SIZE = canvas.width / BOARD_SIZE;
    const EMPTY = 0;
    const WHITE_MAN = 1;
    const BLACK_MAN = 2;
    const WHITE_KING = 3;
    const BLACK_KING = 4;
    const INITIAL_BOARD = [
        [0, BLACK_MAN, 0, BLACK_MAN, 0, BLACK_MAN, 0, BLACK_MAN],
        [BLACK_MAN, 0, BLACK_MAN, 0, BLACK_MAN, 0, BLACK_MAN, 0],
        [0, BLACK_MAN, 0, BLACK_MAN, 0, BLACK_MAN, 0, BLACK_MAN],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [WHITE_MAN, 0, WHITE_MAN, 0, WHITE_MAN, 0, WHITE_MAN, 0],
        [0, WHITE_MAN, 0, WHITE_MAN, 0, WHITE_MAN, 0, WHITE_MAN],
        [WHITE_MAN, 0, WHITE_MAN, 0, WHITE_MAN, 0, WHITE_MAN, 0]
    ];
    let board = JSON.parse(JSON.stringify(INITIAL_BOARD));
    let currentPlayer = 'white';
    let selectedPiece = null;
    let validMoves = [];
    let gameMode = 'friend';
    let gameOver = false;

    function initGame() {
        board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        currentPlayer = 'white';
        selectedPiece = null;
        validMoves = [];
        gameOver = false;
        updateTurnDisplay();
        drawBoard();
    }

    function updateTurnDisplay() {
        if (gameOver) {
            turnIndicator.textContent = 'Игра окончена';
        } else {
            turnIndicator.textContent = `Ход: ${currentPlayer === 'white' ? 'Белые' : 'Чёрные'}`;
        }
    }

    function isPieceBelongToCurrentPlayer(row, col) {
        const piece = board[row][col];
        if (currentPlayer === 'white') {
            return piece === WHITE_MAN || piece === WHITE_KING;
        } else {
            return piece === BLACK_MAN || piece === BLACK_KING;
        }
    }

    function isKing(piece) {
        return piece === WHITE_KING || piece === BLACK_KING;
    }

    function getAllValidMoves() {
        let moves = [];
        let captures = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isPieceBelongToCurrentPlayer(r, c)) {
                    const pieceMoves = getMovesForPiece(r, c);
                    for (let move of pieceMoves) {
                        if (move.capture) {
                            captures.push(move);
                        } else {
                            moves.push(move);
                        }
                    }
                }
            }
        }
        return captures.length > 0 ? captures : moves;
    }

    function getMovesForPiece(row, col) {
        const piece = board[row][col];
        if (piece === EMPTY) return [];
        const isWhite = (piece === WHITE_MAN || piece === WHITE_KING);
        const isBlack = (piece === BLACK_MAN || piece === BLACK_KING);
        const king = isKing(piece);
        let directions = [];
        if (isWhite) {
            if (king) {
                directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            } else {
                directions = [[-1, -1], [-1, 1]];
            }
        } else if (isBlack) {
            if (king) {
                directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            } else {
                directions = [[1, -1], [1, 1]];
            }
        }
        let moves = [];
        for (let [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === EMPTY) {
                moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc, capture: false });
            }
        }
        const captureDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (let [dr, dc] of captureDirections) {
            const midRow = row + dr;
            const midCol = col + dc;
            const landRow = row + 2*dr;
            const landCol = col + 2*dc;
            if (midRow >= 0 && midRow < BOARD_SIZE && midCol >= 0 && midCol < BOARD_SIZE &&
                landRow >= 0 && landRow < BOARD_SIZE && landCol >= 0 && landCol < BOARD_SIZE) {
                const midPiece = board[midRow][midCol];
                if (board[landRow][landCol] === EMPTY) {
                    if (isWhite && (midPiece === BLACK_MAN || midPiece === BLACK_KING)) {
                        moves.push({ fromRow: row, fromCol: col, toRow: landRow, toCol: landCol, capture: true, capturedRow: midRow, capturedCol: midCol });
                    } else if (isBlack && (midPiece === WHITE_MAN || midPiece === WHITE_KING)) {
                        moves.push({ fromRow: row, fromCol: col, toRow: landRow, toCol: landCol, capture: true, capturedRow: midRow, capturedCol: midCol });
                    }
                }
            }
        }
        return moves;
    }

    function makeMove(move) {
        const { fromRow, fromCol, toRow, toCol, capture, capturedRow, capturedCol } = move;
        const piece = board[fromRow][fromCol];
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = EMPTY;
        if (capture) {
            board[capturedRow][capturedCol] = EMPTY;
        }
        if (piece === WHITE_MAN && toRow === 0) {
            board[toRow][toCol] = WHITE_KING;
        } else if (piece === BLACK_MAN && toRow === 7) {
            board[toRow][toCol] = BLACK_KING;
        }
        selectedPiece = null;
        validMoves = [];
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        updateTurnDisplay();
        const nextMoves = getAllValidMovesForPlayer(currentPlayer);
        if (nextMoves.length === 0) {
            gameOver = true;
            updateTurnDisplay();
        }
        drawBoard();
        if (gameMode === 'bot' && currentPlayer === 'black' && !gameOver) {
            setTimeout(botMove, 300);
        }
    }

    function getAllValidMovesForPlayer(player) {
        const originalPlayer = currentPlayer;
        currentPlayer = player;
        const moves = getAllValidMoves();
        currentPlayer = originalPlayer;
        return moves;
    }

    function botMove() {
        if (gameOver) return;
        const moves = getAllValidMovesForPlayer('black');
        if (moves.length === 0) {
            gameOver = true;
            updateTurnDisplay();
            drawBoard();
            return;
        }
        const randomIndex = Math.floor(Math.random() * moves.length);
        const move = moves[randomIndex];
        currentPlayer = 'black';
        makeMove(move);
    }

    function handleCanvasClick(e) {
        if (gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        const col = Math.floor(mouseX / CELL_SIZE);
        const row = Math.floor(mouseY / CELL_SIZE);
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
        if (selectedPiece) {
            const move = validMoves.find(m => m.toRow === row && m.toCol === col);
            if (move) {
                makeMove(move);
                return;
            }
        }
        if (isPieceBelongToCurrentPlayer(row, col)) {
            selectedPiece = { row, col };
            const allMoves = getAllValidMoves();
            validMoves = allMoves.filter(m => m.fromRow === row && m.fromCol === col);
        } else {
            selectedPiece = null;
            validMoves = [];
        }
        drawBoard();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const x = c * CELL_SIZE;
                const y = r * CELL_SIZE;
                if ((r + c) % 2 === 0) {
                    ctx.fillStyle = '#1a1f2a';
                } else {
                    ctx.fillStyle = '#2a3140';
                }
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
            }
        }
        if (selectedPiece) {
            const { row, col } = selectedPiece;
            ctx.fillStyle = '#ff00ff40';
            ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        for (let move of validMoves) {
            const { toRow, toCol, capture } = move;
            ctx.fillStyle = capture ? '#ff000080' : '#00ff0080';
            ctx.beginPath();
            ctx.arc(toCol * CELL_SIZE + CELL_SIZE/2, toRow * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/4, 0, 2*Math.PI);
            ctx.fill();
        }
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = board[r][c];
                if (piece === EMPTY) continue;
                const x = c * CELL_SIZE + CELL_SIZE/2;
                const y = r * CELL_SIZE + CELL_SIZE/2;
                const radius = CELL_SIZE * 0.35;
                let isWhite = (piece === WHITE_MAN || piece === WHITE_KING);
                let isKing = (piece === WHITE_KING || piece === BLACK_KING);
                if (isWhite) {
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#00ffff';
                } else {
                    ctx.fillStyle = '#000000';
                    ctx.shadowColor = '#ff00ff';
                }
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.shadowBlur = 20;
                ctx.strokeStyle = isWhite ? '#00ffff' : '#ff00ff';
                ctx.lineWidth = 2;
                ctx.stroke();
                if (isKing) {
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(x, y - radius/2, radius/3, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
        ctx.shadowBlur = 0;
    }

    function setMode(mode) {
        gameMode = mode;
        modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        initGame();
    }

    canvas.addEventListener('click', handleCanvasClick);
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setMode(btn.dataset.mode);
        });
    });
    newGameBtn.addEventListener('click', () => {
        initGame();
    });
    initGame();
})();