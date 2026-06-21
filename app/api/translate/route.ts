import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientId } from '@/lib/ratelimit'
import { sanitize } from '@/lib/safety'
import { callDoubao } from '@/lib/doubao'
import { getMockReply } from '@/lib/mock'

export const runtime = 'edge'
export const maxDuration = 30

interface Body {
  text?: string
  scene?: string
}

const SCENE_HINT: Record<string, string> = {
  boss: '对方是你的领导/上级,有权力不对等,你需要不卑不亢、保持职业',
  colleague: '对方是你的同事/平级,你需要客观、把冲突"流程化"、避免撕破脸',
  client: '对方是你的客户/甲方的对接人,你需要专业、把"不"包装成"分步走"',
  hr: '对方是公司 HR,你需要保留证据、口头不撕破脸但书面留底',
  promotion: '你要向领导争取晋升/加薪,需要自信但不能要挟',
  salary: '你在跟 HR 谈薪资/offer,需要专业、给出论据、留谈判空间',
  partner: '对方是合作方/乙方/供应商,你需要正式、引用合同条款、保留追款余地',
  general: '通用职场对话,翻译成得体、专业、不情绪化的成年人口吻'
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req)
  const quota = checkRateLimit(clientId)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `今日免费次数(${quota.limit})已用完,明天再来~` },
      { status: 429 }
    )
  }

  let body: Body
  const contentType = req.headers.get('content-type') || ''

  // 音频请求:先调 ASR(此处简化为要求前端已经转写;后续可接豆包 ASR)
  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData()
    const audio = fd.get('audio') as File | null
    if (!audio) return NextResponse.json({ error: '没有收到音频' }, { status: 400 })
    // TODO: 接豆包 ASR. 当前用占位:告诉前端输入框空着让用户手动补一下
    return NextResponse.json({
      transcript: '',
      reply: '🎙️ 录音收到啦!当前 ASR 服务暂未上线,请在左侧输入框直接打字,效果一样~',
      quota: { used: quota.used + 1, limit: quota.limit }
    })
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const rawText = (body.text || '').trim()
  const scene = body.scene || 'general'

  if (!rawText) {
    return NextResponse.json({ error: '吐槽不能为空,先把火发出来~' }, { status: 400 })
  }

  if (rawText.length > 1500) {
    return NextResponse.json({ error: '吐槽太长(>1500字),先精简一下吧' }, { status: 400 })
  }

  // 安全预审
  const safetyCheck = sanitize(rawText)
  if (safetyCheck.blocked) {
    return NextResponse.json(
      { error: safetyCheck.message || '内容存在合规风险,请换个方式表达' },
      { status: 400 }
    )
  }

  const sceneHint = SCENE_HINT[scene] || SCENE_HINT.general

  const systemPrompt = `你是一个"职场翻译官",把用户的情绪化吐槽翻译成得体、专业、不卑不亢的对外发言。

【场景上下文】${sceneHint}

【翻译原则】
1. 保留用户的真实诉求和立场(不能让用户吃亏)
2. 剥离脏话、攻击性、人身攻击
3. 包装成"就事论事"、"有理有据"、"给对方台阶"的成年人对话
4. 不卑不亢:不卑微讨好,也不阴阳怪气
5. 长度:100-200 字,简洁有力
6. 直接给出回复正文,不要任何解释、标题、引用符号
7. 如果吐槽里涉及具体的名字、公司、商业秘密,主动脱敏为"XX"或"对方"

【输出】只输出翻译后的回复正文,不要任何前言后语。`

  let reply: string
  try {
    if (process.env.DOUBAO_API_KEY && process.env.DOUBAO_ENDPOINT) {
      reply = await callDoubao({
        systemPrompt,
        userText: safetyCheck.cleaned,
        apiKey: process.env.DOUBAO_API_KEY,
        endpoint: process.env.DOUBAO_ENDPOINT,
        model: process.env.DOUBAO_MODEL || 'doubao-lite-32k'
      })
    } else {
      // 没配 key,走 Mock(让网站先能跑)
      reply = getMockReply(rawText, scene)
    }
  } catch (e: any) {
    console.error('AI 调用失败,降级到 Mock:', e?.message)
    reply = getMockReply(rawText, scene)
  }

  return NextResponse.json({
    reply,
    quota: { used: quota.used + 1, limit: quota.limit }
  })
}