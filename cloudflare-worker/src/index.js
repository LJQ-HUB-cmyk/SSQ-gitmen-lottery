/**
 * 彩票预测系统 - Cloudflare Workers 版本
 * 主入口文件
 * 
 * 说明：定时任务通过 Cloudflare Dashboard 的触发器配置
 */

import { SSQSpider } from './spiders/ssq.js';
import { SSQPredictor } from './predictors/ssq.js';
import { TelegramBot } from './utils/telegram.js';
import { Database } from './utils/database.js';

/**
 * 从 KV 获取配置
 */
async function getConfig(env) {
  const config = {
    telegramBotToken: await env.CONFIG.get('TELEGRAM_BOT_TOKEN'),
    telegramChatId: await env.CONFIG.get('TELEGRAM_CHAT_ID'),
    apiKey: await env.CONFIG.get('API_KEY')
  };
  
  // 如果 KV 中没有配置，尝试从环境变量获取（兼容性）
  if (!config.telegramBotToken) config.telegramBotToken = env.TELEGRAM_BOT_TOKEN;
  if (!config.telegramChatId) config.telegramChatId = env.TELEGRAM_CHAT_ID;
  if (!config.apiKey) config.apiKey = env.API_KEY;
  
  return config;
}

/**
 * 执行每日任务（由 Cloudflare 触发器调用）
 */
async function runDailyTask(env) {
  console.log('每日任务开始执行:', new Date().toISOString());
  
  const config = await getConfig(env);
  const telegram = new TelegramBot(config.telegramBotToken, config.telegramChatId);
  
  try {
    // 初始化
    const db = new Database(env.DB);
    const spider = new SSQSpider();
    const predictor = new SSQPredictor(db);
    
    // 1. 爬取最新数据
    console.log('开始爬取最新数据...');
    const latestData = await spider.fetchLatest();
    
    if (!latestData) {
      console.log('未获取到最新数据');
      return { success: false, message: '未获取到最新数据' };
    }
    
    console.log(`获取到最新数据: ${latestData.lottery_no}`);
    
    // 检查是否已存在
    const exists = await db.checkExists('ssq', latestData.lottery_no);
    
    if (exists) {
      console.log(`数据已存在，跳过: ${latestData.lottery_no}`);
      return { success: true, message: '数据已存在', lottery_no: latestData.lottery_no };
    }
    
    // 保存到数据库
    await db.insert('ssq', latestData);
    console.log(`新数据已保存: ${latestData.lottery_no}`);
    
    // 备份到 R2（可选）
    if (env.R2) {
      try {
        const backupKey = `ssq/${latestData.lottery_no}.json`;
        await env.R2.put(backupKey, JSON.stringify(latestData, null, 2));
        console.log(`数据已备份到 R2: ${backupKey}`);
      } catch (e) {
        console.error('R2 备份失败:', e);
      }
    }
    
    // 2. 预测下一期
    console.log('开始预测下一期...');
    const predictions = await predictor.predict(5);
    
    // 3. 获取统计信息
    const frequency = await db.getFrequency('ssq');
    const stats = {
      top_red: frequency.red.slice(0, 5),
      top_blue: frequency.blue.slice(0, 3)
    };
    
    // 4. 发送 Telegram 通知
    await telegram.sendDailyReport(latestData, predictions, stats);
    
    console.log('每日任务完成');
    return { 
      success: true, 
      message: '任务完成', 
      lottery_no: latestData.lottery_no,
      predictions_count: predictions.length
    };
    
  } catch (error) {
    console.error('每日任务执行失败:', error);
    
    // 发送错误通知
    try {
      await telegram.sendError(error);
    } catch (e) {
      console.error('发送错误通知失败:', e);
    }
    
    throw error;
  }
}

export default {
  /**
   * HTTP 请求处理器
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const config = await getConfig(env);
    
    // 首页
    if (url.pathname === '/') {
      return new Response(
        '🎰 彩票预测系统 - Cloudflare Workers 版本\n\n' +
        '可用接口:\n' +
        '  POST /run - 手动执行每日任务\n' +
        '  POST /init - 初始化数据库并导入历史数据\n' +
        '  GET /latest - 查询最新开奖数据\n' +
        '  GET /predict - 获取预测结果\n' +
        '  GET /stats - 查看统计信息\n' +
        '  GET /test - 测试 Telegram 连接\n\n' +
        '说明：定时任务通过 Cloudflare Dashboard 的触发器配置\n',
        {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }
      );
    }
    
    // 验证授权（需要 API_KEY 的接口）
    const requireAuth = ['/init', '/run'];
    if (requireAuth.includes(url.pathname)) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || authHeader !== `Bearer ${config.apiKey}`) {
        return new Response('Unauthorized', { status: 401 });
      }
    }
    
    // 初始化数据库
    if (url.pathname === '/init' && request.method === 'POST') {
      try {
        const db = new Database(env.DB);
        await db.init();
        
        // 爬取全量数据
        const spider = new SSQSpider();
        const maxCount = parseInt(url.searchParams.get('count') || '1000');
        const allData = await spider.fetchAll(maxCount);
        
        // 批量插入
        const result = await db.batchInsert('ssq', allData);
        
        // 发送通知
        if (config.telegramBotToken && config.telegramChatId) {
          const telegram = new TelegramBot(config.telegramBotToken, config.telegramChatId);
          await telegram.sendInitComplete(result.inserted);
        }
        
        return new Response(
          `初始化完成\n\n` +
          `新增: ${result.inserted} 条\n` +
          `跳过: ${result.skipped} 条\n` +
          `总计: ${allData.length} 条`,
          {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          }
        );
      } catch (error) {
        return new Response(`初始化失败: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }
    
    // 手动执行每日任务
    if (url.pathname === '/run' && request.method === 'POST') {
      try {
        const result = await runDailyTask(env);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }, null, 2), {
          status: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }
    
    // 查询最新数据
    if (url.pathname === '/latest') {
      try {
        const db = new Database(env.DB);
        const latest = await db.getLatest('ssq');
        
        if (!latest) {
          return new Response('暂无数据', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
        
        return new Response(JSON.stringify(latest, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (error) {
        return new Response(`查询失败: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }
    
    // 预测
    if (url.pathname === '/predict') {
      try {
        const db = new Database(env.DB);
        const predictor = new SSQPredictor(db);
        const count = parseInt(url.searchParams.get('count') || '5');
        const predictions = await predictor.predict(count);
        
        return new Response(JSON.stringify(predictions, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (error) {
        return new Response(`预测失败: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }
    
    // 统计信息
    if (url.pathname === '/stats') {
      try {
        const db = new Database(env.DB);
        const frequency = await db.getFrequency('ssq');
        const count = await db.getCount('ssq');
        
        const stats = {
          total_count: count,
          top_red_balls: frequency.red.slice(0, 10),
          top_blue_balls: frequency.blue.slice(0, 5)
        };
        
        return new Response(JSON.stringify(stats, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (error) {
        return new Response(`查询失败: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }
    
    // 测试 Telegram 连接
    if (url.pathname === '/test') {
      try {
        const telegram = new TelegramBot(config.telegramBotToken, config.telegramChatId);
        const success = await telegram.testConnection();
        
        if (success) {
          await telegram.sendMessage('✅ Telegram 连接测试成功！');
          return new Response('Telegram 连接正常', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        } else {
          return new Response('Telegram 连接失败', {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
      } catch (error) {
        return new Response(`测试失败: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// 导出 runDailyTask 供 Cloudflare 触发器使用
export { runDailyTask };
