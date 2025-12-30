"""
均衡策略
追求号码分布的均衡性
"""

from .base import BaseStrategy
from typing import List, Dict
import random


class BalancedStrategy(BaseStrategy):
    """均衡策略：追求号码分布均衡"""
    
    def __init__(self):
        super().__init__(
            name='均衡策略',
            description='追求号码分布均衡，大小号、奇偶号均衡'
        )
    
    def generate_front_balls(self, context: Dict) -> List[int]:
        """生成前区号码
        
        Args:
            context: 包含 front_frequency 的上下文
            
        Returns:
            5个前区号码
        """
        front_frequency = context.get('front_frequency', {})
        
        # 将号码分为小号(1-17)、大号(18-35)
        small_balls = list(range(1, 18))
        large_balls = list(range(18, 36))
        
        # 选择 2-3 个小号，2-3 个大号
        small_count = random.choice([2, 3])
        large_count = 5 - small_count
        
        # 如果有频率数据，优先选择中频号码
        if front_frequency:
            # 获取中频号码（排名 10-25）
            sorted_balls = sorted(front_frequency.keys(), key=lambda x: front_frequency[x], reverse=True)
            mid_freq_balls = sorted_balls[10:25] if len(sorted_balls) > 25 else sorted_balls[5:]
            
            # 从中频号码中筛选小号和大号
            mid_small = [b for b in mid_freq_balls if b in small_balls]
            mid_large = [b for b in mid_freq_balls if b in large_balls]
            
            # 如果中频号码不够，补充随机号码
            if len(mid_small) < small_count:
                mid_small = small_balls
            if len(mid_large) < large_count:
                mid_large = large_balls
            
            selected_small = self.random_select(mid_small, small_count)
            selected_large = self.random_select(mid_large, large_count)
        else:
            selected_small = self.random_select(small_balls, small_count)
            selected_large = self.random_select(large_balls, large_count)
        
        balls = selected_small + selected_large
        
        # 验证组合有效性
        if not self.is_valid_front_combination(balls):
            return self.generate_front_balls(context)
        
        return sorted(balls)
    
    def generate_back_balls(self, context: Dict) -> List[int]:
        """生成后区号码（基于三种弱周期理论）
        
        Args:
            context: 包含 back_frequency 和 history_data 的上下文
            
        Returns:
            2个后区号码
        """
        from .back_helper import smart_back_selection
        return smart_back_selection(context, self.BACK_RANGE, 2)
