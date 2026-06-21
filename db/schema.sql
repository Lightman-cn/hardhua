-- =============================================================
-- 硬话软说 · D1 Schema
-- 设计目标:收集高质量 (吐槽, 得体回复, 场景, 用户评分) 训练样本
-- =============================================================

-- 翻译记录表:每次调用都写一行,后续人工/AI 抽样筛选高质量样本
CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 用户输入
  hard_text TEXT NOT NULL,            -- 原始吐槽(已脱敏)
  scene TEXT NOT NULL,                -- boss/colleague/client/hr/promotion/salary/partner/general
  hard_length INTEGER,                -- 字符数,便于分析

  -- AI 输出
  soft_text TEXT NOT NULL,            -- 翻译后的得体回复
  ai_model TEXT,                      -- 用了哪个模型(doubao-lite / gpt-4o-mini ...)
  ai_latency_ms INTEGER,              -- 调用耗时

  -- 用户反馈(自愿打分)
  rating INTEGER,                     -- 1-5 星,NULL 表示没评
  rated_at DATETIME,
  feedback_text TEXT,                 -- 可选文字反馈

  -- 元数据
  client_id TEXT,                     -- IP hash 或匿名 UUID,不存真实 IP
  user_agent TEXT,                    -- 浏览器 UA
  country TEXT,                       -- Cloudflare cf-ipcountry header
  is_mock INTEGER DEFAULT 0,          -- 是否 Mock 降级(0=真 AI / 1=Mock)
  blocked INTEGER DEFAULT 0,          -- 是否被安全过滤拦下

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引:按场景和评分查
CREATE INDEX IF NOT EXISTS idx_translations_scene ON translations(scene);
CREATE INDEX IF NOT EXISTS idx_translations_rating ON translations(rating);
CREATE INDEX IF NOT EXISTS idx_translations_created ON translations(created_at);
CREATE INDEX IF NOT EXISTS idx_translations_high_quality
  ON translations(rating, scene)
  WHERE rating >= 4;

-- 场景统计表:加速"今日每场景调用次数"等查询
CREATE TABLE IF NOT EXISTS scene_stats (
  scene TEXT PRIMARY KEY,
  total_count INTEGER DEFAULT 0,
  avg_rating REAL,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 语料黑名单:极端内容标记(防止二次喂模型)
CREATE TABLE IF NOT EXISTS blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 管理员后台用的视图:高分样本(语料候选)
-- 后续训练时: SELECT * FROM translations WHERE rating >= 4 AND blocked = 0
