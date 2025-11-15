#!/usr/bin/env python
"""
数据库初始化脚本
首次运行时创建表并爬取全量数据
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime
from lotteries.ssq.spider import SSQSpider
from lotteries.ssq.database import SSQDatabase
from core.utils import load_db_config
from core.telegram_bot import TelegramBot

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def init_database():
    """初始化数据库并爬取全量数据"""
    logger.info("=" * 60)
    logger.info("开始初始化数据库")
    logger.info("=" * 60)
    
    try:
        # 初始化数据库
        db = SSQDatabase(load_db_config())
        db.connect()
        db.create_table()
        
        # 检查是否已有数据
        total = db.get_total_count('ssq_lottery')
        
        if total > 0:
            logger.info(f"数据库已有 {total} 条数据，跳过初始化")
            latest = db.get_latest_lottery()
            if latest:
                logger.info(f"最新一期: {latest['lottery_no']} ({latest['draw_date']})")
            db.close()
            return True
        
        logger.info("数据库为空，开始爬取全量历史数据...")
        
        # 爬取全量数据
        spider = SSQSpider(timeout=15, retry_times=3)
        current_year = datetime.now().year
        start_year = 2003
        
        total_inserted = 0
        
        for year in range(start_year, current_year + 1):
            year_short = str(year)[2:]
            start_issue = f"{year_short}001"
            end_issue = f"{year_short}200"
            
            logger.info(f"爬取 {year} 年数据 (期号: {start_issue} - {end_issue})")
            
            try:
                year_data = spider.fetch_500com_data(start_issue, end_issue)
                
                if year_data:
                    logger.info(f"  获取 {len(year_data)} 条数据")
                    inserted, duplicated, skipped = db.insert_lottery_data(year_data, skip_existing=True)
                    logger.info(f"  入库: 新增 {inserted} 条")
                    total_inserted += inserted
                else:
                    logger.warning(f"  {year} 年无数据")
                    
            except Exception as e:
                logger.error(f"  爬取 {year} 年失败: {e}")
                continue
        
        logger.info("=" * 60)
        logger.info(f"初始化完成，共爬取 {total_inserted} 条数据")
        logger.info("=" * 60)
        
        # 显示统计
        total = db.get_total_count('ssq_lottery')
        latest = db.get_latest_lottery()
        
        logger.info(f"数据库总记录数: {total}")
        if latest:
            logger.info(f"最新一期: {latest['lottery_no']} ({latest['draw_date']})")
            logger.info(f"号码: {latest['red_balls']} + {latest['blue_ball']}")
        
        db.close()
        
        # 发送 Telegram 通知
        try:
            bot = TelegramBot()
            if bot.bot_token and bot.chat_id:
                bot.send_message(
                    f"✅ 数据库初始化完成\n\n"
                    f"📊 总记录数: {total}\n"
                    f"📅 最新期号: {latest['lottery_no']}\n"
                    f"📆 开奖日期: {latest['draw_date']}"
                )
        except Exception as e:
            logger.warning(f"Telegram 通知发送失败: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"初始化失败: {e}", exc_info=True)
        return False


if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)
