/* =====================================================
   硬话软说 · 庆祝粒子效果
   ===================================================== */

const CONFETTI_COLORS = [
  '#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B6B', '#45B7D1', '#96CEB4', '#FF9F1C', '#2EC4B6'
]

const CONFETTI_SHAPES = ['■', '●', '▲', '✦', '✿']

export function triggerConfetti(container?: HTMLElement | null) {
  const count = 28
  const colors = CONFETTI_COLORS

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-particle'
    el.textContent = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)]
    el.style.color = colors[Math.floor(Math.random() * colors.length)]
    el.style.fontSize = `${Math.random() * 10 + 8}px`
    el.style.left = `${Math.random() * 80 + 10}%`
    el.style.top = container
      ? `${container.getBoundingClientRect().top + window.scrollY - 20}px`
      : `${Math.random() * 40 + 30}%`
    el.style.animationDuration = `${Math.random() * 1 + 1}s`
    el.style.animationDelay = `${Math.random() * 0.4}s`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2000)
  }
}
