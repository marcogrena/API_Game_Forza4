/**
 * Configurazione dell'applicazione
 */
export const CONFIG = {
    // URL dell'API backend
    API_BASE_URL: 'https://fluffy-sniffle-x9r9jvjx76g36jxr-3000.app.github.dev',
    
    // API Key condivisa per tutti i giocatori
    API_KEY: 'f246e697-eb92-443e-8789-02f956b3f572953e91cc3dde41f087ba1a0212efc4c9',
    
    // Impostazioni del gioco
    MOVE_TIME_LIMIT: 5, // Secondi per ogni mossa
    POLLING_INTERVAL: 1000, // Millisecondi tra ogni polling
    PLAYER_POLLING_INTERVAL: 2000, // Millisecondi per verificare nuovi giocatori
    
    // Dimensioni della griglia
    BOARD_ROWS: 6,
    BOARD_COLS: 7
};
