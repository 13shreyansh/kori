import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
// @ts-expect-error plain JS module
import { geminiMiddleware } from './server/gemini.mjs'

const api = (env: Record<string, string>): Plugin => ({
  name: 'kori-api',
  configureServer(s) { s.middlewares.use(geminiMiddleware(env)) },
  configurePreviewServer(s) { s.middlewares.use(geminiMiddleware(env)) },
})

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), api({ ...process.env, ...loadEnv(mode, process.cwd(), '') } as Record<string, string>)],
}))
