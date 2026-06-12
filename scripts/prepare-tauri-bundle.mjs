import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const bundleDir = path.join(root, 'src-tauri', 'bundle-resources');
const serverDir = path.join(bundleDir, 'server');
const clientDistDir = path.join(bundleDir, 'client-dist');
const binDir = path.join(bundleDir, 'bin');

function preserveBinNode() {
  const nodeExe = path.join(binDir, 'node.exe');
  const nodeBin = path.join(binDir, 'node');
  if (fs.existsSync(nodeExe)) return fs.readFileSync(nodeExe);
  if (fs.existsSync(nodeBin)) return fs.readFileSync(nodeBin);
  return null;
}

function restoreBinNode(data) {
  if (!data) return;
  fs.mkdirSync(binDir, { recursive: true });
  const target = process.platform === 'win32' ? 'node.exe' : 'node';
  fs.writeFileSync(path.join(binDir, target), data);
}

console.log('==> Building client...');
execSync('npm run build --prefix client', { cwd: root, stdio: 'inherit' });

console.log('==> Building server...');
execSync('npm run build --prefix server', { cwd: root, stdio: 'inherit' });

console.log('==> Pruning server production dependencies...');
execSync('npm prune --prefix server --omit=dev', { cwd: root, stdio: 'inherit' });

console.log('==> Preparing bundle-resources...');
const savedNode = preserveBinNode();
fs.rmSync(serverDir, { recursive: true, force: true });
fs.rmSync(clientDistDir, { recursive: true, force: true });
fs.mkdirSync(serverDir, { recursive: true });
restoreBinNode(savedNode);

fs.cpSync(path.join(root, 'server', 'dist'), path.join(serverDir, 'dist'), { recursive: true });
fs.cpSync(path.join(root, 'server', 'node_modules'), path.join(serverDir, 'node_modules'), {
  recursive: true,
});
fs.cpSync(path.join(root, 'server', 'package.json'), path.join(serverDir, 'package.json'));
fs.cpSync(path.join(root, 'client', 'dist'), clientDistDir, { recursive: true });
fs.cpSync(path.join(root, 'client', 'dist'), path.join(serverDir, 'client-dist'), { recursive: true });

console.log('==> Bundle ready at src-tauri/bundle-resources/');
