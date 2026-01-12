import { defineConfig } from 'tsup'

export default defineConfig({
    entry: {
        index: 'index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true, // Clean dist folder before starting
    splitting: false,
    external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'next',
        'next/link',
        'next/navigation',
        'next-auth',
        '@prisma/client',
        'next-intl',
    ],
    banner: {
        js: '"use client";',
    },
    esbuildOptions(options) {
        options.alias = { '@': './src' }
        options.jsx = 'automatic'
    },
})
