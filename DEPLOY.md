# 硬话软说 · Cloudflare Pages 部署指南

## 0. 前置: 开通 Cloudflare 账号
- https://dash.cloudflare.com/sign-up
- 免费版够用

## 1. 在 GitHub 建仓库 (Lightman-cn/hardhua, Public)

## 2. 在 Cloudflare Dashboard 配资源

### 2.1 建 D1 数据库
1. Dashboard → Workers & Pages → D1 SQL Database → Create
2. 名称: `hardhua-db`
3. 点进数据库 → Console 标签 → 粘贴并执行 `db/schema.sql` 的全部内容
4. 复制 **Database ID** (形如 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2.2 建 KV Namespace
1. Dashboard → Workers & Pages → KV → Create
2. 名称: `hardhua-kv`
3. 复制 **Namespace ID**

### 2.3 (可选) AI Key
- 火山方舟: https://www.volcengine.com/product/ark
- 硅基流动: https://cloud.siliconflow.cn
- 任选一家,创建 API Key

## 3. 创建 Pages 项目

1. Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. 选 GitHub → 授权 → 选 `Lightman-cn/hardhua`
3. Project name: `hardhua`
4. **Build settings**:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Root directory: `/`
   - Node version: `20` (Environment variables 加 `NODE_VERSION=20`)
5. **Environment variables** (加密的 Secrets):
   - `AI_PROVIDER` = `doubao` 或 `silicon`
   - `DOUBAO_API_KEY` = 你的 key (或 `SILICON_API_KEY`)
   - `DOUBAO_ENDPOINT` = `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
   - `DOUBAO_MODEL` = `doubao-lite-32k`
6. **Bindings** (下一步配)

## 4. 配 Bindings

部署一次后,到 Project → Settings → Functions:
- **D1 databases**: 变量名 `DB`,选 `hardhua-db`
- **KV namespaces**: 变量名 `KV`,选 `hardhua-kv`

## 5. 部署

回到 Project → Deployments → Retry deployment,带 bindings 重新部署。

完成后会得到一个 URL: `https://hardhua.pages.dev`

## 6. 验证

```bash
curl -X POST https://hardhua.pages.dev/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"领导抢功真恶心","scene":"boss"}'
```

应该返回:
```json
{
  "reply": "...",
  "quota": {"used": 1, "limit": 50},
  "id": 1
}
```

## 成本预估

完全免费层内:
- Cloudflare Pages: 无限请求、无限带宽
- Cloudflare Functions: 100,000 次/天
- Cloudflare D1: 5GB 存储、每天 5M 读 / 100K 写
- Cloudflare KV: 100K 读/天、10K 写/天
- AI 调用: 豆包 lite 约 ¥0.0008/千 token,5000 次/天也就几块钱

预计 1 万 DAU 内 0 元。
