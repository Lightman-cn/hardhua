/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 用 standalone 模式更友好
  output: 'standalone',
  // 我们用 Pages Functions 处理 /api/*,Next.js 自己的 API Routes 不打包
  // 但保留 pages/api 是兼容写法,实际由 functions/api 接管
  reactStrictMode: true
}

module.exports = nextConfig
