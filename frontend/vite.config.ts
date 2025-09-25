import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lee variables del .env en la RAÍZ del proyecto y también en frontend
  const envRoot = loadEnv(mode, PROJECT_ROOT, '')
  const envFront = loadEnv(mode, __dirname, '')

  // Fallback manual: parsear .env raíz si loadEnv no encuentra valores (casos raros)
  function parseEnvFile(filePath: string): Record<string, string> {
    const out: Record<string, string> = {}
    try {
      if (!fs.existsSync(filePath)) return out
      const raw = fs.readFileSync(filePath, 'utf-8')
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
        if (!m) continue
        const key = m[1]
        let val = m[2]
        // Quitar comentarios inline simples (# ...) y comillas
        const hash = val.indexOf('#')
        if (hash > -1) val = val.slice(0, hash)
        val = val.trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        out[key] = val
      }
    } catch {}
    return out
  }

  const manualRoot = parseEnvFile(path.join(PROJECT_ROOT, '.env'))
  const manualRootLocal = parseEnvFile(path.join(PROJECT_ROOT, '.env.local'))
  const manualFront = parseEnvFile(path.join(__dirname, '.env'))
  const manualFrontLocal = parseEnvFile(path.join(__dirname, '.env.local'))

  const manualEnv: Record<string, string> = {
    ...manualRoot,
    ...manualRootLocal,
    ...manualFront,
    ...manualFrontLocal,
  }

  const get = (k: string) => envFront[k] || envRoot[k] || manualEnv[k] || process.env[k] || ''
  // Log de depuración en terminal (no expone secretos en el navegador)
  // eslint-disable-next-line no-console
  console.log('[vite] precios (.env) ->', {
    root_basic_month: envRoot.VITE_PRICE_BASIC_MONTH,
    front_basic_month: envFront.VITE_PRICE_BASIC_MONTH,
    manual_root_basic_month: manualRoot.VITE_PRICE_BASIC_MONTH,
    manual_front_basic_month: manualFront.VITE_PRICE_BASIC_MONTH,
    picked_basic_month: get('VITE_PRICE_BASIC_MONTH'),
  })
  return {
    root: __dirname,
    // Apunta envDir a la raíz para que import.meta.env tome ese .env
    envDir: PROJECT_ROOT,
    envPrefix: 'VITE_',
    define: {
      __VITE_SUPABASE_URL__: JSON.stringify(get('VITE_SUPABASE_URL')),
      __VITE_SUPABASE_ANON__: JSON.stringify(get('VITE_SUPABASE_ANON')),
      __VITE_NODE_AUTH_URL__: JSON.stringify(get('VITE_NODE_AUTH_URL')),
      __VITE_GOOGLE_CLIENT_ID__: JSON.stringify(get('VITE_GOOGLE_CLIENT_ID')),
      // Fallbacks para Paddle/env de precios si import.meta.env no llegara a cargarlos
      __VITE_PADDLE_ENV__: JSON.stringify(get('VITE_PADDLE_ENV') || 'sandbox'),
      __VITE_PADDLE_CLIENT_TOKEN__: JSON.stringify(get('VITE_PADDLE_CLIENT_TOKEN')),
      __VITE_PRICE_BASIC_MONTH__: JSON.stringify(get('VITE_PRICE_BASIC_MONTH')),
      __VITE_PRICE_BASIC_YEAR__: JSON.stringify(get('VITE_PRICE_BASIC_YEAR')),
      __VITE_PRICE_PRO_MONTH__: JSON.stringify(get('VITE_PRICE_PRO_MONTH')),
      __VITE_PRICE_PRO_YEAR__: JSON.stringify(get('VITE_PRICE_PRO_YEAR')),
      __VITE_PRICE_ULTRA_MONTH__: JSON.stringify(get('VITE_PRICE_ULTRA_MONTH')),
      __VITE_PRICE_ULTRA_YEAR__: JSON.stringify(get('VITE_PRICE_ULTRA_YEAR')),
    },
    plugins: [react()],
    server: {
      hmr: {
        overlay: false
      },
      watch: {
        usePolling: true
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      force: true
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    }
  }
})
