/**
 * Telegram Bot 通知工具
 */

export class TelegramBot {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * 发送消息
   */
  async sendMessage(text, parseMode = 'HTML') {
    if (!this.botToken || !this.chatId) {
      console.warn('Telegram 未配置，跳过发送');
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: parseMode
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API 错误: ${error}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegram 发送失败: ${data.description}`);
      }

      console.log('Telegram 消息发送成功');
      return true;
    } catch (error) {
      console.error('Telegram 发送失败:', error);
      return false;
    }
  }

  /**
   * 发送每日报告
   */
  async sendDailyReport(latestData, predictions, stats = null) {
    let message = '📊 <b>双色球每日报告</b>\n\n';
    message += '━━━━━━━━━━━━━━━\n';
    message += '🎰 <b>最新开奖</b>\n\n';
    message += `📅 期号: ${latestData.lottery_no}\n`;
    message += `📆 日期: ${latestData.draw_date}\n\n`;
    message += `🔴 红球: <code>${latestData.red_balls.join(' ')}</code>\n`;
    message += `🔵 蓝球: <code>${latestData.blue_ball}</code>\n\n`;
    
    message += '━━━━━━━━━━━━━━━\n';
    message += '🔮 <b>下期预测</b>\n\n';
    
    predictions.slice(0, 3).forEach((pred, index) => {
      message += `<b>组合 ${index + 1}:</b>\n`;
      message += `🔴 <code>${pred.red_balls.join(' ')}</code>\n`;
      message += `🔵 <code>${pred.blue_ball}</code>\n\n`;
    });
    
    if (stats) {
      message += '━━━━━━━━━━━━━━━\n';
      message += '📈 <b>统计信息</b>\n\n';
      
      if (stats.top_red && stats.top_red.length > 0) {
        const topRed = stats.top_red.slice(0, 5)
          .map(item => `${item.ball}(${item.count})`)
          .join(', ');
        message += `高频红球: ${topRed}\n`;
      }
      
      if (stats.top_blue && stats.top_blue.length > 0) {
        const topBlue = stats.top_blue.slice(0, 3)
          .map(item => `${item.ball}(${item.count})`)
          .join(', ');
        message += `高频蓝球: ${topBlue}\n`;
      }
    }
    
    message += '\n━━━━━━━━━━━━━━━\n';
    message += '⚠️ <i>仅供参考，理性购彩</i>';
    
    return await this.sendMessage(message);
  }

  /**
   * 发送错误通知
   */
  async sendError(error) {
    const message = `❌ <b>任务执行失败</b>\n\n` +
                   `错误信息: <code>${error.message}</code>\n` +
                   `时间: ${new Date().toISOString()}`;
    
    return await this.sendMessage(message);
  }

  /**
   * 发送初始化完成通知
   */
  async sendInitComplete(count) {
    const message = `✅ <b>初始化完成</b>\n\n` +
                   `已导入 ${count} 条历史数据\n` +
                   `时间: ${new Date().toISOString()}`;
    
    return await this.sendMessage(message);
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        console.log(`Telegram Bot 连接成功: @${data.result.username}`);
        return true;
      } else {
        console.error('Telegram Bot 连接失败');
        return false;
      }
    } catch (error) {
      console.error('Telegram 连接测试失败:', error);
      return false;
    }
  }
}
