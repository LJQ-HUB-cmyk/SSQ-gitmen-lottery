"""
随机策略
完全随机选择号码
"""

from .base import BaseStrategy
from typing import List, Dict
import random


class RandomStrategy(BaseStrategy):
    """随机策略：纯随机，不考虑历史数据"""
    
    def __init__(self):
        super().__init__(
            name='随机策略',
            description='完全随机选择号码，不考虑历史数据'
        )
    
    def generate_red_balls(self, context: Dict) -> List[int]:
        """生成红球组合
        
        Args:
            context: 上下文（本策略不使用）
            
        Returns:
            6个红球号码
        """
        balls = self.random_select(self.RED_RANGE, 6)
        
        # 验证组合有效性
        if not self.is_valid_red_combination(balls):
            return self.generate_red_balls(context)
        
        return sorted(balls)
    
    def generate_blue_ball(self, context: Dict) -> int:
        """生成蓝球
        
        Args:
            context: 上下文（本策略不使用）
            
        Returns:
            蓝球号码
        """
        return random.choice(self.BLUE_RANGE)
