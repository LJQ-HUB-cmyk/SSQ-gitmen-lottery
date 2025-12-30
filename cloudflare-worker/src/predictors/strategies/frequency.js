/**
 * 频率策略
 * 基于历史出现频率进行预测
 * 策略：70% 高频号码 + 30% 随机号码
 */

import { BaseStrategy } from './base.js';
import { smartBlueSelection } from './blueHelper.js';

export class FrequencyStrategy extends BaseStrategy {
  constructor() {
    super(
      '频率策略',
      '基于历史出现频率，选择高频号码组合'
    );
    this.highFreqRatio = 0.7; // 高频号码比例
  }

  /**
   * 生成红球组合
   */
  generateRedBalls(context) {
    const { redFrequency } = context;
    const balls = [];
    
    // 获取高频号码（前15个）
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
      return this.generateRedBalls(context);
    }
    
    return balls.sort();
  }

  /**
   * 生成蓝球（基于三种弱周期理论）
   */
  generateBlueBall(context) {
    return smartBlueSelection(context, this.BLUE_RANGE);
  }
}
