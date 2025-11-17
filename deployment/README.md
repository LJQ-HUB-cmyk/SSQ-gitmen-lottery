# Docker 部署指南

本目录包含 Docker 部署相关的配置和脚本。

## 📁 目录结构

```
deployment/
├── docker/
│   ├── Dockerfile           # Docker 镜像配置
│   ├── entrypoint.sh        # 容器启动脚本
│   ├── crontab              # 定时任务配置
│   └── .dockerignore        # Docker 忽略文件
├── docker-compose.yml       # Docker Compose 配置
├── deploy.sh                # 一键部署脚本
└── README.md                # 本文档
```

## 🚀 快速部署

### 1. 配置环境

```bash
# 返回项目根目录
cd ..

# 复制并编辑配置文件
cp .env.example .env
nano .env
```

必需配置：
```bash
# 数据库
MYSQL_HOST=your_host
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# Telegram
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# 定时任务时间（小时，24小时制）
SSQ_CRON_HOUR=22
```

### 2. 执行部署

```bash
cd deployment
./deploy.sh
```

选择要部署的彩票类型：
1. 仅双色球（推荐）
2. 双色球 + 大乐透
3. 全部类型

## 🐳 Docker Compose 命令

### 基本操作

```bash
# 启动双色球
docker-compose up -d lottery-ssq

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f lottery-ssq

# 重启容器
docker-compose restart lottery-ssq

# 停止容器
docker-compose stop

# 删除容器
docker-compose down
```

### 进入容器

```bash
# 进入容器
docker-compose exec lottery-ssq bash

# 手动执行任务
docker-compose exec lottery-ssq python scripts/daily_task.py
```

## ⚙️ 配置说明

### 环境变量

在 `.env` 文件中配置：

| 变量 | 说明 | 示例 |
|------|------|------|
| `MYSQL_HOST` | 数据库地址 | `localhost` |
| `MYSQL_USER` | 数据库用户 | `root` |
| `MYSQL_PASSWORD` | 数据库密码 | `password` |
| `MYSQL_DATABASE` | 数据库名称 | `lottery_db` |
| `TELEGRAM_BOT_TOKEN` | Bot Token | `123456789:ABC...` |
| `TELEGRAM_CHAT_ID` | Chat ID | `123456789` |
| `SSQ_CRON_HOUR` | 定时任务时间 | `22` |

### 容器服务

- `lottery-ssq` - 双色球容器
- `lottery-dlt` - 大乐透容器
- `lottery-ks3` - 快开3容器

## 🔧 故障排查

### 容器无法启动

```bash
# 查看日志
docker-compose logs lottery-ssq

# 检查配置
docker-compose config
```

### 数据库连接失败

检查：
1. 数据库地址和端口是否正确
2. 用户名和密码是否正确
3. 数据库是否已创建
4. 网络是否可达

### Telegram 通知失败

检查：
1. Bot Token 是否正确
2. Chat ID 是否正确
3. 网络是否可达

## 📚 相关文档

- [项目主文档](../README.md)
- [Cloudflare Workers 版本](../cloudflare-worker/README.md)（推荐）

---

**提示**：如果没有服务器，推荐使用 [Cloudflare Workers 版本](../cloudflare-worker/README.md)，完全免费！
