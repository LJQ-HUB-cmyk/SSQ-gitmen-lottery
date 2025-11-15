# 大乐透（DLT）模块

## 规则说明

- **前区**: 从 1-35 中选择 5 个不重复的号码
- **后区**: 从 1-12 中选择 2 个不重复的号码
- **开奖日期**: 周一、周三、周六晚 20:30

## 状态

🚧 开发中...

## 待实现

- [ ] 数据库表结构设计
- [ ] 爬虫实现
- [ ] 预测算法
- [ ] 测试

## 数据源

- **主数据源**: 500.com
- **URL**: https://datachart.500.com/dlt/history/newinc/history.php

## 使用示例

```bash
# 爬取数据
python lottery.py fetch dlt --mode full

# 预测号码
python lottery.py predict dlt

# 定时任务
python lottery.py schedule dlt
```
