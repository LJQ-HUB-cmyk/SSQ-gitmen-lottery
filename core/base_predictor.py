"""
预测器基类
提供通用的预测框架
"""

import logging
from typing import List, Dict, Set
from collections import Counter
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BasePredictor(ABC):
    """预测器基类"""

    def __init__(self, lottery_data: List[Dict]):
        """
        初始化预测器

        Args:
            lottery_data: 历史中奖数据列表
        """
        self.lottery_data = lottery_data
        self._analyze_history()

    @abstractmethod
    def _analyze_history(self):
        """分析历史数据（子类实现）"""
        pass

    @abstractmethod
    def _is_valid_combination(self, numbers: List[int]) -> bool:
        """
        验证组合是否有效（子类实现）

        Args:
            numbers: 号码列表

        Returns:
            True表示有效
        """
        pass

    @abstractmethod
    def predict(self, **kwargs) -> List[Dict]:
        """
        执行预测（子类实现）

        Returns:
            预测结果列表
        """
        pass


class BaseStatistics(ABC):
    """统计分析基类"""

    def __init__(self, lottery_data: List[Dict]):
        """
        初始化统计器

        Args:
            lottery_data: 历史中奖数据列表
        """
        self.lottery_data = lottery_data

    @abstractmethod
    def get_frequency(self) -> Dict:
        """获取号码频率统计（子类实现）"""
        pass

    @abstractmethod
    def get_consecutive_analysis(self) -> Dict:
        """分析连号情况（子类实现）"""
        pass
