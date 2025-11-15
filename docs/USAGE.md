# 使用指南

## 快速开始

### 1. 首次使用 - 爬取全量历史数据

```bash
# 爬取从2003年到现在的所有数据
python scripts/fetch_ssq.py --mode full
```

预计耗时：约10-15分钟（取决于网络速度）

输出示例：
```
2025-11-15 16:00:00 - 开始爬取双色球全量历史数据
2025-11-15 16:00:00 - 年份范围: 2003 至 2025
2025-11-15 16:00:01 - 爬取 2003 年数据 (期号: 03001 - 03200)
2025-11-15 16:00:02 -   获取 89 条数据
2025-11-15 16:00:03 -   入库: 新增 89 条，重复 0 条，跳过 0 条
...
2025-11-15 16:15:00 - 爬取完成，新增 3377 条，跳过 0 条
2025-11-15 16:15:00 - 数据库总记录数: 3377
2025-11-15 16:15:00 - 最新一期: 25131 (2025-11-13)
```

### 2. 预测下一期号码

```bash
python scripts/predict_ssq.py
```

输出示例：
```
2025-11-15 16:12:39 - 开始预测双色球下一期号码
2025-11-15 16:12:39 - 使用 3877 条历史数据进行预测
2025-11-15 16:12:39 - 预测结果:
2025-11-15 16:12:39 - 组合 1: 红球 06,07,17,22,26,32 | 蓝球 15
2025-11-15 16:12:39 - 组合 2: 红球 06,08,17,22,26,32 | 蓝球 15
2025-11-15 16:12:39 - 组合 3: 红球 02,07,17,22,26,32 | 蓝球 15
2025-11-15 16:12:39 - 组合 4: 红球 02,08,17,22,26,32 | 蓝球 15
2025-11-15 16:12:39 - 组合 5: 红球 01,07,17,22,26,32 | 蓝球 15
2025-11-15 16:12:39 - 历史数据统计
2025-11-15 16:12:39 - 红球频率前10: ['17(765)', '26(757)', '14(755)', ...]
2025-11-15 16:12:39 - 蓝球频率前5: ['15(270)', '16(264)', '1(258)', ...]
2025-11-15 16:12:39 - 连号分析: {'1个连号': 2156, '2个连号': 340, '3个连号': 42, '无连号': 1339}
```

### 3. 日常更新 - 增量爬取

```bash
# 仅爬取当前年份的最新数据
python scripts/fetch_ssq.py --mode latest
```

输出示例：
```
2025-11-15 16:13:00 - 增量爬取 2025 年最新数据
2025-11-15 16:13:01 - 获取 131 条数据
2025-11-15 16:13:02 - 入库: 新增 0 条，重复 0 条，跳过 131 条
2025-11-15 16:13:02 - 最新一期: 2025131 (2025-11-13)
```

### 4. 启动定时任务

```bash
# 每天21:30自动爬取最新数据
python scripts/schedule_fetch.py
```

输出示例：
```
2025-11-15 16:14:00 - 定时任务已启动
2025-11-15 16:14:00 - 执行时间: 每天 21:30
2025-11-15 16:14:00 - 按 Ctrl+C 停止
2025-11-15 16:14:00 - 首次执行...
2025-11-15 16:14:01 - 定时任务开始: 2025-11-15 16:14:01
...
```

## 常见场景

### 场景1: 数据库为空，首次使用

```bash
# 步骤1: 爬取全量数据
python scripts/fetch_ssq.py --mode full

# 步骤2: 预测号码
python scripts/predict_ssq.py
```

### 场景2: 每天更新数据并预测

```bash
# 方式1: 手动执行
python scripts/fetch_ssq.py --mode latest
python scripts/predict_ssq.py

# 方式2: 使用定时任务（推荐）
python scripts/schedule_fetch.py  # 后台运行
```

### 场景3: 数据已存在，只需预测

```bash
# 直接预测，不需要爬取
python scripts/predict_ssq.py
```

### 场景4: 重新爬取某一年的数据

```python
# 创建临时脚本或在Python交互环境中执行
from ssq.spider import SSQSpider
from ssq.database import SSQDatabase
from common.utils import load_db_config

spider = SSQSpider()
db = SSQDatabase(load_db_config())
db.connect()

# 爬取2024年数据
data = spider.fetch_500com_data('24001', '24200')
inserted, duplicated, skipped = db.insert_lottery_data(data, skip_existing=False)
print(f"新增: {inserted}, 重复: {duplicated}, 跳过: {skipped}")

db.close()
```

## 命令行参数

### fetch_ssq.py

```bash
python scripts/fetch_ssq.py --mode [full|latest]
```

参数说明：
- `--mode full`: 全量爬取（2003年至今）
- `--mode latest`: 增量爬取（仅当前年份）
- 默认：`latest`

### predict_ssq.py

```bash
python scripts/predict_ssq.py
```

无参数，直接执行。

### schedule_fetch.py

```bash
python scripts/schedule_fetch.py
```

无参数，启动后持续运行。

## 日志查看

### 查看爬取日志

```bash
# 实时查看
tail -f logs/fetch_ssq.log

# 查看最后50行
tail -50 logs/fetch_ssq.log

# 搜索错误
grep ERROR logs/fetch_ssq.log
```

### 查看预测日志

```bash
tail -f logs/predict_ssq.log
```

### 查看定时任务日志

```bash
tail -f logs/schedule.log
```

## 数据库操作

### 查看数据统计

```python
from ssq.database import SSQDatabase
from common.utils import load_db_config

db = SSQDatabase(load_db_config())
db.connect()

# 总记录数
total = db.get_total_count('ssq_lottery')
print(f"总记录数: {total}")

# 最新一期
latest = db.get_latest_lottery()
print(f"最新一期: {latest}")

# 所有历史组合
sorted_codes = db.get_sorted_codes()
print(f"历史组合数: {len(sorted_codes)}")

db.close()
```

### 清空数据库

```sql
-- 谨慎操作！
TRUNCATE TABLE ssq_lottery;
```

或使用Python：

```python
from ssq.database import SSQDatabase
from common.utils import load_db_config

db = SSQDatabase(load_db_config())
db.connect()

cursor = db.connection.cursor()
cursor.execute("TRUNCATE TABLE ssq_lottery")
db.connection.commit()
cursor.close()

db.close()
```

## 后台运行

### 使用 nohup

```bash
# 启动定时任务
nohup python scripts/schedule_fetch.py > logs/nohup.log 2>&1 &

# 查看进程
ps aux | grep schedule_fetch

# 停止进程
kill <PID>
```

### 使用 screen

```bash
# 创建新会话
screen -S lottery

# 启动定时任务
python scripts/schedule_fetch.py

# 分离会话: Ctrl+A, D

# 重新连接
screen -r lottery

# 停止: Ctrl+C
```

### 使用 systemd (Linux)

创建服务文件 `/etc/systemd/system/lottery-fetch.service`:

```ini
[Unit]
Description=Lottery Data Fetch Service
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/gitmen-lottery
ExecStart=/usr/bin/python3 scripts/schedule_fetch.py
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start lottery-fetch
sudo systemctl enable lottery-fetch
sudo systemctl status lottery-fetch
```

## 故障排查

### 问题1: 数据库连接失败

```
错误: 数据库连接失败: (2003, "Can't connect to MySQL server")
```

解决方案：
1. 检查 `.env` 文件配置
2. 确认数据库服务运行中
3. 检查网络连接

### 问题2: SSL连接失败

```
错误: Connections using insecure transport are prohibited
```

解决方案：
```bash
# 在 .env 中添加
MYSQL_USE_SSL=true
MYSQL_SSL_CA=/path/to/ca.pem
```

### 问题3: 爬取失败

```
错误: 请求失败，已重试 3 次
```

解决方案：
1. 检查网络连接
2. 稍后重试
3. 检查数据源网站是否可访问

### 问题4: 没有预测结果

```
错误: 没有历史数据，无法预测
```

解决方案：
```bash
# 先爬取数据
python scripts/fetch_ssq.py --mode full
```

## 性能优化

### 1. 批量插入优化

数据库插入已经优化，使用 `skip_existing=True` 避免重复检查。

### 2. 爬取速度优化

调整爬虫参数：

```python
# 在 ssq/spider.py 中
spider = SSQSpider(timeout=10, retry_times=2)  # 减少超时和重试次数
```

### 3. 预测速度优化

使用更少的历史数据：

```python
# 只使用最近1000期数据
recent_data = lottery_data[-1000:]
predictor = SSQPredictor(recent_data)
```

## 最佳实践

1. **首次使用**：先执行全量爬取
2. **日常使用**：使用定时任务自动更新
3. **预测时机**：开奖后第二天预测下一期
4. **数据备份**：定期备份数据库
5. **日志管理**：定期清理旧日志文件

## 免责声明

本系统仅供学习和研究使用，预测结果不保证准确性，请理性购彩。
