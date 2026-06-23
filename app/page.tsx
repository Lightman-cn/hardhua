'use client'

import { useState, useRef, useEffect } from 'react'
import './globals.css'

// 规格要求的5个场景
const SCENES = [
  { id: 'boss', label: '💬 领导', hint: '布置任务不合理/加班太多/功劳被抢' },
  { id: 'colleague', label: '🤝 同事', hint: '同事甩锅/蹭资源/背后说坏话' },
  { id: 'client', label: '💼 客户', hint: '反复改需求/预算砍一半还催交期' },
  { id: 'promotion', label: '📈 晋升/加薪', hint: '年终评定不公平/晋升被拒' },
  { id: 'resign', label: '🚪 离职/交接', hint: '想辞职不知怎么开口/交接时撕破脸' },
]

const CASES = [
  {
    scene: '领导场景',
    hard: '领导天天加班到10点，周末也不放过，还觉得理所应当，真把自己当狼性文化了。',
    soft: '我理解你希望工作和生活能够平衡。其实我一直很佩服你对工作的投入，也希望能跟上这个节奏。不过最近连续的高强度工作让我有点吃力，能不能我们找个时间聊聊，看能不能调整一下工作方式，在保证质量的前提下，让我也能有一些休息和充电的时间？',
    tag: '准时下班了 🎉'
  },
  {
    scene: '客户场景',
    hard: '客户反复改需求，改了七八版最后又说用第一版，我真的会谢。',
    soft: '非常感谢你这么认真地参与需求梳理，看到你们对细节这么重视我很欣慰。我整理了下各版本的迭代记录，可以清晰看到每一版的调整点，也方便后续有据可查。我们下次评审会先对清楚「终稿标准」，避免反复，您看可以吗？',
    tag: '客户居然道歉了 😅'
  },
  {
    scene: '同事场景',
    hard: '同事总让我帮他干活，做完了功劳还是他的，我真的会谢。',
    soft: '我注意到最近我们在协作项目时，任务分工的边界有点模糊。为了后续合作更顺畅，也避免出现信息不对称，我建议下次协作时先把分工和产出标准书面确认一下，这样对大家都公平，也好追责。你觉得呢？',
    tag: '同事再也不敢了 ✌️'
  },
]

const FEATURES = [
  {
    icon: '⚡',
    title: '3秒翻译',
    desc: '输入吐槽，选择场景，一键生成体面回复，AI 比你想得更周全。'
  },
  {
    icon: '🎯',
    title: '场景全覆盖',
    desc: '领导/客户/同事/晋升/离职，职场全场景高情商话术支持。'
  },
  {
    icon: '✨',
    title: '精修打磨',
    desc: '对结果不满意？一键重新生成，或复制后自己再调整。'
  },
]

// 粒子效果
function triggerConfetti(btnEl: HTMLElement) {
  const COLORS = ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B6B', '#45B7D1']
  const SHAPES = ['■', '●', '▲', '✦']
  const rect = btnEl.getBoundingClientRect()
  const baseX = rect.left + rect.width / 2
  for (let i = 0; i < 24; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-particle'
    el.style.left = (baseX + (Math.random() - 0.5) * 140) + 'px'
    el.style.top = (rect.top + window.scrollY - 10) + 'px'
    el.style.fontSize = (Math.random() * 10 + 8) + 'px'
    el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)]
    el.style.animationDuration = (Math.random() * 0.8 + 0.9) + 's'
    el.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2000)
  }
}

// 打字机
function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return }
    setDisplayed(''); setDone(false)
    let i = 0
    const id = setTimeout(function tick() {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
        setTimeout(tick, speed)
      } else {
        setDone(true)
      }
    }, speed * 3)
    return () => clearTimeout(id)
  }, [text, speed])
  return { displayed, done }
}

// 滚动入场
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.scroll-reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
      { threshold: 0.1 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

export default function Home() {
  const [scene, setScene] = useState('boss')
  const [hardText, setHardText] = useState('')
  const [softText, setSoftText] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [quota, setQuota] = useState<{used: number, limit: number} | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [recordId, setRecordId] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)
  const [firstSuccess, setFirstSuccess] = useState(false)
  const speechRef = useRef<any>(null)
  const translateBtnRef = useRef<HTMLButtonElement>(null)
  const { displayed: typedSoft, done: typingDone } = useTypewriter(softText)

  useScrollReveal()

  // 导航滚动阴影
  useEffect(() => {
    const nav = document.querySelector('.nav') as HTMLElement
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setErrMsg('你的浏览器不支持语音录入，换 Chrome 试试~')
      setTimeout(() => setErrMsg(null), 4000)
      return
    }
    const r = new SR()
    speechRef.current = r
    r.lang = 'zh-CN'
    r.continuous = false
    r.interimResults = true
    r.onresult = (e: any) => {
      setHardText(Array.from(e.results).map((t: any) => t[0].transcript).join(''))
    }
    r.onerror = () => setRecording(false)
    r.onend = () => {
      setRecording(false)
      if (hardText.trim()) setTimeout(() => translate(), 100)
    }
    r.start()
    setRecording(true)
  }

  function stopVoice() { speechRef.current?.stop(); setRecording(false) }

  async function translate() {
    if (!hardText.trim()) return
    setLoading(true); setErrMsg(null); setRated(false); setRating(0)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: hardText, scene })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '请求失败')
      setSoftText(data.reply || '')
      if (data.quota) setQuota(data.quota)
      if (data.id) setRecordId(data.id)
      // 首次成功 → 粒子庆祝
      if (!firstSuccess && data.reply) {
        setFirstSuccess(true)
        setTimeout(() => {
          if (translateBtnRef.current) triggerConfetti(translateBtnRef.current)
        }, 500)
      }
    } catch (e: any) {
      setErrMsg(e.message || '出错了,稍后再试')
    } finally {
      setLoading(false)
    }
  }

  async function submitRating(r: number) {
    if (!recordId || rated) return
    setRating(r)
    try {
      await fetch('/api/translate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, rating: r })
      })
      setRated(true)
    } catch (_) {}
  }

  const MAX_CHARS = 300
  const charCountClass = hardText.length > MAX_CHARS ? 'danger' : hardText.length > MAX_CHARS * 0.8 ? 'warn' : ''

  const exampleTexts: Record<string, string> = {
    boss: '领导天天加班到10点，周末也不放过，还觉得理所应当，真把自己当狼性文化了。',
    colleague: '同事总让我帮他干活，做完了功劳还是他的，我真的会谢。',
    client: '客户反复改需求，改了七八版最后又说用第一版，我真的会谢。',
    promotion: '年终评定不公平，领导说我"还不到时候"，但我明明产出了全组最高的业绩。',
    resign: '想辞职但不知道怎么开口，怕领导觉得我不忠诚，也怕交接时撕破脸。',
  }

  return (
    <main>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <span className="dot" /> 硬话软说
        </div>
        <div className="nav-links">
          <a href="#demo">试试</a>
          <a href="#features">特色</a>
          <a href="#cases">案例</a>
        </div>
        <a href="#demo" className="nav-cta">开始翻译</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-hard">
          <span className="tag animate-fade-up">硬话</span>
          <h1 className="animate-fade-up delay-1">想说<span className="accent">滚</span>。<br/>憋不住。</h1>
          <p className="animate-fade-up delay-2">工作里那些想怼不敢怼的瞬间，先来这里倒出来。脏话、吐槽、阴阳怪气，随便说。</p>
          <a href="#demo" className="hero-cta animate-fade-up delay-3">把火发出来 →</a>
          <span className="hero-star animate-fade-up delay-4" style={{right: '15%', top: '15%'}}>✦</span>
          <span className="hero-star animate-fade-up delay-5" style={{left: '18%', top: '35%', fontSize: '18px'}}>✦</span>
        </div>
        <div className="hero-soft">
          <span className="tag animate-fade-up">软话</span>
          <h1 className="animate-fade-up delay-1">对外，<br/>说得<span className="accent">体面</span>。</h1>
          <p className="animate-fade-up delay-2">AI 听懂你的情绪，翻译成你该说的样子。不卑不亢，有理有面，成年人的体面。</p>
          <a href="#demo" className="hero-cta animate-fade-up delay-3">看怎么翻译 →</a>
          <span className="hero-star animate-fade-up delay-4" style={{right: '20%', bottom: '30%', fontSize: '22px'}}>✦</span>
        </div>
      </section>

      {/* DEMO */}
      <section className="demo scroll-reveal" id="demo">
        <div className="demo-head animate-fade-up">
          <div className="kicker">现在就试</div>
          <h2>左边发火，右边收场</h2>
          <p>输入你的职场怨气，AI 把它们翻译成得体、专业、让人舒服的回复。</p>
        </div>

        {/* 场景选择器 */}
        <div className="scene-picker animate-fade-up delay-2">
          {SCENES.map(s => (
            <button
              key={s.id}
              className={`scene-chip ${scene === s.id ? 'active' : ''}`}
              onClick={() => { setScene(s.id); setHardText(exampleTexts[s.id] || ''); setSoftText(''); setRated(false); setRating(0); }}
              title={s.hint}
            >{s.label}</button>
          ))}
        </div>

        <div className="split animate-scale-in delay-3">
          {/* 左侧：吐槽 */}
          <div className="split-left">
            <h3>硬话</h3>
            <textarea
              value={hardText}
              onChange={e => setHardText(e.target.value)}
              placeholder="比如：领导总让我加班到很晚，还觉得理所应当..."
              style={{
                border: hardText ? '2px solid var(--brand-orange)' : 'none',
                borderRadius: '8px',
                padding: '4px',
                transition: 'border-color 0.2s'
              }}
            />
            <div className={`char-count ${charCountClass}`}>
              {hardText.length} / {MAX_CHARS}
            </div>
            <div className="toolbar">
              {!recording ? (
                <button className="rec-btn" onClick={startVoice} title="语音录入">
                  <svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/></svg>
                </button>
              ) : (
                <button className="rec-btn recording" onClick={stopVoice} title="停止">
                  <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                </button>
              )}
              <button
                ref={translateBtnRef}
                className={`translate-btn ${loading ? 'loading' : ''}`}
                onClick={translate}
                disabled={loading || !hardText.trim() || hardText.length > MAX_CHARS}
              >
                {loading ? '⚡ 翻译中…' : '翻译成体面话 →'}
              </button>
            </div>
          </div>

          {/* 右侧：软话 */}
          <div className="split-right">
            <h3>软话</h3>
            <div
              className={`result ${softText ? 'result-reveal' : ''}`}
              style={{ whiteSpace: 'pre-wrap', minHeight: 120 }}
            >
              {typedSoft}
              {softText && !typingDone && <span className="typewriter-cursor" />}
            </div>
            <div className="toolbar">
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(softText)
                  setErrMsg('已复制，直接粘贴就行 ✦')
                  setTimeout(() => setErrMsg(null), 2500)
                }}
                disabled={!softText}
              >📋 复制</button>
              <button
                className="translate-btn"
                onClick={translate}
                disabled={loading || !hardText.trim()}
                style={{ flex: '0 0 auto', padding: '13px 18px' }}
              >🔄 重新翻译</button>
            </div>

            {softText && recordId && !rated && (
              <div className="rating">
                <span className="rating-label">这个翻译贴不贴?</span>
                <div className="stars">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} className={`star ${n <= rating ? 'active' : ''}`}
                      onClick={() => submitRating(n)}>★</button>
                  ))}
                </div>
                <span className="rating-hint">帮 AI 学得更懂你</span>
              </div>
            )}
            {rated && <div className="rating-thanks">谢谢评分！这会让下一个翻译更精准 ✨</div>}

            {loading && !softText && (
              <div className="result loading">
                <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                <span style={{marginLeft: 8}}>AI 在琢磨怎么帮你说得体面…</span>
              </div>
            )}
            {errMsg && (
              <div className="result" style={{ borderLeftColor: '#ff8800', background: '#fff8e8' }}>{errMsg}</div>
            )}
            {quota && (
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
                今日已用 {quota.used} / {quota.limit} 次
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 功能特色 */}
      <section className="features scroll-reveal" id="features">
        <div className="features-head">
          <h2>为什么用硬话软说</h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className={`feature-card scroll-reveal delay-${i+1}`}>
              <div className="feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 案例展示 */}
      <section className="cases scroll-reveal" id="cases">
        <div className="cases-head">
          <h2>看看别人怎么说</h2>
          <p>真实场景示例，左边是你心里想的，右边是 AI 给你的。</p>
        </div>
        <div className="case-grid">
          {CASES.map((c, i) => (
            <div key={i} className={`case-card scroll-reveal delay-${i+1}`}>
              <div className="case-label">{c.scene}</div>
              <div className="case-hard">{c.hard}</div>
              <div className="case-arrow">↓</div>
              <div className="case-soft">{c.soft}</div>
              <div className="case-tag">{c.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta scroll-reveal">
        <h2>让每个想说<span className="accent">"滚"</span>的职场人，<br/>都能体面地说出<span className="accent">"我保留意见"</span>。</h2>
        <p>免费使用 · 无需注册 · 5秒完成</p>
        <a href="#demo" className="cta-btn">来，先骂一句 →</a>
      </section>

      <footer>
        <div style={{ marginBottom: 12 }}>硬话软说 · 职场嘴替 AI</div>
        <div>
          <a href="#">关于</a>
          <a href="#">隐私</a>
          <a href="#">联系</a>
        </div>
        <div style={{ marginTop: 16, fontSize: 12, opacity: 0.4 }}>
          © 2026 · AI 翻译结果仅供参考
        </div>
      </footer>
    </main>
  )
}
