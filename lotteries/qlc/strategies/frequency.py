"""
频率策略 - 基于历史出现频率
"""

from .base import BaseStrategy
from typing import List, Dict, Tuple
import random


class FrequencyStrategy(BaseStrategy):
    """频率策略：基于历史频率选择号码"""
    
    def __init__(self):
        super().__init__(
            name='频率策略',
            description='基于历史出现频率选择号码'
        )
    
    def generate_balls(self, context: Dict) -> Tuple[List[int], int]:
        """生成基本号和特别号"""
        basic_frequency = context.get('basic_frequency', {})
        
        # 获取高频基本号
        if basic_frequency:
            top_balls = sorted(basic_frequency.keys(), key=lambda x: basic_frequency[x], reverse=True)[:15]
        else:
            top_balls = self.BASIC_RANGE
        
        # 选择7个基本号（80%高频 + 20%随机）
        high_freq_count = 5
        basic_balls = self.random_select(top_balls, high_freq_count)
        
        # 补充随机号码
        remaining = [b for b in self.BASIC_RANGE if b not in basic_balls]
        basic_balls.extend(self.random_select(remaining, self.BASIC_COUNT - high_freq_count))
        
        # 选择特别号（使用智能算法）
        from .special_helper import smart_special_selection
        available_for_special = [b for b in self.BASIC_RANGE if b not in basic_balls]
        special_ball = smart_special_selection(context, available_for_special)
        
        return sorted(basic_balls), special_ball
