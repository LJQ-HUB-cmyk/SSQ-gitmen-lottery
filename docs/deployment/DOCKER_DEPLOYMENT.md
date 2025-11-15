# Docker 部署指南

## 概述

本项目已完全容器化，支持通过 Docker 部署到 Linux 服务器。

## 功能特性

- ✅ 首次运行自动初始化数据库并爬取全量数据
- ✅ 每天晚上 22:00 自动爬取增量数据
- ✅ 自动预测下一期号码
- ✅ 通过 Telegram 机器人发送通知
- ✅ 自动清理旧日志
- ✅ 健康检查
- ✅ 自动重启

## 前置要求

### 1. 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get install docker-compose-plugin
```

### 2. 创建 Telegram 机器人

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 创建新机器人
3. 按提示设置机器人名称和用户名
4. 获取 Bot Token（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 3. 获取 Chat ID

方法1：使用 @userinfobot
1. 在 Telegram 中搜索 `@userinfobot`
2. 发送任意消息
3. 获取你的 Chat ID

方法2：通过 API
1. 给你的机器人发送一条消息
2. 访问：`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. 在返回的 JSON 中找到 `chat.id`

## 快速开始

### 1. 克隆项目

```bash
git clone <repository_url>
cd lottery-prediction
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

编辑 `.env` 文件，填入以下配置：

```bash
# 数据库配置
MYSQL_HOST=your_database_host
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# SSL 配置（如果使用 TiDB Cloud）
MYSQL_USE_SSL=true
MYSQL_SSL_CA=/etc/ssl/cert.pem

# Telegram 配置
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 3. 构建并启动容器

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 容器管理

### 查看状态

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f lottery-prediction

# 查看最近100行日志
docker-compose logs --tail=100 lottery-prediction
```

### 停止和重启

```bash
# 停止容器
docker-compose stop

# 重启容器
docker-compose restart

# 停止并删除容器
docker-compose down
```

### 进入容器

```bash
# 进入容器 shell
docker-compose exec lottery-prediction bash

# 手动执行任务
docker-compose exec lottery-prediction python scripts/daily_task.py

# 查看 cron 任务
docker-compose exec lottery-prediction crontab -l
```

## 定时任务

容器内配置了以下定时任务：

| 时间 | 任务 | 说明 |
|------|------|------|
| 每天 22:00 | 数据爬取和预测 | 爬取最新数据并预测下一期 |
| 每周日 23:00 | 清理旧日志 | 删除30天前的日志文件 |

### 修改定时任务

编辑 `docker/crontab` 文件：

```bash
# 修改为每天 21:00 执行
0 21 * * * cd /app && /usr/local/bin/python scripts/daily_task.py >> /var/log/cron.log 2>&1
```

重新构建镜像：

```bash
docker-compose build
docker-compose up -d
```

## Telegram 通知

### 通知内容

每日任务会发送以下内容到 Telegram：

1. **最新开奖结果**
   - 期号
   - 开奖日期
   - 红球号码
   - 蓝球号码

2. **下期预测**
   - 3-5组预测组合
   - 每组包含红球和蓝球

3. **统计信息**
   - 高频红球
   - 高频蓝球

### 测试通知

```bash
# 进入容器
docker-compose exec lottery-prediction bash

# 测试 Telegram 连接
python -c "
from core.telegram_bot import TelegramBot
bot = TelegramBot()
bot.test_connection()
bot.send_message('测试消息')
"
```

## 数据持久化

容器使用 volume 挂载以下目录：

```yaml
volumes:
  - ./logs:/app/logs      # 日志文件
  - ./data:/app/data      # 数据文件
```

数据保存在宿主机，容器删除后数据不会丢失。

## 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker-compose logs lottery-prediction

# 检查环境变量
docker-compose config
```

### 2. 数据库连接失败

```bash
# 测试数据库连接
docker-compose exec lottery-prediction python -c "
from core.base_database import BaseDatabase
from core.utils import load_db_config
db = BaseDatabase(load_db_config())
db.connect()
print('连接成功')
"
```

### 3. Telegram 通知失败

```bash
# 测试 Telegram 连接
docker-compose exec lottery-prediction python -c "
from core.telegram_bot import TelegramBot
bot = TelegramBot()
bot.test_connection()
"
```

### 4. 定时任务未执行

```bash
# 查看 cron 日志
docker-compose exec lottery-prediction tail -f /var/log/cron.log

# 手动执行任务测试
docker-compose exec lottery-prediction python scripts/daily_task.py
```

### 5. 查看容器健康状态

```bash
# 查看健康检查状态
docker inspect --format='{{.State.Health.Status}}' lottery-prediction

# 查看健康检查日志
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' lottery-prediction
```

## 性能优化

### 1. 调整资源限制

编辑 `docker-compose.yml`：

```yaml
services:
  lottery-prediction:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 2. 调整爬虫配置

在 `.env` 中：

```bash
# 增加请求间隔，降低被封禁风险
SPIDER_MIN_DELAY=1.0
SPIDER_MAX_DELAY=3.0

# 增加批量大小，提高性能
DB_BATCH_SIZE=200
```

## 监控和日志

### 查看日志

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定日志文件
tail -f logs/ssq/fetch.log
tail -f logs/ssq/predict.log
```

### 日志轮转

容器会自动清理30天前的日志，也可以手动清理：

```bash
# 清理旧日志
find logs -name "*.log" -mtime +30 -delete
```

## 备份和恢复

### 备份数据

```bash
# 备份日志和数据
tar -czf lottery-backup-$(date +%Y%m%d).tar.gz logs/ data/

# 备份数据库（如果使用本地数据库）
docker-compose exec lottery-prediction mysqldump -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > backup.sql
```

### 恢复数据

```bash
# 恢复日志和数据
tar -xzf lottery-backup-20241115.tar.gz

# 恢复数据库
docker-compose exec -T lottery-prediction mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backup.sql
```

## 更新部署

### 更新代码

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build

# 重启容器
docker-compose up -d
```

### 更新配置

```bash
# 修改 .env 文件
nano .env

# 重启容器使配置生效
docker-compose restart
```

## 安全建议

1. **保护环境变量**
   - 不要将 `.env` 文件提交到 Git
   - 使用强密码
   - 定期更换密码

2. **网络安全**
   - 使用 SSL/TLS 连接数据库
   - 限制数据库访问 IP
   - 使用防火墙

3. **容器安全**
   - 定期更新基础镜像
   - 使用非 root 用户运行
   - 限制容器权限

## 生产环境建议

1. **使用外部数据库**
   - 使用云数据库服务（如 TiDB Cloud）
   - 配置自动备份
   - 启用 SSL 连接

2. **监控告警**
   - 配置容器监控
   - 设置告警规则
   - 监控磁盘空间

3. **高可用**
   - 使用容器编排（Kubernetes）
   - 配置自动重启
   - 多实例部署

## 常见问题

### Q: 如何修改定时任务时间？

A: 编辑 `docker/crontab` 文件，然后重新构建镜像。

### Q: 如何手动触发任务？

A: 
```bash
docker-compose exec lottery-prediction python scripts/daily_task.py
```

### Q: 容器重启后数据会丢失吗？

A: 不会。日志和数据通过 volume 挂载，保存在宿主机。

### Q: 如何查看 Telegram 机器人是否正常？

A: 
```bash
docker-compose exec lottery-prediction python -c "from core.telegram_bot import TelegramBot; TelegramBot().test_connection()"
```

### Q: 如何更改时区？

A: 在 `docker-compose.yml` 中修改 `TZ` 环境变量。

## 支持

如有问题，请查看：
- [项目文档](../README.md)
- [使用指南](USAGE.md)
- [优化说明](OPTIMIZATION.md)
