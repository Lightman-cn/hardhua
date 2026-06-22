// =============================================================
// 硬话软说 · Cloudflare Pages Function
// 路径: functions/api/translate.js
// 功能: 调 AI / 安全过滤 / 写 D1 / 限流
// =============================================================

const SCENE_HINT = {
  boss: '对方是你的领导/上级,有权力不对等,你需要不卑不亢、保持职业',
  colleague: '对方是你的同事/平级,你需要客观、把冲突"流程化"、避免撕破脸',
  client: '对方是你的客户/甲方的对接人,你需要专业、把"不"包装成"分步走"',
  hr: '对方是公司 HR,你需要保留证据、口头不撕破脸但书面留底',
  promotion: '你要向领导争取晋升/加薪,需要自信但不能要挟',
  salary: '你在跟 HR 谈薪资/offer,需要专业、给出论据、留谈判空间',
  partner: '对方是合作方/乙方/供应商,你需要正式、引用合同条款、保留追款余地',
  general: '通用职场对话,翻译成得体、专业、不情绪化的成年人口吻'
}

const SYSTEM_PROMPT = `你是一个顶级职场沟通顾问,专治"嘴比脑子快"。

【你的工作方式】
1. 先读懂用户真正想表达什么(表面文字下的真实诉求)
2. 再判断这句话发出去会让对方有什么感受
3. 最后给出一个既保留立场、又让对方好下台的回复

【场景上下文】
{SCENE_HINT}

【翻译原则】
1. 保留用户的核心立场——绝不能让用户吃亏或显得弱势
2. 剥离脏话和人身攻击,但保留情绪的"火候"(不能太假)
3. 翻译后的语气要像一个冷静、有筹码、有底气的成年人,不是在讨好谁
4. 如果对方有错,要让对方意识到但不撕破脸;如果用户有诉求,要理直气壮地提
5. 字数:80-150字,简洁有力,不啰嗦
6. 直接输出翻译后的回复正文,不要任何前言后语、标签、引用符号
7. 吐槽里涉及人名/公司名/具体金额的,主动脱敏为"领导"、"对方"、"XX"

【输出格式】
只输出翻译后的正文一句话,不要解释。`

// ---------------- 限流(基于 KV,跨实例持久)----------------
async function checkRateLimit(env, clientId, limit = 50) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const key = `quota:${today}:${clientId}`
  const current = parseInt((await env.KV.get(key)) || '0', 10)
  if (current >= limit) {
    return { allowed: false, used: current, limit }
  }
  await env.KV.put(key, String(current + 1), { expirationTtl: 86400 * 2 })
  return { allowed: true, used: current + 1, limit }
}

function getClientId(request) {
  const xff = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'anon'
  // hash IP,不存原文
  return hashCode(xff.split(',')[0].trim()).toString(36)
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// ---------------- 内容安全 ----------------
const HARD_BLOCK = [
  /杀(了你|他|她|全家)/i,
  /弄死你/i,
  /死全家/i,
  /(黑人|犹太人|穆斯林|同性恋).*(该死|去死|滚回)/i
]

const EUPHEMISMS = [
  [/傻[逼bB]/g, '过分'],
  [/操你妈/g, '很不爽'],
  [/草你妈/g, '很不爽'],
  [/妈的/g, '真的气'],
  [/\btm\b/g, '真的'],
  [/\btmd\b/g, '真的太过分']
]

function sanitize(text) {
  for (const p of HARD_BLOCK) {
    if (p.test(text)) {
      return { blocked: true, cleaned: '', message: '检测到极端内容,无法翻译。职场吐槽虽爽,咱也不能真出事~' }
    }
  }
  let cleaned = text
  for (const [p, r] of EUPHEMISMS) cleaned = cleaned.replace(p, r)
  // 公司名脱敏
  cleaned = cleaned.replace(/[一-龥]{2,10}(科技|集团|有限公司|股份公司)/g, 'XX公司')
  return { blocked: false, cleaned }
}

// ---------------- AI 调用(MiniMax)----------------
async function callAI(env, systemPrompt, userText) {
  const start = Date.now()
  const apiKey = env.MINIMAX_API_KEY
  const model = 'MiniMax-Text-01'

  if (!apiKey) throw new Error('MINIMAX_API_KEY not configured')

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ],
    temperature: 0.6,
    max_tokens: 600
  }

  const res = await fetch('https://api.minimax.chat/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`MiniMax ${res.status}: ${t.slice(0, 200)}`)
  }
  const data = await res.json()
  const reply = data?.choices?.[0]?.message?.content?.trim() || ''
  return { reply, model, latencyMs: Date.now() - start }
}

// ---------------- Mock 降级 ----------------
const SCENE_TEMPLATES = {
  boss: [
    '王总,关于您提到的 {TOPIC},我整理了下完整的过程和产出(已附文档)。后续类似项目我也会第一时间同步给您对齐,确保信息透明。',
    '理解您对 {TOPIC} 的关注。我这边把当前进展和卡点列了一下(见附件),想跟您约个 15 分钟对齐一下接下来的节奏,可以吗?'
  ],
  colleague: [
    '我看了下原始材料,这块的口径确实有差异(我标了截图)。要不我先按对齐后的版本重新跑一遍,顺便我们拉个内部口径文档,以后避免类似情况。',
    '这个我先记下了。为了后续更高效,我整理了下相关数据和背景,大家可以一起对一下,有问题我们一起优化流程。'
  ],
  client: [
    '理解您想要的效果,这其实是个挺大的体系。建议我们分两步走:第一期先把核心路径和最关键的一个渠道跑通验证 ROI,第二期根据数据再决定是否扩展。这样总投入可控,效果也更可量化。您看这个节奏可以吗?',
    '您说的方向我很认同。为了让方案落地更稳,我建议先把核心场景跑通,后续按数据反馈迭代,这样既保证效果也控制投入。我们约个时间详细对一下?'
  ],
  hr: [
    '谢谢您坦诚沟通。关于这次调整,我希望能拿到书面的具体说明,包括调整依据、时间节点、补偿方案等,我这边也好做下一步的安排。',
    '理解公司业务调整的考虑。我希望我们能在一个正式、透明的框架下来谈,包括时间安排、补偿方案、相关证明文件等。这些对我后续安排都很重要。'
  ],
  promotion: [
    '王总,想跟您聊聊我的成长和接下来的规划。这半年我独立负责了 X 项目,带来了 Y 效果(具体数据见附件)。希望能在团队规划会上系统地讲一下我的贡献和下一步想法,看看有没有更多承担的空间。',
    '关于我接下来的发展,我做了个简短的总结(附件)。想约您 30 分钟时间,系统地聊一下我的贡献和未来规划,看看怎么一起把业务做得更好。'
  ],
  salary: [
    '谢谢您这边的 offer。关于薪资部分,我目前的考量主要是基于市场行情和我过往的产出(我可以提供具体数据参考)。能否在原有基础上再讨论一下空间?我相信我们对岗位价值的判断是一致的。',
    '关于 offer,我整体是认可的。基于我的背景和这份岗位的具体职责,薪资这块希望再讨论一下调整空间。我相信我们能找到双方都舒服的方案。'
  ],
  partner: [
    '关于尾款的事,合同约定的节点已经到了(附件合同对应条款)。我们这边已经把交付做完,希望这周内能收到回款。如果流程上有任何卡点,我们可以一起对齐解决。',
    '理解贵司的流程。为了后续合作更顺畅,建议我们把这次和后续的回款节点都写在补充协议里,大家按节点推进,这样对双方都更清晰。'
  ],
  general: [
    '我理解你的立场,也希望把事情讲清楚。基于目前的事实,我建议我们按以下思路推进:[具体观点]。期待你的反馈。',
    '这件事我想认真回应一下。我的看法是[具体观点]。希望我们能基于事实把问题解决,对双方都更体面。'
  ]
}

function getMockReply(text, scene) {
  const templates = SCENE_TEMPLATES[scene] || SCENE_TEMPLATES.general
  const tpl = templates[Math.floor(Math.random() * templates.length)]
  const topicMatch = text.match(/[一-龥]{3,8}/)?.[0] || '这件事'
  return tpl.replace('{TOPIC}', topicMatch).trim()
}

// =============================================================
// 主入口
// =============================================================
export async function onRequestPost(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  try {
    // 1. 限流
    const clientId = getClientId(request)
    const quota = await checkRateLimit(env, clientId)
    if (!quota.allowed) {
      return jsonResponse(
        { error: `今日免费次数(${quota.limit})已用完,明天再来~`, quota },
        { status: 429, request }
      )
    }

    // 2. 解析请求
    const body = await request.json().catch(() => ({}))
    const rawText = (body.text || '').trim()
    const scene = body.scene || 'general'

    if (!rawText) {
      return jsonResponse({ error: '吐槽不能为空,先把火发出来~' }, { status: 400, request })
    }
    if (rawText.length > 1500) {
      return jsonResponse({ error: '吐槽太长(>1500字),先精简一下吧' }, { status: 400, request })
    }

    // 3. 安全过滤
    const safety = sanitize(rawText)
    if (safety.blocked) {
      // 拦下的也写一行日志,用于统计
      await safeInsert(env, {
        hard_text: rawText.slice(0, 500),
        scene, soft_text: '', blocked: 1, client_id: clientId,
        country: request.cf?.country, user_agent: request.headers.get('user-agent') || ''
      })
      return jsonResponse({ error: safety.message }, { status: 400, request })
    }

    // 4. 调 AI
    const sceneHint = SCENE_HINT[scene] || SCENE_HINT.general
    const systemPrompt = SYSTEM_PROMPT.replace('{SCENE_HINT}', sceneHint)

    let reply, model = 'mock', latencyMs = 0, isMock = 1

    try {
      if (env.MINIMAX_API_KEY) {
        const ai = await callAI(env, systemPrompt, safety.cleaned)
        reply = ai.reply
        model = ai.model
        latencyMs = ai.latencyMs
        isMock = 0
      } else {
        reply = getMockReply(safety.cleaned, scene)
        model = 'mock'
        latencyMs = 0
      }
    } catch (e) {
      console.error('AI failed, fallback mock:', e?.message)
      reply = getMockReply(safety.cleaned, scene)
      model = 'mock-fallback'
    }

    // 5. 写 D1
    const inserted = await safeInsert(env, {
      hard_text: safety.cleaned,
      scene,
      hard_length: safety.cleaned.length,
      soft_text: reply,
      ai_model: model,
      ai_latency_ms: latencyMs,
      is_mock: isMock,
      client_id: clientId,
      country: request.cf?.country,
      user_agent: request.headers.get('user-agent') || '',
      blocked: 0
    })

    // 6. 更新场景统计
    await env.DB.prepare(`
      INSERT INTO scene_stats (scene, total_count, last_used_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(scene) DO UPDATE SET
        total_count = total_count + 1,
        last_used_at = CURRENT_TIMESTAMP
    `).bind(scene).run()

    return jsonResponse({
      reply,
      quota: { used: quota.used, limit: quota.limit },
      id: inserted?.id || null
    }, { status: 200, request })

  } catch (e) {
    console.error('translate error:', e)
    return jsonResponse({ error: '服务开小差了,稍后再试~' }, { status: 500, request })
  }
}

async function safeInsert(env, record) {
  try {
    if (!env.DB) return null
    const result = await env.DB.prepare(`
      INSERT INTO translations
        (hard_text, scene, hard_length, soft_text, ai_model, ai_latency_ms,
         is_mock, blocked, client_id, country, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      record.hard_text,
      record.scene,
      record.hard_length || 0,
      record.soft_text,
      record.ai_model || null,
      record.ai_latency_ms || 0,
      record.is_mock || 0,
      record.blocked || 0,
      record.client_id,
      record.country || null,
      record.user_agent?.slice(0, 200) || null
    ).run()
    return { id: result.meta?.last_row_id }
  } catch (e) {
    console.error('D1 insert failed:', e?.message)
    return null
  }
}

// 评分接口
export async function onRequestPut(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() })

  try {
    const body = await request.json().catch(() => ({}))
    const { id, rating, feedback } = body
    if (!id || !rating || rating < 1 || rating > 5) {
      return jsonResponse({ error: '参数错误' }, { status: 400, request })
    }
    if (!env.DB) return jsonResponse({ error: 'DB 未配置' }, { status: 503, request })

    await env.DB.prepare(`
      UPDATE translations
      SET rating = ?, feedback_text = ?, rated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(rating, feedback?.slice(0, 500) || null, id).run()

    // 更新场景平均分
    await env.DB.prepare(`
      UPDATE scene_stats
      SET avg_rating = (
        SELECT AVG(rating) FROM translations
        WHERE scene = (SELECT scene FROM translations WHERE id = ?) AND rating IS NOT NULL
      )
      WHERE scene = (SELECT scene FROM translations WHERE id = ?)
    `).bind(id, id).run()

    return jsonResponse({ ok: true }, { status: 200, request })
  } catch (e) {
    console.error('rate error:', e)
    return jsonResponse({ error: '评分失败' }, { status: 500, request })
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

function jsonResponse(data, { status = 200, request } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  })
}
