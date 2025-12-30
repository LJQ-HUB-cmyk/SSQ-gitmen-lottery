"""
七乐彩特别号预测辅助模块
基于三种"弱周期"理论（改编自双色球蓝球算法）
注意：特别号的可选范围每期都不同（排除基本号后的剩余号码）
"""

import random
from typing import List, Dict
from collections import Counter


def smart_special_selection(context: Dict, available_range: List[int]) -> int:
    """智能特别号选择（基于三种弱周期理论）
    
    Args:
        context: 包含 history_data 和 special_frequency 的上下文
        available_range: 当前可选的特别号范围（排除了基本号）
        
    Returns:
        特别号
    """
    history_data = context.get('history_data', [])
    special_frequency = context.get('special_frequency', {})
    
    if not history_data or len(history_data) < 30 or len(available_range) < 3:
        return _simple_selection(special_frequency, available_range)
    
    # 三层过滤
    candidates = _get_mean_reversion_candidates(history_data, special_frequency, available_range)
    candidates = _apply_avoidance_filter(candidates, history_data)
    candidates = _apply_zone_preference(candidates, history_data)
    
    if candidates:
        return random.choice(candidates)
    else:
        return _simple_selection(special_frequency, available_range)


def _simple_selection(special_frequency: Dict, available_range: List[int]) -> int:
    """简单选择"""
    if special_frequency and available_range:
        # 从可选范围中筛选高频号码
        top_special = [b for b in sorted(special_frequency.keys(), 
                      key=lambda x: special_frequency[x], reverse=True)[:5]
                      if b in available_range]
        if top_special:
            return random.choice(top_special)
    
    return random.choice(available_range) if available_range else random.choice(range(1, 31))


def _get_mean_reversion_candidates(
    history_data: List[Dict], 
    special_frequency: Dict,
    available_range: List[int]
) -> List[int]:
    """均值回归候选"""
    total_count = len(history_data)
    avg_frequency = total_count / 30  # 30个号码，每期选1个特别号
    
    recent_30 = history_data[-30:]
    recent_frequency = Counter(d.get('special_ball') for d in recent_30)
    recent_avg = len(recent_30) / 30
    
    candidates = []
    
    for ball in available_range:
        long_term_freq = special_frequency.get(ball, 0)
        recent_freq = recent_frequency.get(ball, 0)
        
        # 长期高频但短期过冷
        if long_term_freq > avg_frequency * 1.1 and recent_freq < recent_avg * 0.7:
            candidates.append(ball)
        # 长期均衡且短期均衡
        elif avg_frequency * 0.8 <= long_term_freq <= avg_frequency * 1.2:
            if recent_avg * 0.5 <= recent_freq <= recent_avg * 1.5:
                candidates.append(ball)
    
    # 如果候选太少，放宽条件
    if len(candidates) < 3:
        for ball in available_range:
            if special_frequency.get(ball, 0) >= avg_frequency * 0.8:
                candidates.append(ball)
    
    return list(set(candidates))


def _apply_avoidance_filter(candidates: List[int], history_data: List[Dict]) -> List[int]:
    """回避型准周期过滤"""
    if not candidates:
        return candidates
    
    recent_specials = [d.get('special_ball') for d in history_data[-3:]]
    
    # 排除最近1期
    if recent_specials:
        filtered = [b for b in candidates if b != recent_specials[-1]]
        if filtered:
            candidates = filtered
    
    # 降低最近2-3期权重
    if len(recent_specials) >= 2:
        recent_2_3 = recent_specials[-3:-1]
        weighted = []
        for ball in candidates:
            if ball not in recent_2_3:
                weighted.extend([ball, ball])  # 双倍权重
            else:
                weighted.append(ball)
        return weighted if weighted else candidates
    
    return candidates


def _apply_zone_preference(candidates: List[int], history_data: List[Dict]) -> List[int]:
    """区间偏移分析（特别号分为3个区间：1-10, 11-20, 21-30）"""
    if not candidates:
        return candidates
    
    recent_40 = history_data[-40:] if len(history_data) >= 40 else history_data[-20:]
    
    zone_count = {'low': 0, 'mid': 0, 'high': 0}
    for d in recent_40:
        ball = d.get('special_ball')
        if ball:
            if ball <= 10:
                zone_count['low'] += 1
            elif ball <= 20:
                zone_count['mid'] += 1
            else:
                zone_count['high'] += 1
    
    total = len(recent_40)
    expected = total / 3
    
    zone_deviation = {zone: (count - expected) / expected for zone, count in zone_count.items()}
    
    weighted = []
    for ball in candidates:
        if ball <= 10:
            ball_zone = 'low'
        elif ball <= 20:
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
