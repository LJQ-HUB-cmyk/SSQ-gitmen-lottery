#!/bin/bash

# 测试多策略预测
# 用途：验证多个策略是否都参与预测

set -e

# 加载环境变量
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ 错误: .env 文件不存在"
  exit 1
fi

# 检查必需的环境变量
if [ -z "$WORKER_URL" ]; then
  echo "❌ 错误: 缺少必需的环境变量 WORKER_URL"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试多策略预测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试1: 单个策略
echo "📊 测试1: 单个策略（frequency）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s "${WORKER_URL}/predict?count=3&strategies=frequency")
echo "$response" | jq -r '.[] | "  \(.rank). 策略: \(.strategy_name) | 红球: \(.red_balls | join(",")) | 蓝球: \(.blue_ball)"'
echo ""

# 测试2: 两个策略
echo "📊 测试2: 两个策略（frequency,balanced）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s "${WORKER_URL}/predict?count=6&strategies=frequency,balanced")
echo "$response" | jq -r '.[] | "  \(.rank). 策略: \(.strategy_name) | 红球: \(.red_balls | join(",")) | 蓝球: \(.blue_ball)"'

# 统计策略分布
echo ""
echo "策略分布统计:"
echo "$response" | jq -r 'group_by(.strategy) | .[] | "  \(.[0].strategy_name): \(length) 个"'
echo ""

# 测试3: 三个策略
echo "📊 测试3: 三个策略（frequency,balanced,coldHot）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s "${WORKER_URL}/predict?count=9&strategies=frequency,balanced,coldHot")
echo "$response" | jq -r '.[] | "  \(.rank). 策略: \(.strategy_name) | 红球: \(.red_balls | join(",")) | 蓝球: \(.blue_ball)"'

# 统计策略分布
echo ""
echo "策略分布统计:"
echo "$response" | jq -r 'group_by(.strategy) | .[] | "  \(.[0].strategy_name): \(length) 个"'
echo ""

# 测试4: 所有策略
echo "📊 测试4: 所有策略（frequency,random,balanced,coldHot）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s "${WORKER_URL}/predict?count=12&strategies=frequency,random,balanced,coldHot")
echo "$response" | jq -r '.[] | "  \(.rank). 策略: \(.strategy_name) | 红球: \(.red_balls | join(",")) | 蓝球: \(.blue_ball)"'

# 统计策略分布
echo ""
echo "策略分布统计:"
echo "$response" | jq -r 'group_by(.strategy) | .[] | "  \(.[0].strategy_name): \(length) 个"'
echo ""

# 测试5: 不均匀分配（1个组合，3个策略）
echo "📊 测试5: 不均匀分配（1个组合，3个策略）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "预期: 只会使用第一个策略"
response=$(curl -s "${WORKER_URL}/predict?count=1&strategies=frequency,balanced,coldHot")
echo "$response" | jq -r '.[] | "  \(.rank). 策略: \(.strategy_name) | 红球: \(.red_balls | join(",")) | 蓝球: \(.blue_ball)"'
echo ""

# 测试6: 不均匀分配（5个组合，3个策略）
echo "📊 测试6: 不均匀分配（5个组合，3个策略）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "预期: 每个策略生成 Math.ceil(5/3)=2 个，总共6个，截取前5个"
response=$(curl -s "${WORKER_URL}/predict?count=5&strategies=frequency,balanced,coldHot")
echo "$response" | jq -r '.[] | "  \(.rank). 策略: \(.strategy_name) | 红球: \(.red_balls | join(",")) | 蓝球: \(.blue_ball)"'

# 统计策略分布
echo ""
echo "策略分布统计:"
echo "$response" | jq -r 'group_by(.strategy) | .[] | "  \(.[0].strategy_name): \(length) 个"'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 说明:"
echo "   - 多个策略会依次执行，每个策略生成 Math.ceil(总数/策略数) 个组合"
echo "   - 最终结果会截取到指定数量"
echo "   - 如果总数不能被策略数整除，前面的策略会生成更多组合"
echo ""
