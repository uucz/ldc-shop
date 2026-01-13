# LDC Shop (Cloudflare Workers Edition)


基于 **Next.js 16**、**Cloudflare Workers** (OpenNext)、**D1 Database** 和 **Shadcn UI** 构建的无服务器虚拟商品商店。

## 🛠 技术架构 (Technical Architecture)

本版本采用 **Next.js on Workers** 的前沿技术路线，而非传统的单文件 Worker：

*   **核心框架**: **Next.js 16 (App Router)** - 保持与 Vercel 版本一致的现代化开发体验。
*   **适配器**: **OpenNext (Cloudflare Adapter)** - 目前最先进的 Next.js 到 Workers 的转换方案，支持大部分 Next.js 特性。
*   **数据库**: **Cloudflare D1 (SQLite)** - 边缘原生关系型数据库，替代 Vercel Postgres。
*   **ORM**: **Drizzle ORM** - 完美适配 D1，提供类型安全的 SQL 操作。
*   **部署**: **Wrangler** - 一键部署到全球边缘网络。

此架构旨在结合 Next.js 的开发效率与 Cloudflare 的边缘性能/低成本优势。

## ✨ 特性

- **OpenNext**: 在 Cloudflare Workers 运行时上完整运行 Next.js App Router。
- **Cloudflare D1**: 使用边缘 SQLite 数据库，低成本高性能。
- **Linux DO 集成**: 内置 OIDC 登录与 EasyPay 支付。
- **完整商城功能**:
    - 🔍 **搜索与筛选**: 客户端即时搜索。
    -  **Markdown 描述**: 商品支持富文本。
    - � **限购与库存**: 实时库存扣减，防止超卖。
    - � **自动发货**: 支付成功后自动展示卡密。
    - 🧾 **订单管理**: 完整的订单流程与管理员后台。
- **管理后台**:
    - 商品/分类管理、库存管理、销售统计、订单处理、顾客管理。

## �️ 部署指南

### 前置要求
- Cloudflare 账号
- Node.js & NPM
- Wrangler CLI (`npm install -g wrangler`)

### 1. 初始化
进入目录并安装依赖：
```bash
cd _workers_next
npm install
```

### 2. 创建数据库
在 Cloudflare 上创建一个新的 D1 数据库：
```bash
npx wrangler d1 create ldc-shop-next
```
**注意**: 复制终端输出的 `database_id`。

### 3. 修改配置
打开 `wrangler.json`，找到 `d1_databases` 部分，将 `database_id` 替换为你刚才获取的 ID。

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "ldc-shop-next",
    "database_id": "你的-DATABASE-ID"
  }
]
```

### 4. 数据库迁移
生成并应用数据库表结构到 Cloudflare D1：
```bash
# 生成 SQL 迁移文件
npx drizzle-kit generate

# 应用到远程 D1 数据库
npx wrangler d1 migrations apply DB --remote
```

### 5. 配置环境变量 (Secrets)
需要在 Cloudflare 后台或使用 Wrangler 设置以下环境变量（请替换为你的实际值）：

**LDC Connect / OAuth 配置:**
```bash
npx wrangler secret put OAUTH_CLIENT_ID
npx wrangler secret put OAUTH_CLIENT_SECRET
```
*回调地址 (Callback URL)*: `https://你的域名.workers.dev/api/auth/callback/linuxdo`

**EPay / 支付配置:**
```bash
npx wrangler secret put MERCHANT_ID
npx wrangler secret put MERCHANT_KEY
```
*回调 URI*: `https://你的域名.workers.dev/callback`
*通知 URL*: `https://你的域名.workers.dev/api/notify`

**其他配置:**
```bash
npx wrangler secret put AUTH_SECRET  # 生成一个随机字符串: openssl rand -base64 32
npx wrangler secret put ADMIN_USERS  # 管理员用户名，如: user1,user2
npx wrangler secret put NEXT_PUBLIC_APP_URL # https://你的域名.workers.dev
```

### 6. 部署上线
```bash
npm run deploy
```
部署完成后，Cloudflare 会返回一个访问链接（如 `https://ldc-shop-next.你的子域.workers.dev`）。

---

## � 本地开发

本地开发使用 SQLite 文件模拟 D1。

1. **配置本地环境**
   复制 `.env.example` (如果有) 或直接创建 `.env.local`：
   ```bash
   LOCAL_DB_PATH=local.sqlite
   ```

2. **生成本地数据库**
   ```bash
   npx drizzle-kit push
   ```
   这会创建一个 `local.sqlite` 文件。

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 `http://localhost:3000`。

## ⚙️ 环境变量说明

| 变量名 | 说明 |
|Ref | Ref Description|
| `OAUTH_CLIENT_ID` | Linux DO Connect Client ID |
| `OAUTH_CLIENT_SECRET` | Linux DO Connect Client Secret |
| `MERCHANT_ID` | EPay 商户 ID |
| `MERCHANT_KEY` | EPay 商户 Key |
| `AUTH_SECRET` | NextAuth 加密密钥 |
| `ADMIN_USERS` | 管理员用户名列表 (逗号分隔) |
| `NEXT_PUBLIC_APP_URL` | 部署后的完整 URL (用于回调) |

## 📄 许可证
MIT
