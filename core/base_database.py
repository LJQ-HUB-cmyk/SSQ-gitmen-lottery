"""
公共数据库基类
提供数据库连接、SSL配置等通用功能
"""

try:
    import pymysql
except ImportError as e:
    raise ImportError("PyMySQL 未安装。请运行 `pip install PyMySQL` 或 `pip install -r requirements.txt`. 错误详情: " + str(e))

import logging
import os
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class BaseDatabase:
    """数据库基类，提供通用的连接和配置功能"""

    def __init__(self, db_config: Dict):
        """
        初始化数据库连接

        Args:
            db_config: 数据库配置 {
                'host': 'localhost',
                'port': 3306,
                'user': 'root',
                'password': 'password',
                'database': 'lottery_db',
                'use_ssl': False,  # 可选
                'ssl_ca': '/path/to/ca.pem'  # 可选
            }
        """
        self.db_config = db_config
        self.connection = None

    def connect(self):
        """连接到数据库，使用连接池和安全配置"""
        try:
            params = {
                'host': self.db_config['host'],
                'port': self.db_config.get('port', 3306),
                'user': self.db_config['user'],
                'password': self.db_config['password'],
                'database': self.db_config['database'],
                'charset': 'utf8mb4',
                'autocommit': False,  # 显式控制事务
                'connect_timeout': 10,  # 连接超时
                'read_timeout': 30,  # 读取超时
                'write_timeout': 30,  # 写入超时
            }

            # 从配置或环境变量读取 SSL 设置
            use_ssl = self.db_config.get('use_ssl') or os.getenv('MYSQL_USE_SSL', 'false').lower() in ['1', 'true', 'yes']
            ssl_ca = self.db_config.get('ssl_ca') or os.getenv('MYSQL_SSL_CA')
            ssl_cert = self.db_config.get('ssl_cert') or os.getenv('MYSQL_SSL_CERT')
            ssl_key = self.db_config.get('ssl_key') or os.getenv('MYSQL_SSL_KEY')

            if use_ssl:
                ssl_args = {}
                if ssl_ca:
                    ssl_args['ca'] = ssl_ca
                if ssl_cert:
                    ssl_args['cert'] = ssl_cert
                if ssl_key:
                    ssl_args['key'] = ssl_key
                params['ssl'] = ssl_args or {}

            self.connection = pymysql.connect(**params)
            
            # 设置会话变量，优化性能
            with self.connection.cursor() as cursor:
                cursor.execute("SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO'")
                cursor.execute("SET SESSION time_zone='+08:00'")  # 设置时区
            
            logger.info("数据库连接成功")
        except pymysql.Error as e:
            logger.error(f"数据库连接失败: {e}")
            if 'insecure transport' in str(e).lower() or 'secure' in str(e).lower():
                logger.error("检测到目标数据库要求安全连接（TLS/SSL）。请在 .env 中添加 MYSQL_USE_SSL=true 并设置 MYSQL_SSL_CA=/path/to/ca.pem")
            raise
    
    def ensure_connection(self):
        """确保数据库连接有效，如果断开则重连"""
        try:
            if self.connection:
                self.connection.ping(reconnect=True)
        except:
            logger.warning("数据库连接已断开，正在重连...")
            self.connect()

    def close(self):
        """关闭数据库连接"""
        if self.connection:
            self.connection.close()
            logger.info("数据库连接已关闭")

    def execute_query(self, sql: str, params: tuple = None):
        """执行查询"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, params)
            return cursor
        except Exception as e:
            logger.error(f"执行查询失败: {e}")
            raise

    def get_total_count(self, table_name: str) -> int:
        """获取表中总记录数"""
        if not self.connection:
            self.connect()

        cursor = self.connection.cursor()
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row = cursor.fetchone()
            return int(row[0]) if row else 0
        finally:
            cursor.close()
