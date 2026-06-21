// 内存级限流(部署到 Vercel Edge 在同一 region 内单实例有效,够 MVP 用)
// 正式版应换 Upstash Redis

interface QuotaState { used: number; resetAt: number }
const store = new Map<string, QuotaState>()
const DAILY_LIMIT = 50

export function checkRateLimit(clientId: string, limit = DAILY_LIMIT) {
  const now = Date.now()
  const todayEnd = new Date()
  todayEnd.setHours(24, 0, 0, 0)
  const resetAt = todayEnd.getTime()

  let state = store.get(clientId)
  if (!state || state.resetAt <= now) {
    state = { used: 0, resetAt }
    store.set(clientId, state)
  }

  if (state.used >= limit) {
    return { allowed: false, used: state.used, limit, resetAt }
  }
  state.used++
  return { allowed: true, used: state.used, limit, resetAt }
}

export function getClientId(req: Request): string {
  // 优先 x-forwarded-for,其次 x-real-ip,最后 fallback
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'anonymous-' + Math.random().toString(36).slice(2, 8)
}