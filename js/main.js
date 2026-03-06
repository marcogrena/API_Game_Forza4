/**
 * Main Application Entry Point
 */
import { ApiClient } from './ApiClient.js';
import { GameBoard } from './GameBoard.js';
import { UI } from './UI.js';
import { GameController } from './GameController.js';
import { CONFIG } from './config.js';

class App {
    constructor() {
        // Inizializza i componenti
        this.api = new ApiClient(CONFIG.API_BASE_URL);
        this.board = new GameBoard();
        this.ui = new UI();
        this.gameController = new GameController(this.api, this.board, this.ui);
        
        this.init();
    }

    /**
     * Inizializza l'applicazione
     */
    init() {
        this.setupEventListeners();
        
        // Verifica se l'utente ha già un username salvato
        const savedUsername = localStorage.getItem('username');
        if (savedUsername) {
            this.api.username = savedUsername;
            this.showLobby();
        } else {
            this.ui.showScreen('auth');
        }
    }

    /**
     * Configura tutti gli event listener
     */
    setupEventListeners() {
        // Auth screen
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('username-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Lobby screen
        document.getElementById('create-game-btn').addEventListener('click', () => this.handleCreateGame());
        document.getElementById('refresh-games-btn').addEventListener('click', () => this.refreshLobby());

        // Game screen
        document.getElementById('back-to-lobby-btn').addEventListener('click', () => this.backToLobby());

        // Column buttons (per le mosse)
        document.querySelectorAll('.column-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = parseInt(e.target.dataset.column);
                this.gameController.makeMove(column);
            });
        });
    }

    /**
     * Gestisce il login/registrazione
     */
    async handleLogin() {
        const usernameInput = document.getElementById('username-input');
        const username = usernameInput.value.trim();

        if (!username) {
            this.ui.showAuthError('Inserisci un username valido');
            return;
        }

        this.ui.clearAuthError();
        
        try {
            // Disabilita il pulsante durante il caricamento
            const loginBtn = document.getElementById('login-btn');
            loginBtn.disabled = true;
            loginBtn.textContent = 'Caricamento...';

            await this.api.register(username);
            
            // Reset del form
            usernameInput.value = '';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Inizia a Giocare';

            // Mostra la lobby
            this.showLobby();
            
        } catch (error) {
            this.ui.showAuthError(error.message);
            const loginBtn = document.getElementById('login-btn');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Inizia a Giocare';
        }
    }

    /**
     * Gestisce il logout
     */
    handleLogout() {
        // Pulisci il game controller
        this.gameController.cleanup();
        
        // Effettua il logout
        this.api.logout();
        this.ui.hideUserInfo();
        this.ui.showScreen('auth');
    }

    /**
     * Mostra la lobby e carica le partite
     */
    async showLobby() {
        this.ui.updateUserInfo(this.api.username);
        this.ui.showScreen('lobby');
        await this.refreshLobby();
    }

    /**
     * Aggiorna la lobby con le partite disponibili
     */
    async refreshLobby() {
        this.ui.showLoading('available-games', 'Caricamento partite disponibili...');
        this.ui.showLoading('my-games', 'Caricamento delle tue partite...');

        try {
            // Ottieni tutte le partite
            const myGamesResponse = await this.api.getMyGames();
            const allGames = myGamesResponse.games;
            
            // Per ogni partita, verifica se l'utente corrente è tra i players
            const gamesWithPlayerInfo = await Promise.all(allGames.map(async game => {
                try {
                    const playersResponse = await this.api.getPlayers(game.id);
                    return {
                        ...game,
                        playersList: playersResponse.players
                    };
                } catch (error) {
                    console.error(`Error loading players for game ${game.id}:`, error);
                    return {
                        ...game,
                        playersList: game.players || []
                    };
                }
            }));
            
            // Filtra le partite disponibili (non piene, non finite, e l'utente NON è già dentro)
            const availableGames = gamesWithPlayerInfo.filter(game => {
                const isPlayerInGame = game.playersList.some(p => p.name === this.api.username);
                return game.playersList.length < 2 && 
                       game.status !== 'finished' &&
                       !isPlayerInGame; // Non mostrare partite dove sei già dentro
            });

            // Le mie partite (dove l'utente è tra i players)
            const myGames = gamesWithPlayerInfo.filter(game => {
                const isPlayerInGame = game.playersList.some(p => p.name === this.api.username);
                return isPlayerInGame;
            });

            // Renderizza le liste
            this.ui.renderAvailableGames(
                availableGames.map(g => ({ game: g })),
                (gameId) => this.handleJoinGame(gameId)
            );
            
            this.ui.renderMyGames(
                myGames,
                (gameId) => this.handleSelectGame(gameId)
            );

        } catch (error) {
            console.error('Error refreshing lobby:', error);
            document.getElementById('available-games').innerHTML = 
                `<p class="error-message">Errore nel caricamento: ${error.message}</p>`;
            document.getElementById('my-games').innerHTML = 
                `<p class="error-message">Errore nel caricamento: ${error.message}</p>`;
        }
    }

    /**
     * Gestisce la creazione di una nuova partita
     */
    async handleCreateGame() {
        const gameName = prompt('Inserisci il nome della partita:');
        
        if (!gameName || !gameName.trim()) {
            return;
        }

        try {
            const result = await this.gameController.startNewGame(gameName.trim());
            
            if (result.success) {
                // Vai alla schermata di gioco
                this.ui.showScreen('game');
            } else {
                alert('Errore nella creazione della partita: ' + result.error);
            }
        } catch (error) {
            alert('Errore nella creazione della partita: ' + error.message);
        }
    }

    /**
     * Gestisce l'unione a una partita esistente
     */
    async handleJoinGame(gameId) {
        try {
            const result = await this.gameController.joinGame(gameId);
            
            if (result.success) {
                // Vai alla schermata di gioco
                this.ui.showScreen('game');
            } else {
                alert('Errore nell\'unirsi alla partita: ' + result.error);
            }
        } catch (error) {
            alert('Errore nell\'unirsi alla partita: ' + error.message);
        }
    }

    /**
     * Gestisce la selezione di una partita propria
     */
    async handleSelectGame(gameId) {
        try {
            const result = await this.gameController.loadGame(gameId);
            
            if (result.success) {
                // Vai alla schermata di gioco
                this.ui.showScreen('game');
            } else {
                alert('Errore nel caricamento della partita: ' + result.error);
            }
        } catch (error) {
            alert('Errore nel caricamento della partita: ' + error.message);
        }
    }

    /**
     * Torna alla lobby
     */
    backToLobby() {
        // Pulisci il game controller
        this.gameController.cleanup();
        
        // Torna alla lobby
        this.showLobby();
    }
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
