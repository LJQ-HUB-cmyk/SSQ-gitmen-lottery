# 部署目录

本目录包含所有部署相关的配置和脚本。

## 📁 目录结构

```
deployment/
├── docker/                    # Docker 配置
│   ├── Dockerfile            # Docker 镜像配置
│   ├── entrypoint.sh         # 容器启动脚本
│   └── crontab.template      # Cron 配置模板
│
├── docker-compose.yml        # Docker Compose 配置
├── deploy.sh                 # 一键部署脚本
└── README.md                 # 本文件
```

## 🚀 快速部署

### 1. 配置环境

```bash
# 返回项目根目录
cd ..

# 复制配置文件
cp .env.example .env

# 编辑配置
nano .env
```

### 2. 执行部署

```bash
# 进入部署目录
cd deployment

# 运行部署脚本
./deploy.sh
```

### 3. 选择彩票类型

部署脚本会提示选择：

1. 仅双色球（推荐）
2. 双色球 + 大乐透
3. 双色球 + 快开3
4. 全部彩票类型

## 🐳 Docker Compose 使用

### 启动容器

```bash
# 启动双色球
docker-compose up -d lottery-ssq

# 启动多个容器
docker-compose up -d lottery-ssq lottery-dlt

# 启动所有容器
docker-compose up -d
```

### 管理容器

```bash
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
# 进入双色球容器
docker-compose exec lottery-ssq bash

# 手动执行任务
docker-compose exec lottery-ssq python scripts/daily_task.py
```

## ⚙️ 配置说明

### 环境变量

在项目根目录的 `.env` 文件中配置：

```bash
# 数据库配置
MYSQL_HOST=your_host
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# Telegram 配置
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# 定时任务时间（小时）
SSQ_CRON_HOUR=22  # 双色球
DLT_CRON_HOUR=22  # 大乐透
KS3_CRON_HOUR=22  # 快开3
```

### Docker Compose 配置

`docker-compose.yml` 文件定义了三个服务：

- `lottery-ssq` - 双色球容器
- `lottery-dlt` - 大乐透容器（使用 profile: dlt）
- `lottery-ks3` - 快开3容器（使用 profile: ks3）

### Dockerfile 配置

支持构建参数：

```bash
# 构建双色球镜像
docker-compose build --build-arg LOTTERY_TYPE=ssq lottery-ssq

# 构建大乐透镜像
docker-compose build --build-arg LOTTERY_TYPE=dlt lottery-dlt
```

## 📊 容器架构

```
┌─────────────────┐
│  lottery-ssq    │  双色球容器
│  - 独立日志     │
│  - 独立定时任务  │
│  - 共享数据库    │
└─────────────────┘

┌─────────────────┐
│  lottery-dlt    │  大乐透容器
│  - 独立日志     │
│  - 独立定时任务  │
│  - 共享数据库    │
└─────────────────┘

┌─────────────────┐
│  lottery-ks3    │  快开3容器
│  - 独立日志     │
│  - 独立定时任务  │
│  - 共享数据库    │
└─────────────────┘
```

## 🔧 自定义配置

### 修改定时任务时间

在 `.env` 文件中设置：

```bash
SSQ_CRON_HOUR=21  # 改为 21:00 执行
```

### 修改容器资源限制

编辑 `docker-compose.yml`：

```yaml
services:
  lottery-ssq:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

### 添加新的彩票类型

1. 在 `docker-compose.yml` 中添加新服务
2. 实现对应的彩票模块
3. 更新部署脚本

## 📚 相关文档

- [Docker 部署指南](../docs/deployment/DOCKER_DEPLOYMENT.md)
- [部署检查清单](../docs/deployment/DEPLOYMENT_CHECKLIST.md)
- [快速参考](../docs/QUICK_REFERENCE.md)

## 🆘 故障排查

### 容器无法启动

```bash
# 查看日志
docker-compose logs lottery-ssq

# 检查配置
docker-compose config
```

### 数据库连接失败

```bash
# 测试连接
docker-compose exec lottery-ssq python -c "
from core.base_database import BaseDatabase
from core.utils import load_db_config
db = BaseDatabase(load_db_config())
db.connect()
print('连接成功')
"
```

### Telegram 通知失败

```bash
# 测试 Telegram
docker-compose exec lottery-ssq python -c "
from core.telegram_bot import TelegramBot
TelegramBot().test_connection()
"
```

## 📞 获取帮助

- 查看 [完整文档](../docs/INDEX.md)
- 提交 [Issue](https://github.com/your-repo/issues)
- 查看 [常见问题](../docs/deployment/DOCKER_DEPLOYMENT.md#常见问题)
