/**
 * 七乐彩特别号预测辅助模块
 * 基于三种"弱周期"理论（改编自双色球蓝球算法）
 */

/**
 * 智能特别号选择（基于三种弱周期理论）
 * @param {Array} historyData - 历史数据
 * @param {Object} specialFreq - 特别号频率统计
 * @param {Array} availableRange - 当前可选的特别号范围（排除了基本号）
 * @returns {number} 特别号
 */
export function smartSpecialSelection(historyData, specialFreq, availableRange) {
  if (!historyData || historyData.length < 30 || availableRange.length < 3) {
    return simpleSelection(specialFreq, availableRange);
  }
  
  // 三层过滤
  let candidates = getMeanReversionCandidates(historyData, specialFreq, availableRange);
  candidates = applyAvoidanceFilter(candidates, historyData);
  candidates = applyZonePreference(candidates, historyData);
  
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    return simpleSelection(specialFreq, availableRange);
  }
}

/**
 * 简单选择
 */
function simpleSelection(specialFreq, availableRange) {
  if (specialFreq && Object.keys(specialFreq).length > 0 && availableRange.length > 0) {
    const topSpecial = Object.entries(specialFreq)
      .sort(([,a], [,b]) => b - a)
      .map(([num]) => parseInt(num))
      .slice(0, 5)
      .filter(n => availableRange.includes(n));
    
    if (topSpecial.length > 0) {
      return topSpecial[Math.floor(Math.random() * topSpecial.length)];
    }
  }
  
  return availableRange.length > 0 ? 
    availableRange[Math.floor(Math.random() * availableRange.length)] :
    Math.floor(Math.random() * 30) + 1;
}

/**
 * 均值回归候选
 */
function getMeanReversionCandidates(historyData, specialFreq, availableRange) {
  const totalCount = historyData.length;
  const avgFrequency = totalCount / 30; // 30个号码，每期选1个特别号
  
  const recent30 = historyData.slice(-30);
  const recentFrequency = {};
  for (const d of recent30) {
    const ball = d.special_ball;
    if (ball) {
      recentFrequency[ball] = (recentFrequency[ball] || 0) + 1;
    }
  }
  const recentAvg = recent30.length / 30;
  
  const candidates = [];
  
  for (const ball of availableRange) {
    const longTermFreq = specialFreq[ball] || 0;
    const recentFreq = recentFrequency[ball] || 0;
    
    // 长期高频但短期过冷
    if (longTermFreq > avgFrequency * 1.1 && recentFreq < recentAvg * 0.7) {
      candidates.push(ball);
    }
    // 长期均衡且短期均衡
    else if (longTermFreq >= avgFrequency * 0.8 && longTermFreq <= avgFrequency * 1.2) {
      if (recentFreq >= recentAvg * 0.5 && recentFreq <= recentAvg * 1.5) {
        candidates.push(ball);
      }
    }
  }
  
  // 如果候选太少，放宽条件
  if (candidates.length < 3) {
    for (const ball of availableRange) {
      if ((specialFreq[ball] || 0) >= avgFrequency * 0.8) {
        candidates.push(ball);
      }
    }
  }
  
  return [...new Set(candidates)];
}

/**
 * 回避型准周期过滤
 */
function applyAvoidanceFilter(candidates, historyData) {
  if (!candidates || candidates.length === 0) {
    return candidates;
  }
  
  const recentSpecials = historyData.slice(-3).map(d => d.special_ball).filter(b => b);
  
  // 排除最近1期
  if (recentSpecials.length > 0) {
    const filtered = candidates.filter(b => b !== recentSpecials[recentSpecials.length - 1]);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }
  
  // 降低最近2-3期权重
  if (recentSpecials.length >= 2) {
    const recent23 = recentSpecials.slice(0, -1);
    const weighted = [];
    for (const ball of candidates) {
      if (!recent23.includes(ball)) {
        weighted.push(ball, ball); // 双倍权重
      } else {
        weighted.push(ball);
      }
    }
    return weighted.length > 0 ? weighted : candidates;
  }
  
  return candidates;
}

/**
 * 区间偏移分析（特别号分为3个区间：1-10, 11-20, 21-30）
 */
function applyZonePreference(candidates, historyData) {
  if (!candidates || candidates.length === 0) {
    return candidates;
  }
  
  const recent40 = historyData.length >= 40 ? historyData.slice(-40) : historyData.slice(-20);
  
  const zoneCount = { low: 0, mid: 0, high: 0 };
  for (const d of recent40) {
    const ball = d.special_ball;
    if (ball) {
      if (ball <= 10) {
        zoneCount.low++;
      } else if (ball <= 20) {
        zoneCount.mid++;
      } else {
        zoneCount.high++;
      }
    }
  }
  
  const total = recent40.length;
  const expected = total / 3;
  
  const zoneDeviation = {
    low: (zoneCount.low - expected) / expected,
    mid: (zoneCount.mid - expected) / expected,
    high: (zoneCount.high - expected) / expected
  };
  
  const weighted = [];
  for (const ball of candidates) {
    let ballZone;
    if (ball <= 10) {
      ballZone = 'low';
    } else if (ball <= 20) {
      ballZone = 'mid';
    } else {
      ballZone = 'high';
    }
    
    const deviation = zoneDeviation[ballZone];
    
    // 过热区间降低权重，过冷区间提高权重
    if (deviation > 0.2) {
      weighted.push(ball);
    } else if (deviation < -0.2) {
      weighted.push(ball, ball, ball); // 三倍权重
    } else {
      weighted.push(ball, ball); // 双倍权重
    }
  }
  
  return weighted.length > 0 ? weighted : candidates;
}
