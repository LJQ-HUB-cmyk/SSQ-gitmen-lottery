# 🎰 彩票预测系统

基于历史数据分析的彩票预测系统，支持双色球和大乐透。

提供 **Python** 和 **Cloudflare Workers** 两个版本。

## ✨ 特性

- 🎯 **双彩票支持**：双色球（SSQ）+ 大乐透（DLT）
- 🔄 **数据源**：500.com，稳定可靠
- 🤖 **智能爬取**：统一的增量爬取逻辑
- 📊 **多策略预测**：频率、随机、均衡、冷热号
- 📱 **Telegram 通知**：实时推送预测结果
- ☁️ **双版本**：Python 本地版 + Worker 云端版

## 🚀 快速开始

### Python 版本

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置
cp .env.example .env
vim .env

# 3. 全量爬取（首次使用，自动完成所有年份）
python lottery.py fetch ssq --mode full  # 自动爬取所有年份直到完成
python lottery.py fetch dlt --mode full  # 自动爬取所有年份直到完成

# 4. 增量更新（日常使用）
python lottery.py fetch ssq
python lottery.py fetch dlt

# 5. 预测号码
python lottery.py predict ssq
python lottery.py predict dlt

# 6. 定时任务（自动增量 + 预测）
python lottery.py schedule
```

### Cloudflare Workers 版本

```bash
# 1. 部署
cd cloudflare-worker
wrangler deploy

# 2. 初始化数据（首次使用）
./scripts/init.sh ssq
./scripts/init.sh dlt

# 3. 使用 API
curl https://your-worker.workers.dev/latest/ssq
curl https://your-worker.workers.dev/predict/dlt
```

## 📖 文档

- [架构说明](./docs/ARCHITECTURE.md) - 系统架构和设计
- [Worker 版本](./cloudflare-worker/README.md) - Worker 使用说明
- [API 文档](./cloudflare-worker/API_USAGE.md) - API 接口说明
- [Telegram 设置](./docs/guides/TELEGRAM_SETUP.md) - Telegram 配置指南

## 🎲 支持的彩票

| 彩票 | 代码 | 规则 | 开奖时间 |
|------|------|------|---------|
| 双色球 | ssq | 红球 1-33 选 6，蓝球 1-16 选 1 | 周二、四、日 21:15 |
| 大乐透 | dlt | 前区 1-35 选 5，后区 1-12 选 2 | 周一、三、六 21:25 |

## 🔧 核心功能

### 1. 统一的爬取接口

Python 和 Cloudflare Worker 使用相同的爬取逻辑：

```python
# Python
spider.fetch(start_issue, end_issue)  # 按期号范围爬取
spider.fetch()                         # 获取最新数据
```

```javascript
// Cloudflare Worker
spider.fetch(startIssue, endIssue)  // 按期号范围爬取
spider.fetch()                       // 获取最新数据
```

### 2. 智能增量更新

自动从数据库最新期号的下一期开始爬取：

```
数据库最新期号: 2025133
爬取范围: 25134 -> 25200
自动跳过已存在的数据
```

### 3. 定时任务

定时任务 = 增量爬取 + 预测：

```python
# Python
fetch_incremental_data('ssq', with_predict=True)
```

```javascript
// Cloudflare Worker
processSingleLottery('ssq', env, config)
```

## 📊 预测策略

| 策略 | 说明 |
|------|------|
| frequency | 基于历史高频号码 |
| random | 完全随机选择 |
| balanced | 大小号均衡分布 |
| coldHot | 结合冷热号 |

## �️ 技术栈

### Python 版本
- Python 3.8+
- MySQL 5.7+
- BeautifulSoup4
- APScheduler

### Worker 版本
- Cloudflare Workers
- D1 数据库
- KV 存储

## 📁 项目结构

```
lottery-predictor/
├── lotteries/          # 彩票模块
│   ├── ssq/           # 双色球
│   └── dlt/           # 大乐透
├── cli/               # CLI 命令
│   ├── fetch.py       # 爬取命令（核心方法）
│   ├── predict.py     # 预测命令
│   └── schedule.py    # 定时任务
├── core/              # 核心模块
├── cloudflare-worker/ # Worker 版本
├── docs/              # 文档
├── lottery.py         # 主入口
└── README.md          # 本文件
```

## 📝 配置

在 `.env` 文件中配置：

```bash
# 数据库
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lottery_db

# Telegram（可选）
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# 代理（可选，用于本地测试）
TELEGRAM_PROXY_HOST=127.0.0.1
TELEGRAM_PROXY_PORT=7890
```

## 🔄 最新更新（2025-11-19）

1. **统一爬虫接口**
   - Python 和 Worker 使用相同的 `fetch()` 方法
   - 支持全量、增量、获取最新三种场景

2. **智能全量爬取**
   - 逐年推进模式，避免访问量过大被限制
   - 智能判断缺失年份，自动循环爬取直到完成
   - 一次执行完成所有年份，无需重复执行

3. **统一增量逻辑**
   - 从数据库最新期号的下一期开始爬取
   - 自动跳过已存在的数据
   - Python 和 Worker 使用相同的逻辑

4. **优化 Telegram 消息**
   - 与 Python 版本格式完全一致
   - 显示策略名称和所有预测组合
   - 分别发送，避免消息截断

## ⚠️ 免责声明

本项目仅供学习和研究使用，不构成任何投资建议。彩票具有随机性，请理性购彩。

详细说明：[DISCLAIMER.md](./DISCLAIMER.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**版本**：3.0.0  
**更新日期**：2025-11-18