#!/usr/bin/env python
"""
数据导出模块
支持导出为 CSV、MySQL SQL、SQLite SQL 格式
复用现有的 Database 类，符合项目架构设计
"""

import csv
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import pymysql

from core.config import SUPPORTED_LOTTERIES, LOTTERY_NAMES
from core.utils import load_db_config

logger = logging.getLogger(__name__)


def get_database_instance(lottery_type: str):
    """
    获取对应彩票类型的 Database 实例（复用现有代码）
    
    Args:
        lottery_type: 彩票类型
        
    Returns:
        Database 实例
    """
    db_config = load_db_config()
    
    if lottery_type == 'ssq':
        from lotteries.ssq.database import SSQDatabase
        return SSQDatabase(db_config)
    elif lottery_type == 'dlt':
        from lotteries.dlt.database import DLTDatabase
        return DLTDatabase(db_config)
    elif lottery_type == 'qxc':
        from lotteries.qxc.database import QXCDatabase
        return QXCDatabase(db_config)
    elif lottery_type == 'qlc':
        from lotteries.qlc.database import QLCDatabase
        return QLCDatabase(db_config)
    else:
        raise ValueError(f"不支持的彩票类型: {lottery_type}")


class DataExporter:
    """数据导出类（复用现有 Database 类）"""
    
    def __init__(self, lottery_type: str):
        """
        初始化导出器
        
        Args:
            lottery_type: 彩票类型 (ssq, dlt, qxc, qlc)
        """
        if lottery_type not in SUPPORTED_LOTTERIES:
            raise ValueError(f"不支持的彩票类型: {lottery_type}")
        
        # 安全检查：确保 lottery_type 只包含字母（防止 SQL 注入）
        if not lottery_type.isalpha():
            raise ValueError(f"无效的彩票类型格式: {lottery_type}")
        
        self.lottery_type = lottery_type
        self.lottery_name = LOTTERY_NAMES[lottery_type]
        self.table_name = f"{lottery_type}_lottery"
        
        # 复用现有的 Database 类
        self.db = get_database_instance(lottery_type)
        
        # 导出目录
        self.export_dir = Path('data/export')
        self.export_dir.mkdir(parents=True, exist_ok=True)
    
    def get_all_data(self) -> List[Dict]:
        """
        获取全量数据（直接从数据库读取原始数据）
        
        Returns:
            数据列表
        """
        if not self.db.connection:
            self.db.connect()
        
        cursor = self.db.connection.cursor(pymysql.cursors.DictCursor)
        
        try:
            cursor.execute(f"SELECT * FROM {self.table_name} ORDER BY lottery_no ASC")
            data = cursor.fetchall()
            logger.info(f"获取到 {len(data)} 条数据")
            return data
        finally:
            cursor.close()
    
    def export_csv(self, data: List[Dict], filename: str) -> str:
        """
        导出为 CSV 文件（包含所有字段，包括 id）
        
        Args:
            data: 数据列表
            filename: 文件名
            
        Returns:
            文件路径
        """
        if not data:
            logger.warning("没有数据可导出")
            return None
        
        filepath = self.export_dir / filename
        
        # 动态获取所有列名（从第一行数据）
        columns = list(data[0].keys())
        
        with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=columns)
            writer.writeheader()
            writer.writerows(data)
        
        logger.info(f"CSV 文件已导出: {filepath}")
        return str(filepath)
    
    def export_sql(self, data: List[Dict], filename: str, format: str = 'mysql') -> str:
        """
        导出为 SQL 文件（不包含 id，包含 DROP TABLE + CREATE TABLE + INSERT）
        
        Args:
            data: 数据列表
            filename: 文件名
            format: 数据库格式 (mysql 或 sqlite)
            
        Returns:
            文件路径
        """
        if not data:
            logger.warning("没有数据可导出")
            return None
        
        filepath = self.export_dir / filename
        is_sqlite = format == 'sqlite'
        
        # 动态获取所有列名（排除 id）
        all_columns = list(data[0].keys())
        data_columns = [col for col in all_columns if col != 'id']
        
        with open(filepath, 'w', encoding='utf-8') as f:
            # 文件头
            f.write(f"-- {self.lottery_name} 数据导出\n")
            f.write(f"-- 导出时间: {datetime.now().isoformat()}\n")
            f.write(f"-- 数据条数: {len(data)}\n")
            f.write(f"-- 数据库格式: {format.upper()}\n\n")
            
            # 删除旧表
            f.write(f"-- 删除旧表（如果存在）\n")
            f.write(f"DROP TABLE IF EXISTS {self.table_name};\n\n")
            
            # 创建表
            f.write(f"-- 创建 {self.lottery_name} 数据表\n")
            f.write(self._generate_create_table(data_columns, format))
            f.write("\n")
            
            # 插入数据
            f.write(f"-- 插入数据\n")
            for row in data:
                values = []
                for col in data_columns:
                    value = row[col]
                    if value is None:
                        values.append('NULL')
                    else:
                        # 转义单引号
                        escaped_value = str(value).replace("'", "''")
                        values.append(f"'{escaped_value}'")
                
                f.write(f"INSERT INTO {self.table_name} ({', '.join(data_columns)}) VALUES ({', '.join(values)});\n")
        
        logger.info(f"SQL 文件已导出: {filepath}")
        return str(filepath)
    
    def _generate_create_table(self, columns: List[str], format: str = 'mysql') -> str:
        """
        动态生成 CREATE TABLE 语句
        
        Args:
            columns: 列名列表（不包含 id）
            format: 数据库格式 (mysql 或 sqlite)
            
        Returns:
            CREATE TABLE SQL 语句
        """
        is_sqlite = format == 'sqlite'
        sql = f"CREATE TABLE IF NOT EXISTS {self.table_name} (\n"
        
        # id 字段（自增主键）
        if is_sqlite:
            sql += "    id INTEGER PRIMARY KEY AUTOINCREMENT,\n"
        else:
            sql += "    id INT AUTO_INCREMENT PRIMARY KEY,\n"
        
        # 动态添加其他字段
        for col in columns:
            col_type = 'TEXT'
            constraints = ''
            
            if not is_sqlite:
                # MySQL 类型
                if col == 'lottery_no':
                    col_type = 'VARCHAR(20)'
                    constraints = ' UNIQUE NOT NULL'
                elif col == 'draw_date':
                    col_type = 'DATE'
                    constraints = ' NOT NULL'
                elif col == 'sorted_code':
                    col_type = 'VARCHAR(100)'
                    constraints = ' NOT NULL'
                elif col in ['sales', 'pool_money']:
                    col_type = 'BIGINT'
                elif col == 'created_at':
                    col_type = 'TIMESTAMP'
                    constraints = ' DEFAULT CURRENT_TIMESTAMP'
                elif col == 'updated_at':
                    col_type = 'TIMESTAMP'
                    constraints = ' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                else:
                    col_type = 'VARCHAR(10)'
                    constraints = ' NOT NULL'
            else:
                # SQLite 类型
                if col == 'lottery_no':
                    constraints = ' UNIQUE NOT NULL'
                elif col in ['draw_date', 'sorted_code']:
                    constraints = ' NOT NULL'
                elif col in ['created_at', 'updated_at']:
                    constraints = " DEFAULT (datetime('now'))"
                else:
                    constraints = ' NOT NULL'
            
            sql += f"    {col} {col_type}{constraints},\n"
        
        # 移除最后的逗号
        sql = sql.rstrip(',\n') + '\n'
        sql += ");\n"
        
        # 添加索引
        if is_sqlite:
            # SQLite 支持 IF NOT EXISTS
            sql += f"\nCREATE INDEX IF NOT EXISTS idx_{self.lottery_type}_lottery_no ON {self.table_name}(lottery_no);\n"
            sql += f"CREATE INDEX IF NOT EXISTS idx_{self.lottery_type}_draw_date ON {self.table_name}(draw_date);\n"
            sql += f"CREATE INDEX IF NOT EXISTS idx_{self.lottery_type}_sorted_code ON {self.table_name}(sorted_code);\n"
        else:
            # MySQL: 表已经 DROP 了，索引也删除了，直接 CREATE 即可
            sql += f"\nCREATE INDEX idx_{self.lottery_type}_lottery_no ON {self.table_name}(lottery_no);\n"
            sql += f"CREATE INDEX idx_{self.lottery_type}_draw_date ON {self.table_name}(draw_date);\n"
            sql += f"CREATE INDEX idx_{self.lottery_type}_sorted_code ON {self.table_name}(sorted_code);\n"
        
        return sql
    
    def export_all(self) -> Dict[str, str]:
        """
        导出所有格式（CSV + MySQL SQL + SQLite SQL）
        
        Returns:
            文件路径字典 {csv: path, sql: path, sqlite: path}
        """
        logger.info(f"开始导出 {self.lottery_name} 数据...")
        
        try:
            # 获取全量数据
            data = self.get_all_data()
            
            if not data:
                logger.warning(f"{self.lottery_name} 暂无数据可导出")
                return {}
            
            # 生成文件名（固定名称，每次覆盖）
            csv_filename = f"{self.lottery_type}_latest.csv"
            sql_filename = f"{self.lottery_type}_latest.sql"
            sqlite_filename = f"{self.lottery_type}_latest.sqlite.sql"
            
            # 导出 CSV
            csv_path = self.export_csv(data, csv_filename)
            
            # 导出 MySQL SQL
            sql_path = self.export_sql(data, sql_filename, format='mysql')
            
            # 导出 SQLite SQL
            sqlite_path = self.export_sql(data, sqlite_filename, format='sqlite')
            
            logger.info(f"✅ {self.lottery_name} 数据导出完成")
            
            return {
                'csv': csv_path,
                'sql': sql_path,
                'sqlite': sqlite_path,
                'count': len(data),
                'export_time': datetime.now().isoformat()
            }
        
        finally:
            self.db.close()


def export_lottery(lottery_type: str) -> Dict[str, str]:
    """
    导出指定彩票类型的数据
    
    Args:
        lottery_type: 彩票类型 (ssq, dlt, qxc, qlc)
        
    Returns:
        导出结果
    """
    exporter = DataExporter(lottery_type)
    return exporter.export_all()


def export_all_lotteries() -> Dict[str, Dict]:
    """
    导出所有彩票类型的数据
    
    Returns:
        导出结果字典
    """
    results = {}
    
    for lottery_type in SUPPORTED_LOTTERIES:
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"导出 {LOTTERY_NAMES[lottery_type]}")
            logger.info(f"{'='*60}")
            
            result = export_lottery(lottery_type)
            results[lottery_type] = result
            
        except Exception as e:
            logger.error(f"导出 {LOTTERY_NAMES[lottery_type]} 失败: {e}")
            results[lottery_type] = {'error': str(e)}
    
    return results


if __name__ == '__main__':
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 导出所有彩票类型
    results = export_all_lotteries()
    
    # 打印结果
    print("\n" + "="*60)
    print("导出完成")
    print("="*60)
    for lottery_type, result in results.items():
        if 'error' in result:
            print(f"{LOTTERY_NAMES[lottery_type]}: ❌ {result['error']}")
        else:
            print(f"{LOTTERY_NAMES[lottery_type]}: ✅ {result['count']} 条数据")
            print(f"  CSV: {result['csv']}")
            print(f"  SQL: {result['sql']}")
            print(f"  SQLite: {result['sqlite']}")
