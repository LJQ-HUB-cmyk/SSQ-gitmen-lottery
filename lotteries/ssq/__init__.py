"""
双色球 (Super Lotto) 模块
"""

from .spider import SSQSpider
from .database import SSQDatabase, SSQR2Storage
from .predictor import SSQPredictor, SSQStatistics
from .config import SSQ_RULES, PREDICTION_STRATEGIES

__all__ = [
    'SSQSpider',
    'SSQDatabase',
    'SSQR2Storage',
    'SSQPredictor',
    'SSQStatistics',
    'SSQ_RULES',
    'PREDICTION_STRATEGIES'
]

__version__ = '1.0.0'
