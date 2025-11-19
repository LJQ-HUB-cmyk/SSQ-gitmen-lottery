/**
 * Telegram Bot 通知工具
 */

export class TelegramBot {
  constructor(botToken, chatId, channelId = null, sendToBot = true, sendToChannel = false) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.channelId = channelId;
    this.sendToBot = sendToBot;
    this.sendToChannel = sendToChannel;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
    
    // 检查发送目标
    const targets = [];
    if (this.sendToBot && this.chatId) {
      targets.push(`机器人(${this.chatId})`);
    }
    if (this.sendToChannel && this.channelId) {
      targets.push(`频道(${this.channelId})`);
    }
    
    if (targets.length > 0) {
      console.log(`Telegram 发送目标: ${targets.join(', ')}`);
    } else {
      console.warn('未配置有效的 Telegram 发送目标');
    }
  }

  /**
   * 发送消息到配置的目标（机器人和/或频道）
   * 如果消息过长，自动分割成多条发送
   */
  async sendMessage(text, parseMode = 'HTML') {
    if (!this.botToken) {
      console.warn('Telegram Bot Token 未配置，跳过发送');
      return false;
    }

    // Telegram 消息长度限制为 4096 字符
    const MAX_LENGTH = 4096;
    const messages = [];

    if (text.length <= MAX_LENGTH) {
      messages.push(text);
    } else {
      // 消息过长，需要分割
      console.log(`消息长度 ${text.length} 超过限制，分割发送`);
      
      // 按组合分割（查找"组合 X:"）
      const lines = text.split('\n');
      let currentMessage = '';
      let header = '';
      let footer = '';
      
      // 提取头部（标题）
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('组合')) {
          header = lines.slice(0, i).join('\n');
          break;
        }
      }
      
      // 提取尾部（警告信息）
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('━━━━━━━━━━━━━━━')) {
          footer = lines.slice(i).join('\n');
          break;
        }
      }
      
      // 分割组合
      currentMessage = header + '\n';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 如果是新组合且当前消息已经较长，开始新消息
        if (line.includes('组合') && currentMessage.length > 1000) {
          currentMessage += footer;
          messages.push(currentMessage.trim());
          currentMessage = header + '\n';
        }
        
        // 跳过已经在 header 或 footer 中的行
        if (!header.includes(line) && !footer.includes(line)) {
          currentMessage += line + '\n';
        }
      }
      
      // 添加最后一条消息
      if (currentMessage.trim() && !currentMessage.includes('━━━━━━━━━━━━━━━')) {
        currentMessage += footer;
      }
      if (currentMessage.trim()) {
        messages.push(currentMessage.trim());
      }
    }

    let successCount = 0;
    let totalTargets = 0;

    // 发送给机器人
    if (this.sendToBot && this.chatId) {
      totalTargets++;
      let allSuccess = true;
      for (const msg of messages) {
        if (!await this._sendToTarget(this.chatId, msg, parseMode, '机器人')) {
          allSuccess = false;
          break;
        }
      }
      if (allSuccess) successCount++;
    }

    // 发送给频道
    if (this.sendToChannel && this.channelId) {
      totalTargets++;
      let allSuccess = true;
      for (const msg of messages) {
        if (!await this._sendToTarget(this.channelId, msg, parseMode, '频道')) {
          allSuccess = false;
          break;
        }
      }
      if (allSuccess) successCount++;
    }

    if (totalTargets === 0) {
      console.warn('未配置有效的 Telegram 发送目标');
      return false;
    }

    console.log(`Telegram 消息发送完成: ${successCount}/${totalTargets} 成功 (${messages.length} 条消息)`);
    return successCount > 0;
  }

  /**
   * 发送消息到指定目标
   */
  async _sendToTarget(targetId, text, parseMode, targetType) {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: targetId,
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

      console.log(`Telegram 消息发送成功 -> ${targetType}(${targetId})`);
      return true;
    } catch (error) {
      console.error(`Telegram 消息发送失败 -> ${targetType}(${targetId}):`, error);
      return false;
    }
  }

  /**
   * 仅发送给机器人
   */
  async sendToBotOnly(text, parseMode = 'HTML') {
    if (!this.botToken || !this.chatId) {
      console.warn('机器人未配置，跳过发送');
      return false;
    }
    return await this._sendToTarget(this.chatId, text, parseMode, '机器人');
  }

  /**
   * 仅发送给频道
   */
  async sendToChannelOnly(text, parseMode = 'HTML') {
    if (!this.botToken || !this.channelId) {
      console.warn('频道未配置，跳过发送');
      return false;
    }
    return await this._sendToTarget(this.channelId, text, parseMode, '频道');
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
      message += `<b>组合 ${index + 1}:</b>`;
      
      // 添加策略名称（如果有）
      if (pred.strategy_name) {
        message += ` <i>[${pred.strategy_name}]</i>`;
      }
      
      message += `\n`;
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
