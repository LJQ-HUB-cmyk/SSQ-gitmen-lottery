/**
 * 冷热号策略
 * 结合冷号和热号
 * 策略：3个热号 + 2个温号 + 1个冷号
 */

import { BaseStrategy } from './base.js';
import { smartBlueSelection } from './blueHelper.js';

export class ColdHotStrategy extends BaseStrategy {
  constructor() {
    super(
      '冷热号策略',
      '结合热号、温号、冷号，追求冷热平衡'
    );
  }

  /**
   * 生成红球组合
   */
  generateRedBalls(context) {
    const { redFrequency } = context;
    const balls = [];
    
    // 热号：前10个高频号码
    const hotBalls = redFrequency.slice(0, 10).map(item => item.ball);
    
    // 温号：中间13个号码
    const warmBalls = redFrequency.slice(10, 23).map(item => item.ball);
    
    // 冷号：后10个低频号码
    const coldBalls = redFrequency.slice(23).map(item => item.ball);
    
    // 选择 3 个热号
    balls.push(...this.randomSelect(hotBalls, 3));
    
    // 选择 2 个温号
    balls.push(...this.randomSelect(warmBalls, 2));
    
    // 选择 1 个冷号
    balls.push(...this.randomSelect(coldBalls, 1));
    
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
