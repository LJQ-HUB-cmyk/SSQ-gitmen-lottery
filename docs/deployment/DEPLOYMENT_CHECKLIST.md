# Docker 部署清单

## 部署前准备

### 1. 服务器要求

- [ ] Linux 服务器（Ubuntu 20.04+ / CentOS 7+ / Debian 10+）
- [ ] 至少 1GB RAM
- [ ] 至少 10GB 磁盘空间
- [ ] 稳定的网络连接

### 2. 软件要求

- [ ] Docker 已安装（20.10+）
- [ ] Docker Compose 已安装（1.29+）
- [ ] Git 已安装

### 3. 数据库准备

- [ ] MySQL/TiDB 数据库已创建
- [ ] 数据库用户已创建
- [ ] 数据库权限已配置
- [ ] 网络连接已测试

### 4. Telegram 配置

- [ ] Telegram 机器人已创建
- [ ] Bot Token 已获取
- [ ] Chat ID 已获取
- [ ] 机器人连接已测试

## 部署步骤

### 1. 克隆项目

```bash
git clone <repository_url>
cd lottery-prediction
```

- [ ] 项目已克隆
- [ ] 进入项目目录

### 2. 配置环境

```bash
cp .env.example .env
nano .env
```

配置项检查：
- [ ] MYSQL_HOST
- [ ] MYSQL_PORT
- [ ] MYSQL_USER
- [ ] MYSQL_PASSWORD
- [ ] MYSQL_DATABASE
- [ ] MYSQL_USE_SSL（如需要）
- [ ] MYSQL_SSL_CA（如需要）
- [ ] TELEGRAM_BOT_TOKEN
- [ ] TELEGRAM_CHAT_ID

### 3. 执行部署

```bash
./deploy.sh
```

- [ ] 脚本执行成功
- [ ] 镜像构建完成
- [ ] 容器启动成功

### 4. 验证部署

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

- [ ] 容器状态为 Up
- [ ] 数据库连接成功
- [ ] 初始化完成
- [ ] 无错误日志

### 5. 测试功能

```bash
# 测试数据库连接
docker-compose exec lottery-prediction python -c "
from core.base_database import BaseDatabase
from core.utils import load_db_config
db = BaseDatabase(load_db_config())
db.connect()
print('✓ 数据库连接成功')
"

# 测试 Telegram
docker-compose exec lottery-prediction python -c "
from core.telegram_bot import TelegramBot
bot = TelegramBot()
bot.test_connection()
bot.send_message('部署测试消息')
"

# 手动执行任务
docker-compose exec lottery-prediction python scripts/daily_task.py
```

- [ ] 数据库连接测试通过
- [ ] Telegram 连接测试通过
- [ ] 收到测试消息
- [ ] 手动任务执行成功

## 部署后配置

### 1. 定时任务验证

```bash
# 查看 cron 配置
docker-compose exec lottery-prediction crontab -l

# 查看 cron 日志
docker-compose exec lottery-prediction tail -f /var/log/cron.log
```

- [ ] Cron 任务已配置
- [ ] 执行时间正确（22:00）

### 2. 日志配置

```bash
# 检查日志目录
ls -la logs/ssq/

# 查看日志文件
tail -f logs/ssq/fetch.log
```

- [ ] 日志目录已创建
- [ ] 日志文件正常写入

### 3. 数据持久化

```bash
# 检查数据目录
ls -la data/
```

- [ ] 数据目录已创建
- [ ] 权限配置正确

## 监控和维护

### 1. 日常检查

- [ ] 每天检查容器状态
- [ ] 每周检查日志
- [ ] 每月检查磁盘空间
- [ ] 定期备份数据

### 2. 监控指标

- [ ] 容器运行状态
- [ ] 数据库连接状态
- [ ] Telegram 通知状态
- [ ] 磁盘使用率
- [ ] 内存使用率

### 3. 告警配置

- [ ] 容器停止告警
- [ ] 任务失败告警
- [ ] 磁盘空间告警
- [ ] 数据库连接失败告警

## 故障处理

### 常见问题检查清单

#### 容器无法启动

- [ ] 检查 Docker 服务状态
- [ ] 检查端口占用
- [ ] 检查环境变量配置
- [ ] 查看容器日志

#### 数据库连接失败

- [ ] 检查数据库服务状态
- [ ] 检查网络连接
- [ ] 检查用户名密码
- [ ] 检查 SSL 配置

#### Telegram 通知失败

- [ ] 检查 Bot Token
- [ ] 检查 Chat ID
- [ ] 检查网络连接
- [ ] 测试 API 连接

#### 定时任务未执行

- [ ] 检查 cron 服务状态
- [ ] 检查 cron 配置
- [ ] 查看 cron 日志
- [ ] 手动执行测试

## 安全检查

### 1. 配置安全

- [ ] .env 文件权限正确（600）
- [ ] 密码强度足够
- [ ] SSL/TLS 已启用
- [ ] 敏感信息未提交到 Git

### 2. 网络安全

- [ ] 防火墙已配置
- [ ] 只开放必要端口
- [ ] 数据库访问限制
- [ ] 使用 VPN（如需要）

### 3. 容器安全

- [ ] 使用最新基础镜像
- [ ] 定期更新依赖
- [ ] 限制容器权限
- [ ] 启用健康检查

## 备份策略

### 1. 数据备份

- [ ] 数据库定期备份
- [ ] 日志定期归档
- [ ] 配置文件备份
- [ ] 备份存储到安全位置

### 2. 恢复测试

- [ ] 定期测试恢复流程
- [ ] 验证备份完整性
- [ ] 记录恢复时间
- [ ] 更新恢复文档

## 性能优化

### 1. 资源配置

- [ ] CPU 限制合理
- [ ] 内存限制合理
- [ ] 磁盘 I/O 优化
- [ ] 网络带宽充足

### 2. 应用优化

- [ ] 爬虫间隔合理
- [ ] 批量操作优化
- [ ] 数据库索引优化
- [ ] 日志轮转配置

## 文档更新

- [ ] 部署文档已更新
- [ ] 配置说明已完善
- [ ] 故障处理文档已更新
- [ ] 联系方式已记录

## 团队培训

- [ ] 部署流程已培训
- [ ] 监控方法已培训
- [ ] 故障处理已培训
- [ ] 应急预案已制定

## 上线确认

### 最终检查

- [ ] 所有测试通过
- [ ] 文档完整
- [ ] 团队已培训
- [ ] 监控已配置
- [ ] 备份已设置
- [ ] 应急预案已准备

### 上线批准

- [ ] 技术负责人批准
- [ ] 运维负责人批准
- [ ] 项目负责人批准

### 上线时间

- 计划上线时间：__________
- 实际上线时间：__________
- 上线负责人：__________

## 上线后验证

- [ ] 容器运行正常
- [ ] 定时任务执行正常
- [ ] Telegram 通知正常
- [ ] 数据爬取正常
- [ ] 预测功能正常
- [ ] 监控告警正常

## 签字确认

| 角色 | 姓名 | 签字 | 日期 |
|------|------|------|------|
| 开发 |      |      |      |
| 测试 |      |      |      |
| 运维 |      |      |      |
| 项目经理 |      |      |      |

---

**部署完成日期**: __________

**部署状态**: ☐ 成功  ☐ 失败  ☐ 部分成功

**备注**: 
