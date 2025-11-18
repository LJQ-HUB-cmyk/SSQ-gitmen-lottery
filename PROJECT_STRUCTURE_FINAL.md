# 项目结构（清理后）

## 📁 目录结构

```
gitmen-lottery/
├── README.md                           # 项目说明
├── CHANGELOG.md                        # 更新日志
├── DISCLAIMER.md                       # 免责声明
├── PROJECT_STRUCTURE.md                # 项目结构（旧版）
├── PROJECT_STRUCTURE_FINAL.md          # 项目结构（最终版）
├── PYTHON_CODE_SYNC_SUMMARY.md         # Python 代码同步总结
├── SYNC_COMPLETE_REPORT.md             # 同步完成报告
├── requirements.txt                    # Python 依赖
├── .env.example                        # 环境变量示例
├── .gitignore                          # Git 忽略
├── lottery.py                          # 主程序入口
│
├── cloudflare-worker/                  # ⭐ Cloudflare Worker 版本
│   ├── src/                            # 源代码
│   │   ├── index.js                    # 主入口
│   │   ├── spiders/                    # 爬虫模块
│   │   │   └── ssq.js                  # 双色球爬虫
│   │   ├── predictors/                 # 预测模块
│   │   │   ├── ssq.js                  # 双色球预测器
│   │   │   └── strategies/             # 预测策略
│   │   │       ├── index.js            # 策略注册中心
│   │   │       ├── base.js             # 策略基类
│   │   │       ├── frequency.js        # 频率策略
│   │   │       ├── random.js           # 随机策略
│   │   │       ├── balanced.js         # 均衡策略
│   │   │       └── coldHot.js          # 冷热号策略
│   │   └── utils/                      # 工具模块
│   │       ├── database.js             # 数据库操作
│   │       └── telegram.js             # Telegram 机器人
│   │
│   ├── scripts/                        # 脚本
│   │   ├── init.sh                     # 初始化脚本
│   │   ├── diagnose.sh                 # 诊断脚本
│   │   ├── set-strategies.sh           # 设置策略脚本
│   │   ├── test-incremental.sh         # 测试增量爬取
│   │   └── test-strategies.sh          # 测试策略
│   │
│   ├── docs/                           # 文档
│   │   ├── 快速开始.md                 # 快速开始指南
│   │   ├── 预测策略.md                 # 预测策略文档
│   │   ├── 配置说明.md                 # 配置说明
│   │   └── 测试增量爬取.md             # 测试文档
│   │
│   ├── .env.example                    # 环境变量示例
│   ├── wrangler.toml                   # Worker 配置
│   ├── package.json                    # 依赖配置
│   ├── schema.sql                      # 数据库结构
│   └── README.md                       # Worker 说明
│
├── lotteries/                          # ⭐ 彩票模块
│   ├── __init__.py
│   ├── ssq/                            # 双色球模块
│   │   ├── __init__.py
│   │   ├── spider.py                   # 爬虫（500.com 主源）
│   │   ├── predictor.py                # 预测器（支持策略模式）
│   │   ├── database.py                 # 数据库操作
│   │   ├── config.py                   # 配置
│   │   ├── example.py                  # 使用示例
│   │   ├── strategies/                 # ⭐ 预测策略（新增）
│   │   │   ├── __init__.py             # 策略注册中心
│   │   │   ├── base.py                 # 策略基类
│   │   │   ├── frequency.py            # 频率策略
│   │   │   ├── random.py               # 随机策略
│   │   │   ├── balanced.py             # 均衡策略
│   │   │   └── cold_hot.py             # 冷热号策略
│   │   ├── PYTHON_SYNC_COMPLETE.md     # Python 同步文档
│   │   └── README.md                   # 模块说明
│   │
│   └── dlt/                            # 大乐透模块（占位）
│       ├── __init__.py
│       └── README.md
│
├── core/                               # 核心模块
│   ├── __init__.py
│   ├── base_spider.py                  # 爬虫基类
│   ├── base_predictor.py               # 预测器基类
│   ├── base_database.py                # 数据库基类
│   ├── telegram_bot.py                 # Telegram 机器人
│   ├── config.py                       # 配置管理
│   └── utils.py                        # 工具函数
│
├── scripts/                            # 脚本
│   ├── init_database.py                # 初始化数据库
│   └── daily_task.py                   # 每日任务
│
├── cli/                                # 命令行工具
│   ├── __init__.py
│   ├── fetch.py                        # 获取数据
│   ├── predict.py                      # 预测
│   └── schedule.py                     # 定时任务
│
├── tests/                              # 测试
│   ├── test_telegram.py                # Telegram 测试
│   └── README.md                       # 测试说明
│
├── deployment/                         # 部署配置
│   ├── deploy.sh                       # 部署脚本
│   ├── docker-compose.yml              # Docker Compose
│   ├── docker/                         # Docker 配置
│   └── README.md                       # 部署说明
│
└── docs/                               # 文档
    ├── INDEX.md                        # 文档索引
    ├── ARCHITECTURE.md                 # 架构文档
    ├── USAGE.md                        # 使用指南
    ├── STAR_GUIDE.md                   # Star 指南
    └── TELEGRAM_PROXY_SETUP.md         # Telegram 代理设置
```

## 📊 清理统计

### 删除的文件（共 23 个）

#### 根目录（6个）
- ✅ `CLOUDFLARE_WORKER_VERSION.md`
- ✅ `DEPLOYMENT_CHECKLIST.md`
- ✅ `FIX_CRAWL_STRATEGY.md`
- ✅ `FIX_ISSUE_GENERATION.md`
- ✅ `SUMMARY.md`
- ✅ `立即部署.md`

#### docs/（6个）
- ✅ `docs/接口对比.md`
- ✅ `docs/OPTIMIZATION_REPORT.md`
- ✅ `docs/OPTIMIZATION.md`
- ✅ `docs/PROJECT_CLEANUP.md`
- ✅ `docs/PROJECT_DESIGN.md`
- ✅ `docs/TEST_REPORT.md`

#### tests/（4个）
- ✅ `tests/TELEGRAM_TEST_REPORT.md`
- ✅ `tests/TELEGRAM_TEST_SUCCESS.md`
- ✅ `tests/test_telegram_quick.py`
- ✅ `tests/test_telegram_proxy.py`

#### cloudflare-worker/（4个）
- ✅ `cloudflare-worker/.env.local.example`
- ✅ `cloudflare-worker/QUICKSTART.md`
- ✅ `cloudflare-worker/test-fetch.js`
- ✅ `cloudflare-worker/test-spider.js`

#### lotteries/ssq/（3个）
- ✅ `lotteries/ssq/BUGFIX_README.md`
- ✅ `lotteries/ssq/test_spider.py`
- ✅ `lotteries/ssq/使用指南.md`

#### scripts/（1个）
- ✅ `scripts/setup_github.sh`

### 新增的文件（阶段1，共 9 个）

#### lotteries/ssq/strategies/（6个）
- ✅ `__init__.py`
- ✅ `base.py`
- ✅ `frequency.py`
- ✅ `random.py`
- ✅ `balanced.py`
- ✅ `cold_hot.py`

#### 文档和示例（3个）
- ✅ `lotteries/ssq/example.py`
- ✅ `lotteries/ssq/PYTHON_SYNC_COMPLETE.md`
- ✅ `PYTHON_CODE_SYNC_SUMMARY.md`

### 修改的文件（阶段1，共 2 个）
- ✅ `lotteries/ssq/predictor.py`
- ✅ `lotteries/ssq/spider.py`

## 🎯 核心模块

### 1. Cloudflare Worker 版本
- **位置**：`cloudflare-worker/`
- **特点**：无服务器部署，自动扩展
- **数据源**：500.com（主）+ 中彩网（备用）
- **预测**：4种策略可组合

### 2. Python 版本
- **位置**：`lotteries/ssq/`
- **特点**：本地部署，灵活控制
- **数据源**：500.com（主）+ 中彩网（备用）
- **预测**：4种策略可组合

### 3. 核心库
- **位置**：`core/`
- **功能**：基类、工具、Telegram 机器人

## 📝 主要改进

### 1. 代码同步 ✅
- Python 和 Worker 版本功能一致
- 都支持策略模式预测
- 都使用 500.com 作为主数据源

### 2. 项目清理 ✅
- 删除 23 个废弃文件
- 整理目录结构
- 保留核心功能

### 3. 文档完善 ✅
- 更新使用文档
- 添加策略说明
- 提供使用示例

## 🚀 快速开始

### Cloudflare Worker 版本
```bash
cd cloudflare-worker
./scripts/init.sh
```

### Python 版本
```bash
python3 lotteries/ssq/example.py
```

## 📚 文档索引

### 核心文档
- `README.md` - 项目说明
- `CHANGELOG.md` - 更新日志
- `docs/INDEX.md` - 文档索引
- `docs/ARCHITECTURE.md` - 架构文档
- `docs/USAGE.md` - 使用指南

### Worker 文档
- `cloudflare-worker/README.md` - Worker 说明
- `cloudflare-worker/docs/快速开始.md` - 快速开始
- `cloudflare-worker/docs/预测策略.md` - 策略文档
- `cloudflare-worker/docs/配置说明.md` - 配置说明

### Python 文档
- `lotteries/ssq/README.md` - 模块说明
- `lotteries/ssq/PYTHON_SYNC_COMPLETE.md` - 同步文档
- `lotteries/ssq/example.py` - 使用示例

### 同步文档
- `PYTHON_CODE_SYNC_SUMMARY.md` - 同步总结
- `SYNC_COMPLETE_REPORT.md` - 完成报告

## ✅ 项目状态

- [x] Python 代码同步完成
- [x] 项目清理完成
- [x] 文档更新完成
- [x] 目录结构优化完成
- [x] 测试验证通过

## 🎉 总结

项目已完成全面清理和优化：
1. ✅ 删除了 23 个废弃文件
2. ✅ 新增了 9 个核心文件
3. ✅ 修改了 2 个关键文件
4. ✅ 整理了目录结构
5. ✅ 完善了文档系统

现在项目结构清晰，代码同步，文档完善，可以高效开发和维护！
