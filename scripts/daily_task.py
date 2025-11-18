#!/usr/bin/env python
"""
每日任务脚本
1. 爬取最新数据
2. 预测下一期号码
3. 发送 Telegram 通知
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime
from lotteries.ssq.spider import SSQSpider
from lotteries.ssq.database import SSQDatabase
from lotteries.ssq.predictor import SSQPredictor, SSQStatistics
from core.utils import load_db_config
from core.telegram_bot import TelegramBot

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def daily_task():
    """执行每日任务"""
    logger.info("=" * 60)
    logger.info(f"开始执行每日任务: {datetime.now()}")
    logger.info("=" * 60)
    
    try:
        # 1. 爬取最新数据
        logger.info("步骤 1: 爬取最新数据")
        spider = SSQSpider(timeout=15, retry_times=3)
        db = SSQDatabase(load_db_config())
        
        db.connect()
        db.create_table()
        
        current_year = datetime.now().year
        year_short = str(current_year)[2:]
        start_issue = f"{year_short}001"
        end_issue = f"{year_short}200"
        
        logger.info(f"爬取 {current_year} 年最新数据")
        data = spider.fetch_500com_data(start_issue, end_issue)
        
        new_data_count = 0
        if data:
            logger.info(f"获取 {len(data)} 条数据")
            inserted, duplicated, skipped = db.insert_lottery_data(data, skip_existing=True)
            logger.info(f"入库: 新增 {inserted} 条，重复 {duplicated} 条，跳过 {skipped} 条")
            new_data_count = inserted
        else:
            logger.warning("未获取到数据")
        
        # 2. 获取最新开奖结果
        logger.info("步骤 2: 获取最新开奖结果")
        latest = db.get_latest_lottery()
        
        if not latest:
            logger.error("没有开奖数据")
            db.close()
            return False
        
        logger.info(f"最新一期: {latest['lottery_no']} ({latest['draw_date']})")
        logger.info(f"号码: {latest['red_balls']} + {latest['blue_ball']}")
        
        # 3. 预测下一期
        logger.info("步骤 3: 预测下一期号码")
        lottery_data = db.get_all_lottery_data()
        
        if not lottery_data:
            logger.error("没有历史数据")
            db.close()
            return False
        
        logger.info(f"使用 {len(lottery_data)} 条历史数据进行预测")
        
        # 从环境变量读取配置
        default_strategies = os.getenv('DEFAULT_STRATEGIES', 'frequency').split(',')
        default_strategies = [s.strip() for s in default_strategies]
        default_count = int(os.getenv('DEFAULT_PREDICTION_COUNT', '5'))
        
        logger.info(f"使用策略: {', '.join(default_strategies)}")
        logger.info(f"预测条数: {default_count}")
        
        predictor = SSQPredictor(lottery_data, strategies=default_strategies)
        predictions = predictor.predict(count=default_count)
        
        logger.info(f"生成 {len(predictions)} 个预测组合")
        for i, pred in enumerate(predictions[:3], 1):
            red_str = ','.join([f"{x:02d}" for x in pred['red_balls']])
            blue_str = f"{pred['blue_ball']:02d}"
            strategy_name = pred.get('strategy_name', '')
            
            if strategy_name:
                logger.info(f"组合 {i} [{strategy_name}]: 红球 {red_str} | 蓝球 {blue_str}")
            else:
                logger.info(f"组合 {i}: 红球 {red_str} | 蓝球 {blue_str}")
        
        # 4. 统计信息
        logger.info("步骤 4: 生成统计信息")
        stats = SSQStatistics(lottery_data)
        freq_data = stats.get_frequency()
        
        red_freq = freq_data['red_balls']
        top_red = sorted(red_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        
        blue_freq = freq_data['blue_ball']
        top_blue = sorted(blue_freq.items(), key=lambda x: x[1], reverse=True)[:3]
        
        stats_info = {
            'top_red': top_red,
            'top_blue': top_blue
        }
        
        db.close()
        
        # 5. 发送 Telegram 通知
        logger.info("步骤 5: 发送 Telegram 通知")
        bot = TelegramBot()
        
        if not bot.bot_token or not bot.chat_id:
            logger.warning("Telegram 未配置，跳过通知")
        else:
            # 测试连接
            if not bot.test_connection():
                logger.error("Telegram 连接失败")
                return False
            
            # 发送每日报告
            if new_data_count > 0:
                # 有新数据，发送完整报告
                success = bot.send_daily_report('ssq', latest, predictions, stats_info)
                if success:
                    logger.info("✓ Telegram 每日报告发送成功")
                else:
                    logger.error("✗ Telegram 每日报告发送失败")
            else:
                # 没有新数据，只发送预测
                success = bot.send_prediction('ssq', predictions)
                if success:
                    logger.info("✓ Telegram 预测发送成功")
                else:
                    logger.error("✗ Telegram 预测发送失败")
        
        logger.info("=" * 60)
        logger.info(f"每日任务完成: {datetime.now()}")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"每日任务失败: {e}", exc_info=True)
        
        # 发送错误通知
        try:
            bot = TelegramBot()
            if bot.bot_token and bot.chat_id:
                bot.send_message(f"❌ 每日任务失败\n\n错误: {str(e)}")
        except:
            pass
        
        return False


if __name__ == '__main__':
    success = daily_task()
    sys.exit(0 if success else 1)
