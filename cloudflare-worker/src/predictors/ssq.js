/**
 * 双色球预测器 - Cloudflare Worker 版本
 * 基于历史数据进行智能预测
 */

export class SSQPredictor {
  constructor(db) {
    this.db = db;
    this.RED_RANGE = Array.from({ length: 33 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    this.BLUE_RANGE = Array.from({ length: 16 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  }

  /**
   * 执行预测
   * @param {number} count - 预测组合数
   */
  async predict(count = 5) {
    try {
      // 获取历史数据
      const historyData = await this.db.getAll('ssq', 500);
      
      if (historyData.length === 0) {
        throw new Error('没有历史数据');
      }

      // 获取频率统计
      const frequency = await this.db.getFrequency('ssq');
      
      // 获取历史组合（用于去重）
      const historicalCombinations = await this.db.getHistoricalCombinations('ssq');

      // 生成预测组合
      const predictions = [];
      const maxAttempts = count * 100; // 最多尝试次数
      let attempts = 0;

      while (predictions.length < count && attempts < maxAttempts) {
        attempts++;

        // 生成红球组合
        const redBalls = this.generateRedBalls(frequency.red, historicalCombinations);
        
        // 生成蓝球
        const blueBall = this.generateBlueBall(frequency.blue);

        // 检查是否重复
        const sortedCode = redBalls.sort().join(',') + '-' + blueBall;
        
        if (!historicalCombinations.has(sortedCode) && 
            !predictions.some(p => p.sorted_code === sortedCode)) {
          predictions.push({
            rank: predictions.length + 1,
            red_balls: redBalls,
            blue_ball: blueBall,
            sorted_code: sortedCode,
            prediction_time: new Date().toISOString()
          });
        }
      }

      console.log(`生成了 ${predictions.length} 个预测组合`);
      return predictions;
    } catch (error) {
      console.error('预测失败:', error);
      throw error;
    }
  }

  /**
   * 生成红球组合
   */
  generateRedBalls(redFrequency, historicalCombinations) {
    const balls = [];
    
    // 策略：70% 高频号码 + 30% 随机号码
    const topBalls = redFrequency.slice(0, 15).map(item => item.ball);
    
    // 选择 4 个高频号码
    const highFreqBalls = this.randomSelect(topBalls, 4);
    balls.push(...highFreqBalls);
    
    // 选择 2 个随机号码（不重复）
    const remainingBalls = this.RED_RANGE.filter(b => !balls.includes(b));
    const randomBalls = this.randomSelect(remainingBalls, 2);
    balls.push(...randomBalls);
    
    // 验证组合有效性
    if (!this.isValidRedCombination(balls)) {
      // 如果无效，重新生成
      return this.generateRedBalls(redFrequency, historicalCombinations);
    }
    
    return balls.sort();
  }

  /**
   * 生成蓝球
   */
  generateBlueBall(blueFrequency) {
    // 策略：80% 概率选择高频蓝球，20% 概率随机
    if (Math.random() < 0.8 && blueFrequency.length > 0) {
      // 从前5个高频蓝球中随机选择
      const topBlue = blueFrequency.slice(0, 5);
      return topBlue[Math.floor(Math.random() * topBlue.length)].ball;
    } else {
      // 随机选择
      return this.BLUE_RANGE[Math.floor(Math.random() * this.BLUE_RANGE.length)];
    }
  }

  /**
   * 验证红球组合是否有效
   * 规则：不能有超过3个连号
   */
  isValidRedCombination(balls) {
    const sorted = balls.map(b => parseInt(b)).sort((a, b) => a - b);
    
    let consecutiveCount = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) {
        consecutiveCount++;
        if (consecutiveCount >= 3) {
          return false; // 超过3个连号
        }
      } else {
        consecutiveCount = 1;
      }
    }
    
    return true;
  }

  /**
   * 从数组中随机选择 n 个不重复的元素
   */
  randomSelect(array, n) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  /**
   * 计算组合得分（用于排序）
   */
  scoreCombin(redBalls, redFrequency) {
    let score = 0;
    
    // 频率得分
    for (const ball of redBalls) {
      const freq = redFrequency.find(f => f.ball === ball);
      if (freq) {
        score += freq.count;
      }
    }
    
    // 分布得分（号码分布越均匀得分越高）
    const sorted = redBalls.map(b => parseInt(b)).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(sorted[i] - sorted[i - 1]);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const idealGap = 33 / 6; // 理想间距
    const gapScore = 100 - Math.abs(avgGap - idealGap) * 10;
    score += gapScore;
    
    return score;
  }
}
