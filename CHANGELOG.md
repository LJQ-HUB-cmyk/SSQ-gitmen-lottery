# 📝 更新日志

## [3.4.0] - 2024-12-30

### 🎯 增强功能 - 蓝球/后区/特别号预测算法优化
- **双色球蓝球优化**：基于三种"弱周期"理论增强所有策略的蓝球预测算法
- **大乐透后区优化**：将相同的智能算法应用到大乐透后区预测
- **七乐彩特别号优化**：将相同的智能算法应用到七乐彩特别号预测
- **均值回归型弱周期**：识别长期高频但短期过冷的号码
- **行为约束型准周期**：避开最近1-3期出现的号码
- **频段切换型结构周期**：分析当前处于哪个区间偏好阶段

### 📦 新增文件
- `lotteries/ssq/strategies/blue_helper.py` - 双色球蓝球预测辅助模块
- `lotteries/dlt/strategies/back_helper.py` - 大乐透后区预测辅助模块
- `lotteries/qlc/strategies/special_helper.py` - 七乐彩特别号预测辅助模块
- `cloudflare-worker/src/predictors/strategies/blueHelper.js` - 双色球蓝球辅助（Worker版）
- `cloudflare-worker/src/predictors/strategies/dlt/backHelper.js` - 大乐透后区辅助（Worker版）
- `cloudflare-worker/src/predictors/specialHelper.js` - 七乐彩特别号辅助（Worker版）

### 🔧 修改文件
**Python版本：**
- `lotteries/ssq/strategies/frequency.py` - 使用智能蓝球选择
- `lotteries/ssq/strategies/cold_hot.py` - 使用智能蓝球选择
- `lotteries/ssq/strategies/balanced.py` - 使用智能蓝球选择
- `lotteries/dlt/strategies/frequency.py` - 使用智能后区选择
- `lotteries/dlt/strategies/cold_hot.py` - 使用智能后区选择
- `lotteries/dlt/strategies/balanced.py` - 使用智能后区选择
- `lotteries/dlt/predictor.py` - 添加 history_data 到上下文
- `lotteries/qlc/strategies/frequency.py` - 使用智能特别号选择
- `lotteries/qlc/strategies/cold_hot.py` - 使用智能特别号选择
- `lotteries/qlc/strategies/balanced.py` - 使用智能特别号选择

**Cloudflare Worker版本：**
- `cloudflare-worker/src/predictors/strategies/frequency.js` - 使用智能蓝球选择
- `cloudflare-worker/src/predictors/strategies/coldHot.js` - 使用智能蓝球选择
- `cloudflare-worker/src/predictors/strategies/balanced.js` - 使用智能蓝球选择
- `cloudflare-worker/src/predictors/strategies/dlt/frequency.js` - 使用智能后区选择
- `cloudflare-worker/src/predictors/strategies/dlt/coldHot.js` - 使用智能后区选择
- `cloudflare-worker/src/predictors/strategies/dlt/balanced.js` - 使用智能后区选择
- `cloudflare-worker/src/predictors/qlc.js` - 使用智能特别号选择

### 📊 算法特性
- **三层过滤机制**：
  1. 均值回归候选筛选
  2. 回避型准周期过滤
  3. 区间偏移权重调整
- **动态权重**：根据历史数据动态调整候选号码权重
- **防御性设计**：数据不足时自动降级到简单策略
- **透明集成**：所有现有策略自动获得增强，无需修改使用方式
- **区间划分**：
  - 双色球蓝球：低值段(1-6)、中值段(7-11)、高值段(12-16)
  - 大乐透后区：低值段(1-4)、中值段(5-8)、高值段(9-12)
  - 七乐彩特别号：低值段(1-10)、中值段(11-20)、高值段(21-30)

### 💡 使用示例
```python
# 所有策略自动使用增强的预测算法
python lottery.py predict ssq  # 双色球
python lottery.py predict dlt  # 大乐透
python lottery.py predict qlc  # 七乐彩
```

### 🔬 理论基础
基于对双色球蓝球3000+期数据的深度分析，发现三种"弱周期"现象：
1. **均值回归**：号码有向平均值回归的倾向
2. **回避型准周期**：刚出现的号码短期内被"隐性压低"
3. **区间偏移**：号码在不同值段之间存在20-60期的偏好切换

该算法已成功应用到：
- 大乐透后区（12个号码选2个）- 周期性特征更明显
- 七乐彩特别号（动态范围选1个）- 需要适应每期不同的可选范围

### ⚠️ 七星彩说明
七星彩为位置型彩票（每位独立选择0-9），不适合应用此算法，保持原有预测逻辑。

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
