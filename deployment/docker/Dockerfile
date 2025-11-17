# 使用 Python 3.12 官方镜像
FROM python:3.12-slim

# 构建参数
ARG LOTTERY_TYPE=ssq

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=Asia/Shanghai \
    LOTTERY_TYPE=${LOTTERY_TYPE} \
    DEBIAN_FRONTEND=noninteractive

# 安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        tzdata \
        cron \
        ca-certificates && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY core/ ./core/
COPY lotteries/ ./lotteries/
COPY cli/ ./cli/
COPY scripts/ ./scripts/
COPY lottery.py .

# 创建日志和数据目录
RUN mkdir -p logs/${LOTTERY_TYPE} data

# 复制启动脚本
COPY deployment/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 复制 cron 配置模板
COPY deployment/docker/crontab.template /etc/cron.d/lottery-cron.template

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

# 启动脚本
ENTRYPOINT ["/entrypoint.sh"]
CMD ["cron"]
