#!/usr/bin/env python3
"""
Python 版本配置脚本
用于设置默认预测策略和条数
"""

import os
import sys
import argparse


def update_env_file(strategies, count):
    """更新 .env 文件"""
    env_file = '.env'
    env_example_file = '.env.example'
    
    # 读取现有配置
    config_lines = []
    
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            config_lines = f.readlines()
    elif os.path.exists(env_example_file):
        with open(env_example_file, 'r', encoding='utf-8') as f:
            config_lines = f.readlines()
    
    # 更新配置
    updated_lines = []
    strategies_updated = False
    count_updated = False
    
    for line in config_lines:
        if line.startswith('DEFAULT_STRATEGIES='):
            updated_lines.append(f'DEFAULT_STRATEGIES={strategies}\n')
            strategies_updated = True
        elif line.startswith('DEFAULT_PREDICTION_COUNT='):
            updated_lines.append(f'DEFAULT_PREDICTION_COUNT={count}\n')
            count_updated = True
        else:
            updated_lines.append(line)
    
    # 如果没有找到配置项，添加新的
    if not strategies_updated or not count_updated:
        if not any('预测策略配置' in line for line in updated_lines):
            updated_lines.append('\n## 预测策略配置\n')
        
        if not strategies_updated:
            updated_lines.append(f'DEFAULT_STRATEGIES={strategies}\n')
        
        if not count_updated:
            updated_lines.append(f'DEFAULT_PREDICTION_COUNT={count}\n')
    
    # 写入文件
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)
    
    print(f"✅ 已更新 {env_file}")


def validate_strategies(strategies_str):
    """验证策略名称"""
    valid_strategies = ['frequency', 'random', 'balanced', 'coldHot']
    strategies = [s.strip() for s in strategies_str.split(',')]
    
    for strategy in strategies:
        if strategy not in valid_strategies:
            raise ValueError(f"无效的策略名称: {strategy}。可用策略: {', '.join(valid_strategies)}")
    
    return strategies


def calculate_distribution(strategies, count):
    """计算策略分配"""
    strategy_count = len(strategies)
    per_strategy = count // strategy_count
    remainder = count % strategy_count
    
    distribution = []
    for i, strategy in enumerate(strategies):
        strategy_count_val = per_strategy + (1 if i < remainder else 0)
        distribution.append((strategy, strategy_count_val))
    
    return distribution


def main():
    parser = argparse.ArgumentParser(
        description='设置 Python 版本的默认预测策略和条数',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s frequency 5                    # 单个策略，5条
  %(prog)s frequency,balanced 10          # 两个策略，10条
  %(prog)s frequency,balanced,coldHot 15  # 三个策略，15条

可用策略:
  frequency  - 频率策略（基于历史高频号码）
  random     - 随机策略（完全随机）
  balanced   - 均衡策略（追求号码分布均衡）
  coldHot    - 冷热号策略（结合冷热号）

建议:
  - 使用策略数的倍数作为预测条数，确保均匀分配
  - 1个策略: 任意条数
  - 2个策略: 偶数（如 10, 20）
  - 3个策略: 3的倍数（如 9, 15, 30）
  - 4个策略: 4的倍数（如 12, 20, 40）
        """
    )
    
    parser.add_argument('strategies', help='策略列表（逗号分隔）')
    parser.add_argument('count', type=int, nargs='?', default=5, help='预测条数（默认5）')
    
    args = parser.parse_args()
    
    try:
        # 验证策略
        strategies = validate_strategies(args.strategies)
        count = args.count
        
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("🎯 设置 Python 版本预测配置")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"策略: {args.strategies}")
        print(f"条数: {count}")
        print()
        
        # 计算分配
        distribution = calculate_distribution(strategies, count)
        
        print("💡 分配预览:")
        print(f"   策略数量: {len(strategies)}")
        for strategy, strategy_count in distribution:
            print(f"   {strategy}: {strategy_count} 条")
        print()
        
        # 更新配置
        update_env_file(args.strategies, count)
        
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("✅ 配置完成")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print()
        print("📌 下一步:")
        print("   1. 测试预测: python lottery.py predict ssq")
        print("   2. 执行任务: python scripts/daily_task.py")
        print()
        print("💡 提示:")
        print(f"   - 默认策略: {args.strategies}")
        print(f"   - 默认条数: {count}")
        print("   - 可以通过环境变量覆盖配置")
        print()
        
    except ValueError as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 配置失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
