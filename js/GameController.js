/**
 * GameController - Gestisce il flusso del gioco e la coordinazione tra logica e UI
 */
import { CONFIG } from './config.js';

export class GameController {
    constructor(apiClient, gameBoard, ui) {
        this.api = apiClient;
        this.board = gameBoard;
        this.ui = ui;
        
        this.currentGame = null;
        this.players = [];
        this.myPlayerId = null; // ID del giocatore corrente
        this.currentPlayerIndex = 0;
        this.isMyTurn = false;
        this.gameActive = false;
        
        // Timer settings
        this.moveTimeLimit = CONFIG.MOVE_TIME_LIMIT;
        this.timerInterval = null;
        this.remainingTime = this.moveTimeLimit;
        
        // Polling
        this.pollingInterval = null;
        this.moveCount = 0;
    }

    /**
     * Inizia una nuova partita
     */
    async startNewGame(gameName) {
        try {
            const response = await this.api.createGame(gameName);
            this.currentGame = response.game;
            
            // Aggiungi il creatore come primo giocatore
            const playerResponse = await this.api.addPlayer(this.currentGame.id, this.api.username);
            this.myPlayerId = playerResponse.player.id; // Salva l'ID del giocatore
            
            // Carica i dati della partita
            await this.loadGame(this.currentGame.id);
            
            return { success: true, gameId: this.currentGame.id };
        } catch (error) {
            console.error('Error starting new game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Carica e entra in una partita
     */
    async loadGame(gameId) {
        try {
            // Ottieni i dettagli della partita
            const gameResponse = await this.api.getGame(gameId);
            this.currentGame = gameResponse.game;
            
            // Ottieni i giocatori
            const playersResponse = await this.api.getPlayers(gameId);
            this.players = playersResponse.players;
            
            // Ottieni le mosse
            const movesResponse = await this.api.getMoves(gameId);
            this.moveCount = movesResponse.moves.length;
            
            // Ricostruisci la board dalle mosse
            this.board.rebuildFromMoves(movesResponse.moves);
            
            // Aggiorna l'UI
            this.updateUI();
            
            // Se ci sono 2 giocatori, avvia il gioco
            if (this.players.length === 2) {
                this.startGameplay();
            } else {
                // Altrimenti aspetta il secondo giocatore
                this.waitForSecondPlayer();
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error loading game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unisciti a una partita come secondo giocatore
     */
    async joinGame(gameId) {
        try {
            // Verifica se l'utente è già nella partita
            const gameResponse = await this.api.getGame(gameId);
            const playersResponse = await this.api.getPlayers(gameId);
            
            const existingPlayer = playersResponse.players.find(
                p => p.name === this.api.username
            );
            
            if (existingPlayer) {
                // Il giocatore è già nella partita, salva il suo ID
                this.myPlayerId = existingPlayer.id;
            } else if (playersResponse.players.length < 2) {
                // Aggiungi come secondo giocatore
                const playerResponse = await this.api.addPlayer(gameId, this.api.username);
                this.myPlayerId = playerResponse.player.id; // Salva l'ID del giocatore
                
                // Aggiorna lo status della partita a "playing"
                await this.api.updateGameStatus(gameId, 'playing');
            }
            
            // Carica la partita
            await this.loadGame(gameId);
            
            return { success: true };
        } catch (error) {
            console.error('Error joining game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Aspetta che si unisca il secondo giocatore
     */
    waitForSecondPlayer() {
        this.ui.updateTurnMessage('In attesa del secondo giocatore...');
        this.ui.enableColumnButtons(false);
        
        // Polling per verificare se si è unito il secondo giocatore
        this.pollingInterval = setInterval(async () => {
            try {
                const playersResponse = await this.api.getPlayers(this.currentGame.id);
                if (playersResponse.players.length === 2) {
                    clearInterval(this.pollingInterval);
                    this.players = playersResponse.players;
                    
                    // Aggiorna lo status a "playing"
                    await this.api.updateGameStatus(this.currentGame.id, 'playing');
                    
                    this.updateUI();
                    this.startGameplay();
                }
            } catch (error) {
                console.error('Error polling for players:', error);
            }
        }, CONFIG.PLAYER_POLLING_INTERVAL);
    }

    /**
     * Avvia il gameplay effettivo
     */
    startGameplay() {
        this.gameActive = true;
        this.updateUI();
        this.checkTurn();
        
        // Avvia il polling per le mosse dell'avversario
        this.startPolling();
    }

    /**
     * Verifica di chi è il turno
     */
    checkTurn() {
        if (!this.gameActive) return;
        
        // Determina il giocatore corrente basandosi sul numero di mosse
        const currentPlayerNumber = (this.moveCount % 2) + 1;
        
        // Verifica se è il turno dell'utente corrente usando il player ID
        const myPlayerIndex = this.players.findIndex(p => p.id === this.myPlayerId);
        this.isMyTurn = (myPlayerIndex + 1) === currentPlayerNumber;
        
        this.updateUI();
        
        if (this.isMyTurn) {
            this.startTurnTimer();
        } else {
            this.stopTurnTimer();
            this.ui.updateTurnMessage(`Turno dell'avversario...`);
            this.ui.showTimer(false);
        }
    }

    /**
     * Avvia il timer per il turno
     */
    startTurnTimer() {
        this.remainingTime = this.moveTimeLimit;
        this.ui.showTimer(true);
        this.ui.updateTimer(this.remainingTime, this.moveTimeLimit);
        
        const availableColumns = this.board.getAvailableColumns();
        this.ui.enableColumnButtons(true, availableColumns);
        
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.ui.updateTimer(this.remainingTime, this.moveTimeLimit);
            
            if (this.remainingTime <= 0) {
                // Tempo scaduto - effettua una mossa casuale
                this.makeRandomMove();
            }
        }, 1000);
    }

    /**
     * Ferma il timer del turno
     */
    stopTurnTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.ui.enableColumnButtons(false);
    }

    /**
     * Effettua una mossa
     */
    async makeMove(column) {
        if (!this.isMyTurn || !this.gameActive) return;
        
        // Ferma il timer
        this.stopTurnTimer();
        
        const myPlayerIndex = this.players.findIndex(p => p.id === this.myPlayerId);
        const playerNumber = myPlayerIndex + 1;
        
        // Effettua la mossa sulla board locale
        const moveResult = this.board.makeMove(column, playerNumber);
        
        if (!moveResult.success) {
            this.ui.showGameMessage(moveResult.error, 'error');
            this.startTurnTimer(); // Riavvia il timer
            return;
        }
        
        // Aggiorna la UI locale
        this.ui.renderBoard(this.board.board);
        
        // Invia la mossa all'API usando il player ID
        try {
            await this.api.addMove(this.currentGame.id, this.myPlayerId, {
                column: column,
                player: playerNumber,
                row: moveResult.row
            });
            
            this.moveCount++;
            
            // Verifica vittoria
            if (moveResult.win) {
                this.handleWin(moveResult.winningCells, playerNumber);
                return;
            }
            
            // Verifica pareggio
            if (this.board.isBoardFull()) {
                this.handleDraw();
                return;
            }
            
            // Passa al turno successivo
            this.board.switchPlayer();
            this.checkTurn();
            
        } catch (error) {
            console.error('Error sending move:', error);
            this.ui.showGameMessage('Errore durante l\'invio della mossa', 'error');
        }
    }

    /**
     * Effettua una mossa casuale (timeout)
     */
    async makeRandomMove() {
        this.stopTurnTimer();
        
        const moveResult = this.board.makeRandomMove();
        
        if (!moveResult.success) {
            console.error('Cannot make random move');
            return;
        }
        
        this.ui.showGameMessage('Tempo scaduto! Mossa casuale effettuata.', 'info');
        
        // Continua come una mossa normale
        await this.makeMove(moveResult.col);
    }

    /**
     * Gestisce la vittoria
     */
    async handleWin(winningCells, winnerNumber) {
        this.gameActive = false;
        this.stopTurnTimer();
        this.stopPolling();
        
        this.ui.highlightWinningCells(winningCells);
        this.ui.enableColumnButtons(false);
        
        const isMyWin = winnerNumber === (this.players.findIndex(p => p.id === this.myPlayerId) + 1);
        const message = isMyWin ? '🎉 Hai vinto!' : '😞 Ha vinto l\'avversario!';
        this.ui.showGameMessage(message, isMyWin ? 'success' : 'error');
        
        // Aggiorna lo status della partita
        try {
            await this.api.updateGameStatus(this.currentGame.id, 'finished');
        } catch (error) {
            console.error('Error updating game status:', error);
        }
    }

    /**
     * Gestisce il pareggio
     */
    async handleDraw() {
        this.gameActive = false;
        this.stopTurnTimer();
        this.stopPolling();
        
        this.ui.showGameMessage('🤝 Pareggio! La griglia è piena.', 'info');
        this.ui.enableColumnButtons(false);
        
        try {
            await this.api.updateGameStatus(this.currentGame.id, 'finished');
        } catch (error) {
            console.error('Error updating game status:', error);
        }
    }

    /**
     * Avvia il polling per le mosse dell'avversario
     */
    startPolling() {
        this.pollingInterval = setInterval(async () => {
            if (!this.isMyTurn && this.gameActive) {
                await this.checkForNewMoves();
            }
        }, CONFIG.POLLING_INTERVAL);
    }

    /**
     * Ferma il polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Verifica se ci sono nuove mosse
     */
    async checkForNewMoves() {
        try {
            const result = await this.api.pollGameState(this.currentGame.id, this.moveCount);
            
            if (result.hasNewMoves) {
                // Ricostruisci la board con tutte le mosse
                this.board.rebuildFromMoves(result.moves);
                this.moveCount = result.moves.length;
                
                // Aggiorna la UI
                this.ui.renderBoard(this.board.board);
                
                // Verifica se c'è stata una vittoria nell'ultima mossa
                if (result.moves.length > 0) {
                    const lastMove = result.moves[result.moves.length - 1];
                    if (lastMove.data) {
                        const checkResult = this.board.checkWin(
                            lastMove.data.row,
                            lastMove.data.column,
                            lastMove.data.player
                        );
                        
                        if (checkResult.win) {
                            this.handleWin(checkResult.cells, lastMove.data.player);
                            return;
                        }
                    }
                }
                
                // Verifica pareggio
                if (this.board.isBoardFull()) {
                    this.handleDraw();
                    return;
                }
                
                // Passa al turno successivo
                this.checkTurn();
            }
        } catch (error) {
            console.error('Error checking for new moves:', error);
        }
    }

    /**
     * Aggiorna l'UI con lo stato corrente
     */
    updateUI() {
        // Aggiorna titolo
        if (this.currentGame) {
            this.ui.updateGameTitle(this.currentGame.name);
        }
        
        // Aggiorna nomi giocatori
        const player1Name = this.players[0]?.name || 'Giocatore 1';
        const player2Name = this.players[1]?.name || null;
        this.ui.updatePlayerInfo(player1Name, player2Name);
        
        // Aggiorna messaggio turno
        if (this.gameActive && this.players.length === 2) {
            const currentPlayerIndex = (this.moveCount % 2);
            const currentPlayerName = this.players[currentPlayerIndex]?.name || 'Giocatore';
            const message = this.isMyTurn ? '🎯 Il tuo turno!' : `Turno di ${currentPlayerName}`;
            this.ui.updateTurnMessage(message);
        }
        
        // Renderizza la board
        this.ui.renderBoard(this.board.board);
    }

    /**
     * Pulisce e resetta il controller
     */
    cleanup() {
        this.stopTurnTimer();
        this.stopPolling();
        this.gameActive = false;
        this.currentGame = null;
        this.players = [];
        this.myPlayerId = null;
        this.moveCount = 0;
        this.board.reset();
        this.ui.resetBoard();
    }
}
