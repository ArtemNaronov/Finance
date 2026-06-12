import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NODE_VERSION = '22.12.0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const binDir = path.join(root, 'src-tauri', 'bundle-resources', 'bin');
const tmpDir = path.join(root, '.tmp-node-download');

function resolvePlatform(value) {
  const map = { win: 'win', win32: 'win', darwin: 'darwin', linux: 'linux' };
  const key = value?.toLowerCase();
  if (key && map[key]) return map[key];
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'darwin';
  return 'linux';
}

function resolveArch(value) {
  const map = { x64: 'x64', amd64: 'x64', arm64: 'arm64', aarch64: 'arm64' };
  const key = value?.toLowerCase();
  if (key && map[key]) return map[key];
  return process.arch === 'arm64' ? 'arm64' : 'x64';
}

const platform = resolvePlatform(process.argv[2]);
const arch = resolveArch(process.argv[3]);
const folder = `node-v${NODE_VERSION}-${platform}-${arch}`;
const archive = platform === 'win' ? `${folder}.zip` : `${folder}.tar.xz`;
const url = `https://nodejs.org/dist/v${NODE_VERSION}/${archive}`;

async function download(fileUrl, destination) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Не удалось скачать Node.js (${response.status}): ${fileUrl}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, buffer);
}

function extract(archivePath, destination) {
  fs.mkdirSync(destination, { recursive: true });
  if (platform === 'win') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${archivePath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force"`,
      { stdio: 'inherit' },
    );
    return;
  }
  if (archive.endsWith('.zip')) {
    execSync(`tar -xf "${archivePath}" -C "${destination}"`, { stdio: 'inherit' });
    return;
  }
  execSync(`tar -xJf "${archivePath}" -C "${destination}"`, { stdio: 'inherit' });
}

console.log(`==> Node.js ${NODE_VERSION} for ${platform}-${arch}`);
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(binDir, { recursive: true });

const archivePath = path.join(tmpDir, archive);
await download(url, archivePath);
extract(archivePath, tmpDir);

const extractedNode = path.join(tmpDir, folder, 'bin', platform === 'win' ? 'node.exe' : 'node');
const targetName = platform === 'win' ? 'node.exe' : 'node';
const targetPath = path.join(binDir, targetName);

function findNodeBinary(dir) {
  const expected = platform === 'win' ? 'node.exe' : 'node';
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findNodeBinary(full);
      if (nested) return nested;
      continue;
    }
    if (entry.name === expected && entry.name.endsWith('.exe') === (platform === 'win')) {
      return full;
    }
  }
  return null;
}

const nodeBinary = fs.existsSync(extractedNode) ? extractedNode : findNodeBinary(tmpDir);
if (!nodeBinary) {
  throw new Error(`Node binary not found under ${tmpDir}`);
}

fs.copyFileSync(nodeBinary, targetPath);
if (platform !== 'win') {
  fs.chmodSync(targetPath, 0o755);
}

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`==> Saved ${targetPath}`);
