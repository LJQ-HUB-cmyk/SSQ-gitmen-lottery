# 项目架构说明

## 📁 目录结构

```
lottery-prediction/
├── README.md              # 项目入口文档
├── CHANGELOG.md           # 版本更新日志
├── .env.example           # 环境配置模板
├── .gitignore             # Git 忽略规则
├── requirements.txt       # Python 依赖
├── lottery.py             # 命令行入口
│
├── core/                  # 核心框架（7个文件）
│   ├── base_database.py  # 数据库基类
│   ├── base_spider.py    # 爬虫基类
│   ├── base_predictor.py # 预测基类
│   ├── telegram_bot.py   # Telegram 机器人
│   ├── config.py         # 全局配置
│   └── utils.py          # 工具函数
│
├── lotteries/             # 彩票模块
│   ├── ssq/              # 双色球（5个文件）✅
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── spider.py
│   │   ├── predictor.py
│   │   └── README.md
│   └── dlt/              # 大乐透（1个文件）🚧
│       └── README.md
│
├── cli/                   # 命令行工具（4个文件）
│   ├── fetch.py          # 数据爬取
│   ├── predict.py        # 号码预测
│   └── schedule.py       # 定时任务
│
├── scripts/               # 脚本（2个文件）
│   ├── init_database.py  # 数据库初始化
│   └── daily_task.py     # 每日任务
│
├── deployment/            # 部署配置（8个文件）
│   ├── docker-compose.yml # 多容器配置
│   ├── deploy.sh         # 一键部署脚本
│   ├── README.md         # 部署说明
│   └── docker/
│       ├── Dockerfile
│       ├── entrypoint.sh
│       ├── crontab.template
│       └── .dockerignore
│
├── docs/                  # 文档（8个文件）
│   ├── INDEX.md          # 文档索引
│   ├── USAGE.md          # 使用手册
│   ├── PROJECT_DESIGN.md # 项目设计
│   ├── OPTIMIZATION.md   # 性能优化
│   ├── ARCHITECTURE.md   # 本文件
│   ├── deployment/       # 部署文档（3个文件）
│   │   ├── DOCKER_DEPLOYMENT.md
│   │   ├── DEPLOYMENT_CHECKLIST.md
│   │   └── DOCKER_SUMMARY.md
│   └── guides/           # 使用指南（1个文件）
│       └── TELEGRAM_SETUP.md
│
├── logs/                  # 日志目录
│   ├── ssq/              # 双色球日志
│   └── dlt/              # 大乐透日志
│
└── data/                  # 数据目录
```

## 📊 统计信息

| 类型 | 数量 |
|------|------|
| 根目录文件 | 7 个 |
| 核心代码文件 | 20 个 |
| 文档文件 | 8 个 |
| 部署文件 | 8 个 |
| 总计 | 43 个 |

## 🎯 设计原则

### 1. 简洁的根目录

根目录只保留必要文件：
- 项目说明（README.md）
- 更新日志（CHANGELOG.md）
- 配置模板（.env.example）
- 依赖清单（requirements.txt）
- 入口脚本（lottery.py）

### 2. 模块化设计

- **core/** - 可复用的核心框架
- **lotteries/** - 独立的彩票模块
- **cli/** - 统一的命令行接口
- **scripts/** - 独立的可执行脚本

### 3. 配置分离

- **deployment/** - 所有部署相关配置
- **docs/** - 所有文档集中管理
- **logs/** - 按模块分类的日志
- **data/** - 数据文件存储

### 4. 文档完善

- 主入口：README.md
- 文档索引：docs/INDEX.md
- 分类清晰：deployment、guides
- 易于查找和维护

## 🏗️ 架构特点

### 多容器架构

每个彩票类型运行在独立容器中：

```
lottery-ssq    # 双色球容器
  ├── 独立日志目录
  ├── 独立定时任务
  └── 共享数据库

lottery-dlt    # 大乐透容器
  ├── 独立日志目录
  ├── 独立定时任务
  └── 共享数据库
```

### 核心框架

所有彩票模块共享核心框架：

```
BaseDatabase    # 数据库操作
  ├── 连接管理
  ├── 批量操作
  └── 事务支持

BaseSpider      # 爬虫框架
  ├── 防封禁机制
  ├── 重试策略
  └── 连接池

BasePredictor   # 预测框架
  ├── 多策略支持（frequency、balanced、coldHot、random）
  ├── 配置驱动（通过 .env 灵活配置）
  ├── 频率分析
  ├── 去重规则
  └── 连号限制

TelegramBot     # 通知系统
  ├── 消息发送
  ├── 格式化
  └── 错误处理
```

### 扩展性

添加新彩票类型只需3步：

1. 在 `lotteries/` 创建新目录
2. 实现 4 个核心文件（config、database、spider、predictor）
3. 在 `docker-compose.yml` 添加容器配置

## 🔄 工作流程

### 部署流程

```
1. 配置 .env
   ↓
2. cd deployment
   ↓
3. ./deploy.sh
   ↓
4. 选择彩票类型
   ↓
5. 自动构建镜像
   ↓
6. 启动容器
   ↓
7. 初始化数据库
   ↓
8. 爬取全量数据
   ↓
9. 启动定时任务
```

### 运行流程（统一的增量爬取逻辑）

```
定时任务触发（每天 21:30）
   ↓
调用 fetch_incremental_data(type, with_predict=True)
   ↓
获取数据库最新期号
   ↓
计算爬取范围（下一期 -> 当年最后一期）
   ↓
调用 spider.fetch(start_issue, end_issue)
   ↓
批量入库（自动跳过已存在）
   ↓
如果有新数据 → 预测下一期
   ↓
发送 Telegram 通知
```

**核心设计：**
- Python 和 Cloudflare Worker 使用相同的增量爬取逻辑
- 全量、增量、定时任务都调用同一个底层方法 `spider.fetch()`
- 定时任务 = 增量爬取 + 预测（通过 `with_predict=True` 参数控制）

## 📈 性能优化

### 数据库优化

- 批量插入（100条/批）
- 批量查询去重
- 连接池复用
- 事务支持

### 爬虫优化

- 多 User-Agent 轮换
- 随机请求间隔（0.5-2秒）
- 429 限流处理
- 指数退避 + 随机抖动

### 容器优化

- 多阶段构建
- 最小化镜像
- 健康检查
- 自动重启

## 🛡️ 安全特性

### 代码安全

- 参数化查询（防 SQL 注入）
- 异常处理完善
- 数据验证
- 事务回滚

### 配置安全

- 环境变量隔离
- .env 不提交
- SSL/TLS 支持
- 敏感信息保护
- 预测策略配置化（支持动态调整）

### 容器安全

- 网络隔离
- 资源限制
- 健康检查
- 日志管理

## 📚 文档体系

### 文档分类

```
docs/
├── INDEX.md              # 文档索引（入口）
├── USAGE.md              # 使用手册
├── PROJECT_DESIGN.md     # 项目设计
├── OPTIMIZATION.md       # 性能优化
├── ARCHITECTURE.md       # 架构说明（本文件）
│
├── deployment/           # 部署文档
│   ├── DOCKER_DEPLOYMENT.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── DOCKER_SUMMARY.md
│
└── guides/               # 使用指南
    └── TELEGRAM_SETUP.md
```

### 文档导航

```
README.md (主入口)
    ↓
    ├─→ docs/INDEX.md (文档索引)
    │       ↓
    │       ├─→ 部署文档
    │       ├─→ 使用指南
    │       └─→ 项目设计
    │
    └─→ deployment/README.md (部署说明)
```

## 🎓 最佳实践

### 开发规范

1. 遵循 PEP 8 代码规范
2. 使用类型注解
3. 编写文档字符串
4. 完善异常处理
5. 添加日志记录

### 部署规范

1. 使用环境变量配置
2. 容器化部署
3. 数据持久化
4. 日志集中管理
5. 定期备份数据

### 文档规范

1. README.md 作为主入口
2. 文档集中管理
3. 分类清晰
4. 保持更新
5. 提供示例

## 🔮 扩展方向

### 短期（1周）

- [ ] 实现大乐透模块
- [ ] 添加单元测试
- [ ] 优化预测算法

### 中期（1个月）

- [ ] Web 管理界面
- [ ] RESTful API
- [ ] 数据可视化

### 长期（3个月）

- [ ] 机器学习预测
- [ ] 分布式部署
- [ ] 实时推送系统

---

**版本**: 3.1.0  
**更新日期**: 2025-11-19  
**状态**: 🟢 生产就绪

## 🔄 最新架构改进（2025-11-19）

### 预测策略配置化

**问题**：预测器只使用单一策略，忽略配置文件

**解决方案**：
1. 统一配置读取（`core/config.py`）
2. 所有预测器调用传入策略参数
3. 支持多策略组合预测

**架构改进**：
```
配置层 (.env)
    ↓
core/config.py (统一配置读取)
    ↓
预测器调用 (cli/fetch.py, cli/predict.py, cli/schedule.py)
    ↓
BasePredictor (多策略执行)
    ↓
预测结果 (策略×数量 = 总组合数)
```

**配置示例**：
```bash
DEFAULT_STRATEGIES=frequency,balanced,coldHot,random
DEFAULT_PREDICTION_COUNT=5
# 结果：4策略 × 5组 = 20个预测组合
```
