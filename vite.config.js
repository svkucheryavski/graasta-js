import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as fs from 'fs';

const appID = JSON.parse(fs.readFileSync(`${process.cwd()}/info.json`)).id;
if (appID === "" || appID === undefined) {
   throw new Error("App ID is not defined.");
}

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [svelte()],
   build: {
      assetsDir: '',
      sourcemap: true,
      rollupOptions: {
         external: [
         'node:*',
         ],
        	input: 'src/main.js',
         output: {
            entryFileNames: `${appID}.js`,
            assetFileNames: `${appID}.[ext]`,
            sourcemap: true,
            format: 'iife',
            name: 'app',
            dir: "dist"
         }
      }
   }

})
