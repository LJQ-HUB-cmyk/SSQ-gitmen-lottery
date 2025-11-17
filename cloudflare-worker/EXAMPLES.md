# 使用示例

## 场景 1：首次初始化（最常见）

```bash
# 1. 配置
cd cloudflare-worker
cp .env.example .env
vim .env  # 填写 WORKER_URL 和 API_KEY

# 2. 检查配置
cd scripts
./diagnose.sh

# 3. 开始初始化
./init.sh

# 输出示例：
# 🚀 彩票数据初始化
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Worker URL: https://lottery-prediction.githubmen.workers.dev
# 每日限制: 500 次
# 爬取间隔: 120 秒
# 自动跨天: 否
# 
# 📊 今日已执行: 0/500 次
# 
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 执行第 1 次（今日第 1/500 次）
# 时间: 2025-11-17 15:45:00
# 
# ✅ 本批次成功
#    新增: 100 条
#    跳过: 0 条
#    当前总计: 100 条
```

## 场景 2：使用代理

```bash
# 1. 在 .env 中配置
USE_PROXY=true
PROXY_PORT=7897

# 2. 运行
./init.sh

# 输出示例：
# 🔧 使用代理: 127.0.0.1:7897
# 🚀 彩票数据初始化
# ...
```

## 场景 3：自动跨天继续（推荐）

适合在服务器上长时间运行，自动完成所有数据爬取。

```bash
# 1. 在 .env 中配置
AUTO_CONTINUE=true
DAILY_REQUEST_LIMIT=500

# 2. 后台运行
nohup ./init.sh > init.log 2>&1 &

# 3. 查看进度
tail -f init.log

# 4. 查看后台任务
jobs

# 5. 停止（如果需要）
kill %1  # 或使用具体的进程 ID
```

## 场景 4：快速爬取（提高限制）

如果你的 Worker 只用于数据爬取，可以提高限制。

```bash
# 1. 在 .env 中配置
DAILY_REQUEST_LIMIT=2000  # 提高限制
SLEEP_TIME=60             # 减少间隔

# 2. 运行
./init.sh

# 预计时间：约 30 分钟（原来 1-2 小时）
```

## 场景 5：保守爬取（手动控制）

每天手动运行一次，确保不触发任何限制。

```bash
# 1. 在 .env 中配置
AUTO_CONTINUE=false
DAILY_REQUEST_LIMIT=100   # 非常保守
SLEEP_TIME=300            # 5 分钟间隔

# 2. 每天运行一次
./init.sh

# 达到限制后自动停止，明天继续
```

## 场景 6：使用 screen（服务器推荐）

```bash
# 1. 创建 screen 会话
screen -S lottery-init

# 2. 在 .env 中配置
AUTO_CONTINUE=true

# 3. 运行脚本
cd cloudflare-worker/scripts
./init.sh

# 4. 分离会话（按键）
# Ctrl+A, 然后按 D

# 5. 重新连接
screen -r lottery-init

# 6. 查看所有会话
screen -ls

# 7. 终止会话
screen -X -S lottery-init quit
```

## 场景 7：定时任务（cron）

每天自动运行一次。

```bash
# 1. 编辑 crontab
crontab -e

# 2. 添加定时任务（每天凌晨 2 点运行）
0 2 * * * cd /path/to/cloudflare-worker/scripts && ./init.sh >> /tmp/lottery-init.log 2>&1

# 3. 查看日志
tail -f /tmp/lottery-init.log
```

## 场景 8：Docker 容器中运行

```bash
# 1. 创建 Dockerfile
cat > Dockerfile << 'EOF'
FROM alpine:latest
RUN apk add --no-cache bash curl jq
WORKDIR /app
COPY cloudflare-worker /app
CMD ["./scripts/init.sh"]
EOF

# 2. 构建镜像
docker build -t lottery-init .

# 3. 运行容器
docker run -d --name lottery-init \
  -v $(pwd)/cloudflare-worker/.env:/app/.env \
  lottery-init

# 4. 查看日志
docker logs -f lottery-init

# 5. 停止容器
docker stop lottery-init
```

## 场景 9：监控和告警

```bash
# 1. 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
WORKER_URL="https://your-worker.workers.dev"

# 获取数据量
count=$(curl -s "$WORKER_URL/stats" | jq -r '.total_count')

echo "当前数据量: $count 条"

# 如果数据量小于预期，发送告警
if [ "$count" -lt 3000 ]; then
  echo "⚠️  数据量不足，可能需要继续爬取"
  # 这里可以添加发送邮件或通知的代码
fi
EOF

chmod +x monitor.sh

# 2. 定时运行监控
crontab -e
# 添加：每小时检查一次
0 * * * * /path/to/monitor.sh
```

## 场景 10：多环境配置

```bash
# 1. 创建多个配置文件
cp .env .env.dev
cp .env .env.prod

# 2. 编辑不同环境的配置
vim .env.dev   # 开发环境
vim .env.prod  # 生产环境

# 3. 使用不同配置运行
# 开发环境
cp .env.dev .env
./init.sh

# 生产环境
cp .env.prod .env
./init.sh
```

## 常用命令速查

```bash
# 检查配置
./diagnose.sh

# 开始初始化
./init.sh

# 后台运行
nohup ./init.sh > init.log 2>&1 &

# 查看日志
tail -f init.log

# 查看数据量
curl -s "$WORKER_URL/stats" | jq '.total_count'

# 查看最新数据
curl -s "$WORKER_URL/latest" | jq '.'

# 手动触发更新
curl -X POST "$WORKER_URL/run" \
  -H "Authorization: Bearer $API_KEY"

# 查看今日请求次数
cat /tmp/lottery_init_count_$(date '+%Y-%m-%d').txt
```

## 故障排查

### 问题 1：认证失败

```bash
# 错误信息
❌ 认证失败！请检查 .env 文件中的 API_KEY 是否正确

# 解决方案
# 1. 检查 API_KEY
vim .env

# 2. 验证 API_KEY
curl -X POST "$WORKER_URL/run" \
  -H "Authorization: Bearer $API_KEY"
```

### 问题 2：连接失败

```bash
# 错误信息
❌ Worker 无法访问

# 解决方案
# 1. 检查 WORKER_URL
vim .env

# 2. 测试连接
curl -s "$WORKER_URL"

# 3. 如果需要代理
USE_PROXY=true
PROXY_PORT=7897
```

### 问题 3：达到限制

```bash
# 信息
⏸️  已达到今日请求限制

# 解决方案 1：等待明天
# 明天再次运行 ./init.sh

# 解决方案 2：自动跨天
AUTO_CONTINUE=true

# 解决方案 3：提高限制
DAILY_REQUEST_LIMIT=1000
```

## 性能优化

### 优化 1：并行爬取（不推荐）

```bash
# 注意：可能触发限制，不推荐
# 如果确实需要，可以运行多个实例
./init.sh &
sleep 60
./init.sh &
```

### 优化 2：调整间隔

```bash
# 快速模式（注意 CPU 限制）
SLEEP_TIME=60

# 标准模式（推荐）
SLEEP_TIME=120

# 保守模式
SLEEP_TIME=300
```

### 优化 3：批量大小

目前每次爬取 100 期，这是在 Worker 代码中设置的。如果需要调整，修改：

```javascript
// cloudflare-worker/src/index.js
const batchSize = 100;  // 改为 50 或 200
```

## 总结

- ✅ **最简单**：直接运行 `./init.sh`
- ✅ **最安全**：设置 `AUTO_CONTINUE=true` 并后台运行
- ✅ **最快速**：提高 `DAILY_REQUEST_LIMIT` 和降低 `SLEEP_TIME`
- ✅ **最保守**：降低 `DAILY_REQUEST_LIMIT` 和提高 `SLEEP_TIME`
