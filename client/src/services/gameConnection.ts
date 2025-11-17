import { io, Socket } from 'socket.io-client';

export interface LobbyPlayerState {
  socketId: string;
  name: string;
  deckId: string | null;
  faction: string | null;
}

export interface LobbyState {
  host: LobbyPlayerState | null;
  guest: LobbyPlayerState | null;
  started: boolean;
}

type Listener = (state: LobbyState) => void;

class GameConnection {
  private socket: Socket | null = null;
  private listeners: Set<Listener> = new Set();
  private connectListeners: Set<() => void> = new Set();
  private disconnectListeners: Set<() => void> = new Set();

  connect() {
    if (this.socket) return;
    const isProd = (import.meta as any).env?.PROD;
    const url = isProd ? undefined : 'http://localhost:3000';
    this.socket = io(url ?? '/', { autoConnect: true, withCredentials: false });
    this.socket.on('connect', () => {
      this.connectListeners.forEach((l) => l());
    });
    this.socket.on('lobby:state', (state: LobbyState) => {
      this.listeners.forEach((l) => l(state));
    });
    this.socket.on('disconnect', () => {
      this.disconnectListeners.forEach((l) => l());
    });
  }

  onState(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSocketId(): string | null {
    return this.socket?.id ?? null;
  }

  isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }

  runWhenConnected(cb: () => void) {
    if (this.isConnected()) {
      cb();
      return () => {};
    }
    return this.onConnect(cb);
  }

  onConnect(listener: () => void) {
    this.connectListeners.add(listener);
    return () => this.connectListeners.delete(listener);
  }
  onDisconnect(listener: () => void) {
    this.disconnectListeners.add(listener);
    return () => this.disconnectListeners.delete(listener);
  }

  disconnect() {
    if (!this.socket) return;
    try {
      this.socket.disconnect();
    } finally {
      this.disconnectListeners.forEach((l) => l());
      this.socket = null;
    }
  }

  host(name: string) {
    this.socket?.emit('lobby:host', name);
  }
  join(name: string) {
    this.socket?.emit('lobby:join', name);
  }
  setName(name: string) {
    this.socket?.emit('lobby:setName', name);
  }
  setFaction(faction: string | null) {
    this.socket?.emit('lobby:setFaction', faction);
  }
  setDeck(deckId: string | null) {
    this.socket?.emit('lobby:setDeck', deckId);
  }
  leave() {
    this.socket?.emit('lobby:leave');
    setTimeout(() => this.disconnect(), 50);
  }
  startRequest() {
    this.socket?.emit('lobby:startRequest');
  }
}

export const gameConnection = new GameConnection();
