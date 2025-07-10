import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VITE_BIN_PATH = path.resolve(__dirname, 'node_modules/.bin/vite');

const watcher = spawn('nodemon', ['--watch', 'manifest.json', '--exec', VITE_BIN_PATH, 'build'], {
  stdio: 'inherit',
});
watcher.on('exit', (code) => {
  process.exit(code);
});