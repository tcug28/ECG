import { defineConfig } from 'vite';

export default defineConfig({
    root: 'client', // Source files are in client/
    build: {
        outDir: '../dist', // Output to dist/ in the project root
        emptyOutDir: true,
    }
});
