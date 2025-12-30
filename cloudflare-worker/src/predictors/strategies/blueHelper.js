/**
 * 蓝球预测辅助模块
 * 基于三种"弱周期"理论
 */

/**
 * 智能蓝球选择（基于三种弱周期理论）
 * @param {Object} context - 包含 historyData 和 blueFrequency 的上下文
 * @param {Array} blueRange - 蓝球范围
 * @returns {string} 蓝球号码
 */
export function smartBlueSelection(context, blueRange) {
  const { historyData = [], blueFrequency = [] } = context;
  
  if (!historyData || historyData.length < 30) {
    return simpleSelection(blueFrequency, blueRange);
  }
  
  // 三层过滤
  let candidates = getMeanReversionCandidates(historyData, blueFrequency, blueRange);
  candidates = applyAvoidanceFilter(candidates, historyData);
  candidates = applyZonePreference(candidates, historyData);
  
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    return simpleSelection(blueFrequency, blueRange);
  }
}

/**
 * 简单选择
 */
function simpleSelection(blueFrequency, blueRange) {
  if (blueFrequency && blueFrequency.length > 0) {
    const topBlue = blueFrequency.slice(0, 5);
    return topBlue[Math.floor(Math.random() * topBlue.length)].ball;
  } else {
    return blueRange[Math.floor(Math.random() * blueRange.length)];
  }
}

/**
 * 均值回归候选
 */
function getMeanReversionCandidates(historyData, blueFrequency, blueRange) {
  const totalCount = historyData.length;
  const avgFrequency = totalCount / 16;
  
  const recent30 = historyData.slice(-30);
  const recentFrequency = {};
  recent30.forEach(d => {
    const ball = d.blue_ball;
    recentFrequency[ball] = (recentFrequency[ball] || 0) + 1;
  });
  const recentAvg = recent30.length / 16;
  
  const candidates = [];
  
  // 将 blueFrequency 转换为对象
  const freqMap = {};
  blueFrequency.forEach(item => {
    freqMap[item.ball] = item.count;
  });
  
  for (const ball of blueRange) {
    const longTermFreq = freqMap[ball] || 0;
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
    for (const ball of blueRange) {
      if ((freqMap[ball] || 0) >= avgFrequency * 0.8) {
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
  
  const recentBlues = historyData.slice(-3).map(d => d.blue_ball);
  
  // 排除最近1期
  if (recentBlues.length > 0) {
    const filtered = candidates.filter(b => b !== recentBlues[recentBlues.length - 1]);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }
  
  // 降低最近2-3期权重
  if (recentBlues.length >= 2) {
    const recent23 = recentBlues.slice(0, -1);
    const weighted = [];
    for (const ball of candidates) {
      if (!recent23.includes(ball)) {
        weighted.push(ball, ball); // 双倍权重
      } else {
        weighted.push(ball);
      }
    }
    return weighted;
  }
  
  return candidates;
}

/**
 * 区间偏移分析
 */
function applyZonePreference(candidates, historyData) {
  if (!candidates || candidates.length === 0) {
    return candidates;
  }
  
  const recent40 = historyData.length >= 40 ? historyData.slice(-40) : historyData.slice(-20);
  
  const zoneCount = { low: 0, mid: 0, high: 0 };
  for (const d of recent40) {
    const ball = parseInt(d.blue_ball);
    if (ball <= 6) {
      zoneCount.low++;
    } else if (ball <= 11) {
      zoneCount.mid++;
    } else {
      zoneCount.high++;
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
    const ballNum = parseInt(ball);
    let ballZone;
    if (ballNum <= 6) {
      ballZone = 'low';
    } else if (ballNum <= 11) {
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
