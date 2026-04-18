import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../../components/ui/Button'
import { Rocket, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'

const LAST_PUBLISHED_KEY = 'bcs:lastPublishedAt'

export const AdminPublish = () => {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [lastPublishedAt, setLastPublishedAt] = useState(
    () => localStorage.getItem(LAST_PUBLISHED_KEY) || ''
  )

  const isPublishing = status === 'publishing'

  const handlePublish = async () => {
    const ok = window.confirm(
      '確定要發佈最新資料到官網嗎？\n\n這會觸發 Vercel 重新建置（約 1–3 分鐘後生效）。'
    )
    if (!ok) return

    setStatus('publishing')
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('未登入，請重新登入')

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `發佈失敗（HTTP ${res.status}）`)

      const now = new Date().toISOString()
      localStorage.setItem(LAST_PUBLISHED_KEY, now)
      setLastPublishedAt(now)
      setStatus('success')
      setMessage('已送出發佈請求，約 1–3 分鐘後官網生效。可到 Vercel Dashboard 查看建置進度。')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || '未知錯誤')
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">發佈到官網</h1>
        <p className="text-gray-600 mt-2 leading-relaxed">
          當你修改<strong>商品</strong>或<strong>課程</strong>資料後，按此按鈕才會重新產生官網的 SEO 靜態頁。<br />
          訂單、庫存、報名等即時資料 <strong>不需要</strong> 按此按鈕。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-3 flex items-center justify-center gap-2"
        >
          {isPublishing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              發佈中...
            </>
          ) : (
            <>
              <Rocket size={18} />
              立即發佈到官網
            </>
          )}
        </Button>

        {status === 'success' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded flex items-start gap-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-green-900 leading-relaxed">{message}</div>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-900 leading-relaxed">{message}</div>
          </div>
        )}

        {lastPublishedAt && (
          <div className="mt-6 pt-4 border-t text-sm text-gray-500">
            最後發佈時間（本機記錄）：
            <span className="ml-1 font-medium text-gray-700">
              {new Date(lastPublishedAt).toLocaleString('zh-TW')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
        <div className="flex items-start gap-2 mb-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="font-semibold text-blue-900">使用時機</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-blue-900 mb-2">需要發佈</div>
            <ul className="space-y-1 list-disc list-inside text-blue-800">
              <li>新增或下架商品 / 課程</li>
              <li>修改商品名稱、描述、主圖、價格</li>
              <li>修改課程資訊、日期、地點</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-2">不需要發佈</div>
            <ul className="space-y-1 list-disc list-inside text-gray-600">
              <li>處理訂單、調整庫存、狀態</li>
              <li>回覆客服詢問、審核報名</li>
              <li>後台本身的操作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
