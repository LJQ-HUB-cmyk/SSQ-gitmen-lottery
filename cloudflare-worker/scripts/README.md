# 脚本使用说明

## 快速开始

### 1. 配置环境变量

```bash
cd cloudflare-worker
cp .env.example .env
vim .env  # 填写 WORKER_URL 和 API_KEY
```

### 2. 运行初始化

```bash
cd scripts
./init.sh
```

## 可用脚本

### init.sh - 数据初始化脚本

批量导入历史数据，支持断点续传和自动管理每日请求限制。

```bash
./init.sh
```

**功能特点：**
- ✅ 自动从数据库最旧期号往前爬取
- ✅ 每次爬取 100 期
- ✅ 自动管理每日请求限制（默认 500 次/天）
- ✅ 支持代理（在 .env 中配置）
- ✅ 支持自动跨天继续（可选）
- ✅ 连续 3 次无新数据自动停止

**使用场景：**
- 首次初始化数据库
- 补充历史数据
- 定期更新

### diagnose.sh - 诊断脚本

全面检查 Worker 运行状态。

```bash
./diagnose.sh
```

**检查项目：**
- Worker 是否可访问
- API 认证是否正常
- 数据库数据量
- 各接口运行状态

## 环境变量配置

在 `.env` 文件中配置：

```bash
# Cloudflare Worker 配置
WORKER_URL=https://your-worker.workers.dev  # 必填
API_KEY=your-api-key-here                   # 必填

# 代理配置（可选）
USE_PROXY=false
PROXY_PORT=7897

# 爬取配置
SLEEP_TIME=120              # 每次爬取间隔（秒）
DAILY_REQUEST_LIMIT=500     # 每日请求限制
AUTO_CONTINUE=false         # 是否自动跨天继续
```

### 配置说明

| 配置项 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| WORKER_URL | 是 | - | Cloudflare Worker 的 URL |
| API_KEY | 是 | - | API 认证密钥 |
| USE_PROXY | 否 | false | 是否使用代理 |
| PROXY_PORT | 否 | 7897 | 代理端口 |
| SLEEP_TIME | 否 | 120 | 每次爬取间隔（秒） |
| DAILY_REQUEST_LIMIT | 否 | 500 | 每日请求限制 |
| AUTO_CONTINUE | 否 | false | 是否自动跨天继续 |

## 使用场景

### 场景 1：首次初始化（推荐）

```bash
# 1. 配置环境变量
vim .env

# 2. 运行初始化
./init.sh

# 预计时间：1-2 小时
# 预计请求：30-50 次
```

### 场景 2：自动跨天继续

适合在服务器上长时间运行，自动完成所有数据爬取。

```bash
# 1. 在 .env 中设置
AUTO_CONTINUE=true

# 2. 后台运行
nohup ./init.sh > init.log 2>&1 &

# 3. 查看日志
tail -f init.log
```

### 场景 3：手动分批爬取

适合保守策略，每天手动运行一次。

```bash
# 1. 在 .env 中设置
AUTO_CONTINUE=false
DAILY_REQUEST_LIMIT=500

# 2. 每天运行一次
./init.sh

# 达到限制后自动停止，明天继续
```

## 常见问题

### Q: 如何知道数据是否爬取完成？

A: 脚本会自动检测，连续 3 次无新数据时自动停止并提示完成。

### Q: 如何查看当前数据量？

A: 
```bash
curl -s "$WORKER_URL/stats" | jq '.total_count'
```

### Q: 如何加快爬取速度？

A: 在 .env 中调整：
```bash
SLEEP_TIME=60              # 减少间隔（不建议低于 60 秒）
DAILY_REQUEST_LIMIT=1000   # 提高每日限制
```

### Q: 达到每日限制后怎么办？

A: 
- **自动模式**：设置 `AUTO_CONTINUE=true`，脚本会自动等待到明天继续
- **手动模式**：明天再次运行 `./init.sh`

### Q: 如何在服务器上后台运行？

A: 
```bash
# 使用 nohup
nohup ./init.sh > init.log 2>&1 &

# 或使用 screen
screen -S lottery-init
./init.sh
# 按 Ctrl+A+D 分离会话

# 重新连接
screen -r lottery-init
```

### Q: 如何停止运行中的脚本？

A: 按 `Ctrl+C`，脚本会保存当前进度，下次继续。

## 数据量估算

- **双色球历史**：约 3,400+ 期（2003年至今）
- **每次爬取**：100 期
- **总次数**：约 34 次
- **总时间**：约 68 分钟（间隔 120 秒）

## Cloudflare 限制

| 套餐 | 每日请求 | 脚本默认限制 | 是否够用 |
|------|---------|-------------|---------|
| 免费 | 100,000 次 | 500 次 | ✅ 完全够用 |
| 付费 | 无限制 | 可调高 | ✅ 更宽裕 |

**结论**：免费套餐完全够用，全量初始化只需 30-50 次请求。

## 最佳实践

1. **首次使用**：先运行 `./diagnose.sh` 检查配置
2. **初始化数据**：运行 `./init.sh`
3. **长期运行**：设置 `AUTO_CONTINUE=true` 并后台运行
4. **定期检查**：查看 Cloudflare Dashboard 的 Metrics

## 安全提示

- ✅ `.env` 文件已在 `.gitignore` 中，不会被提交
- ✅ 不要将 API_KEY 分享给他人
- ✅ 定期更换 API_KEY
- ✅ 使用强密码生成器生成 API_KEY
