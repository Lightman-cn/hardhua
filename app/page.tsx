'use client'

import { useState, useRef, useEffect } from 'react'
import './animations.css'

const SCENES = [
  { id: 'boss', label: '霸道领导', hint: '领导让你无偿加班、抢功、PUA' },
  { id: 'colleague', label: '甩锅同事', hint: '同事把活推给你、抢你功劳' },
  { id: 'client', label: '异想天开客户', hint: '客户需求反复、预算离谱、临时加塞' },
  { id: 'hr', label: 'HR 谈辞退', hint: 'HR 用话术逼你主动离职' },
  { id: 'promotion', label: '晋升答辩', hint: '向领导汇报争取升职加薪' },
  { id: 'salary', label: '谈薪水', hint: '面对 offer 谈判、涨薪请求' },
  { id: 'partner', label: '难缠合作方', hint: '合作方拖延、扯皮、推卸' },
  { id: 'general', label: '随便聊聊', hint: '不想分类,先把情绪倒出来' }
]

const MEMES = [
  { src: '/memes/meme-01.png', hint: '领导卖力画饼，而我只想减肥' },
  { src: '/memes/meme-02.png', hint: '会开完了，但问题没解决' },
  { src: '/memes/meme-03.png', hint: '表面云淡风轻，内心尼玛成群' },
  { src: '/memes/meme-04.png', hint: '拿着卖白菜的钱，操着卖白粉的心' },
  { src: '/memes/meme-05.png', hint: '同事两大爱好：甩锅和抢功' },
  { src: '/memes/meme-06.png', hint: '我想骂人，但我忍住了' },
  { src: '/memes/meme-07.png', hint: '客户虐我千百遍，我待客户如初恋' },
  { src: '/memes/meme-08.png', hint: '客户报低价，我还不能说贵' },
]

const CASES = [
  {
    scene: '霸道领导',
    hard: '我 tm 加班到 11 点,周一早会他当着全组说"上周那个方案是 XX 主导的,我只是给点建议"。要点脸吗?',
    soft: '王总,关于上周那个方案,我整理了下完整的过程文档(附件),可以更清楚地看到从需求拆解到落地的每个关键节点,后面类似项目我也准备同步给您过目。',
    meta: '— 让领导知道你功劳清清楚楚,但不撕破脸'
  },
  {
    scene: '甩锅同事',
    hard: '数据出问题明明是他给的源表错了,他在群里@我说"麻烦 XX 把数据再核对一下哈",意思让我背锅?',
    soft: '我看了下原始数据,源表里这个字段的口径和我们用的有差异(我标了截图)。我先按新的口径重新跑一遍,顺便拉个对齐文档,以后我们组统一一个版本,避免再出现这种误会。',
    meta: '— 把锅"客观化"成流程问题,不点名但暗示清清楚楚'
  },
  {
    scene: '异想天开客户',
    hard: '预算 5000 要做个淘宝+抖音+小红书三端 App,还要 AI 推荐,还要私域运营全包。我:???',
    soft: '理解您想要全渠道触达的思路,这其实是个挺大的体系。我建议我们分两步:第一期(2周)先把核心用户路径和最关键的一个渠道跑通,验证 ROI;第二期根据数据决定要不要扩到其他渠道。这样总投入可控,效果也更可量化。您看这个节奏可以吗?',
    meta: '— 把"不"包装成"两步走",客户觉得是策略,不是拒绝'
  }
]

// ---- 粒子效果 ----
const CONFETTI_COLORS = ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B6B', '#45B7D1', '#96CEB4']
const CONFETTI_SHAPES = ['■', '●', '▲', '✦']

function triggerConfetti(btnEl: HTMLElement) {
  const rect = btnEl.getBoundingClientRect()
  const baseX = rect.left + rect.width / 2
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div')
    el.style.position = 'fixed'
    el.style.left = (baseX + (Math.random() - 0.5) * 120) + 'px'
    el.style.top = (rect.top + window.scrollY) + 'px'
    el.style.zIndex = '9999'
    el.style.pointerEvents = 'none'
    el.style.fontSize = (Math.random() * 10 + 8) + 'px'
    el.style.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    el.style.animation = `confettiFall ${Math.random() * 0.8 + 0.9}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`
    el.textContent = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)]
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2000)
  }
}

// 打字机 hook
function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return }
    setDisplayed(''); setDone(false)
    let i = 0
    const tick = () => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
        setTimeout(tick, speed)
      } else {
        setDone(true)
      }
    }
    const id = setTimeout(tick, speed * 3)
    return () => clearTimeout(id)
  }, [text, speed])
  return { displayed, done }
}

// 滚动入场 hook
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.scroll-reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
      { threshold: 0.12 }
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
  const [memeIdx, setMemeIdx] = useState(0)
  const [firstSuccess, setFirstSuccess] = useState(false)
  const [copyFlash, setCopyFlash] = useState(false)
  const [memeTransitioning, setMemeTransitioning] = useState(false)
  const speechRef = useRef<any>(null)
  const translateBtnRef = useRef<HTMLButtonElement>(null)
  const { displayed: typedSoft, done: typingDone } = useTypewriter(softText)

  useScrollReveal()

  // 导航滚动阴影
  useEffect(() => {
    const nav = document.querySelector('.nav') as HTMLElement
    const onScroll = () => {
      if (window.scrollY > 20) nav?.classList.add('scrolled')
      else nav?.classList.remove('scrolled')
    }
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
      const transcript = Array.from(e.results).map((t: any) => t[0].transcript).join('')
      setHardText(transcript)
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
          translateBtnRef.current && triggerConfetti(translateBtnRef.current)
        }, 600)
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

  function copyResult() {
    navigator.clipboard.writeText(softText)
    setCopyFlash(true)
    setErrMsg('已复制,直接粘贴就行 ✦')
    setTimeout(() => { setErrMsg(null); setCopyFlash(false) }, 2500)
  }

  function loadExample(s: typeof SCENES[number]) {
    setScene(s.id)
    setHardText(''); setSoftText(''); setRating(0); setRated(false); setRecordId(null)
    const ex: Record<string, string> = {
      boss: '我 tm 加班到 11 点,周一早会他当着全组说"上周那个方案是 XX 主导的,我只是给点建议"。要点脸吗?',
      colleague: '数据出问题明明是他给的源表错了,他在群里@我说"麻烦 XX 把数据再核对一下哈",意思让我背锅?',
      client: '预算 5000 要做个淘宝+抖音+小红书三端 App,还要 AI 推荐,还要私域运营全包。我:???',
      hr: 'HR 说"公司近期业务调整,你的岗位不太合适,建议你主动提离职,这样对大家都体面",我笑了。',
      promotion: '我跟了半年的项目上线了,想跟领导聊聊升职加薪,但又怕他觉得我"太急"。',
      salary: '对方开的薪资比预期低 30%,HR 说"这是我们能给到的最优方案了",我不知道怎么谈。',
      partner: '合作方拖了 3 个月没付尾款,微信上问就是"在走流程",我 tm 已经在朋友圈看到他们团建了。',
      general: ''
    }
    setHardText(ex[s.id] || '')
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
          <a href="#scenes">场景</a>
          <a href="#how">怎么用</a>
          <a href="#cases">案例</a>
        </div>
        <a href="#demo" className="nav-cta">开始吐槽</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-hard">
          <span className="tag animate-fade-up">硬话</span>
          <h1 className="animate-fade-up delay-1">想说<span className="accent">滚</span>。<br/>憋不住。</h1>
          <p className="animate-fade-up delay-2">工作里那些想怼不敢怼的瞬间,先来这里倒出来。<br/>脏话、吐槽、阴阳怪气,随便说。</p>
          <a href="#demo" className="hero-cta animate-fade-up delay-3">把火发出来 →</a>
        </div>
        <div className="hero-soft">
          <span className="tag animate-fade-up">软话</span>
          <h1 className="animate-fade-up delay-1">对外,<br/>说得<span className="accent">体面</span>。</h1>
          <p className="animate-fade-up delay-2">AI 听懂你的情绪,翻译成你该说的样子。<br/>不卑不亢,有理有面,成年人的体面。</p>
          <a href="#demo" className="hero-cta animate-fade-up delay-3">看怎么翻译 →</a>
        </div>
      </section>

      {/* DEMO */}
      <section className="demo scroll-reveal" id="demo">
        <div className="demo-head animate-fade-up">
          <div className="kicker">现在就试</div>
          <h2>左边发火,右边收场</h2>
          <p>录音或打字,AI 帮你把"想说滚"翻译成"我保留意见"。每天 50 次,免费。</p>
        </div>

        <div className="scene-picker animate-fade-up delay-2">
          {SCENES.map(s => (
            <button
              key={s.id}
              className={`scene-chip ${scene === s.id ? 'active' : ''}`}
              onClick={() => loadExample(s)}
              title={s.hint}
            >{s.label}</button>
          ))}
        </div>

        <div className="split animate-scale-in delay-3">
          <div className="split-left">
            <h3>硬话</h3>
            <textarea
              value={hardText}
              onChange={e => setHardText(e.target.value)}
              placeholder="把你想说的都倒出来…脏话、吐槽、阴阳怪气,随便。"
            />
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
                className={`translate-btn ${loading ? 'translating' : ''}`}
                onClick={translate}
                disabled={loading || !hardText.trim()}
              >
                {loading ? 'AI 在想…' : '翻译成体面话 →'}
              </button>
            </div>
          </div>

          <div className="split-right">
            <h3>软话</h3>
            <div className={`result ${!softText && !loading ? '' : 'result-reveal'} ${copyFlash ? 'copy-flash' : ''}`}
                 style={{ whiteSpace: 'pre-wrap', minHeight: 120 }}>
              {typedSoft}
              {softText && !typingDone && <span className="typewriter-cursor" />}
            </div>
            <div className="toolbar">
              <button
                className="translate-btn"
                onClick={copyResult}
                disabled={!softText}
              >📋 复制</button>
            </div>

            {softText && recordId && !rated && (
              <div className="rating">
                <span className="rating-label">这个翻译贴不贴?</span>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      className={`star ${n <= rating ? 'active' : ''}`}
                      onClick={() => submitRating(n)}
                    >★</button>
                  ))}
                </div>
                <span className="rating-hint">评分帮 AI 学得更懂你</span>
              </div>
            )}
            {rated && (
              <div className="rating-thanks">谢谢评分!这会让下一个翻译更精准 ✨</div>
            )}

            {loading && !softText && (
              <div className="result loading">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span style={{ marginLeft: 8 }}>AI 在琢磨怎么帮你说得体面…</span>
              </div>
            )}
            {errMsg && (
              <div className="result" style={{ borderLeftColor: '#ff8800', background: '#fff8e8' }}>
                {errMsg}
              </div>
            )}
            {quota && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
                今日已用 {quota.used} / {quota.limit} 次
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="pain scroll-reveal" id="scenes">
        <div className="pain-head scroll-reveal">
          <h2>职场人<span className="red"> 8 大想怼</span>现场</h2>
          <p>这些场景,谁没遇到几次?你心里骂了一万句,但最后还是微笑点头。</p>
        </div>
        <div className="cards">
          {[
            { icon: '👑', title: '霸道专制的领导', body: '抢功、PUA、无偿加班、开会骂人、把你的方案改成他的还让你汇报。', ex: '"我 tm 加班到 11 点,周一早会他说方案是他主导的。"' },
            { icon: '🫠', title: '甩锅甩到飞起的同事', body: '把活推给你,出问题就装傻,在群里@你"麻烦核对一下"。', ex: '"数据是他给的源表错了,他让我背锅?"' },
            { icon: '🤑', title: '异想天开的客户', body: '预算 5000 要做淘宝+抖音+小红书+私域+AI 全部。', ex: '"我:???"' },
            { icon: '📋', title: '话术流 HR', body: '"公司业务调整,你的岗位不太合适,建议主动离职。"', ex: '"我笑了。"' },
            { icon: '📈', title: '晋升答辩压力', body: '跟了半年的项目想争取升职加薪,又怕被领导觉得"太急"。', ex: '"怎么开口才不显得我在要挟?"' },
            { icon: '💰', title: '薪资谈判', body: '对方开的比预期低 30%,HR 说"这是最优方案了"。', ex: '"不知道还能不能谈,怕谈了 offer 飞。"' },
          ].map((card, i) => (
            <div key={i} className={`card scroll-reveal delay-${(i % 3) + 1}`}>
              <div className="card-icon">{card.icon}</div>
              <h4>{card.title}</h4>
              <p>{card.body}</p>
              <div className="example">"{card.ex}"</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="how scroll-reveal" id="how">
        <div className="how-head">
          <div className="kicker">怎么用</div>
          <h2>4 步,搞定一次"想怼"</h2>
          <p>从情绪倒出到体面发言,一杯咖啡的时间。</p>
        </div>
        <div className="steps">
          {[
            { num: '01', title: '选场景', desc: '领导/同事/客户/HR,选个最贴你心塞的分类。' },
            { num: '02', title: '把火发出来', desc: '录音或打字都行。脏话、吐槽、阴阳怪气,通通收下。' },
            { num: '03', title: 'AI 翻译', desc: '听懂你的情绪,把"想说滚"翻译成"我保留意见"。' },
            { num: '04', title: '评分 + 直接用', desc: '给翻译打分帮 AI 学,再一键复制粘贴去用。' },
          ].map((s, i) => (
            <div key={i} className={`step scroll-reveal delay-${i + 1}`}>
              <div className="step-num">{s.num}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CASES */}
      <section className="cases scroll-reveal" id="cases">
        <div className="cases-head scroll-reveal">
          <h2>看看<span style={{color: 'var(--hard-accent)'}}>硬话</span>怎么变<span style={{color: 'var(--soft-accent)'}}>软话</span></h2>
          <p>真实场景示例,左侧是你心里想的,右侧是 AI 给你的。</p>
        </div>
        <div className="case-layout">
          <div className="case-grid">
            {CASES.map((c, i) => (
              <div key={i} className={`case scroll-reveal delay-${i + 1}`}>
                <div className="case-hard">{c.hard}</div>
                <div className="arrow">→</div>
                <div>
                  <div className="case-soft">{c.soft}</div>
                  <div className="case-meta">{c.scene} · {c.meta}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 梗图横向焦点视图 */}
          <div className="meme-spotlight scroll-reveal delay-2">
            <div className="meme-spotlight-title">点击放大 · {memeIdx + 1}/{MEMES.length}</div>
            <img
              src={MEMES[memeIdx].src}
              alt={MEMES[memeIdx].hint}
              className={`meme-main-img ${memeTransitioning ? 'transitioning' : ''}`}
              onClick={() => setMemeIdx(i => (i + 1) % MEMES.length)}
            />
            <div className="meme-hint">{MEMES[memeIdx].hint}</div>
            <div className="meme-strip">
              {MEMES.map((m, i) => (
                <div
                  key={i}
                  className={`meme-thumb ${i === memeIdx ? 'active' : ''}`}
                  onClick={() => {
                    if (i !== memeIdx) {
                      setMemeTransitioning(true)
                      setTimeout(() => {
                        setMemeIdx(i)
                        setMemeTransitioning(false)
                      }, 200)
                    }
                  }}
                >
                  <img src={m.src} alt={m.hint} />
                </div>
              ))}
            </div>
            <div className="meme-indicator">
              {MEMES.map((_, i) => (
                <div key={i} className={`meme-pip ${i === memeIdx ? 'active' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 数据飞轮 */}
      <section className="wheel scroll-reveal">
        <div className="wheel-head">
          <div className="kicker">为什么越来越准</div>
          <h2>数据飞轮</h2>
        </div>
        <div className="wheel-flow">
          {['你吐槽', 'AI 翻译', '你评分', '语料沉淀', '下次更准'].map((node, i) => (
            <div key={i}>
              <div className={`wheel-node ${i === 1 || i === 3 ? 'highlight' : ''}`}>{node}</div>
              {i < 4 && <div className="wheel-arrow">→</div>}
            </div>
          ))}
        </div>
        <p className="wheel-note">每一条吐槽 + 评分,都在帮下一个职场人翻译得更体面。</p>
      </section>

      {/* CTA */}
      <section className="cta scroll-reveal">
        <h2>让每个想说<span className="red">"滚"</span>的职场人,<br/>都能体面地说出<span className="red">"我保留意见"</span>。</h2>
        <p>免费,免注册,录音打字都行。心情不好的时候,来一句。</p>
        <a href="#demo" className="cta-btn">来,先骂一句 →</a>
      </section>

      <footer>
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#999' }}>硬话软说</span> · 职场嘴替 AI · 一个不让你憋出内伤的小工具
        </div>
        <div>
          <a href="#">关于</a>
          <a href="#">隐私</a>
          <a href="#">联系</a>
          <a href="#">微信公众号:硬话软说</a>
        </div>
        <div style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>
          © 2026 · 仅供职场情绪宣泄使用,AI 翻译结果仅供参考
        </div>
      </footer>
    </main>
  )
}
