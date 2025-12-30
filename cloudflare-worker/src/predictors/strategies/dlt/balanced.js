/**
 * 均衡策略
 * 追求号码分布的均衡性
 */

import { BaseStrategy } from './base.js';
import { smartBackSelection } from './backHelper.js';

export class BalancedStrategy extends BaseStrategy {
  constructor() {
    super('均衡策略', '追求号码分布均衡，大小号、奇偶号均衡');
  }

  generateFrontBalls(context) {
    const frontFrequency = context.frontFrequency || {};
    
    // 将号码分为小号(1-17)、大号(18-35)
    const smallBalls = Array.from({ length: 17 }, (_, i) => i + 1);
    const largeBalls = Array.from({ length: 18 }, (_, i) => i + 18);
    
    // 选择 2-3 个小号，2-3 个大号
    const smallCount = Math.random() < 0.5 ? 2 : 3;
    const largeCount = 5 - smallCount;
    
    let selectedSmall, selectedLarge;
    
    // 如果有频率数据，优先选择中频号码
    if (Object.keys(frontFrequency).length > 0) {
      // 获取中频号码（排名 10-25）
      const sortedBalls = Object.keys(frontFrequency)
        .map(k => parseInt(k))
        .sort((a, b) => frontFrequency[b] - frontFrequency[a]);
      const midFreqBalls = sortedBalls.slice(10, 25);
      
      // 从中频号码中筛选小号和大号
      let midSmall = midFreqBalls.filter(b => smallBalls.includes(b));
      let midLarge = midFreqBalls.filter(b => largeBalls.includes(b));
      
      // 如果中频号码不够，补充随机号码
      if (midSmall.length < smallCount) {
        midSmall = smallBalls;
      }
      if (midLarge.length < largeCount) {
        midLarge = largeBalls;
      }
      
      selectedSmall = this.randomSelect(midSmall, smallCount);
      selectedLarge = this.randomSelect(midLarge, largeCount);
    } else {
      selectedSmall = this.randomSelect(smallBalls, smallCount);
      selectedLarge = this.randomSelect(largeBalls, largeCount);
    }
    
    const balls = [...selectedSmall, ...selectedLarge];
    
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
