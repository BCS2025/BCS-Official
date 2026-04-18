/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import prerender from '@prerenderer/rollup-plugin'
import { createClient } from '@supabase/supabase-js'

// 公開、且希望被索引的靜態路由。送 sitemap + 預渲染。
const INDEXED_STATIC_ROUTES = [
  '/',
  '/about',
  '/store',
  '/store/products',
  '/forge',
  '/makerworld',
]

// 會被預渲染但不該被索引。寫 robots noindex，避免被當成首頁重複內容。
// Why: Vercel 對找不到的靜態檔走 rewrite → /index.html（=首頁預渲染 HTML），
// 結果 /store/cart 會被爬蟲誤當成首頁。替它產一份專屬 HTML 即可解決。
const NOINDEX_PRERENDER_ROUTES = ['/store/cart']

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
  const isServerlessBuild = !!process.env.VERCEL

  const dynamicRoutes = isBuild && !skipPrerender ? await fetchDynamicRoutes(env) : []
  const sitemapRoutes = [...INDEXED_STATIC_ROUTES, ...dynamicRoutes]
  const prerenderRoutes = [...INDEXED_STATIC_ROUTES, ...NOINDEX_PRERENDER_ROUTES, ...dynamicRoutes]

  // 在 Vercel 的 serverless Linux 容器（缺 libnspr4 等系統函式庫）改用 @sparticuz/chromium，
  // 它自帶一份完整的 Chromium binary + 必要 shared libs。本機 build 仍用 puppeteer 預設 Chrome。
  let serverlessLaunchOptions = null
  if (isBuild && !skipPrerender && isServerlessBuild) {
    const { default: chromium } = await import('@sparticuz/chromium')
    serverlessLaunchOptions = {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }
    console.log('[prerender] using @sparticuz/chromium for serverless build')
  }

  if (isBuild) {
    console.log(`[prerender] routes to prerender: ${prerenderRoutes.length}（其中 sitemap: ${sitemapRoutes.length}）`)
  }

  return {
    plugins: [
      react(),
      Sitemap({
        hostname: 'https://bcs.tw',
        dynamicRoutes: sitemapRoutes,
        readable: true,
        lastmod: new Date(),
        generateRobotsTxt: false,
        robots: [{ userAgent: '*', allow: '/' }],
      }),
      ...(isBuild && !skipPrerender
        ? [
            prerender({
              routes: prerenderRoutes,
              renderer: '@prerenderer/renderer-puppeteer',
              rendererOptions: {
                renderAfterDocumentEvent: 'render-complete',
                maxConcurrentRoutes: 4,
                timeout: 60000,
                launchOptions: serverlessLaunchOptions || {
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
