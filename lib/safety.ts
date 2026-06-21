// 基础内容安全过滤 + 脱敏
// 严格说应调内容安全 API,这里先做规则层兜底

const HARD_BLOCK_PATTERNS = [
  // 极端暴力威胁
  /杀(了你|他|她|全家)/i,
  /弄死你/i,
  // 严重歧视
  /(黑人|犹太人|穆斯林|同性恋).*(该死|去死|滚回)/i
]

const SOFT_FLAG_PATTERNS = [
  // 公司名/商业秘密(简单启发式)
  /[一-龥]{2,}(科技|集团|有限公司|公司).*?(内部|保密|未公开)/i
]

export function sanitize(text: string): { cleaned: string; blocked: boolean; message?: string } {
  for (const p of HARD_BLOCK_PATTERNS) {
    if (p.test(text)) {
      return {
        cleaned: '',
        blocked: true,
        message: '检测到极端内容,无法翻译。职场吐槽虽爽,咱也不能真出事~'
      }
    }
  }

  let cleaned = text
  // 简单脱敏:把脏话里特别过分的替换成相对文明的
  const euphemisms: [RegExp, string][] = [
    [/傻[逼bB]/g, '过分'],
    [/操你妈/g, '很不爽'],
    [/草你妈/g, '很不爽'],
    [/妈的/g, '真的气'],
    [/tm/g, '真的'],
    [/tmd/g, '真的太过分']
  ]
  for (const [p, r] of euphemisms) cleaned = cleaned.replace(p, r)

  for (const p of SOFT_FLAG_PATTERNS) {
    if (p.test(cleaned)) {
      cleaned = cleaned.replace(/[一-龥]{2,}(科技|集团|有限公司|公司)/g, 'XX公司')
    }
  }

  return { cleaned, blocked: false }
}