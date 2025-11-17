# 彩票预测系统 - Cloudflare Workers 版本

基于 Cloudflare Workers + D1 + KV 的双色球彩票预测系统，通过 GitHub 自动部署。

## ✨ 特性

- 🚀 无服务器部署 - 基于 Cloudflare Workers
- 📊 D1 数据库 - SQLite 存储历史数据
- 🔐 KV 配置管理 - 安全存储敏感信息
- 💾 R2 自动备份 - 数据备份到对象存储
- 📱 Telegram 通知 - 实时推送开奖和预测结果
- 🛡️ 防封禁策略 - 随机延迟，模拟人类行为
- 🔄 GitHub 自动部署 - 推送代码自动更新
- 💰 完全免费 - 使用 Cloudflare 免费套餐

## 📋 快速开始

### 1. 准备工作

**Cloudflare 账号**
- 注册：https://dash.cloudflare.com/sign-up

**Telegram Bot**
- 搜索 @BotFather，发送 `/newbot` 创建 Bot
- 复制返回的 Token

**Telegram Chat ID**
- 搜索 @userinfobot，发送任意消息
- 复制返回的 ID

### 2. 创建 Cloudflare 资源

#### D1 数据库
1. 进入 Cloudflare Dashboard
2. Workers & Pages > D1 > Create database
3. 名称：`lottery_db`
4. 复制 `database_id`，填入 `wrangler.toml`

#### KV 命名空间
1. Workers & Pages > KV > Create namespace
2. 名称：`lottery-config`
3. 复制 `id`，填入 `wrangler.toml`

#### R2 存储桶（可选）
1. R2 > Create bucket
2. 名称：`lottery-data`

### 3. 配置 KV 存储

在 KV 命名空间 `lottery-config` 中添加以下配置：

| Key | Value | 说明 |
|-----|-------|------|
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | 从 @BotFather 获取 |
| `TELEGRAM_CHAT_ID` | `123456789` | 从 @userinfobot 获取 |
| `API_KEY` | `your-secret-key` | 自己设置一个复杂密码（至少20字符） |

**如何添加：**
1. 进入 KV 命名空间
2. 点击 "Add entry"
3. 输入 Key 和 Value
4. 点击 "Add"

### 4. 更新配置文件

编辑 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "lottery_db"
database_id = "你的database_id"  # 填写这里

[[kv_namespaces]]
binding = "CONFIG"
id = "你的kv_id"  # 填写这里
```

### 5. 连接 GitHub

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Dashboard：
   - Workers & Pages > Create application
   - Pages > Connect to Git
   - 选择你的 GitHub 仓库
   - 构建配置：
     - 构建命令：留空
     - 构建输出目录：`cloudflare-worker`
     - 根目录：`cloudflare-worker`
3. 点击 "Save and Deploy"
4. 等待部署完成，记录 Worker URL

### 6. 初始化数据库

#### 创建表结构
在 D1 控制台执行 `schema.sql` 中的 SQL：

```sql
CREATE TABLE IF NOT EXISTS ssq_lottery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lottery_no TEXT UNIQUE NOT NULL,
    draw_date TEXT NOT NULL,
    red1 TEXT NOT NULL,
    red2 TEXT NOT NULL,
    red3 TEXT NOT NULL,
    red4 TEXT NOT NULL,
    red5 TEXT NOT NULL,
    red6 TEXT NOT NULL,
    blue TEXT NOT NULL,
    sorted_code TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lottery_no ON ssq_lottery(lottery_no);
CREATE INDEX IF NOT EXISTS idx_draw_date ON ssq_lottery(draw_date);
CREATE INDEX IF NOT EXISTS idx_sorted_code ON ssq_lottery(sorted_code);
```

#### 导入历史数据
```bash
curl -X POST https://your-worker.workers.dev/init \
  -H "Authorization: Bearer YOUR_API_KEY"
```

等待 5-10 分钟，完成后会收到 Telegram 通知。

### 7. 配置定时触发器

在 Cloudflare Dashboard 配置定时任务：

1. 进入你的 Worker 设置
2. Triggers > Add Cron Trigger
3. 配置：
   - **Cron 表达式**：`0 14 * * *` (UTC 14:00 = 北京时间 22:00)
   - **触发 URL**：`https://your-worker.workers.dev/run`
   - **方法**：POST
   - **Headers**：
     - `Authorization: Bearer YOUR_API_KEY`
     - `Content-Type: application/json`

## 📖 API 接口

| 接口 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/` | GET | 首页，显示可用接口 | ❌ |
| `/run` | POST | 手动执行每日任务 | ✅ |
| `/init` | POST | 初始化数据库并导入历史数据 | ✅ |
| `/latest` | GET | 查询最新开奖数据 | ❌ |
| `/predict` | GET | 获取预测结果 | ❌ |
| `/stats` | GET | 查看统计信息 | ❌ |
| `/test` | GET | 测试 Telegram 连接 | ❌ |

### 使用示例

```bash
# 测试 Telegram 连接
curl https://your-worker.workers.dev/test

# 查询最新数据
curl https://your-worker.workers.dev/latest

# 获取预测结果
curl https://your-worker.workers.dev/predict

# 查看统计信息
curl https://your-worker.workers.dev/stats

# 手动执行任务（需要认证）
curl -X POST https://your-worker.workers.dev/run \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 🏗️ 项目结构

```
cloudflare-worker/
├── src/
│   ├── index.js              # 主入口（HTTP 路由 + 任务执行）
│   ├── spiders/
│   │   └── ssq.js           # 双色球爬虫
│   ├── predictors/
│   │   └── ssq.js           # 预测算法
│   └── utils/
│       ├── database.js      # D1 数据库操作
│       └── telegram.js      # Telegram 通知
├── .gitignore               # Git 忽略文件
├── CHANGELOG.md             # 更新日志
├── package.json             # 项目配置
├── README.md                # 本文档
├── schema.sql               # 数据库表结构
└── wrangler.toml           # Cloudflare Workers 配置
```

## 🔧 配置说明

### wrangler.toml

```toml
name = "lottery-prediction"
main = "src/index.js"
compatibility_date = "2024-01-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "lottery_db"
database_id = ""  # 填写你的 database_id

# KV 命名空间绑定
[[kv_namespaces]]
binding = "CONFIG"
id = ""  # 填写你的 KV id

# R2 存储绑定（可选）
[[r2_buckets]]
binding = "R2"
bucket_name = "lottery-data"
```

### KV 配置项

所有敏感配置存储在 KV 中：

- `TELEGRAM_BOT_TOKEN` - Telegram Bot Token
- `TELEGRAM_CHAT_ID` - Telegram Chat ID
- `API_KEY` - API 认证密钥（自己设置）

### 定时触发器

- **时间**：每天 22:00 (北京时间)
- **Cron**：`0 14 * * *` (UTC)
- **URL**：`/run`
- **认证**：需要 API_KEY

## 🔐 安全性

1. **配置管理**
   - 所有敏感信息存储在 KV 中
   - 不在代码中硬编码
   - GitHub 仓库不包含密钥

2. **API 认证**
   - 敏感接口需要 Bearer Token
   - API_KEY 存储在 KV 中
   - 建议使用强密码（20+ 字符）

3. **访问控制**
   - `/init` 和 `/run` 需要认证
   - 其他接口公开访问
   - 可根据需要调整

## 💰 成本

**完全免费！**

Cloudflare Workers 免费套餐：
- 100,000 次请求/天
- 5GB D1 存储
- 10GB R2 存储

本项目每天只需要几次请求，完全在免费额度内。

## 🛠️ 开发

### 本地开发

```bash
# 安装依赖
npm install

# 本地运行
npm run dev

# 查看日志
npm run tail
```

### 更新代码

1. 修改代码
2. 推送到 GitHub
3. Cloudflare 自动部署

### 查看日志

- Cloudflare Dashboard > Workers > 你的 Worker > Logs
- 或使用命令：`npm run tail`

## 📱 Telegram 通知示例

系统会在每天 22:00 自动发送通知：

```
📊 双色球每日报告

━━━━━━━━━━━━━━━
🎰 最新开奖

📅 期号: 2025131
📆 日期: 2025-11-13

🔴 红球: 03 13 14 18 24 31
🔵 蓝球: 03

━━━━━━━━━━━━━━━
🔮 下期预测

组合 1:
🔴 06 07 17 22 26 32
🔵 15

组合 2:
🔴 06 08 17 22 26 32
🔵 15

━━━━━━━━━━━━━━━
📈 统计信息

高频红球: 17(765), 26(757), 14(755)
高频蓝球: 15(270), 16(264), 1(258)

━━━━━━━━━━━━━━━
⚠️ 仅供参考，理性购彩
```

## ❓ 常见问题

### Q: 如何修改定时任务时间？

A: 在 Cloudflare Dashboard 的 Triggers 中修改 Cron 表达式：
- `0 14 * * *` - 22:00 北京时间
- `0 13 * * *` - 21:00 北京时间
- `0 12 * * *` - 20:00 北京时间

### Q: 如何查看日志？

A: 
1. Cloudflare Dashboard > Workers > 你的 Worker > Logs
2. 或使用命令：`npm run tail`

### Q: 如何更新代码？

A: 推送到 GitHub，Cloudflare 会自动部署

### Q: 触发器不工作？

A: 检查：
1. URL 是否正确
2. Authorization Header 是否正确
3. API_KEY 是否匹配

### Q: 如何备份数据？

A: 数据会自动备份到 R2，也可以手动导出：
```bash
# 在 D1 控制台执行
SELECT * FROM ssq_lottery ORDER BY draw_date DESC;
```

### Q: 如何生成强密码？

A: 使用密码生成器或命令：
```bash
openssl rand -base64 32
```

## ⚠️ 免责声明

本项目仅供学习和研究使用，严禁用于任何商业或非法用途。

- 所有预测结果基于历史数据统计，不代表未来结果
- 不保证任何中奖概率
- 请理性对待彩票，切勿沉迷
- 使用本项目产生的任何后果由使用者自行承担

## 📄 许可证

MIT License

---

**如果觉得有用，请给项目一个 Star ⭐**
