"""
公共工具函数
"""

import os
from dotenv import load_dotenv
from typing import Dict


def load_db_config() -> Dict:
    """
    从环境变量加载数据库配置

    Returns:
        数据库配置字典
    """
    load_dotenv()
    
    db_config = {
        'host': os.getenv('MYSQL_HOST'),
        'port': int(os.getenv('MYSQL_PORT', 3306)),
        'user': os.getenv('MYSQL_USER'),
        'password': os.getenv('MYSQL_PASSWORD'),
        'database': os.getenv('MYSQL_DATABASE')
    }
    
    # SSL配置
    if os.getenv('MYSQL_USE_SSL', 'false').lower() in ['1', 'true', 'yes']:
        db_config['use_ssl'] = True
        db_config['ssl_ca'] = os.getenv('MYSQL_SSL_CA')
    
    return db_config


def format_number(num: int, width: int = 2) -> str:
    """
    格式化数字为固定宽度的字符串

    Args:
        num: 数字
        width: 宽度

    Returns:
        格式化后的字符串
    """
    return f"{num:0{width}d}"


def has_consecutive_numbers(numbers: list, max_consecutive: int = 3) -> bool:
    """
    检查列表中是否有超过指定数量的连号

    Args:
        numbers: 数字列表（已排序）
        max_consecutive: 最大连号数量

    Returns:
        True表示有超过max_consecutive个连号
    """
    if len(numbers) < max_consecutive:
        return False
    
    consecutive_count = 1
    for i in range(1, len(numbers)):
        if numbers[i] == numbers[i-1] + 1:
            consecutive_count += 1
            if consecutive_count >= max_consecutive:
                return True
        else:
            consecutive_count = 1
    
    return False
