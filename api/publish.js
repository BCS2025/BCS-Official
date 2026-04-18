import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '缺少授權 Token' })
  }
  const token = authHeader.slice(7)

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: '伺服器未設定 Supabase 環境變數' })
  }
  if (!deployHook) {
    return res.status(500).json({ error: '伺服器未設定 VERCEL_DEPLOY_HOOK_URL' })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    return res.status(401).json({ error: '登入狀態無效，請重新登入' })
  }

  try {
    const hookRes = await fetch(deployHook, { method: 'POST' })
    const text = await hookRes.text()
    if (!hookRes.ok) {
      return res.status(502).json({
        error: `Vercel Deploy Hook 回應 ${hookRes.status}`,
        detail: text.slice(0, 500),
      })
    }
    let payload = {}
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { raw: text.slice(0, 200) }
    }
    return res.status(200).json({
      ok: true,
      triggeredAt: new Date().toISOString(),
      triggeredBy: data.user.email,
      deployment: payload,
    })
  } catch (err) {
    return res.status(502).json({ error: err.message || '觸發部署失敗' })
  }
}
