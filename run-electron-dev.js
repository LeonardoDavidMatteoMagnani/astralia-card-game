#!/usr/bin/env node
import { spawn } from 'child_process';
import electron from 'electron';

process.env.ELECTRON_DEV = '1';

const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_DEV: '1' }
});

child.on('exit', (code) => {
  process.exit(code);
});
