"""
蓝球预测辅助模块
基于三种"弱周期"理论
"""

import random
from typing import List, Dict
from collections import Counter


def smart_blue_selection(context: Dict, blue_range: List[int]) -> int:
    """智能蓝球选择（基于三种弱周期理论）
    
    Args:
        context: 包含 history_data 和 blue_frequency 的上下文
        blue_range: 蓝球范围
        
    Returns:
        蓝球号码
    """
    history_data = context.get('history_data', [])
    blue_frequency = context.get('blue_frequency', {})
    
    if not history_data or len(history_data) < 30:
        return _simple_selection(blue_frequency, blue_range)
    
    # 三层过滤
    candidates = _get_mean_reversion_candidates(history_data, blue_frequency, blue_range)
    candidates = _apply_avoidance_filter(candidates, history_data)
    candidates = _apply_zone_preference(candidates, history_data)
    
    if candidates:
        return random.choice(candidates)
    else:
        return _simple_selection(blue_frequency, blue_range)


def _simple_selection(blue_frequency: Dict, blue_range: List[int]) -> int:
    """简单选择"""
    if blue_frequency:
        top_blue = sorted(blue_frequency.keys(), key=lambda x: blue_frequency[x], reverse=True)[:5]
        return random.choice(top_blue)
    else:
        return random.choice(blue_range)


def _get_mean_reversion_candidates(
    history_data: List[Dict], 
    blue_frequency: Dict,
    blue_range: List[int]
) -> List[int]:
    """均值回归候选"""
    total_count = len(history_data)
    avg_frequency = total_count / 16
    
    recent_30 = history_data[-30:]
    recent_frequency = Counter(d['blue_ball'] for d in recent_30)
    recent_avg = len(recent_30) / 16
    
    candidates = []
    
    for ball in blue_range:
        long_term_freq = blue_frequency.get(ball, 0)
        recent_freq = recent_frequency.get(ball, 0)
        
        if long_term_freq > avg_frequency * 1.1 and recent_freq < recent_avg * 0.7:
            candidates.append(ball)
        elif avg_frequency * 0.8 <= long_term_freq <= avg_frequency * 1.2:
            if recent_avg * 0.5 <= recent_freq <= recent_avg * 1.5:
                candidates.append(ball)
    
    if len(candidates) < 3:
        for ball in blue_range:
            if blue_frequency.get(ball, 0) >= avg_frequency * 0.8:
                candidates.append(ball)
    
    return list(set(candidates))


def _apply_avoidance_filter(candidates: List[int], history_data: List[Dict]) -> List[int]:
    """回避型准周期过滤"""
    if not candidates:
        return candidates
    
    recent_blues = [d['blue_ball'] for d in history_data[-3:]]
    
    # 排除最近1期
    if recent_blues:
        filtered = [b for b in candidates if b != recent_blues[-1]]
        if filtered:
            candidates = filtered
    
    # 降低最近2-3期权重
    if len(recent_blues) >= 2:
        recent_2_3 = recent_blues[-3:-1]
        weighted = []
        for ball in candidates:
            if ball not in recent_2_3:
                weighted.extend([ball, ball])
            else:
                weighted.append(ball)
        return weighted
    
    return candidates


def _apply_zone_preference(candidates: List[int], history_data: List[Dict]) -> List[int]:
    """区间偏移分析"""
    if not candidates:
        return candidates
    
    recent_40 = history_data[-40:] if len(history_data) >= 40 else history_data[-20:]
    
    zone_count = {'low': 0, 'mid': 0, 'high': 0}
    for d in recent_40:
        ball = d['blue_ball']
        if ball <= 6:
            zone_count['low'] += 1
        elif ball <= 11:
            zone_count['mid'] += 1
        else:
            zone_count['high'] += 1
    
    total = len(recent_40)
    expected = total / 3
    
    zone_deviation = {zone: (count - expected) / expected for zone, count in zone_count.items()}
    
    weighted = []
    for ball in candidates:
        if ball <= 6:
            ball_zone = 'low'
        elif ball <= 11:
            ball_zone = 'mid'
        else:
            ball_zone = 'high'
        
        deviation = zone_deviation[ball_zone]
        
        if deviation > 0.2:
            weighted.append(ball)
        elif deviation < -0.2:
            weighted.extend([ball, ball, ball])
        else:
            weighted.extend([ball, ball])
    
    return weighted if weighted else candidates
