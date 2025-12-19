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
    const insertCmd = isSQLite ? 'INSERT' : 'INSERT';
    const tableName = `${type}_lottery`;
    
    let sql = `-- ${lotteryName} 数据导出\n`;
    sql += `-- 导出时间: ${new Date().toISOString()}\n`;
    sql += `-- 数据条数: ${data.length}\n`;
    sql += `-- 数据库格式: ${format.toUpperCase()}\n\n`;
    
    // 动态获取所有列名（排除 id）
    const allColumns = Object.keys(data[0]);
    const dataColumns = allColumns.filter(col => col !== 'id');
    
    // 删除旧表并重新创建
    sql += `-- 删除旧表（如果存在）\n`;
    sql += `DROP TABLE IF EXISTS ${tableName};\n\n`;
    
    // 生成 CREATE TABLE 语句
    sql += `-- 创建 ${lotteryName} 数据表\n`;
    sql += this.generateCreateTable(type, dataColumns, format);
    sql += `\n`;
    
    // 生成 INSERT 语句（不包含 id，让数据库自动生成）
    sql += `-- 插入数据\n`;
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
   * 动态生成 CREATE TABLE 语句
   */
  generateCreateTable(type, columns, format = 'mysql') {
    const isSQLite = format === 'sqlite';
    const tableName = `${type}_lottery`;
    
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    // id 字段（自增主键）
    if (isSQLite) {
      sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    } else {
      sql += `    id INT AUTO_INCREMENT PRIMARY KEY,\n`;
    }
    
    // 动态添加其他字段
    for (const col of columns) {
      // 根据字段名推断类型
      let colType = 'TEXT';
      let constraints = '';
      
      if (!isSQLite) {
        // MySQL 类型
        if (col === 'lottery_no') {
          colType = 'VARCHAR(20)';
          constraints = ' UNIQUE NOT NULL';
        } else if (col === 'draw_date') {
          colType = 'VARCHAR(20)';
          constraints = ' NOT NULL';
        } else if (col === 'sorted_code') {
          colType = 'VARCHAR(100)';
          constraints = ' NOT NULL';
        } else if (col.includes('created_at') || col.includes('updated_at')) {
          colType = 'DATETIME';
          constraints = col.includes('created_at') ? ' DEFAULT CURRENT_TIMESTAMP' : ' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';
        } else {
          colType = 'VARCHAR(10)';
          constraints = ' NOT NULL';
        }
      } else {
        // SQLite 类型
        if (col === 'lottery_no') {
          constraints = ' UNIQUE NOT NULL';
        } else if (col === 'draw_date' || col === 'sorted_code') {
          constraints = ' NOT NULL';
        } else if (col.includes('created_at') || col.includes('updated_at')) {
          constraints = " DEFAULT (datetime('now'))";
        } else {
          constraints = ' NOT NULL';
        }
      }
      
      sql += `    ${col} ${colType}${constraints},\n`;
    }
    
    // 移除最后的逗号
    sql = sql.slice(0, -2) + '\n';
    sql += `);\n`;
    
    // 添加索引（根据数据库类型使用不同语法）
    if (isSQLite) {
      // SQLite 支持 IF NOT EXISTS
      sql += `\nCREATE INDEX IF NOT EXISTS idx_${type}_lottery_no ON ${tableName}(lottery_no);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_${type}_draw_date ON ${tableName}(draw_date);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_${type}_sorted_code ON ${tableName}(sorted_code);\n`;
    } else {
      // MySQL 不支持 IF NOT EXISTS，使用 DROP + CREATE
      sql += `\nDROP INDEX IF EXISTS idx_${type}_lottery_no ON ${tableName};\n`;
      sql += `CREATE INDEX idx_${type}_lottery_no ON ${tableName}(lottery_no);\n`;
      sql += `DROP INDEX IF EXISTS idx_${type}_draw_date ON ${tableName};\n`;
      sql += `CREATE INDEX idx_${type}_draw_date ON ${tableName}(draw_date);\n`;
      sql += `DROP INDEX IF EXISTS idx_${type}_sorted_code ON ${tableName};\n`;
      sql += `CREATE INDEX idx_${type}_sorted_code ON ${tableName}(sorted_code);\n`;
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
