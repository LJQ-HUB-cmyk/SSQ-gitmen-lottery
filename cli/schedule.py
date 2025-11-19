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


def fetch_and_predict_single(lottery_type: str):
    """
    单个彩票类型的增量爬取和预测
    
    注意：此方法现在直接调用 fetch.py 中的核心方法，实现代码复用
    """
    logger.info(f"\n{'=' * 60}")
    logger.info(f"处理 {LOTTERY_NAMES.get(lottery_type, lottery_type)}")
    logger.info(f"{'=' * 60}")
    
    # 直接调用 fetch.py 中的核心方法，with_predict=True
    from cli.fetch import fetch_incremental_data
    return fetch_incremental_data(lottery_type, with_predict=True)


def fetch_latest_data():
    """增量爬取所有彩票类型的最新数据并预测"""
    logger.info("=" * 60)
    logger.info(f"定时任务开始: {datetime.now()}")
    logger.info("=" * 60)
    
    results = []
    
    # 处理双色球
    ssq_result = fetch_and_predict_single('ssq')
    if ssq_result:
        results.append(ssq_result)
    
    # 处理大乐透
    dlt_result = fetch_and_predict_single('dlt')
    if dlt_result:
        results.append(dlt_result)
    
    # 发送 Telegram 通知
    if results:
        try:
            from core.telegram_bot import TelegramBot
            telegram = TelegramBot()
            
            # 为每个彩票类型单独发送消息
            for result in results:
                predictions = result.get('predictions', [])
                
                # 只发送有预测结果的彩票类型
                if not predictions:
                    logger.info(f"跳过 {result['lottery_name']}：无预测结果")
                    continue
                
                # 构建单个彩票类型的消息
                message = f"🔮 <b>{result['lottery_name']}预测</b>\n\n"
                
                # 显示所有预测组合
                for i, pred in enumerate(predictions, 1):
                    strategy_name = pred.get('strategy_name', pred.get('strategy', '未知策略'))
                    
                    message += f"<b>组合 {i}: [{strategy_name}]</b>\n"
                    
                    if result['lottery_type'] == 'ssq':
                        red_str = ' '.join([f"{int(b):02d}" for b in pred['red_balls']])
                        message += f"🔴 红球: <code>{red_str}</code>\n"
                        message += f"🔵 蓝球: <code>{int(pred['blue_ball']):02d}</code>\n\n"
                    else:  # dlt
                        front_str = ' '.join([f"{int(b):02d}" for b in pred['front_balls']])
                        back_str = ' '.join([f"{int(b):02d}" for b in pred['back_balls']])
                        message += f"🔴 前区: <code>{front_str}</code>\n"
                        message += f"🔵 后区: <code>{back_str}</code>\n\n"
                
                message += "━━━━━━━━━━━━━━━\n"
                message += "⚠️ 仅供参考，理性购彩"
                
                # 发送单个彩票类型的消息
                telegram.send_message(message)
                logger.info(f"✓ {result['lottery_name']} Telegram 通知已发送")
            
        except Exception as e:
            logger.error(f"发送 Telegram 通知失败: {e}", exc_info=True)
    
    logger.info("=" * 60)
    logger.info(f"定时任务结束: {datetime.now()}")
    logger.info("=" * 60 + "\n")


def start_schedule(lottery_type: str = None):
    """启动定时任务
    
    Args:
        lottery_type: 彩票类型，如果为 None 则处理所有类型
    """
    # 使用通用日志目录
    log_dir = LOG_DIR / 'schedule'
    log_dir.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / 'schedule.log'),
            logging.StreamHandler()
        ]
    )
    
    scheduler = BlockingScheduler()
    
    # 每天晚上21:30执行（开奖后1小时）
    scheduler.add_job(
        fetch_latest_data,
        'cron',
        hour=21,
        minute=30
    )
    
    logger.info("=" * 60)
    logger.info("定时任务已启动 - 所有彩票类型")
    logger.info("执行时间: 每天 21:30")
    logger.info("处理类型: 双色球 + 大乐透")
    logger.info("按 Ctrl+C 停止")
    logger.info("=" * 60)
    
    # 启动时立即执行一次
    logger.info("\n首次执行...")
    fetch_latest_data()
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("\n定时任务已停止")
