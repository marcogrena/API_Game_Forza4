# Forza 4 - Gioco Online Multiplayer

Web application per giocare a Forza 4 (Connect Four) online con 2 giocatori utilizzando le API REST.

## 🎮 Caratteristiche

- **Registrazione semplice**: Inserisci solo il tuo username per iniziare (API key condivisa)
- **Lobby**: Visualizzazione delle partite disponibili e delle tue partite attive
- **Creazione partita**: Possibilità di creare nuove partite
- **Join partita**: Unirsi a partite create da altri giocatori
- **Gameplay a turni**: Gestione automatica dei turni tra i due giocatori
- **Timer di mossa**: 5 secondi per effettuare una mossa con progress bar visiva
- **Mossa automatica**: Se il tempo scade, viene effettuata una mossa casuale
- **Polling real-time**: Aggiornamento automatico dello stato di gioco
- **Rilevamento vittoria**: Controllo automatico di vittorie e pareggi
- **Design responsive**: Interfaccia moderna ed elegante

## 📁 Struttura del Progetto

```
/
├── index.html              # File HTML principale
├── css/
│   └── style.css          # Stili dell'applicazione
├── js/
│   ├── main.js            # Entry point dell'applicazione
│   ├── config.js          # Configurazione (API key, URL, parametri)
│   ├── ApiClient.js       # Gestione delle chiamate API
│   ├── GameBoard.js       # Logica del gioco Forza 4
│   ├── GameController.js  # Controller del gioco e timer
│   └── UI.js              # Gestione interfaccia utente
├── backend/               # Codice di riferimento delle API
│   ├── index.js
│   ├── auth.js
│   └── games.js
└── README.md
```

## ⚙️ Configurazione

Il file [js/config.js](js/config.js) contiene tutte le impostazioni configurabili:

- `API_BASE_URL`: URL del server backend
- `API_KEY`: API key condivisa per tutti i giocatori
- `MOVE_TIME_LIMIT`: Tempo in secondi per ogni mossa (default: 5)
- `POLLING_INTERVAL`: Intervallo di polling per le mosse (default: 1000ms)
- `PLAYER_POLLING_INTERVAL`: Intervallo di polling per nuovi giocatori (default: 2000ms)
- `BOARD_ROWS` e `BOARD_COLS`: Dimensioni della griglia (6x7)

Per modificare questi parametri, modifica il file [js/config.js](js/config.js).

## 🚀 Come Usare

### 1. Avvia il server API

Assicurati che il server backend sia in esecuzione all'indirizzo:
```
https://fluffy-sniffle-x9r9jvjx76g36jxr-3000.app.github.dev
```

### 2. Apri l'applicazione

Apri il file `index.html` in un browser moderno oppure usa un server locale:

```bash
# Con Python 3
python3 -m http.server 8080

# Con Node.js (http-server)
npx http-server -p 8080
```

Poi apri `http://localhost:8080` nel browser.

### 3. Gioca!

1. **Inserisci il tuo username**: Scegli un nome per identificarti (l'API key è condivisa tra tutti i giocatori)
2. **Crea o unisciti a una partita**:
   - Crea una nuova partita dalla lobby (verrai aggiunto automaticamente come primo giocatore)
   - Oppure unisciti a una partita disponibile (verrai aggiunto come secondo giocatore)
3. **Aspetta il secondo giocatore** (se hai creato tu la partita)
4. **Gioca**:
   - Clicca sulla colonna dove vuoi inserire il tuo disco
   - Hai 5 secondi per ogni mossa
   - Cerca di allineare 4 dischi dello stesso colore (orizzontale, verticale o diagonale)

## 🎯 API Endpoints Utilizzati

### Autenticazione
- **API Key condivisa**: Tutti i giocatori usano la stessa API key per autenticarsi
- I giocatori si identificano tramite il nome quando si aggiungono a una partita

### Gestione Partite
- `POST /games` - Crea una nuova partita
- `GET /games` - Ottiene le partite dell'utente
- `GET /games/:gameId` - Ottiene i dettagli di una partita
- `PUT /games/:gameId` - Aggiorna lo status della partita

### Gestione Giocatori
- `POST /games/:gameId/players` - Aggiunge un giocatore alla partita
- `GET /games/:gameId/players` - Ottiene i giocatori di una partita

### Gestione Mosse
- `POST /games/:gameId/moves` - Invia una mossa
- `GET /games/:gameId/moves` - Ottiene tutte le mosse della partita

## 🏗️ Architettura

### Classi JavaScript

#### `ApiClient` 
Gestisce tutte le comunicazioni con l'API backend:
- Autenticazione con API key
- Gestione delle richieste HTTP
- Salvataggio credenziali in localStorage

#### `GameBoard`
Gestisce la logica del gioco:
- Griglia 7x6 per Forza 4
- Validazione delle mosse
- Rilevamento vittorie (4 in linea)
- Gestione mosse casuali

#### `UI`
Gestisce l'interfaccia utente:
- Rendering della griglia di gioco
- Aggiornamento del timer
- Gestione degli schermi (auth, lobby, game)
- Visualizzazione messaggi

#### `GameController`
Coordina il flusso di gioco:
- Gestione dei turni
- Timer di 5 secondi per mossa
- Polling per aggiornamenti in real-time
- Sincronizzazione con l'API

### Flusso di Gioco

1. **Setup iniziale**: L'utente inserisce il proprio username (l'API key condivisa viene caricata automaticamente)
2. **Lobby**: Visualizza partite disponibili (dove può unirsi) e le proprie partite attive
3. **Creazione partita**: 
   - L'utente crea una nuova partita specificando il nome
   - Viene automaticamente aggiunto come primo giocatore tramite API
4. **Join partita**: 
   - L'utente si unisce a una partita esistente
   - Viene aggiunto come secondo giocatore tramite API
5. **Attesa**: Se necessario, aspetta il secondo giocatore
6. **Gameplay**: 
   - I giocatori alternano i turni (identificati dal loro nome)
   - Ogni giocatore ha 5 secondi per ogni mossa
   - Il timer viene visualizzato con una progress bar
   - Se il tempo scade, viene effettuata una mossa casuale
   - Il polling verifica continuamente le mosse dell'avversario
7. **Fine partita**: Vittoria, sconfitta o pareggio

## 🎨 Design

L'interfaccia utilizza:
- Gradient viola/blu per lo sfondo
- Glassmorphism per i contenitori
- Animazioni fluide per le transizioni
- Colori rosso e giallo per i dischi dei giocatori
- Progress bar animata per il timer
- Design responsive per mobile e desktop

## 🔧 Tecnologie

- **HTML5**: Markup semantico
- **CSS3**: Stili moderni con variabili CSS, grid e flexbox
- **JavaScript ES6+**: Moduli, classi, async/await
- **Fetch API**: Chiamate HTTP asincrone
- **LocalStorage**: Persistenza delle credenziali

## 📝 Note

- L'applicazione usa JavaScript vanilla (nessun framework)
- Il codice è organizzato in classi ES6 per maggiore modularità
- Il polling è implementato per simulare comunicazione real-time
- L'API key è condivisa tra tutti i giocatori per semplificare l'autenticazione
- I giocatori si identificano tramite username salvato in localStorage
- Ogni giocatore viene registrato come player nella partita tramite API
