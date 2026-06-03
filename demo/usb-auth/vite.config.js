import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Workspace root — two levels up from demo/usb-auth.
// Vite must be allowed to serve @aztec/bb.js worker scripts that live here.
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bbBrowserDir = path.resolve(workspaceRoot, 'demo/node_modules/@aztec/bb.js/dest/browser');
const noirWasmFiles = new Map([
  [
    '/node_modules/.vite/deps/acvm_js_bg.wasm',
    path.resolve(workspaceRoot, 'demo/node_modules/@noir-lang/acvm_js/web/acvm_js_bg.wasm'),
  ],
  [
    '/node_modules/.vite/deps/noirc_abi_wasm_bg.wasm',
    path.resolve(workspaceRoot, 'demo/node_modules/@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm'),
  ],
]);

function contentType(filePath) {
  if (filePath.endsWith('.js')) return 'text/javascript';
  if (filePath.endsWith('.wasm')) return 'application/wasm';
  if (filePath.endsWith('.gz')) return 'application/gzip';
  if (filePath.endsWith('.json') || filePath.endsWith('.map')) return 'application/json';
  if (filePath.endsWith('.d.ts')) return 'text/plain';
  return 'application/octet-stream';
}

function bbStaticBundle() {
  let outDir;

  return {
    name: 'bb-static-bundle',
    configureServer(server) {
      server.middlewares.use('/vendor/bb.js', (req, res, next) => {
        const requestPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
        const filePath = path.resolve(bbBrowserDir, `.${requestPath}`);

        if (!filePath.startsWith(`${bbBrowserDir}${path.sep}`)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) {
            next();
            return;
          }

          res.setHeader('Content-Type', contentType(filePath));
          res.setHeader('Cache-Control', 'no-cache');
          fs.createReadStream(filePath).pipe(res);
        });
      });
    },
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      if (!outDir) return;
      fs.cpSync(bbBrowserDir, path.resolve(outDir, 'vendor/bb.js'), { recursive: true });
    },
  };
}

function noirWasmDeps() {
  return {
    name: 'noir-wasm-deps',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
        const filePath = noirWasmFiles.get(requestPath);

        if (!filePath) {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    bbStaticBundle(),
    noirWasmDeps(),
    nodePolyfills({
      include: ['buffer'],
      globals: { Buffer: true, global: true, process: false },
      protocolImports: false,
    }),
  ],
  server: {
    fs: {
      // Allow Vite to serve files from the monorepo root so that
      // @aztec/bb.js worker scripts (main.worker.js, thread.worker.js)
      // in the workspace-root node_modules can be fetched.
      allow: [workspaceRoot],
    },
  },
  optimizeDeps: {
    // Keep bb.js out of esbuild pre-bundling — it embeds WASM as data URIs
    // and spawns workers; esbuild cannot handle either pattern.
    exclude: ['@aztec/bb.js'],
    include: ['@noir-lang/noir_js'],
  },
  build: {
    rollupOptions: {
      external: ['@aztec/bb.js'],
    },
  },
});
