# Electron Integration for Astralia Game

## Overview

The Socket.IO server is now embedded in the Electron main process, eliminating the need for a separate server terminal.

## Setup

1. All dependencies are installed: `npm install`
2. The `electron.js` file contains:
   - Express + Socket.IO server (port 3000)
   - Electron BrowserWindow setup
   - Lobby state machine

## Running the App

### Development Mode

```bash
npm run dev
```

This will:

1. Start Vite dev server on `http://localhost:5173`
2. Start Electron main process with embedded Socket.IO server on `localhost:3000`
3. Open an Electron window with React app
4. Auto-open DevTools for debugging

### Web-Only Development

If you want to work on the React app without Electron:

```bash
npm run dev:web
```

This runs Vite dev server on `http://localhost:5173`. You'll need to manually start the server for Socket.IO to work (or use the old `/server/server.js` setup).

### Production Build

```bash
npm run build
```

This builds the React app to `dist/` folder. The Electron app will serve static files from `dist/` in production.

## File Structure

- `electron.js` - Main Electron process (creates window, starts server)
- `src/` - React application source
- `public/` - Static assets
- `dist/` - Built React app (after `npm run build`)

## Socket.IO Connection

The React app connects to `http://localhost:3000` in development, established in `src/services/gameConnection.ts`.

## Next Steps

1. Test the dev flow: `npm run dev`
2. Verify 2-player lobby works with auto-connection
3. (Optional) Remove the `/server` folder once fully tested
4. Add Electron build configuration for packaging

## Troubleshooting

- If Vite dev server fails to start, check port 5173 is available
- If Socket.IO connection fails, ensure the Electron process started successfully
- Check browser DevTools console for client-side errors
- Check Electron DevTools for server-side errors
