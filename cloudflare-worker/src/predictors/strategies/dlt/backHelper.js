/**
 * 大乐透后区预测辅助模块
 * 基于三种"弱周期"理论（改编自双色球蓝球算法）
 */

/**
 * 智能后区选择（基于三种弱周期理论）
 * @param {Object} context - 包含 historyData 和 backFrequency 的上下文
 * @param {Array} backRange - 后区范围
 * @param {number} count - 需要选择的后区号码数量（默认2个）
 * @returns {Array} 后区号码列表（已排序）
 */
export function smartBackSelection(context, backRange, count = 2) {
  const { historyData = [], backFrequency = [] } = context;
  
  if (!historyData || historyData.length < 30) {
    return simpleSelection(backFrequency, backRange, count);
  }
  
  // 三层过滤
  let candidates = getMeanReversionCandidates(historyData, backFrequency, backRange);
  candidates = applyAvoidanceFilter(candidates, historyData);
  candidates = applyZonePreference(candidates, historyData);
  
  // 去重候选列表
  const uniqueCandidates = [...new Set(candidates)];
  
  if (uniqueCandidates.length >= count) {
    // 随机选择count个不重复的号码
    const selected = [];
    const available = [...uniqueCandidates];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available.splice(idx, 1)[0]);
    }
    return selected.sort((a, b) => a - b);
  } else {
    return simpleSelection(backFrequency, backRange, count);
  }
}

/**
 * 简单选择
 */
function simpleSelection(backFrequency, backRange, count) {
  if (backFrequency && backFrequency.length > 0) {
    const topBack = backFrequency.slice(0, 6).map(item => parseInt(item.ball));
    const selected = [];
    const available = [...topBack];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available.splice(idx, 1)[0]);
    }
    return selected.sort((a, b) => a - b);
  } else {
    const selected = [];
    const available = [...backRange];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available.splice(idx, 1)[0]);
    }
    return selected.sort((a, b) => a - b);
  }
}

/**
 * 均值回归候选
 */
function getMeanReversionCandidates(historyData, backFrequency, backRange) {
  const totalCount = historyData.length;
  const avgFrequency = (totalCount * 2) / 12; // 后区每期选2个，共12个号码
  
  const recent30 = historyData.slice(-30);
  const recentFrequency = {};
  for (const d of recent30) {
    for (const ball of (d.back_balls || [])) {
      const ballNum = parseInt(ball);
      recentFrequency[ballNum] = (recentFrequency[ballNum] || 0) + 1;
    }
  }
  const recentAvg = (recent30.length * 2) / 12;
  
  const candidates = [];
  
  // 将 backFrequency 转换为对象
  const freqMap = {};
  backFrequency.forEach(item => {
    freqMap[parseInt(item.ball)] = item.count;
  });
  
  for (const ball of backRange) {
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
  if (candidates.length < 4) {
    for (const ball of backRange) {
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
  
  // 获取最近3期的后区号码
  const recentBacks = [];
  for (const d of historyData.slice(-3)) {
    for (const ball of (d.back_balls || [])) {
      recentBacks.push(parseInt(ball));
    }
  }
  
  // 排除最近1期的号码
  if (recentBacks.length >= 2) {
    const lastPeriod = (historyData[historyData.length - 1].back_balls || []).map(b => parseInt(b));
    const filtered = candidates.filter(b => !lastPeriod.includes(b));
    if (filtered.length >= 2) {
      candidates = filtered;
    }
  }
  
  // 降低最近2-3期的权重
  if (historyData.length >= 3) {
    const recent23 = [];
    for (const d of historyData.slice(-3, -1)) {
      for (const ball of (d.back_balls || [])) {
        recent23.push(parseInt(ball));
      }
    }
    
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
 * 区间偏移分析（后区分为3个区间：1-4, 5-8, 9-12）
 */
function applyZonePreference(candidates, historyData) {
  if (!candidates || candidates.length === 0) {
    return candidates;
  }
  
  const recent40 = historyData.length >= 40 ? historyData.slice(-40) : historyData.slice(-20);
  
  const zoneCount = { low: 0, mid: 0, high: 0 };
  for (const d of recent40) {
    for (const ball of (d.back_balls || [])) {
      const ballNum = parseInt(ball);
      if (ballNum <= 4) {
        zoneCount.low++;
      } else if (ballNum <= 8) {
        zoneCount.mid++;
      } else {
        zoneCount.high++;
      }
    }
  }
  
  const total = recent40.length * 2; // 每期2个后区号码
  const expected = total / 3;
  
  const zoneDeviation = {
    low: (zoneCount.low - expected) / expected,
    mid: (zoneCount.mid - expected) / expected,
    high: (zoneCount.high - expected) / expected
  };
  
  const weighted = [];
  for (const ball of candidates) {
    let ballZone;
    if (ball <= 4) {
      ballZone = 'low';
    } else if (ball <= 8) {
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
