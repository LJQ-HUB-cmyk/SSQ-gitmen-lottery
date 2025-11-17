#!/bin/bash

# 彩票预测系统 - 多容器部署脚本

set -e

echo "=========================================="
echo "彩票预测系统 - Docker 多容器部署"
echo "=========================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✓ Docker 已安装"

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose"
    exit 1
fi

echo "✓ Docker Compose 已安装"

# 检查 .env 文件
if [ ! -f ../.env ]; then
    echo "创建 .env 文件..."
    cp ../.env.example ../.env
    echo ""
    echo "⚠️  请编辑 .env 文件，填入以下配置："
    echo "   - 数据库连接信息"
    echo "   - Telegram Bot Token"
    echo "   - Telegram Chat ID"
    echo ""
    echo "编辑完成后，再次运行此脚本"
    exit 0
fi

echo "✓ .env 文件存在"

# 选择 Dockerfile
echo ""
echo "选择 Dockerfile 版本："
echo "1) 默认版本（推荐海外服务器）"
echo "2) 国内镜像源版本（推荐国内服务器）"
echo "3) 最小化版本（网络受限环境）"
echo ""
read -p "请选择 [1-3]: " dockerfile_choice

case $dockerfile_choice in
    2)
        echo "使用国内镜像源版本..."
        cp docker/Dockerfile.cn docker/Dockerfile
        ;;
    3)
        echo "使用最小化版本..."
        cp docker/Dockerfile.minimal docker/Dockerfile
        ;;
    *)
        echo "使用默认版本..."
        # 确保使用原始 Dockerfile
        if [ -f docker/Dockerfile.original ]; then
            cp docker/Dockerfile.original docker/Dockerfile
        fi
        ;;
esac

# 检查必要的环境变量
source ../.env

if [ -z "$MYSQL_HOST" ] || [ -z "$MYSQL_USER" ] || [ -z "$MYSQL_PASSWORD" ] || [ -z "$MYSQL_DATABASE" ]; then
    echo "错误: 数据库配置不完整"
    echo "请检查 .env 文件中的以下变量："
    echo "  - MYSQL_HOST"
    echo "  - MYSQL_USER"
    echo "  - MYSQL_PASSWORD"
    echo "  - MYSQL_DATABASE"
    exit 1
fi

echo "✓ 数据库配置完整"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "⚠️  Telegram 配置未设置，将无法接收通知"
    echo "如需启用通知，请在 .env 中设置："
    echo "  - TELEGRAM_BOT_TOKEN"
    echo "  - TELEGRAM_CHAT_ID"
    echo ""
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo "✓ Telegram 配置完整"
fi

# 创建必要的目录
echo "创建目录..."
mkdir -p ../logs/ssq ../logs/dlt ../logs/ks3 ../data/backup ../data/export
echo "✓ 目录创建完成"

# 选择要部署的彩票类型
echo ""
echo "请选择要部署的彩票类型："
echo "1) 仅双色球 (推荐)"
echo "2) 双色球 + 大乐透"
echo "3) 双色球 + 快开3"
echo "4) 全部彩票类型"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        SERVICES="lottery-ssq"
        echo "将部署: 双色球"
        ;;
    2)
        SERVICES="lottery-ssq lottery-dlt"
        echo "将部署: 双色球 + 大乐透"
        ;;
    3)
        SERVICES="lottery-ssq lottery-ks3"
        echo "将部署: 双色球 + 快开3"
        ;;
    4)
        SERVICES="lottery-ssq lottery-dlt lottery-ks3"
        echo "将部署: 全部彩票类型"
        ;;
    *)
        echo "无效选项，默认部署双色球"
        SERVICES="lottery-ssq"
        ;;
esac

# 构建镜像
echo ""
echo "构建 Docker 镜像..."
docker-compose build $SERVICES

if [ $? -eq 0 ]; then
    echo "✓ 镜像构建成功"
else
    echo "✗ 镜像构建失败"
    exit 1
fi

# 启动容器
echo ""
echo "启动容器..."
docker-compose up -d $SERVICES

if [ $? -eq 0 ]; then
    echo "✓ 容器启动成功"
else
    echo "✗ 容器启动失败"
    exit 1
fi

# 等待容器启动
echo ""
echo "等待容器初始化..."
sleep 5

# 检查容器状态
echo ""
echo "容器状态:"
docker-compose ps

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "已部署的容器:"
for service in $SERVICES; do
    echo "  - $service"
done
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  进入容器: docker-compose exec lottery-ssq bash"
echo "  停止容器: docker-compose stop"
echo "  重启容器: docker-compose restart"
echo ""
echo "=========================================="
