#!/usr/bin/env node
import { spawn } from 'child_process';
import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.ELECTRON_DEV = '1';

// Launch first Electron instance (Player 1)
const userDataDir1 = path.join(__dirname, '.electron-data', 'player1');
const child1 = spawn(electron, ['.', `--user-data-dir=${userDataDir1}`], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_DEV: '1' }
});

// Launch second Electron instance (Player 2) after a short delay
setTimeout(() => {
  const userDataDir2 = path.join(__dirname, '.electron-data', 'player2');
  const child2 = spawn(electron, ['.', `--user-data-dir=${userDataDir2}`], {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_DEV: '1' }
  });
  
  child2.on('exit', (code) => {
    console.log('Player 2 instance closed');
  });
}, 1000);

child1.on('exit', (code) => {
  console.log('Player 1 instance closed');
  process.exit(code);
});
