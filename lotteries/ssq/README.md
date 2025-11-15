# 双色球（SSQ）模块

## 规则说明

- **红球**: 从 1-33 中选择 6 个不重复的号码
- **蓝球**: 从 1-16 中选择 1 个号码
- **开奖日期**: 周二、周四、周日晚 20:30

## 数据格式

### 数据库表结构

```sql
CREATE TABLE ssq_lottery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lottery_no VARCHAR(20) UNIQUE NOT NULL,  -- 期号（如：2024001）
    draw_date DATE NOT NULL,                 -- 开奖日期
    red1 VARCHAR(2) NOT NULL,                -- 红球1（两位数：01-33）
    red2 VARCHAR(2) NOT NULL,                -- 红球2
    red3 VARCHAR(2) NOT NULL,                -- 红球3
    red4 VARCHAR(2) NOT NULL,                -- 红球4
    red5 VARCHAR(2) NOT NULL,                -- 红球5
    red6 VARCHAR(2) NOT NULL,                -- 红球6
    blue VARCHAR(2) NOT NULL,                -- 蓝球（两位数：01-16）
    sorted_code VARCHAR(50) NOT NULL,        -- 排序号码（如：02,06,08,12,22,31-15）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_draw_date (draw_date),
    INDEX idx_lottery_no (lottery_no)
);
```

### 号码格式

- 所有号码使用两位数格式：`01`, `02`, ..., `33`
- 排序号码格式：`02,06,08,12,22,31-15`（红球按升序，蓝球在后）

## 数据源

- **主数据源**: 500.com
- **URL**: https://datachart.500.com/ssq/history/newinc/history.php
- **格式**: HTML表格

## 预测规则

1. **频率分析**: 优先选择历史高频号码
2. **去重规则**: 排除历史中奖过的完整组合
3. **连号限制**: 不允许3个及以上连号
4. **分布优化**: 号码分布均匀，间距合理

## 使用示例

### 爬取数据

```bash
# 全量爬取
python lottery.py fetch ssq --mode full

# 增量爬取
python lottery.py fetch ssq --mode latest
```

### 预测号码

```bash
python lottery.py predict ssq
```

### 定时任务

```bash
python lottery.py schedule ssq
```

## 模块文件

- `config.py` - 双色球配置（规则、范围等）
- `database.py` - 数据库操作
- `spider.py` - 数据爬虫
- `predictor.py` - 预测算法

## 历史数据

- **开始时间**: 2003年2月23日
- **期号格式**: YYXXX（如：03001表示2003年第1期）
- **每年期数**: 约150-160期（每周3期）
