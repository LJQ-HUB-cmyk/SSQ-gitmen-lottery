# 📚 文档索引

欢迎查阅彩票预测系统文档！

## 🚀 快速开始

| 文档 | 说明 |
|------|------|
| [README.md](../README.md) | 项目介绍和快速开始 ⭐ |
| [Docker 部署指南](deployment/DOCKER_DEPLOYMENT.md) | 详细的部署步骤 ⭐ |
| [Telegram 配置](guides/TELEGRAM_SETUP.md) | 机器人配置教程 ⭐ |

## 📖 核心文档

| 文档 | 说明 |
|------|------|
| [项目架构](ARCHITECTURE.md) | 完整的架构说明 |
| [使用手册](USAGE.md) | 完整的使用说明 |
| [项目设计](PROJECT_DESIGN.md) | 设计理念和原则 |
| [性能优化](OPTIMIZATION.md) | 优化说明和最佳实践 |
| [部署检查清单](deployment/DEPLOYMENT_CHECKLIST.md) | 部署验证清单 |
| [Docker 功能总结](deployment/DOCKER_SUMMARY.md) | Docker 功能说明 |

## 🎰 彩票模块

| 模块 | 说明 | 状态 |
|------|------|------|
| [双色球](../lotteries/ssq/README.md) | 双色球模块 | ✅ 已实现 |
| [大乐透](../lotteries/dlt/README.md) | 大乐透模块 | 🚧 开发中 |

## 🎯 按场景导航

### 场景 1: 首次部署

1. 阅读 [README.md](../README.md) 了解项目
2. 配置 [Telegram 机器人](guides/TELEGRAM_SETUP.md)
3. 按照 [部署指南](deployment/DOCKER_DEPLOYMENT.md) 部署
4. 使用 [检查清单](deployment/DEPLOYMENT_CHECKLIST.md) 验证

### 场景 2: 本地开发

1. 查看 [README.md](../README.md) 快速开始
2. 阅读 [使用手册](USAGE.md)
3. 参考 [项目设计](PROJECT_DESIGN.md)

### 场景 3: 添加新彩票

1. 阅读 [项目设计](PROJECT_DESIGN.md)
2. 参考 [双色球模块](../lotteries/ssq/)
3. 实现新模块

### 场景 4: 故障排查

1. 查看 [Docker 部署指南](deployment/DOCKER_DEPLOYMENT.md#故障排查)
2. 查看 [Telegram 配置](guides/TELEGRAM_SETUP.md#常见问题)
3. 查看 [使用手册](USAGE.md#故障排查)

## ❓ 常见问题

### 如何开始使用？

**Docker 部署（推荐）**:
```bash
cd deployment
./deploy.sh
```

**本地运行**:
```bash
pip install -r requirements.txt
python lottery.py fetch ssq --mode full
```

### 如何配置 Telegram？

查看 [Telegram 配置指南](guides/TELEGRAM_SETUP.md)

### 如何部署多个彩票类型？

查看 [Docker 部署指南](deployment/DOCKER_DEPLOYMENT.md#多容器部署)

### 如何查看日志？

```bash
# 容器日志
docker-compose logs -f lottery-ssq

# 应用日志
tail -f logs/ssq/fetch.log
```

### 遇到问题怎么办？

1. 查看对应文档的故障排查部分
2. 检查日志文件
3. 查看 [常见问题](deployment/DOCKER_DEPLOYMENT.md#常见问题)
4. 提交 Issue

## 📝 文档结构

```
docs/
├── INDEX.md                    # 本文件（文档索引）
├── ARCHITECTURE.md             # 项目架构说明
├── USAGE.md                    # 使用手册
├── PROJECT_DESIGN.md           # 项目设计
├── OPTIMIZATION.md             # 性能优化
│
├── deployment/                 # 部署文档
│   ├── DOCKER_DEPLOYMENT.md   # Docker 部署指南
│   ├── DEPLOYMENT_CHECKLIST.md # 部署检查清单
│   └── DOCKER_SUMMARY.md      # Docker 功能总结
│
└── guides/                     # 使用指南
    └── TELEGRAM_SETUP.md      # Telegram 配置
```

## 🔗 外部资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Python 官方文档](https://docs.python.org/3/)

## 📅 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2025-11-15 | 重构项目结构，支持多容器部署 |
| 2025-11-15 | 添加 Docker 和 Telegram 文档 |
| 2025-11-15 | 完善部署指南和故障排查 |

---

**提示**: 建议从 [README.md](../README.md) 开始阅读，然后根据需要查看其他文档。
