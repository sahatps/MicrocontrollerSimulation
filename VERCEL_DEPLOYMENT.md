# HackCable - Vercel Deployment Guide

This guide will help you deploy HackCable (Arduino and ESP32 simulator) to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (optional, but recommended):
   ```bash
   npm install -g vercel
   ```

## Deployment Methods

### Method 1: Deploy via Vercel CLI

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project locally to verify:
   ```bash
   npm run build:web
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. For production deployment:
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel will detect the configuration from `vercel.json`
5. Click "Deploy"

## Configuration

The project is configured with the necessary Vercel settings in `vercel.json`:

- **Build Command**: `npm run build:web`
- **Output Directory**: `dist/web`
- **Headers**: Cross-Origin headers are configured for browser-side `wasm-clang`

`npm run build:web` builds the HackCable web bundle, builds the tracked `blocks-app/` web app, and copies that output into `dist/web/blocks` so the shell's `/blocks/index.html` iframe route is present in production.

### Important Headers

The following headers are required for browser-side `wasm-clang`:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

## Build Output

The build process creates the following files in `dist/web/`:
- `index.html` - Main HTML file
- `bundle.js` - Compiled JavaScript bundle
- `assets/` - Static assets (icons, SVG files)
- `blocks/` - Embedded Blocks app build

## Verification

After deployment, verify that:
1. The application loads without errors
2. You can select different boards (Arduino Uno, ESP32, Handysense Pro)
3. ESP32 code compiles and executes through Clang/LLVM
4. `/wasm-clang` assets load correctly in the browser

## Troubleshooting

### WebAssembly Errors
If you encounter CORS or WebAssembly errors, verify that:
- The Cross-Origin headers are properly configured in `vercel.json`
- Your browser supports WebAssembly with shared memory

### Build Errors
If the build fails:
1. Ensure all dependencies are installed: `npm install`
2. Clear the build cache: `rm -rf dist node_modules && npm install`
3. Check Node.js version (recommended: Node.js 14 or higher)

### Missing Assets
If assets are not loading:
- Verify that the `web/assets/` directory contains all necessary files
- Check the browser console for 404 errors

## Local Development

To run the project locally:

```bash
npm install
npm run serve:web
```

This starts a development server at http://localhost:3000

## Environment Variables

This project doesn't require environment variables for deployment.

## Support

For issues or questions:
- GitHub Issues: https://github.com/ClementGre/HackCable/issues
- Vercel Documentation: https://vercel.com/docs
