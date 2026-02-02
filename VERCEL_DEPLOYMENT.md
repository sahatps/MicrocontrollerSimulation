# HackCable - Vercel Deployment Guide

This guide will help you deploy HackCable (Arduino and ESP32 simulator) to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (optional, but recommended):
   ```bash
   npm install -g vercel
   ```

## Deployment Methods

### Method 1: Deploy via Vercel CLI (Recommended)

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

4. Deploy to Vercel:
   ```bash
   vercel
   ```

5. For production deployment:
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to https://vercel.com/new

3. Import your repository

4. Vercel will automatically detect the configuration from `vercel.json`

5. Click "Deploy"

## Configuration

The project is already configured with the necessary Vercel settings in `vercel.json`:

- **Build Command**: `npm run build:web`
- **Output Directory**: `dist/web`
- **Headers**: Cross-Origin headers are configured for WebAssembly support

### Important Headers

The following headers are required for MicroPython (WebAssembly) to work:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These are already configured in `vercel.json`.

## Build Output

The build process creates the following files in `dist/web/`:
- `index.html` - Main HTML file
- `bundle.js` - Compiled JavaScript bundle
- `micropython.wasm` - MicroPython WebAssembly binary
- `micropython.mjs` - MicroPython JavaScript module
- `assets/` - Static assets (icons, SVG files)

## Verification

After deployment, verify that:
1. The application loads without errors
2. You can select different boards (Arduino Uno, ESP32, Handysense Pro)
3. Code compilation and execution works properly
4. WebAssembly modules load correctly (check browser console for errors)

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

This will start a development server at http://localhost:3000

## Environment Variables

This project doesn't require any environment variables for deployment.

## Custom Domain

To add a custom domain:
1. Go to your project on Vercel Dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Follow the DNS configuration instructions

## Support

For issues or questions:
- GitHub Issues: https://github.com/ClementGre/HackCable/issues
- Vercel Documentation: https://vercel.com/docs
