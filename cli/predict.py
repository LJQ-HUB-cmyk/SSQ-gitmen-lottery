"""
预测命令
"""

import logging
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
            logging.FileHandler(log_dir / 'predict.log'),
            logging.StreamHandler()
        ]
    )


def predict(lottery_type: str):
    """执行预测"""
    setup_logging(lottery_type)
    
    logger.info("=" * 60)
    logger.info(f"开始预测{LOTTERY_NAMES.get(lottery_type, lottery_type)}下一期号码")
    logger.info("=" * 60)
    
    try:
        if lottery_type == 'ssq':
            from lotteries.ssq.database import SSQDatabase
            from lotteries.ssq.predictor import SSQPredictor, SSQStatistics
            
            db = SSQDatabase(load_db_config())
            db.connect()
            
            # 获取历史数据
            lottery_data = db.get_all_lottery_data()
            
            if not lottery_data:
                logger.error("数据库中没有历史数据，请先运行爬取命令")
                db.close()
                return
            
            logger.info(f"使用 {len(lottery_data)} 条历史数据进行预测")
            
            # 创建预测器
            predictor = SSQPredictor(lottery_data)
            
            # 预测红球和蓝球
            predictions = predictor.predict(red_count=5, blue_count=1)
            
            # 显示预测结果
            logger.info("\n" + "=" * 60)
            logger.info("预测结果:")
            logger.info("=" * 60)
            
            for i, pred in enumerate(predictions, 1):
                red_str = ','.join([f"{x:02d}" for x in pred['red_balls']])
                blue_str = f"{pred['blue_ball']:02d}"
                logger.info(f"组合 {i}: 红球 {red_str} | 蓝球 {blue_str}")
            
            # 显示统计信息
            logger.info("\n" + "=" * 60)
            logger.info("历史数据统计")
            logger.info("=" * 60)
            
            stats = SSQStatistics(lottery_data)
            
            # 红球频率
            freq_data = stats.get_frequency()
            red_freq = freq_data['red_balls']
            top_red = sorted(red_freq.items(), key=lambda x: x[1], reverse=True)[:10]
            logger.info(f"红球频率前10: {[f'{k}({v})' for k, v in top_red]}")
            
            # 蓝球频率
            blue_freq = freq_data['blue_ball']
            top_blue = sorted(blue_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            logger.info(f"蓝球频率前5: {[f'{k}({v})' for k, v in top_blue]}")
            
            # 连号分析
            consecutive = stats.get_consecutive_analysis()
            logger.info(f"连号分析: {consecutive}")
            
            # 最新一期
            latest = db.get_latest_lottery()
            if latest:
                logger.info(f"\n最新一期: {latest['lottery_no']} ({latest['draw_date']})")
                red_str = ','.join([f"{x:02d}" for x in latest['red_balls']])
                logger.info(f"号码: {red_str} + {latest['blue_ball']:02d}")
            
            db.close()
            
        else:
            logger.error(f"暂不支持彩票类型: {lottery_type}")
            
    except Exception as e:
        logger.error(f"预测失败: {e}", exc_info=True)
