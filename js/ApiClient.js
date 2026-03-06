/**
 * ApiClient - Gestisce tutte le chiamate API al backend
 */
import { CONFIG } from './config.js';

export class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Rimuove il trailing slash se presente
        this.apiKey = localStorage.getItem('apiKey');
        this.username = localStorage.getItem('username');
        
        // Se non c'è API key, imposta quella di default
        if (!this.apiKey) {
            this.apiKey = CONFIG.API_KEY;
            localStorage.setItem('apiKey', this.apiKey);
        }
    }

    /**
     * Effettua una richiesta HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Aggiungi API Key se presente
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP Error: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * Registra un nuovo utente e ottiene l'API Key
     */
    async register(username) {
        this.username = username;
        localStorage.setItem('username', this.username);
        
        const data = {
            user: {
                username: this.username,
                apiKey: this.apiKey
            }
        };
        return data.user;
    }

    /**
     * Logout - Cancella le credenziali salvate
     */
    logout() {
        this.username = null;
        localStorage.removeItem('username');
        // Manteniamo l'API key perché è condivisa
    }

    /**
     * Verifica se l'utente è autenticato
     */
    isAuthenticated() {
        return !!this.apiKey;
    }

    /**
     * Crea una nuova partita
     */
    async createGame(gameName) {
        return await this.request('/games', {
            method: 'POST',
            body: JSON.stringify({ name: gameName })
        });
    }

    /**
     * Ottiene tutte le partite dell'utente corrente
     */
    async getMyGames() {
        return await this.request('/games');
    }

    /**
     * Ottiene i dettagli di una partita specifica
     */
    async getGame(gameId) {
        return await this.request(`/games/${gameId}`);
    }

    /**
     * Aggiorna lo status di una partita
     */
    async updateGameStatus(gameId, status) {
        return await this.request(`/games/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    /**
     * Aggiunge un giocatore alla partita
     */
    async addPlayer(gameId, playerName) {
        return await this.request(`/games/${gameId}/players`, {
            method: 'POST',
            body: JSON.stringify({ name: playerName })
        });
    }

    /**
     * Ottiene tutti i giocatori di una partita
     */
    async getPlayers(gameId) {
        return await this.request(`/games/${gameId}/players`);
    }

    /**
     * Aggiunge una mossa alla partita
     */
    async addMove(gameId, playerId, moveData) {
        return await this.request(`/games/${gameId}/moves`, {
            method: 'POST',
            body: JSON.stringify({
                playerId,
                data: moveData
            })
        });
    }

    /**
     * Ottiene tutte le mosse di una partita
     */
    async getMoves(gameId) {
        return await this.request(`/games/${gameId}/moves`);
    }

    /**
     * Polling per verificare nuove mosse
     */
    async pollGameState(gameId, currentMoveCount) {
        try {
            const movesResponse = await this.getMoves(gameId);
            return {
                moves: movesResponse.moves,
                hasNewMoves: movesResponse.moves.length > currentMoveCount
            };
        } catch (error) {
            console.error('Error polling game state:', error);
            return {
                moves: [],
                hasNewMoves: false
            };
        }
    }
}
