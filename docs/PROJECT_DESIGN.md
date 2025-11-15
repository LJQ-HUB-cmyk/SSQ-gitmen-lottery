# 彩票预测系统 - 项目设计

## 目标结构

```
lottery-prediction/
│
├── core/                          # 核心框架（所有彩票共用）
│   ├── __init__.py
│   ├── base_database.py          # 数据库基类
│   ├── base_spider.py            # 爬虫基类
│   ├── base_predictor.py         # 预测基类
│   ├── config.py                 # 全局配置
│   └── utils.py                  # 工具函数
│
├── lotteries/                     # 彩票类型目录
│   │
│   ├── ssq/                      # 双色球
│   │   ├── __init__.py
│   │   ├── config.py             # 双色球配置（规则、范围等）
│   │   ├── database.py           # 双色球数据库操作
│   │   ├── spider.py             # 双色球爬虫
│   │   ├── predictor.py          # 双色球预测算法
│   │   └── README.md             # 双色球说明
│   │
│   ├── dlt/                      # 大乐透
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── spider.py
│   │   ├── predictor.py
│   │   └── README.md
│   │
│   ├── ks3/                      # 快开3
│   │   └── ...
│   │
│   └── sdlt/                     # 超级大乐透
│       └── ...
│
├── cli/                          # 命令行工具
│   ├── __init__.py
│   ├── fetch.py                  # 通用爬取命令
│   ├── predict.py                # 通用预测命令
│   ├── schedule.py               # 定时任务命令
│   └── main.py                   # CLI入口
│
├── api/                          # API服务（可选）
│   ├── __init__.py
│   ├── app.py                    # Flask/FastAPI应用
│   └── routes/
│       ├── ssq.py
│       └── dlt.py
│
├── web/                          # Web界面（可选）
│   ├── static/
│   ├── templates/
│   └── app.py
│
├── tests/                        # 测试
│   ├── test_core/
│   ├── test_ssq/
│   └── test_dlt/
│
├── logs/                         # 日志
│   ├── ssq/
│   ├── dlt/
│   └── system/
│
├── data/                         # 数据文件（可选）
│   ├── backup/
│   └── export/
│
├── docs/                         # 文档
│   ├── design.md
│   ├── api.md
│   └── development.md
│
├── .env                          # 环境配置
├── .env.example
├── requirements.txt              # 依赖
├── setup.py                      # 安装配置
├── README.md                     # 项目说明
└── lottery.py                    # 统一入口脚本
```

## 设计原则

### 1. 核心框架（core/）
提供所有彩票类型共用的基础功能：
- 数据库连接和操作
- HTTP请求和重试
- 预测算法框架
- 工具函数

### 2. 彩票模块（lotteries/）
每个彩票类型一个独立目录：
- 继承核心框架的基类
- 实现特定的规则和逻辑
- 完全独立，互不影响

### 3. 命令行工具（cli/）
统一的命令行接口：
```bash
python lottery.py fetch ssq --mode full
python lottery.py fetch dlt --mode latest
python lottery.py predict ssq
python lottery.py predict dlt
python lottery.py schedule ssq
```

### 4. 扩展性
添加新彩票类型只需：
1. 在 lotteries/ 下创建新目录
2. 继承 core/ 中的基类
3. 实现特定逻辑
4. 无需修改其他代码

## 使用示例

### 双色球
```bash
# 爬取
python lottery.py fetch ssq --mode full
python lottery.py fetch ssq --mode latest

# 预测
python lottery.py predict ssq

# 定时任务
python lottery.py schedule ssq
```

### 大乐透
```bash
# 爬取
python lottery.py fetch dlt --mode full

# 预测
python lottery.py predict dlt

# 定时任务
python lottery.py schedule dlt
```

### 多彩票同时运行
```bash
# 同时爬取多个彩票
python lottery.py fetch ssq dlt ks3 --mode latest

# 同时预测多个彩票
python lottery.py predict ssq dlt

# 定时任务（所有彩票）
python lottery.py schedule --all
```
