"""
冷热号策略
结合冷号和热号
"""

from .base import BaseStrategy
from typing import List, Dict
import random


class ColdHotStrategy(BaseStrategy):
    """冷热号策略：3个热号 + 2个温号 + 1个冷号"""
    
    def __init__(self):
        super().__init__(
            name='冷热号策略',
            description='结合热号、温号、冷号，追求冷热平衡'
        )
    
    def generate_red_balls(self, context: Dict) -> List[int]:
        """生成红球组合
        
        Args:
            context: 包含 red_frequency 的上下文
            
        Returns:
            6个红球号码
        """
        red_frequency = context.get('red_frequency', {})
        
        if not red_frequency:
            # 如果没有频率数据，使用随机策略
            return sorted(self.random_select(self.RED_RANGE, 6))
        
        # 按频率排序
        sorted_balls = sorted(red_frequency.keys(), key=lambda x: red_frequency[x], reverse=True)
        
        # 热号：前10个高频号码
        hot_balls = sorted_balls[:10]
        
        # 温号：中间13个号码
        warm_balls = sorted_balls[10:23] if len(sorted_balls) > 23 else sorted_balls[10:]
        
        # 冷号：后10个低频号码
        cold_balls = sorted_balls[23:] if len(sorted_balls) > 23 else []
        
        balls = []
        
        # 选择 3 个热号
        balls.extend(self.random_select(hot_balls, 3))
        
        # 选择 2 个温号
        if warm_balls:
            balls.extend(self.random_select(warm_balls, 2))
        else:
            balls.extend(self.random_select(hot_balls, 2))
        
        # 选择 1 个冷号
        if cold_balls:
            balls.extend(self.random_select(cold_balls, 1))
        else:
            remaining = [b for b in self.RED_RANGE if b not in balls]
            balls.extend(self.random_select(remaining, 1))
        
        # 验证组合有效性
        if not self.is_valid_red_combination(balls):
            return self.generate_red_balls(context)
        
        return sorted(balls)
    
    def generate_blue_ball(self, context: Dict) -> int:
        """生成蓝球
        
        Args:
            context: 包含 blue_frequency 的上下文
            
        Returns:
            蓝球号码
        """
        blue_frequency = context.get('blue_frequency', {})
        
        if not blue_frequency:
            return random.choice(self.BLUE_RANGE)
        
        # 按频率排序
        sorted_blue = sorted(blue_frequency.keys(), key=lambda x: blue_frequency[x], reverse=True)
        
        # 60% 热号，30% 温号，10% 冷号
        rand = random.random()
        
        if rand < 0.6:
            # 热号（前5个）
            hot_blue = sorted_blue[:5]
            return random.choice(hot_blue)
        elif rand < 0.9:
            # 温号（中间6个）
            warm_blue = sorted_blue[5:11] if len(sorted_blue) > 11 else sorted_blue[5:]
            return random.choice(warm_blue) if warm_blue else random.choice(sorted_blue[:5])
        else:
            # 冷号（后5个）
            cold_blue = sorted_blue[11:] if len(sorted_blue) > 11 else []
            return random.choice(cold_blue) if cold_blue else random.choice(self.BLUE_RANGE)
