"""
定时任务命令
"""

import logging
from apscheduler.schedulers.blocking import BlockingScheduler
from datetime import datetime
from core.config import LOG_DIR, LOTTERY_NAMES
from core.utils import load_db_config

logger = logging.getLogger(__name__)


def setup_logging(lottery_type: str):
    """设置日志"""
    log_dir = LOG_DIR / lottery_type
    log_dir.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / 'schedule.log'),
            logging.StreamHandler()
        ]
    )


def fetch_latest_data(lottery_type: str):
    """增量爬取最新数据"""
    logger.info("=" * 60)
    logger.info(f"定时任务开始: {datetime.now()}")
    logger.info("=" * 60)
    
    try:
        if lottery_type == 'ssq':
            from lotteries.ssq.spider import SSQSpider
            from lotteries.ssq.database import SSQDatabase
            
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
            
            if data:
                logger.info(f"获取 {len(data)} 条数据")
                inserted, duplicated, skipped = db.insert_lottery_data(data, skip_existing=True)
                logger.info(f"入库: 新增 {inserted} 条，重复 {duplicated} 条，跳过 {skipped} 条")
                
                if inserted > 0:
                    logger.info(f"✓ 发现并入库 {inserted} 条新数据")
                else:
                    logger.info("✓ 暂无新数据")
            else:
                logger.warning("未获取到数据")
            
            # 显示最新一期
            latest = db.get_latest_lottery()
            if latest:
                logger.info(f"最新一期: {latest['lottery_no']} ({latest['draw_date']})")
                logger.info(f"号码: {latest['red_balls']} + {latest['blue_ball']}")
            
            db.close()
            
        else:
            logger.error(f"暂不支持彩票类型: {lottery_type}")
            
    except Exception as e:
        logger.error(f"定时任务失败: {e}", exc_info=True)
    
    logger.info("=" * 60)
    logger.info(f"定时任务结束: {datetime.now()}")
    logger.info("=" * 60 + "\n")


def start_schedule(lottery_type: str):
    """启动定时任务"""
    setup_logging(lottery_type)
    
    scheduler = BlockingScheduler()
    
    # 每天晚上21:30执行（开奖后1小时）
    scheduler.add_job(
        lambda: fetch_latest_data(lottery_type),
        'cron',
        hour=21,
        minute=30
    )
    
    logger.info("=" * 60)
    logger.info(f"定时任务已启动 - {LOTTERY_NAMES.get(lottery_type, lottery_type)}")
    logger.info("执行时间: 每天 21:30")
    logger.info("按 Ctrl+C 停止")
    logger.info("=" * 60)
    
    # 启动时立即执行一次
    logger.info("\n首次执行...")
    fetch_latest_data(lottery_type)
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("\n定时任务已停止")
