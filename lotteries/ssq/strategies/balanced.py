"""
均衡策略
追求号码分布均衡
"""

from .base import BaseStrategy
from typing import List, Dict
import random


class BalancedStrategy(BaseStrategy):
    """均衡策略：将号码分为3个区间，每个区间选择2个号码"""
    
    def __init__(self):
        super().__init__(
            name='均衡策略',
            description='追求号码分布均衡，从不同区间选择号码'
        )
    
    def generate_red_balls(self, context: Dict) -> List[int]:
        """生成红球组合
        
        Args:
            context: 上下文
            
        Returns:
            6个红球号码
        """
        # 将红球分为3个区间
        # 区间1: 01-11
        # 区间2: 12-22
        # 区间3: 23-33
        zone1 = [b for b in self.RED_RANGE if b <= 11]
        zone2 = [b for b in self.RED_RANGE if 12 <= b <= 22]
        zone3 = [b for b in self.RED_RANGE if b >= 23]
        
        # 每个区间选择2个号码
        balls = []
        balls.extend(self.random_select(zone1, 2))
        balls.extend(self.random_select(zone2, 2))
        balls.extend(self.random_select(zone3, 2))
        
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
        
        # 50% 概率选择高频，50% 概率随机
        if random.random() < 0.5 and blue_frequency:
            top_blue = sorted(blue_frequency.keys(), key=lambda x: blue_frequency[x], reverse=True)[:8]
            return random.choice(top_blue)
        else:
            return random.choice(self.BLUE_RANGE)
