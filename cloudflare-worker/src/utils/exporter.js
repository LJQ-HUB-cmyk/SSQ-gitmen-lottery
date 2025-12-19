/**
 * 数据导出工具 - 支持导出为 CSV 和 SQL 文件
 */

export class DataExporter {
  constructor(db, r2Bucket) {
    this.db = db;
    this.r2Bucket = r2Bucket;
  }

  /**
   * 导出指定彩票类型的全量数据
   * @param {string} type - 彩票类型 (ssq, dlt, qxc, qlc)
   * @param {string} lotteryName - 彩票名称
   * @returns {Promise<{csv: string, sql: string, sqlite: string}>} 返回下载链接
   */
  async exportLotteryData(type, lotteryName) {
    console.log(`开始导出 ${lotteryName} 数据...`);
    
    // 获取全量数据
    const data = await this.getAllData(type);
    
    if (!data || data.length === 0) {
      throw new Error(`${lotteryName} 暂无数据可导出`);
    }
    
    console.log(`获取到 ${data.length} 条数据`);
    
    // 使用固定文件名，每次覆盖（保持最新）
    const csvFileName = `${type}/${type}_latest.csv`;
    const sqlFileName = `${type}/${type}_latest.sql`;
    const sqliteFileName = `${type}/${type}_latest.sqlite.sql`;
    
    // 生成 CSV 文件（Excel 可以直接打开）- 包含所有字段
    const csvContent = await this.generateCSV(type, data, lotteryName);
    const csvUrl = await this.uploadToR2(csvFileName, csvContent, 'text/csv; charset=utf-8');
    
    // 生成 SQL 文件（MySQL 格式）- 不包含 id
    const sqlContent = await this.generateSQL(type, data, lotteryName, 'mysql');
    const sqlUrl = await this.uploadToR2(sqlFileName, sqlContent, 'text/plain');
    
    // 生成 SQLite 格式的 SQL 文件 - 不包含 id
    const sqliteContent = await this.generateSQL(type, data, lotteryName, 'sqlite');
    const sqliteUrl = await this.uploadToR2(sqliteFileName, sqliteContent, 'text/plain');
    
    console.log(`✅ ${lotteryName} 数据导出完成`);
    
    return {
      csv: csvUrl,
      sql: sqlUrl,
      sqlite: sqliteUrl,
      count: data.length,
      exportTime: new Date().toISOString()
    };
  }

  /**
   * 获取指定类型的全量数据
   */
  async getAllData(type) {
    // 使用 Database 类的底层数据库对象
    const results = await this.db.db
      .prepare(`SELECT * FROM ${type}_lottery ORDER BY lottery_no ASC`)
      .all();
    
    return results.results || [];
  }

  /**
   * 获取表的所有列名（动态获取 schema）
   */
  async getTableColumns(type) {
    const tableName = `${type}_lottery`;
    
    // 从第一行数据获取所有列名
    const result = await this.db.db
      .prepare(`SELECT * FROM ${tableName} LIMIT 1`)
      .first();
    
    if (!result) {
      // 如果没有数据，从 schema 获取
      const schema = await this.db.db
        .prepare(`PRAGMA table_info(${tableName})`)
        .all();
      
      return schema.results.map(col => col.name);
    }
    
    return Object.keys(result);
  }

  /**
   * 生成 CSV 文件（Excel 可以直接打开）- 动态导出所有字段
   */
  async generateCSV(type, data, lotteryName) {
    if (!data || data.length === 0) {
      return '\uFEFF'; // 空文件
    }
    
    // 添加 BOM 以支持中文
    let csv = '\uFEFF';
    
    // 动态获取所有列名（从第一行数据）
    const columns = Object.keys(data[0]);
    
    // 写入表头（使用列名）
    csv += columns.join(',') + '\n';
    
    // 写入数据行
    for (const row of data) {
      const values = columns.map(col => {
        const value = row[col];
        // 处理可能包含逗号的字段，用引号包裹
        if (value === null || value === undefined) {
          return '';
        }
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      });
      csv += values.join(',') + '\n';
    }
    
    return csv;
  }

  /**
   * 生成 SQL 文件（支持 MySQL 和 SQLite）- 动态生成，不包含 id
   */
  async generateSQL(type, data, lotteryName, format = 'mysql') {
    if (!data || data.length === 0) {
      return `-- ${lotteryName} 数据导出\n-- 无数据\n`;
    }
    
    const isSQLite = format === 'sqlite';
    const insertCmd = isSQLite ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
    const tableName = `${type}_lottery`;
    
    let sql = `-- ${lotteryName} 数据导出\n`;
    sql += `-- 导出时间: ${new Date().toISOString()}\n`;
    sql += `-- 数据条数: ${data.length}\n`;
    sql += `-- 数据库格式: ${format.toUpperCase()}\n\n`;
    
    // 动态获取所有列名（排除 id）
    const allColumns = Object.keys(data[0]);
    const dataColumns = allColumns.filter(col => col !== 'id');
    
    // 生成 CREATE TABLE 语句（简化版，只包含基本结构）
    sql += `-- ${lotteryName}数据表\n`;
    sql += `-- 注意：此脚本仅包含 INSERT 语句，假设表结构已存在\n`;
    sql += `-- 如需完整表结构，请参考 schema.sql\n\n`;
    
    // 生成 INSERT 语句（不包含 id，让数据库自动生成）
    for (const row of data) {
      const values = dataColumns.map(field => {
        const value = row[field];
        if (value === null || value === undefined) {
          return 'NULL';
        }
        return `'${this.escapeSql(value)}'`;
      }).join(', ');
      
      sql += `${insertCmd} INTO ${tableName} (${dataColumns.join(', ')}) VALUES (${values});\n`;
    }
    
    return sql;
  }

  /**
   * 上传文件到 R2
   */
  async uploadToR2(fileName, content, contentType) {
    try {
      // 上传到 R2
      await this.r2Bucket.put(fileName, content, {
        httpMetadata: {
          contentType: contentType
        }
      });
      
      // 生成通过 Worker 访问的 URL
      const url = `https://cp.gitman.de5.net/download/${fileName}`;
      
      console.log(`文件已上传到 R2: ${fileName}`);
      return url;
    } catch (error) {
      console.error(`上传文件到 R2 失败: ${fileName}`, error);
      throw new Error(`上传失败: ${error.message}`);
    }
  }

  /**
   * 转义 SQL 特殊字符
   */
  escapeSql(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "''");
  }
}
