import { defineConfig } from 'tsup'

export default defineConfig({
    entry: {
        server: 'src/server/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: false, // Don't clean to preserve client build
    splitting: false,
    external: [
        'react', 'react-dom', 'next', 'next-auth', '@prisma/client', 'next-intl'
    ],
    esbuildOptions(options) {
        options.alias = { '@': './src' }
    },
})
