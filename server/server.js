import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// In-memory single lobby (max 2 players)
const lobby = {
  host: null, // { socketId, name, deckId, faction }
  guest: null,
  started: false,
};

function buildState() {
  return {
    host: lobby.host ? { ...lobby.host } : null,
    guest: lobby.guest ? { ...lobby.guest } : null,
    started: lobby.started,
  };
}

function emitState() {
  io.emit('lobby:state', buildState());
}

function resetLobbyIfEmpty() {
  if (!lobby.host && !lobby.guest) {
    lobby.started = false;
  }
}

app.use(express.static(path.join(__dirname, "../client/dist"))); // serve React build

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('lobby:host', (name) => {
    if (lobby.host) return; // already hosted
    lobby.host = { socketId: socket.id, name: name?.trim() || 'Host', deckId: null, faction: null };
    lobby.started = false;
    emitState();
  });

  socket.on('lobby:join', (name) => {
    if (!lobby.host || lobby.guest) return; // need host and no guest yet
    lobby.guest = { socketId: socket.id, name: name?.trim() || 'Guest', deckId: null, faction: null };
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
    // Reset deck if faction changed
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
      // Clear entire lobby if host leaves
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
    // Only host can start
    if (lobby.host?.socketId !== socket.id) return;
    if (!lobby.host?.deckId || !lobby.guest?.deckId) return; // both need decks
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
    resetLobbyIfEmpty();
    emitState();
  });

  // Send initial state
  emitState();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
