import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const bundleDir = path.join(root, 'src-tauri', 'bundle-resources');

console.log('==> Building client...');
execSync('npm run build --prefix client', { cwd: root, stdio: 'inherit' });

console.log('==> Building server...');
execSync('npm run build --prefix server', { cwd: root, stdio: 'inherit' });

console.log('==> Installing server production dependencies...');
execSync('npm ci --prefix server --omit=dev', { cwd: root, stdio: 'inherit' });

console.log('==> Preparing bundle-resources...');
fs.rmSync(bundleDir, { recursive: true, force: true });
fs.mkdirSync(path.join(bundleDir, 'server'), { recursive: true });
fs.mkdirSync(path.join(bundleDir, 'bin'), { recursive: true });

fs.cpSync(path.join(root, 'server', 'dist'), path.join(bundleDir, 'server', 'dist'), {
  recursive: true,
});
fs.cpSync(path.join(root, 'server', 'node_modules'), path.join(bundleDir, 'server', 'node_modules'), {
  recursive: true,
});
fs.copyFileSync(path.join(root, 'server', 'package.json'), path.join(bundleDir, 'server', 'package.json'));
fs.cpSync(path.join(root, 'client', 'dist'), path.join(bundleDir, 'client-dist'), { recursive: true });

console.log('==> Bundle ready at src-tauri/bundle-resources/');
