# 📝 更新日志

## [3.3.0] - 2024-12-19

### 🎯 新增功能 - Python 版本数据导出
- **数据导出模块**：新增 `cli/export.py` 模块，支持导出彩票数据
- **多格式支持**：支持导出为 CSV、MySQL SQL、SQLite SQL 三种格式
- **动态 Schema**：自动适应数据库结构变化，无需修改代码
- **完整 SQL**：包含 DROP TABLE + CREATE TABLE + INSERT 语句，可直接导入
- **命令行接口**：通过 `python lottery.py export` 命令导出数据
- **批量导出**：支持一次导出所有彩票类型或指定类型

### 📦 新增文件
- `cli/export.py` - Python 数据导出模块

### 🔧 修改文件
- `lottery.py` - 添加 export 命令支持

### 📊 功能特性
- **CSV 格式**：包含所有字段（包括 id），UTF-8 BOM 编码，Excel 可直接打开
- **MySQL SQL**：不包含 id（自增），包含完整表结构和索引
- **SQLite SQL**：不包含 id（自增），包含完整表结构和索引
- **固定文件名**：使用 `{type}_latest.*` 格式，每次导出覆盖旧文件
- **导出目录**：文件保存在 `data/export/` 目录

### 💡 使用示例
```bash
# 导出所有彩票类型
python lottery.py export

# 导出指定类型
python lottery.py export ssq
python lottery.py export dlt
```

## [3.2.0] - 2024-12-19

### 🎯 新增功能 - Cloudflare Worker 数据导出
- **数据导出功能**：支持将彩票数据导出为 Excel 和 SQL 文件
- **云端存储**：自动上传到 Cloudflare R2 存储桶
- **批量导出**：支持一次导出所有彩票类型（双色球、大乐透、七星彩、七乐彩）
- **下载链接生成**：自动生成可访问的下载链接
- **安全认证**：导出接口需要 API Key 认证

### 📦 新增文件
- `cloudflare-worker/src/utils/exporter.js` - 数据导出核心模块
- `cloudflare-worker/R2_SETUP.md` - R2 存储桶配置指南
- `cloudflare-worker/EXPORT_FEATURE.md` - 功能详细说明文档
- `cloudflare-worker/DEPLOYMENT_CHECKLIST.md` - 部署检查清单
- `cloudflare-worker/EXPORT_FEATURE_SUMMARY.md` - 开发总结文档
- `cloudflare-worker/QUICK_START_EXPORT.md` - 快速开始指南
- `cloudflare-worker/scripts/test-export.sh` - 导出功能测试脚本
- `cloudflare-worker/src/utils/exporter-with-presigned-url.js.example` - 预签名 URL 示例

### 🔧 修改文件
- `cloudflare-worker/src/index.js` - 添加导出路由和接口
- `cloudflare-worker/wrangler.toml` - 添加 R2 存储桶绑定
- `cloudflare-worker/API_USAGE.md` - 更新 API 文档，添加导出接口说明

### 📊 功能特性
- **多格式支持**：Excel (.xlsx) 和 SQL (.sql) 两种格式
- **全量导出**：导出数据库中的所有历史数据
- **文件格式**：
  - Excel 使用 SpreadsheetML 格式，兼容 Excel、WPS、LibreOffice
  - SQL 包含 CREATE TABLE 和 INSERT 语句，可直接导入数据库
- **时间戳命名**：文件名包含时间戳，避免冲突
- **成本优化**：使用 Cloudflare R2，存储和流量成本极低

### 🔄 API 接口
```bash
# 导出单个类型
POST /export/{type}  # type: ssq, dlt, qxc, qlc

# 导出所有类型
POST /export

# 需要认证
Authorization: Bearer YOUR_API_KEY
```

### 📋 响应示例
```json
{
  "success": true,
  "lottery_type": "ssq",
  "lottery_name": "双色球",
  "count": 3378,
  "timestamp": "2024-12-19T14-30-00",
  "downloads": {
    "excel": "https://lottery-exports.your-domain.com/ssq_lottery_2024-12-19T14-30-00.xlsx",
    "sql": "https://lottery-exports.your-domain.com/ssq_lottery_2024-12-19T14-30-00.sql"
  }
}
```

### 🏗️ 架构设计
- **开闭原则**：新增独立模块，不修改现有代码
- **单一职责**：DataExporter 类专注于数据导出
- **依赖倒置**：依赖 Database 接口，不依赖具体实现

### 📈 性能指标
- 单个类型导出：2-5 秒
- 批量导出：10-20 秒
- Excel 文件大小：100-500 KB
- SQL 文件大小：200-800 KB

### 💰 成本估算
- 基于 Cloudflare R2 定价
- 每月导出 10 次：约 $0.001
- 几乎可以忽略不计

### ✅ 向后兼容
- 完全不影响现有功能
- 现有 API 接口保持不变
- 可选功能，不使用不影响系统运行

### 📚 文档完善
- 提供完整的配置指南
- 提供详细的使用文档
- 提供部署检查清单
- 提供测试脚本和示例

---

## [3.1.0] - 2025-11-19

### 🎯 新增功能
- **多策略预测配置**：支持通过 `.env` 配置多种预测策略
- **策略组合预测**：可同时使用 frequency、balanced、coldHot、random 策略
- **灵活预测数量**：每种策略可配置生成的组合数量

### 🔧 修复问题
- **预测策略配置问题**：修复预测器只使用单一策略的问题
- **配置读取缺失**：所有预测器调用现在正确读取环境变量配置
- **策略参数传递**：修复预测器构造时缺少策略参数的问题

### 📊 改进内容
- **预测结果丰富化**：从单一策略5组提升到多策略20组（可配置）
- **日志信息完善**：清晰显示每种策略的使用情况和生成结果
- **配置驱动设计**：完全通过 `.env` 文件控制预测行为

### 🔄 修改文件
- `cli/fetch.py` - 增量爬取预测功能
- `cli/predict.py` - 独立预测命令
- `cli/schedule.py` - 定时任务预测
- `README.md` - 更新文档和配置说明
- `docs/ARCHITECTURE.md` - 更新架构说明

### 📋 配置示例
```bash
# 新增配置项
DEFAULT_STRATEGIES=frequency,balanced,coldHot,random  # 使用的策略
DEFAULT_PREDICTION_COUNT=5                            # 每种策略生成组合数
```

### ✅ 向后兼容
- 完全向后兼容现有配置
- 如果未配置策略，使用默认的 frequency 策略
- 现有预测逻辑保持不变

---

## [3.0.0] - 2025-11-18

### 🚀 重大更新
- **统一爬虫接口**：Python 和 Cloudflare Worker 使用相同的爬取逻辑
- **智能全量爬取**：逐年推进模式，自动完成所有年份数据爬取
- **统一增量逻辑**：从数据库最新期号自动开始增量更新
- **Telegram 消息优化**：格式统一，支持策略显示

### 🔧 架构改进
- **模块化设计**：核心框架与彩票模块分离
- **配置统一管理**：所有配置集中在 `core/config.py`
- **双版本支持**：Python 本地版 + Cloudflare Worker 云端版

### 📚 文档完善
- 完整的架构说明文档
- 详细的部署指南
- API 使用文档
- Telegram 配置指南

---

## [2.x.x] - 历史版本

### 基础功能
- 双色球、大乐透和七星彩数据爬取
- 基础预测算法
- 数据库存储
- 基本的 Telegram 通知

---

**版本规范**：
- 主版本号：重大架构变更
- 次版本号：新功能添加
- 修订版本号：问题修复和小改进