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
  code?: string;
}

type Listener = (state: LobbyState) => void;
type ErrorListener = (error: string) => void;

class GameConnection {
  private socket: Socket | null = null;
  private listeners: Set<Listener> = new Set();
  private connectListeners: Set<() => void> = new Set();
  private disconnectListeners: Set<() => void> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private registryUrl = 'https://astralia-card-game-registry.onrender.com'; // simple registry service
  private hostEmitted = false; // Prevent duplicate host emissions in same session

  connect(joinCode?: string, serverUrl?: string) {
    if (this.socket) return;
    
    let url: string | undefined;
    
    if (serverUrl) {
      // Direct server URL provided (for custom/local servers)
      url = serverUrl;
    } else if (joinCode) {
      // For production guests: look up code in registry to find host's tunnel URL
      // This will be handled in the join() method instead
      url = 'http://localhost:3000'; // fallback for local testing
    } else {
      // Default: connect to own localhost (hosting mode)
      const isProd = (import.meta as any).env?.PROD;
      url = isProd ? undefined : 'http://localhost:3000';
    }
    
    this.socket = io(url ?? '/', { autoConnect: true, withCredentials: false });
    this.socket.on('connect', () => {
      this.connectListeners.forEach((l) => l());
    });
    this.socket.on('lobby:state', (state: LobbyState) => {
      this.listeners.forEach((l) => l(state));
    });
    this.socket.on('lobby:joinError', (error: string) => {
      this.errorListeners.forEach((l) => l(error));
    });
    this.socket.on('disconnect', () => {
      this.disconnectListeners.forEach((l) => l());
    });
  }

  onState(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onError(listener: ErrorListener) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
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
      this.hostEmitted = false; // Reset flag on disconnect
    }
  }

  host(name: string) {
    if (this.hostEmitted) {
      console.log('[GameConnection] Host already emitted in this session, skipping');
      return;
    }
    this.hostEmitted = true;
    this.socket?.emit('lobby:host', name);
  }
  
  async lookupCode(code: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.registryUrl}/api/code/${code}`);
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (err) {
      console.error('Failed to look up code:', err);
    }
    return null;
  }

  join(name: string, joinCode?: string) {
    this.socket?.emit('lobby:join', { name, code: joinCode || null });
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
