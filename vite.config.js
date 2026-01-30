import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import { PRODUCTS } from './src/data/products.js'

const dynamicRoutes = PRODUCTS.map(product => `/product/${product.id}`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    Sitemap({
      hostname: 'https://bcs.tw',
      dynamicRoutes,
      readable: true,
      lastmod: new Date(),
    }),
  ],
  base: "/",
})
