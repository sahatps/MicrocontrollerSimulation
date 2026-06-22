import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const normalizeBasePath = (value) => {
  const trimmed = String(value || '').trim()
  if (!trimmed || trimmed === '/') return ''
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: `${normalizeBasePath(process.env.APP_BASE_PATH)}/blocks/`,
})
