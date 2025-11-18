#!/bin/bash

# 设置默认预测策略和预测条数
# 用途：配置 Worker 的默认预测策略和条数

set -e

# 显示使用说明
show_usage() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎯 设置默认预测策略和条数"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "用法: $0 <策略列表> [预测条数]"
  echo ""
  echo "可用策略:"
  echo "  frequency  - 频率策略（基于历史高频号码）"
  echo "  random     - 随机策略（完全随机）"
  echo "  balanced   - 均衡策略（追求号码分布均衡）"
  echo "  coldHot    - 冷热号策略（结合冷热号）"
  echo ""
  echo "示例:"
  echo "  $0 frequency                      # 单个策略，默认5条"
  echo "  $0 frequency 10                   # 单个策略，10条"
  echo "  $0 frequency,balanced 10          # 两个策略，10条"
  echo "  $0 frequency,balanced,coldHot 15  # 三个策略，15条（每个5条）"
  echo ""
  echo "💡 建议:"
  echo "  - 使用策略数的倍数作为预测条数，确保均匀分配"
  echo "  - 1个策略: 任意条数"
  echo "  - 2个策略: 偶数（如 10, 20）"
  echo "  - 3个策略: 3的倍数（如 9, 15, 30）"
  echo "  - 4个策略: 4的倍数（如 12, 20, 40）"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
}

# 检查参数
if [ $# -eq 0 ]; then
  show_usage
fi

STRATEGIES="$1"
COUNT="${2:-5}"  # 默认5条

# 验证策略名称
VALID_STRATEGIES="frequency random balanced coldHot"
IFS=',' read -ra STRATEGY_ARRAY <<< "$STRATEGIES"

for strategy in "${STRATEGY_ARRAY[@]}"; do
  strategy=$(echo "$strategy" | xargs) # 去除空格
  if [[ ! " $VALID_STRATEGIES " =~ " $strategy " ]]; then
    echo "❌ 错误: 无效的策略名称 '$strategy'"
    echo ""
    show_usage
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 设置默认预测策略和条数"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "策略: $STRATEGIES"
echo "条数: $COUNT"
echo ""

# 计算策略数量
IFS=',' read -ra STRATEGY_ARRAY <<< "$STRATEGIES"
STRATEGY_COUNT=${#STRATEGY_ARRAY[@]}

# 计算每个策略的分配
PER_STRATEGY=$(awk "BEGIN {print int(($COUNT + $STRATEGY_COUNT - 1) / $STRATEGY_COUNT)}")

echo "💡 分配预览:"
echo "   策略数量: $STRATEGY_COUNT"
echo "   每个策略: 约 $PER_STRATEGY 条"
echo ""

# 方法1: 更新 wrangler.toml
echo "📝 步骤1: 更新 wrangler.toml"
if [ -f wrangler.toml ]; then
  # 更新策略配置
  if grep -q "DEFAULT_STRATEGIES" wrangler.toml; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/DEFAULT_STRATEGIES = .*/DEFAULT_STRATEGIES = \"$STRATEGIES\"/" wrangler.toml
    else
      sed -i "s/DEFAULT_STRATEGIES = .*/DEFAULT_STRATEGIES = \"$STRATEGIES\"/" wrangler.toml
    fi
    echo "   ✅ 已更新策略配置"
  else
    echo "DEFAULT_STRATEGIES = \"$STRATEGIES\"" >> wrangler.toml
    echo "   ✅ 已添加策略配置"
  fi
  
  # 更新条数配置
  if grep -q "DEFAULT_PREDICTION_COUNT" wrangler.toml; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/DEFAULT_PREDICTION_COUNT = .*/DEFAULT_PREDICTION_COUNT = \"$COUNT\"/" wrangler.toml
    else
      sed -i "s/DEFAULT_PREDICTION_COUNT = .*/DEFAULT_PREDICTION_COUNT = \"$COUNT\"/" wrangler.toml
    fi
    echo "   ✅ 已更新条数配置"
  else
    echo "DEFAULT_PREDICTION_COUNT = \"$COUNT\"" >> wrangler.toml
    echo "   ✅ 已添加条数配置"
  fi
else
  echo "   ⚠️  未找到 wrangler.toml"
fi

echo ""

# 方法2: 更新 KV 存储
echo "📝 步骤2: 更新 KV 存储"
if command -v wrangler &> /dev/null; then
  wrangler kv:key put --binding=KV_BINDING "DEFAULT_STRATEGIES" "$STRATEGIES" 2>/dev/null && \
    echo "   ✅ 已更新策略配置" || \
    echo "   ⚠️  策略配置更新失败"
  
  wrangler kv:key put --binding=KV_BINDING "DEFAULT_PREDICTION_COUNT" "$COUNT" 2>/dev/null && \
    echo "   ✅ 已更新条数配置" || \
    echo "   ⚠️  条数配置更新失败"
else
  echo "   ⚠️  未安装 wrangler CLI（可能需要先登录: wrangler login）"
fi

echo ""

# 方法3: 更新 .env 文件
echo "📝 步骤3: 更新 .env 文件"
if [ -f .env ]; then
  # 更新策略配置
  if grep -q "DEFAULT_STRATEGIES" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/DEFAULT_STRATEGIES=.*/DEFAULT_STRATEGIES=$STRATEGIES/" .env
    else
      sed -i "s/DEFAULT_STRATEGIES=.*/DEFAULT_STRATEGIES=$STRATEGIES/" .env
    fi
    echo "   ✅ 已更新策略配置"
  else
    echo "" >> .env
    echo "# 预测策略配置" >> .env
    echo "DEFAULT_STRATEGIES=$STRATEGIES" >> .env
    echo "   ✅ 已添加策略配置"
  fi
  
  # 更新条数配置
  if grep -q "DEFAULT_PREDICTION_COUNT" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/DEFAULT_PREDICTION_COUNT=.*/DEFAULT_PREDICTION_COUNT=$COUNT/" .env
    else
      sed -i "s/DEFAULT_PREDICTION_COUNT=.*/DEFAULT_PREDICTION_COUNT=$COUNT/" .env
    fi
    echo "   ✅ 已更新条数配置"
  else
    echo "DEFAULT_PREDICTION_COUNT=$COUNT" >> .env
    echo "   ✅ 已添加条数配置"
  fi
else
  echo "   ⚠️  未找到 .env 文件"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 配置完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 下一步:"
echo "   1. 重新部署 Worker: wrangler publish"
echo "   2. 测试预测接口（使用默认配置）: curl \"\${WORKER_URL}/predict\""
echo "   3. 或指定参数: curl \"\${WORKER_URL}/predict?count=10&strategies=random\""
echo ""
echo "💡 提示:"
echo "   - 不带参数时使用默认配置: 策略=$STRATEGIES, 条数=$COUNT"
echo "   - API 请求参数可以覆盖默认配置"
echo "   - 建议条数为策略数的倍数，确保均匀分配"
echo ""
