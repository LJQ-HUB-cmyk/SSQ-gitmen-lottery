# 彩票预测系统

基于历史数据的智能彩票号码预测系统，支持 Docker 多容器部署。

## ✨ 特性

- 🐳 **Docker 多容器部署** - 每个彩票类型独立容器
- 📱 **Telegram 机器人通知** - 实时推送开奖和预测结果
- ⏰ **自动定时任务** - 每天自动爬取和预测
- 🔄 **增量数据更新** - 智能跳过已存在数据
- 🛡️ **防封禁爬虫** - 模拟人类浏览行为
- 📊 **数据分析** - 频率统计、连号分析

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 1.29+
- Linux 服务器（推荐）

### 一键部署

```bash
# 1. 克隆项目
git clone <repository_url>
cd lottery-prediction

# 2. 配置环境
cp .env.example .env
nano .env  # 填入数据库和 Telegram 配置

# 3. 部署
cd deployment
./deploy.sh
```

## 📖 文档导航

- **[文档索引](docs/INDEX.md)** - 完整的文档导航
- **[部署指南](docs/deployment/DOCKER_DEPLOYMENT.md)** - Docker 部署详细步骤
- **[Telegram 配置](docs/guides/TELEGRAM_SETUP.md)** - 机器人配置教程
- **[使用手册](docs/USAGE.md)** - 完整的使用说明
- **[项目设计](docs/PROJECT_DESIGN.md)** - 架构和设计理念

## 🎯 支持的彩票

| 彩票类型 | 代码 | 容器名 | 状态 |
|---------|------|--------|------|
| 双色球 | ssq | lottery-ssq | ✅ 已实现 |
| 大乐透 | dlt | lottery-dlt | 🚧 开发中 |
| 快开3 | ks3 | lottery-ks3 | 🚧 开发中 |

## 🐳 Docker 部署

### 多容器架构

每个彩票类型运行在独立的容器中：

```
lottery-ssq    # 双色球容器
lottery-dlt    # 大乐透容器
lottery-ks3    # 快开3容器
```

### 部署选项

```bash
# 仅部署双色球
docker-compose up -d lottery-ssq

# 部署双色球和大乐透
docker-compose up -d lottery-ssq lottery-dlt

# 部署所有彩票类型
docker-compose up -d
```

### 容器管理

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f lottery-ssq

# 重启容器
docker-compose restart lottery-ssq

# 停止容器
docker-compose stop

# 进入容器
docker-compose exec lottery-ssq bash
```

## 📱 Telegram 通知

系统会自动发送以下通知：

- 🎰 **最新开奖结果** - 期号、日期、号码
- 🔮 **下期预测** - 3-5组预测组合
- 📈 **统计信息** - 高频号码分析
- ❌ **错误通知** - 任务失败提醒

### 配置步骤

1. 创建机器人：在 Telegram 搜索 `@BotFather`
2. 获取 Token：发送 `/newbot` 并按提示操作
3. 获取 Chat ID：搜索 `@userinfobot` 并发送消息
4. 配置到 `.env` 文件

详细步骤：[Telegram 配置指南](docs/guides/TELEGRAM_SETUP.md)

## ⚙️ 配置说明

### 必需配置

```bash
# 数据库
MYSQL_HOST=your_host
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_CHAT_ID=123456789
```

### 可选配置

```bash
# 定时任务时间（小时，24小时制）
SSQ_CRON_HOUR=22  # 双色球 22:00
DLT_CRON_HOUR=22  # 大乐透 22:00
KS3_CRON_HOUR=22  # 快开3 22:00

# 爬虫配置
SPIDER_MIN_DELAY=0.5  # 最小请求间隔（秒）
SPIDER_MAX_DELAY=2.0  # 最大请求间隔（秒）

# 数据库性能
DB_BATCH_SIZE=100  # 批量插入大小
```

## 📊 项目结构

```
lottery-prediction/
├── core/              # 核心框架（数据库、爬虫、预测、Telegram）
├── lotteries/         # 彩票模块
│   ├── ssq/          # 双色球 ✅
│   └── dlt/          # 大乐透 🚧
├── cli/               # 命令行工具
├── scripts/           # 初始化和定时任务脚本
├── deployment/        # Docker 部署配置
│   ├── docker/
│   ├── docker-compose.yml
│   └── deploy.sh
├── docs/              # 完整文档
│   ├── deployment/   # 部署指南
│   └── guides/       # 使用教程
├── logs/              # 日志文件
└── data/              # 数据文件
```

## 🔧 常用命令

### 本地开发

```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境
cp .env.example .env

# 运行命令
python lottery.py fetch ssq --mode full
python lottery.py predict ssq
```

### Docker 部署

```bash
# 进入部署目录
cd deployment

# 部署
./deploy.sh

# 查看日志
docker-compose logs -f

# 手动执行任务
docker-compose exec lottery-ssq python scripts/daily_task.py
```

## 🛡️ 安全特性

- ✅ 多 User-Agent 轮换
- ✅ 随机请求间隔（0.5-2秒）
- ✅ 429 限流自动处理
- ✅ SSL/TLS 数据库连接
- ✅ 环境变量隔离
- ✅ 容器网络隔离

## 📈 性能指标

- **内存使用**: ~200MB/容器
- **CPU 使用**: <5%（空闲时）
- **初始化时间**: ~15分钟（全量数据）
- **每日任务**: ~30秒
- **预测速度**: ~2秒

## ⚠️ 注意事项

1. 彩票预测仅供参考，不保证中奖
2. 爬虫已优化，但仍需遵守网站规则
3. 定期备份数据库
4. 遵守当地法律法规

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

- 📖 [完整文档](docs/INDEX.md)
- 🐛 [问题反馈](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

---

**版本**: 2.2.0  
**更新日期**: 2025-11-15  
**状态**: 🟢 生产就绪
