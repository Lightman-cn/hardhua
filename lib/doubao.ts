// 豆包(Doubao)API 调用 — 火山引擎 Ark Runtime

interface DoubaoParams {
  systemPrompt: string
  userText: string
  apiKey: string
  endpoint: string  // 例如 https://ark.cn-beijing.volces.com/api/v3/chat/completions
  model: string     // 例如 doubao-lite-32k 或 ep-xxxxx(端点 id)
}

export async function callDoubao(p: DoubaoParams): Promise<string> {
  const res = await fetch(p.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${p.apiKey}`
    },
    body: JSON.stringify({
      model: p.model,
      messages: [
        { role: 'system', content: p.systemPrompt },
        { role: 'user', content: p.userText }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`豆包 API ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}