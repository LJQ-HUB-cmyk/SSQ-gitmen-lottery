/**
 * 频率策略
 * 基于历史出现频率进行预测
 */

import { BaseStrategy } from './base.js';
import { smartBackSelection } from './backHelper.js';

export class FrequencyStrategy extends BaseStrategy {
  constructor() {
    super('频率策略', '基于历史出现频率，选择高频号码组合');
  }

  generateFrontBalls(context) {
    const frontFrequency = context.frontFrequency || {};
    
    if (Object.keys(frontFrequency).length === 0) {
      // 如果没有频率数据，使用随机策略
      return this.randomSelect(this.FRONT_RANGE, 5).sort((a, b) => a - b);
    }
    
    // 获取高频号码（前15个）
    const sortedBalls = Object.keys(frontFrequency)
      .map(k => parseInt(k))
      .sort((a, b) => frontFrequency[b] - frontFrequency[a]);
    const topBalls = sortedBalls.slice(0, 15);
    
    // 增加随机性：从高频号码中随机选择数量
    const highFreqCount = Math.floor(Math.random() * 2) + 3; // 3-4个高频号码
    const randomCount = 5 - highFreqCount;
    
    // 选择高频号码
    const highFreqBalls = this.randomSelect(topBalls, highFreqCount);
    
    // 选择随机号码（不重复）
    const remainingBalls = this.FRONT_RANGE.filter(b => !highFreqBalls.includes(b));
    const randomBalls = this.randomSelect(remainingBalls, randomCount);
    
    const balls = [...highFreqBalls, ...randomBalls];
    
    // 验证组合有效性
    if (!this.isValidFrontCombination(balls)) {
      return this.generateFrontBalls(context);
    }
    
    return balls.sort((a, b) => a - b);
  }

  generateBackBalls(context) {
    return smartBackSelection(context, this.BACK_RANGE, 2);
  }
}
