import { app, BrowserWindow } from 'electron';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let httpServer;
let io;

// Game lobby state
const lobby = {
  host: null,
  guest: null,
  started: false,
  code: generateCode(),
};

function generateCode() {
  // Generate a 4-character uppercase code
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function buildState() {
  return {
    host: lobby.host ? { ...lobby.host } : null,
    guest: lobby.guest ? { ...lobby.guest } : null,
    started: lobby.started,
    code: lobby.code,
  };
}

function emitState() {
  io?.emit('lobby:state', buildState());
}

function startServer() {
  const expressApp = express();
  httpServer = http.createServer(expressApp);
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Serve the Vite dev server or build
  const isDev = !!process.env.ELECTRON_DEV;
  if (!isDev) {
    // In production, serve the built dist
    expressApp.use(express.static(path.join(__dirname, 'dist')));
    expressApp.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('lobby:host', (name) => {
      if (lobby.host) return;
      lobby.host = { socketId: socket.id, name: name?.trim() || 'Host', deckId: null, faction: null };
      lobby.started = false;
      emitState();
    });

    socket.on('lobby:join', (payload) => {
      // Handle both old format (string) and new format (object with code)
      const name = typeof payload === 'string' ? payload : payload?.name || 'Guest';
      const code = typeof payload === 'string' ? null : payload?.code;
      
      if (!lobby.host || lobby.guest) return;
      
      // Validate code if provided
      if (code && code !== lobby.code) {
        socket.emit('lobby:joinError', 'Invalid join code');
        return;
      }
      
      lobby.guest = { socketId: socket.id, name: name.trim() || 'Guest', deckId: null, faction: null };
      emitState();
    });

    socket.on('lobby:setName', (name) => {
      const who = lobby.host?.socketId === socket.id ? lobby.host : (lobby.guest?.socketId === socket.id ? lobby.guest : null);
      if (!who) return;
      who.name = name?.trim() || who.name;
      emitState();
    });

    socket.on('lobby:setFaction', (faction) => {
      const who = lobby.host?.socketId === socket.id ? lobby.host : (lobby.guest?.socketId === socket.id ? lobby.guest : null);
      if (!who) return;
      who.faction = faction || null;
      who.deckId = null;
      emitState();
    });

    socket.on('lobby:setDeck', (deckId) => {
      const who = lobby.host?.socketId === socket.id ? lobby.host : (lobby.guest?.socketId === socket.id ? lobby.guest : null);
      if (!who) return;
      who.deckId = deckId || null;
      emitState();
    });

    socket.on('lobby:leave', () => {
      if (lobby.host?.socketId === socket.id) {
        lobby.host = null;
        lobby.guest = null;
        lobby.started = false;
        emitState();
        return;
      }
      if (lobby.guest?.socketId === socket.id) {
        lobby.guest = null;
        emitState();
      }
    });

    socket.on('lobby:startRequest', () => {
      if (lobby.host?.socketId !== socket.id) return;
      if (!lobby.host?.deckId || !lobby.guest?.deckId) return;
      lobby.started = true;
      emitState();
      io.emit('lobby:started', { hostDeckId: lobby.host.deckId, guestDeckId: lobby.guest.deckId });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (lobby.host?.socketId === socket.id) {
        lobby.host = null;
        lobby.guest = null;
        lobby.started = false;
      } else if (lobby.guest?.socketId === socket.id) {
        lobby.guest = null;
      }
      emitState();
    });

    emitState();
  });

  const PORT = 3000;
  httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on http://localhost:${PORT}`);
  });
}

function createWindow() {
  console.log('[Electron] Creating BrowserWindow');
  mainWindow = new BrowserWindow({
    fullscreen: false,
    webPreferences: {
      preload: undefined,
      nodeIntegration: false,
    },
  });

  // Maximize the window (windowed fullscreen, not true fullscreen)
  mainWindow.maximize();

  const isDev = !!process.env.ELECTRON_DEV;
  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, 'dist', 'index.html')}`;
  console.log(`[Electron] Loading URL: ${url}`);
  
  mainWindow.loadURL(url).catch(err => {
    console.error('[Electron] Failed to load URL:', err);
  });

  if (isDev) {
    console.log('[Electron] Opening DevTools');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    console.log('[Electron] Window closed');
    mainWindow = null;
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('[Electron] WebContents crashed');
  });

  console.log('[Electron] BrowserWindow created successfully');
}

// Start the server first
startServer();

// Then handle app lifecycle
app.on('ready', () => {
  console.log('[Electron] App ready event');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('[Electron] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[Electron] App activated');
  if (mainWindow === null) {
    createWindow();
  }
});
