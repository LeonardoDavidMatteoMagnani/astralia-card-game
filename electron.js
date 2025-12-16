import { app, BrowserWindow } from 'electron';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import localtunnel from 'localtunnel';

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
  code: null,
  publicUrl: null, // localtunnel URL
  tunnel: null, // localtunnel object for cleanup
};

function generateCode(url) {
  // Derive a unique 8-character code from the tunnel URL
  if (url) {
    // Extract domain from URL and hash it to a code
    const domain = url.replace(/^https?:\/\//, '').replace(/[.-]/g, '');
    return domain.substring(0, 8).toUpperCase();
  }
  // Fallback to UUID if no URL provided (shouldn't happen in production)
  return randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
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

    socket.on('lobby:host', async (name) => {
      console.log('lobby:host received from', socket.id, '| current host:', lobby.host?.socketId);
      if (lobby.host) {
        console.log('Host already exists, rejecting');
        return;
      }
      
      // Set host immediately to prevent race conditions
      lobby.host = { socketId: socket.id, name: name?.trim() || 'Host', deckId: null, faction: null };
      lobby.started = false;
      
      // Create localtunnel if we don't have a public URL yet
      if (!lobby.publicUrl) {
        try {
          console.log('Creating new localtunnel...');
          const tunnel = await localtunnel({ port: 3000 });
          lobby.publicUrl = tunnel.url;
          lobby.tunnel = tunnel;
          lobby.code = generateCode(tunnel.url);
          console.log('Localtunnel created:', tunnel.url);
          console.log('Join code:', lobby.code);
          
          // Register the code in the registry
          try {
            await fetch('https://astralia-card-game-registry.onrender.com/api/code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: lobby.code, url: lobby.publicUrl })
            });
            console.log('Code registered in registry');
          } catch (err) {
            console.warn('Failed to register code:', err);
          }
        } catch (err) {
          console.error('Localtunnel failed:', err);
          socket.emit('lobby:error', 'Failed to create public tunnel');
          return;
        }
      } else {
        console.log('Tunnel already exists:', lobby.publicUrl);
      }
      
      emitState();
    });

    socket.on('lobby:join', (payload) => {
      // Handle both old format (string) and new format (object with code)
      const name = typeof payload === 'string' ? payload : payload?.name || 'Guest';
      const code = typeof payload === 'string' ? null : payload?.code;
      
      // Validate host exists
      if (!lobby.host) {
        socket.emit('lobby:joinError', 'No lobby is currently hosted. Please try again later.');
        return;
      }
      
      // Validate guest slot available
      if (lobby.guest) {
        socket.emit('lobby:joinError', 'This lobby is full.');
        return;
      }
      
      // Validate code if provided
      if (code && code !== lobby.code) {
        socket.emit('lobby:joinError', 'Invalid join code.');
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

    socket.on('lobby:leave', async () => {
      if (lobby.host?.socketId === socket.id) {
        lobby.host = null;
        lobby.guest = null;
        lobby.started = false;
        
        // Unregister code from registry and close localtunnel
        if (lobby.code) {
          try {
            await fetch(`https://astralia-card-game-registry.onrender.com/api/code/${lobby.code}`, {
              method: 'DELETE'
            });
            console.log('Code unregistered from registry');
          } catch (err) {
            console.warn('Failed to unregister code:', err);
          }
        }
        
        if (lobby.tunnel) {
          try {
            await lobby.tunnel.close();
            console.log('Localtunnel closed');
          } catch (err) {
            console.error('Failed to close localtunnel:', err);
          }
          lobby.tunnel = null;
          lobby.publicUrl = null;
          lobby.code = null;
        }
        
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

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id, '| was host?', lobby.host?.socketId === socket.id, '| was guest?', lobby.guest?.socketId === socket.id);
      
      if (lobby.host?.socketId === socket.id) {
        console.log('[Disconnect] Host left, cleaning up...');
        lobby.host = null;
        lobby.guest = null;
        lobby.started = false;
        
        // Unregister code from registry and close localtunnel
        if (lobby.code) {
          try {
            await fetch(`https://astralia-card-game-registry.onrender.com/api/code/${lobby.code}`, {
              method: 'DELETE'
            });
            console.log('[Disconnect] Code unregistered from registry');
          } catch (err) {
            console.warn('[Disconnect] Failed to unregister code:', err);
          }
        }
        
        if (lobby.tunnel) {
          try {
            await lobby.tunnel.close();
            console.log('[Disconnect] Localtunnel closed');
          } catch (err) {
            console.error('[Disconnect] Failed to close localtunnel:', err);
          }
          lobby.tunnel = null;
          lobby.publicUrl = null;
          lobby.code = null;
        }
      } else if (lobby.guest?.socketId === socket.id) {
        console.log('[Disconnect] Guest left');
        lobby.guest = null;
      } else {
        console.log('[Disconnect] Socket was not host or guest');
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
  const url = isDev ? 'http://localhost:5173' : 'http://localhost:3000';
  console.log(`[Electron] Loading URL: ${url}`);
  
  mainWindow.loadURL(url).catch(err => {
    console.error('[Electron] Failed to load URL:', err);
  });

  /*if (isDev) {
    console.log('[Electron] Opening DevTools');
    mainWindow.webContents.openDevTools();
  }*/

  mainWindow.on('closed', () => {
    console.log('[Electron] Window closed');
    mainWindow = null;
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('[Electron] WebContents crashed');
  });

  console.log('[Electron] BrowserWindow created successfully');
}

// Cleanup function for when app is closing
async function cleanup() {
  console.log('[Cleanup] Starting cleanup...');
  
  // Unregister code from registry
  if (lobby.code) {
    try {
      console.log('[Cleanup] Unregistering code:', lobby.code);
      await fetch(`https://astralia-card-game-registry.onrender.com/api/code/${lobby.code}`, {
        method: 'DELETE'
      });
      console.log('[Cleanup] Code unregistered');
    } catch (err) {
      console.warn('[Cleanup] Failed to unregister code:', err);
    }
  }
  
  // Close localtunnel
  if (lobby.tunnel) {
    try {
      console.log('[Cleanup] Closing localtunnel...');
      await lobby.tunnel.close();
      console.log('[Cleanup] Localtunnel closed');
    } catch (err) {
      console.error('[Cleanup] Failed to close localtunnel:', err);
    }
  }
  
  // Close HTTP server
  if (httpServer) {
    httpServer.close();
    console.log('[Cleanup] HTTP server closed');
  }
}

// Start the server first
startServer();

// Then handle app lifecycle
app.on('ready', () => {
  console.log('[Electron] App ready event');
  createWindow();
});

app.on('before-quit', async (event) => {
  console.log('[Electron] Before quit event');
  event.preventDefault(); // Prevent quit until cleanup is done
  
  await cleanup();
  
  // Now actually quit
  process.exit(0);
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
