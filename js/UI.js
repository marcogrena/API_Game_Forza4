/**
 * UI - Gestisce l'interfaccia utente dell'applicazione
 */
export class UI {
    constructor() {
        this.screens = {
            auth: document.getElementById('auth-screen'),
            lobby: document.getElementById('lobby-screen'),
            game: document.getElementById('game-screen')
        };
        
        this.initializeBoardCells();
    }

    /**
     * Inizializza le celle della board
     */
    initializeBoardCells() {
        const boardCells = document.querySelector('.board-cells');
        boardCells.innerHTML = '';
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardCells.appendChild(cell);
            }
        }
    }

    /**
     * Mostra uno schermo specifico
     */
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    /**
     * Aggiorna le informazioni utente nell'header
     */
    updateUserInfo(username) {
        const userInfo = document.getElementById('user-info');
        const usernameDisplay = document.getElementById('username-display');
        
        usernameDisplay.textContent = username;
        userInfo.style.display = 'flex';
    }

    /**
     * Nasconde le informazioni utente
     */
    hideUserInfo() {
        const userInfo = document.getElementById('user-info');
        userInfo.style.display = 'none';
    }

    /**
     * Mostra un errore nello schermo di autenticazione
     */
    showAuthError(message) {
        const errorElement = document.getElementById('auth-error');
        errorElement.textContent = message;
    }

    /**
     * Cancella l'errore di autenticazione
     */
    clearAuthError() {
        const errorElement = document.getElementById('auth-error');
        errorElement.textContent = '';
    }

    /**
     * Renderizza la lista delle partite disponibili
     */
    renderAvailableGames(games, onJoinGame) {
        const container = document.getElementById('available-games');
        
        if (games.length === 0) {
            container.innerHTML = '<p class="no-games">Nessuna partita disponibile. Crea una nuova partita!</p>';
            return;
        }

        container.innerHTML = games.map(game => {
            const playersList = game.game.playersList || [];
            const firstPlayerName = playersList.length > 0 ? playersList[0].name : 'Anonimo';
            
            return `
                <div class="game-card" data-game-id="${game.game.id}">
                    <div class="game-card-header">
                        <h4>${game.game.name}</h4>
                        <span class="game-status waiting">In attesa</span>
                    </div>
                    <div class="game-card-body">
                        <p>Creata da: ${firstPlayerName}</p>
                        <p>Giocatori: ${playersList.length}/2</p>
                    </div>
                </div>
            `;
        }).join('');

        // Aggiungi event listener per ogni card
        container.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                onJoinGame(gameId);
            });
        });
    }

    /**
     * Renderizza le partite dell'utente
     */
    renderMyGames(games, onSelectGame) {
        const container = document.getElementById('my-games');
        
        if (games.length === 0) {
            container.innerHTML = '<p class="no-games">Non sei ancora in nessuna partita.</p>';
            return;
        }

        container.innerHTML = games.map(game => {
            const status = game.status || 'waiting';
            const statusText = {
                'waiting': 'In attesa',
                'playing': 'In corso',
                'finished': 'Terminata'
            }[status] || status;
            
            const playersList = game.playersList || [];
            const playersCount = playersList.length;

            return `
                <div class="game-card" data-game-id="${game.id}">
                    <div class="game-card-header">
                        <h4>${game.name}</h4>
                        <span class="game-status ${status}">${statusText}</span>
                    </div>
                    <div class="game-card-body">
                        <p>Giocatori: ${playersCount}/2</p>
                        <p>Mosse: ${game.moves.length}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Aggiungi event listener
        container.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                onSelectGame(gameId);
            });
        });
    }

    /**
     * Aggiorna il titolo della partita
     */
    updateGameTitle(title) {
        document.getElementById('game-title').textContent = title;
    }

    /**
     * Aggiorna le informazioni dei giocatori
     */
    updatePlayerInfo(player1Name, player2Name = null) {
        document.getElementById('player1-name').textContent = player1Name;
        document.getElementById('player2-name').textContent = player2Name || 'In attesa...';
    }

    /**
     * Aggiorna il messaggio del turno
     */
    updateTurnMessage(message) {
        document.getElementById('turn-message').textContent = message;
    }

    /**
     * Mostra/nasconde il timer
     */
    showTimer(show) {
        const timerContainer = document.getElementById('timer-container');
        timerContainer.style.display = show ? 'block' : 'none';
    }

    /**
     * Aggiorna il timer
     */
    updateTimer(seconds, maxSeconds) {
        const timerSeconds = document.getElementById('timer-seconds');
        const timerProgress = document.getElementById('timer-progress');
        
        timerSeconds.textContent = `${seconds}s`;
        const percentage = (seconds / maxSeconds) * 100;
        timerProgress.style.width = `${percentage}%`;
    }

    /**
     * Renderizza lo stato della board
     */
    renderBoard(boardState) {
        const cells = document.querySelectorAll('.cell');
        
        boardState.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                const cellIndex = rowIndex * 7 + colIndex;
                const cell = cells[cellIndex];
                
                cell.classList.remove('red', 'yellow', 'winning');
                
                if (value === 1) {
                    cell.classList.add('red');
                } else if (value === 2) {
                    cell.classList.add('yellow');
                }
            });
        });
    }

    /**
     * Evidenzia le celle vincenti
     */
    highlightWinningCells(winningCells) {
        winningCells.forEach(({ row, col }) => {
            const cellIndex = row * 7 + col;
            const cells = document.querySelectorAll('.cell');
            cells[cellIndex].classList.add('winning');
        });
    }

    /**
     * Abilita/disabilita i pulsanti delle colonne
     */
    enableColumnButtons(enable, availableColumns = []) {
        const buttons = document.querySelectorAll('.column-btn');
        
        buttons.forEach((btn) => {
            const col = parseInt(btn.dataset.column);
            
            if (enable && availableColumns.includes(col)) {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        });
    }

    /**
     * Mostra un messaggio di gioco
     */
    showGameMessage(message, type = 'info') {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
        messageElement.className = `game-message ${type}`;
    }

    /**
     * Cancella il messaggio di gioco
     */
    clearGameMessage() {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = '';
        messageElement.className = 'game-message';
    }

    /**
     * Mostra uno stato di caricamento
     */
    showLoading(containerId, message = 'Caricamento...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<p class="loading">${message}</p>`;
        }
    }

    /**
     * Resetta la board visuale
     */
    resetBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('red', 'yellow', 'winning');
        });
        this.clearGameMessage();
        this.enableColumnButtons(false);
        this.showTimer(false);
    }
}
