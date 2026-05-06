import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

/**
 * Post-build: fix manifest, clean HTML, create zip
 */
function extensionBuild() {
  return {
    name: 'extension-build',
    writeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // 1. Copy and fix manifest.json
      const src = resolve(__dirname, 'manifest.json');
      const dest = resolve(distDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(src, 'utf-8'));
      const actionKey = manifest.manifest_version === 2 ? 'browser_action' : 'action';
      manifest[actionKey].default_popup = 'index.html';
      mkdirSync(distDir, { recursive: true });
      writeFileSync(dest, JSON.stringify(manifest, null, 2));

      // 2. Fix HTML: remove crossorigin attribute
      const htmlPath = resolve(distDir, 'index.html');
      let html = readFileSync(htmlPath, 'utf-8');
      html = html.replace(/ crossorigin/g, '');
      writeFileSync(htmlPath, html);

      // 3. Create zip
      const zipDest = resolve(__dirname, 'react-slide-to-pptx.zip');
      try {
        execSync(`rm -f "${zipDest}" && cd "${distDir}" && zip -r "${zipDest}" .`, { stdio: 'pipe' });
        console.log(`  ✅ Created ${zipDest}`);
      } catch (e) {
        console.warn('  ⚠️  zip not available, skip zip creation');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), extensionBuild()],
  root: resolve(__dirname, 'popup'),
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'popup', 'index.html'),
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'es2020',
    cssCodeSplit: false,
    minify: 'esbuild',
    modulePreload: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname),
    },
  },
});
