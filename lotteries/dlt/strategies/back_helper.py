"""
大乐透后区预测辅助模块
基于三种"弱周期"理论（改编自双色球蓝球算法）
"""

import random
from typing import List, Dict
from collections import Counter


def smart_back_selection(context: Dict, back_range: List[int], count: int = 2) -> List[int]:
    """智能后区选择（基于三种弱周期理论）
    
    Args:
        context: 包含 history_data 和 back_frequency 的上下文
        back_range: 后区范围
        count: 需要选择的后区号码数量（默认2个）
        
    Returns:
        后区号码列表（已排序）
    """
    history_data = context.get('history_data', [])
    back_frequency = context.get('back_frequency', {})
    
    if not history_data or len(history_data) < 30:
        return _simple_selection(back_frequency, back_range, count)
    
    # 三层过滤
    candidates = _get_mean_reversion_candidates(history_data, back_frequency, back_range)
    candidates = _apply_avoidance_filter(candidates, history_data)
    candidates = _apply_zone_preference(candidates, history_data)
    
    # 去重候选列表
    unique_candidates = list(set(candidates))
    
    if len(unique_candidates) >= count:
        selected = random.sample(unique_candidates, count)
        return sorted(selected)
    else:
        return _simple_selection(back_frequency, back_range, count)


def _simple_selection(back_frequency: Dict, back_range: List[int], count: int) -> List[int]:
    """简单选择"""
    if back_frequency:
        top_back = sorted(back_frequency.keys(), key=lambda x: back_frequency[x], reverse=True)[:6]
        return sorted(random.sample(top_back, min(count, len(top_back))))
    else:
        return sorted(random.sample(back_range, count))


def _get_mean_reversion_candidates(
    history_data: List[Dict], 
    back_frequency: Dict,
    back_range: List[int]
) -> List[int]:
    """均值回归候选"""
    total_count = len(history_data)
    avg_frequency = total_count * 2 / 12  # 后区每期选2个，共12个号码
    
    recent_30 = history_data[-30:]
    recent_frequency = Counter()
    for d in recent_30:
        for ball in d.get('back_balls', []):
            # 确保转换为整数
            ball_int = int(ball) if isinstance(ball, str) else ball
            recent_frequency[ball_int] += 1
    recent_avg = len(recent_30) * 2 / 12
    
    candidates = []
    
    for ball in back_range:
        long_term_freq = back_frequency.get(ball, 0)
        recent_freq = recent_frequency.get(ball, 0)
        
        # 长期高频但短期过冷
        if long_term_freq > avg_frequency * 1.1 and recent_freq < recent_avg * 0.7:
            candidates.append(ball)
        # 长期均衡且短期均衡
        elif avg_frequency * 0.8 <= long_term_freq <= avg_frequency * 1.2:
            if recent_avg * 0.5 <= recent_freq <= recent_avg * 1.5:
                candidates.append(ball)
    
    # 如果候选太少，放宽条件
    if len(candidates) < 4:
        for ball in back_range:
            if back_frequency.get(ball, 0) >= avg_frequency * 0.8:
                candidates.append(ball)
    
    return list(set(candidates))


def _apply_avoidance_filter(candidates: List[int], history_data: List[Dict]) -> List[int]:
    """回避型准周期过滤"""
    if not candidates:
        return candidates
    
    # 获取最近3期的后区号码（转换为整数）
    recent_backs = []
    for d in history_data[-3:]:
        for ball in d.get('back_balls', []):
            ball_int = int(ball) if isinstance(ball, str) else ball
            recent_backs.append(ball_int)
    
    # 排除最近1期的号码
    if len(recent_backs) >= 2:
        last_period = []
        for ball in history_data[-1].get('back_balls', []):
            ball_int = int(ball) if isinstance(ball, str) else ball
            last_period.append(ball_int)
        
        filtered = [b for b in candidates if b not in last_period]
        if len(filtered) >= 2:
            candidates = filtered
    
    # 降低最近2-3期的权重
    if len(history_data) >= 3:
        recent_2_3 = []
        for d in history_data[-3:-1]:
            for ball in d.get('back_balls', []):
                ball_int = int(ball) if isinstance(ball, str) else ball
                recent_2_3.append(ball_int)
        
        weighted = []
        for ball in candidates:
            if ball not in recent_2_3:
                weighted.extend([ball, ball])  # 双倍权重
            else:
                weighted.append(ball)
        return weighted if weighted else candidates
    
    return candidates


def _apply_zone_preference(candidates: List[int], history_data: List[Dict]) -> List[int]:
    """区间偏移分析（后区分为3个区间：1-4, 5-8, 9-12）"""
    if not candidates:
        return candidates
    
    recent_40 = history_data[-40:] if len(history_data) >= 40 else history_data[-20:]
    
    zone_count = {'low': 0, 'mid': 0, 'high': 0}
    for d in recent_40:
        for ball in d.get('back_balls', []):
            # 确保转换为整数
            ball_int = int(ball) if isinstance(ball, str) else ball
            if ball_int <= 4:
                zone_count['low'] += 1
            elif ball_int <= 8:
                zone_count['mid'] += 1
            else:
                zone_count['high'] += 1
    
    total = len(recent_40) * 2  # 每期2个后区号码
    expected = total / 3
    
    zone_deviation = {zone: (count - expected) / expected for zone, count in zone_count.items()}
    
    weighted = []
    for ball in candidates:
        if ball <= 4:
            ball_zone = 'low'
        elif ball <= 8:
            ball_zone = 'mid'
        else:
            ball_zone = 'high'
        
        deviation = zone_deviation[ball_zone]
        
        # 过热区间降低权重，过冷区间提高权重
        if deviation > 0.2:
            weighted.append(ball)
        elif deviation < -0.2:
            weighted.extend([ball, ball, ball])  # 三倍权重
        else:
            weighted.extend([ball, ball])  # 双倍权重
    
    return weighted if weighted else candidates
