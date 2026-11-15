/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'
import { createClient } from '@supabase/supabase-js'
import { NOINDEX_PRERENDER_ROUTES } from './src/lib/seoPolicy.js'
import { fetchPublicRoutes, sitemapPlugin, assertRenderedRoute } from './scripts/seo/build-seo.mjs'
import { setupReadOnlyPrerender } from './scripts/seo/prerender-readonly.mjs'

async function fetchDynamicRoutes(env) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Public catalogue credentials are required for a complete sitemap.')
  }
  if (url.replace(/\/$/, '') !== 'https://qpdpsgmpqkxeqboyapwp.supabase.co') throw new Error('Production catalogue configuration required')
  if (!key.startsWith('sb_publishable_') && JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role !== 'anon') throw new Error('Anonymous public catalogue key required')
  return fetchPublicRoutes(createClient(url, key))
}

// https://vite.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverEnv = { ...env, ...process.env }
  const isBuild = command === 'build'
  const skipPrerender = process.env.SKIP_PRERENDER === 'true'
  if (isBuild && skipPrerender) throw new Error('Release builds require complete prerendering')
  if (isBuild && (serverEnv.BCS_ENV === 'staging' || serverEnv.VITE_BCS_ENV === 'staging')) throw new Error('Release build requires production configuration')
  const isServerlessBuild = !!process.env.VERCEL

  const sitemapRoutes = isBuild ? await fetchDynamicRoutes(serverEnv) : []
  // Cart gets its own noindex HTML instead of falling back to the prerendered homepage.
  const prerenderRoutes = [...new Set([...sitemapRoutes, ...NOINDEX_PRERENDER_ROUTES])]

  // 在 Vercel 的 serverless Linux 容器（缺 libnspr4 等系統函式庫）改用 @sparticuz/chromium，
  // 它自帶一份完整的 Chromium binary + 必要 shared libs。本機 build 仍用 puppeteer 預設 Chrome。
  let serverlessLaunchOptions = null
  if (isBuild && isServerlessBuild) {
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
      sitemapPlugin(sitemapRoutes),
      ...(isBuild
        ? [
            prerender({
              routes: prerenderRoutes,
              renderer: '@prerenderer/renderer-puppeteer',
              postProcess: route => assertRenderedRoute(route),
              rendererOptions: {
                pageSetup: setupReadOnlyPrerender,
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
    build: {
      rollupOptions: {
        output: {
          // 把不常變動的第三方函式庫拆成獨立 chunk：縮小主程式 bundle、改善瀏覽器快取
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['src/__tests__/**/*.test.js'],
    },
  }
})
