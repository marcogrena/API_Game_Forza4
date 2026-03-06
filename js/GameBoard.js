/**
 * GameBoard - Gestisce la logica del gioco Forza 4
 */
export class GameBoard {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1; // 1 = rosso (owner), 2 = giallo (secondo giocatore)
    }

    /**
     * Crea una griglia vuota
     */
    createEmptyBoard() {
        return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    }

    /**
     * Resetta la board
     */
    reset() {
        this.board = this.createEmptyBoard();
        this.currentPlayer = 1;
    }

    /**
     * Verifica se una colonna è piena
     */
    isColumnFull(col) {
        return this.board[0][col] !== 0;
    }

    /**
     * Trova la prima riga disponibile in una colonna (dal basso)
     */
    getAvailableRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                return row;
            }
        }
        return -1;
    }

    /**
     * Effettua una mossa
     */
    makeMove(col, player = this.currentPlayer) {
        if (col < 0 || col >= this.cols) {
            return { success: false, error: 'Colonna non valida' };
        }

        if (this.isColumnFull(col)) {
            return { success: false, error: 'Colonna piena' };
        }

        const row = this.getAvailableRow(col);
        this.board[row][col] = player;

        // Verifica vittoria
        const winResult = this.checkWin(row, col, player);

        return {
            success: true,
            row,
            col,
            player,
            win: winResult.win,
            winningCells: winResult.cells
        };
    }

    /**
     * Verifica se c'è una vittoria
     */
    checkWin(row, col, player) {
        // Direzioni da verificare: orizzontale, verticale, diagonale /, diagonale \
        const directions = [
            { dr: 0, dc: 1 },  // Orizzontale
            { dr: 1, dc: 0 },  // Verticale
            { dr: 1, dc: 1 },  // Diagonale \
            { dr: 1, dc: -1 }  // Diagonale /
        ];

        for (const { dr, dc } of directions) {
            const cells = this.checkDirection(row, col, dr, dc, player);
            if (cells.length >= 4) {
                return { win: true, cells };
            }
        }

        return { win: false, cells: [] };
    }

    /**
     * Verifica una direzione specifica per connessioni
     */
    checkDirection(row, col, dr, dc, player) {
        const cells = [{ row, col }];

        // Controlla avanti
        for (let i = 1; i < 4; i++) {
            const newRow = row + (dr * i);
            const newCol = col + (dc * i);
            if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol] === player) {
                cells.push({ row: newRow, col: newCol });
            } else {
                break;
            }
        }

        // Controlla indietro
        for (let i = 1; i < 4; i++) {
            const newRow = row - (dr * i);
            const newCol = col - (dc * i);
            if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol] === player) {
                cells.unshift({ row: newRow, col: newCol });
            } else {
                break;
            }
        }

        return cells;
    }

    /**
     * Verifica se una cella è valida
     */
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    /**
     * Verifica se la board è piena (pareggio)
     */
    isBoardFull() {
        for (let col = 0; col < this.cols; col++) {
            if (!this.isColumnFull(col)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Ottiene le colonne disponibili per una mossa
     */
    getAvailableColumns() {
        const available = [];
        for (let col = 0; col < this.cols; col++) {
            if (!this.isColumnFull(col)) {
                available.push(col);
            }
        }
        return available;
    }

    /**
     * Effettua una mossa casuale (per timeout)
     */
    makeRandomMove(player = this.currentPlayer) {
        const available = this.getAvailableColumns();
        if (available.length === 0) {
            return { success: false, error: 'Nessuna mossa disponibile' };
        }

        const randomCol = available[Math.floor(Math.random() * available.length)];
        return this.makeMove(randomCol, player);
    }

    /**
     * Cambia il giocatore corrente
     */
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    /**
     * Ottiene lo stato corrente della board
     */
    getState() {
        return {
            board: this.board.map(row => [...row]),
            currentPlayer: this.currentPlayer
        };
    }

    /**
     * Ripristina uno stato della board
     */
    setState(state) {
        this.board = state.board.map(row => [...row]);
        this.currentPlayer = state.currentPlayer;
    }

    /**
     * Ricostruisce la board dalle mosse
     */
    rebuildFromMoves(moves) {
        this.reset();
        
        for (const move of moves) {
            if (move.data && typeof move.data.column === 'number') {
                this.makeMove(move.data.column, move.data.player);
                this.switchPlayer();
            }
        }
    }
}
