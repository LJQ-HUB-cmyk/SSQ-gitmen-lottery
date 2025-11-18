"""
频率策略
基于历史出现频率进行预测
"""

from .base import BaseStrategy
from typing import List, Dict


class FrequencyStrategy(BaseStrategy):
    """频率策略：70% 高频号码 + 30% 随机号码"""
    
    def __init__(self):
        super().__init__(
            name='频率策略',
            description='基于历史出现频率，选择高频号码组合'
        )
    
    def generate_red_balls(self, context: Dict) -> List[int]:
        """生成红球组合
        
        Args:
            context: 包含 red_frequency 的上下文
            
        Returns:
            6个红球号码
        """
        red_frequency = context.get('red_frequency', {})
        
        # 获取高频号码（前15个）
        top_balls = sorted(red_frequency.keys(), key=lambda x: red_frequency[x], reverse=True)[:15]
        
        # 选择 4 个高频号码
        high_freq_balls = self.random_select(top_balls, 4)
        
        # 选择 2 个随机号码（不重复）
        remaining_balls = [b for b in self.RED_RANGE if b not in high_freq_balls]
        random_balls = self.random_select(remaining_balls, 2)
        
        balls = high_freq_balls + random_balls
        
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
        import random
        
        blue_frequency = context.get('blue_frequency', {})
        
        # 80% 概率选择高频蓝球，20% 概率随机
        if random.random() < 0.8 and blue_frequency:
            top_blue = sorted(blue_frequency.keys(), key=lambda x: blue_frequency[x], reverse=True)[:5]
            return random.choice(top_blue)
        else:
            return random.choice(self.BLUE_RANGE)
