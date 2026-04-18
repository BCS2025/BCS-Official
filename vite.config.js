/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import prerender from '@prerenderer/rollup-plugin'
import { createClient } from '@supabase/supabase-js'

const STATIC_PUBLIC_ROUTES = [
  '/',
  '/about',
  '/store',
  '/store/products',
  '/forge',
  '/makerworld',
]

async function fetchDynamicRoutes(env) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[prerender] Supabase env vars missing; skipping dynamic routes.')
    return []
  }
  try {
    const supabase = createClient(url, key)
    const [productsRes, coursesRes] = await Promise.all([
      supabase.from('products').select('id').eq('is_active', true),
      supabase.from('courses').select('id'),
    ])
    const productRoutes = (productsRes.data || []).map((p) => `/store/product/${p.id}`)
    const courseRoutes = (coursesRes.data || []).map((c) => `/makerworld/${c.id}`)
    return [...productRoutes, ...courseRoutes]
  } catch (err) {
    console.warn('[prerender] Failed to fetch dynamic routes:', err.message)
    return []
  }
}

// https://vite.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isBuild = command === 'build'
  const skipPrerender = process.env.SKIP_PRERENDER === 'true'

  const dynamicRoutes = isBuild && !skipPrerender ? await fetchDynamicRoutes(env) : []
  const allPublicRoutes = [...STATIC_PUBLIC_ROUTES, ...dynamicRoutes]

  if (isBuild) {
    console.log(`[prerender] routes to prerender: ${allPublicRoutes.length}`)
  }

  return {
    plugins: [
      react(),
      Sitemap({
        hostname: 'https://bcs.tw',
        dynamicRoutes: allPublicRoutes,
        readable: true,
        lastmod: new Date(),
        generateRobotsTxt: false,
        robots: [{ userAgent: '*', allow: '/' }],
      }),
      ...(isBuild && !skipPrerender
        ? [
            prerender({
              routes: allPublicRoutes,
              renderer: '@prerenderer/renderer-puppeteer',
              rendererOptions: {
                renderAfterDocumentEvent: 'render-complete',
                maxConcurrentRoutes: 4,
                timeout: 60000,
                launchOptions: {
                  headless: true,
                  args: ['--no-sandbox', '--disable-setuid-sandbox'],
                },
                consoleHandler: (route, message) => {
                  const type = message.type()
                  if (type === 'error' || type === 'warning') {
                    console.log(`[prerender:${route}] (${type}) ${message.text()}`)
                  }
                },
              },
            }),
          ]
        : []),
    ],
    base: '/',
    test: {
      globals: true,
      environment: 'node',
      include: ['src/__tests__/**/*.test.js'],
    },
  }
})
