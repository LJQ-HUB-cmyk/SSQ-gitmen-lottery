#!/bin/bash
set -e

LOTTERY_TYPE=${LOTTERY_TYPE:-ssq}
CRON_HOUR=${CRON_HOUR:-22}

echo "=========================================="
echo "彩票预测系统 Docker 容器启动"
echo "彩票类型: $LOTTERY_TYPE"
echo "=========================================="

# 检查环境变量
if [ -z "$MYSQL_HOST" ]; then
    echo "错误: MYSQL_HOST 未设置"
    exit 1
fi

if [ -z "$MYSQL_USER" ]; then
    echo "错误: MYSQL_USER 未设置"
    exit 1
fi

if [ -z "$MYSQL_PASSWORD" ]; then
    echo "错误: MYSQL_PASSWORD 未设置"
    exit 1
fi

if [ -z "$MYSQL_DATABASE" ]; then
    echo "错误: MYSQL_DATABASE 未设置"
    exit 1
fi

echo "✓ 环境变量检查通过"

# 测试数据库连接
echo "测试数据库连接..."
python -c "
from core.base_database import BaseDatabase
from core.utils import load_db_config
try:
    db = BaseDatabase(load_db_config())
    db.connect()
    db.close()
    print('✓ 数据库连接成功')
except Exception as e:
    print(f'✗ 数据库连接失败: {e}')
    exit(1)
"

# 测试 Telegram 连接（可选）
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    echo "测试 Telegram 连接..."
    python -c "
from core.telegram_bot import TelegramBot
try:
    bot = TelegramBot()
    if bot.test_connection():
        print('✓ Telegram 连接成功')
    else:
        print('⚠ Telegram 连接失败，但继续运行')
except Exception as e:
    print(f'⚠ Telegram 测试失败: {e}')
"
else
    echo "⚠ Telegram 未配置，跳过测试"
fi

# 初始化数据库（仅双色球，其他彩票类型待实现）
if [ "$LOTTERY_TYPE" = "ssq" ]; then
    echo "初始化双色球数据库..."
    python scripts/init_database.py

    if [ $? -eq 0 ]; then
        echo "✓ 数据库初始化完成"
    else
        echo "✗ 数据库初始化失败"
        exit 1
    fi
else
    echo "⚠ $LOTTERY_TYPE 初始化脚本未实现，跳过初始化"
fi

# 生成 cron 配置
echo "配置定时任务..."
sed "s/{{CRON_HOUR}}/$CRON_HOUR/g; s/{{LOTTERY_TYPE}}/$LOTTERY_TYPE/g" \
    /etc/cron.d/lottery-cron.template > /etc/cron.d/lottery-cron

chmod 0644 /etc/cron.d/lottery-cron
crontab /etc/cron.d/lottery-cron

# 启动 cron 服务
echo "启动定时任务..."
service cron start

# 显示 cron 任务
echo "定时任务列表:"
crontab -l

echo "=========================================="
echo "容器启动完成，定时任务已激活"
echo "彩票类型: $LOTTERY_TYPE"
echo "执行时间: 每天 ${CRON_HOUR}:00 (北京时间)"
echo "=========================================="

# 保持容器运行
if [ "$1" = "cron" ]; then
    # 创建日志文件
    touch /var/log/cron.log
    # 输出 cron 日志
    tail -f /var/log/cron.log
else
    exec "$@"
fi
