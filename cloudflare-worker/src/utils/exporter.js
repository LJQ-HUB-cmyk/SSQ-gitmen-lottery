/**
 * 数据导出工具 - 支持导出为 Excel 和 SQL 文件
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
   * @returns {Promise<{excel: string, sql: string}>} 返回下载链接
   */
  async exportLotteryData(type, lotteryName) {
    console.log(`开始导出 ${lotteryName} 数据...`);
    
    // 获取全量数据
    const data = await this.getAllData(type);
    
    if (!data || data.length === 0) {
      throw new Error(`${lotteryName} 暂无数据可导出`);
    }
    
    console.log(`获取到 ${data.length} 条数据`);
    
    // 生成文件路径：彩票类型/日期/文件名
    const now = new Date();
    const date = now.toISOString().substring(0, 10); // YYYY-MM-DD
    const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const csvFileName = `${type}/${date}/${type}_lottery_${timestamp}.csv`;
    const sqlFileName = `${type}/${date}/${type}_lottery_${timestamp}.sql`;
    
    // 生成 CSV 文件（Excel 可以直接打开）
    const csvContent = this.generateCSV(type, data, lotteryName);
    const csvUrl = await this.uploadToR2(csvFileName, csvContent, 'text/csv; charset=utf-8');
    
    // 生成 SQL 文件（MySQL 格式）
    const sqlContent = this.generateSQL(type, data, lotteryName, 'mysql');
    const sqlUrl = await this.uploadToR2(sqlFileName, sqlContent, 'text/plain');
    
    // 生成 SQLite 格式的 SQL 文件
    const sqliteFileName = `${type}/${date}/${type}_lottery_${timestamp}.sqlite.sql`;
    const sqliteContent = this.generateSQL(type, data, lotteryName, 'sqlite');
    const sqliteUrl = await this.uploadToR2(sqliteFileName, sqliteContent, 'text/plain');
    
    console.log(`✅ ${lotteryName} 数据导出完成`);
    
    return {
      csv: csvUrl,
      sql: sqlUrl,
      sqlite: sqliteUrl,
      count: data.length,
      timestamp: timestamp
    };
  }

  /**
   * 获取指定类型的全量数据
   */
  async getAllData(type) {
    // 使用 Database 类的 getAll 方法，但需要获取所有数据
    // 由于 getAll 有 limit 参数，我们需要直接访问底层数据库
    const results = await this.db.db
      .prepare(`SELECT * FROM ${type}_lottery ORDER BY lottery_no ASC`)
      .all();
    
    return results.results || [];
  }

  /**
   * 生成 CSV 文件（Excel 可以直接打开）
   */
  generateCSV(type, data, lotteryName) {
    // 添加 BOM 以支持中文
    let csv = '\uFEFF';
    
    // 表头
    if (type === 'ssq') {
      csv += '期号,开奖日期,红球1,红球2,红球3,红球4,红球5,红球6,蓝球\n';
      for (const row of data) {
        csv += `${row.lottery_no},${row.draw_date},${row.red1},${row.red2},${row.red3},${row.red4},${row.red5},${row.red6},${row.blue}\n`;
      }
    } else if (type === 'dlt') {
      csv += '期号,开奖日期,前区1,前区2,前区3,前区4,前区5,后区1,后区2\n';
      for (const row of data) {
        csv += `${row.lottery_no},${row.draw_date},${row.front1},${row.front2},${row.front3},${row.front4},${row.front5},${row.back1},${row.back2}\n`;
      }
    } else if (type === 'qxc') {
      csv += '期号,开奖日期,号码1,号码2,号码3,号码4,号码5,号码6,号码7\n';
      for (const row of data) {
        csv += `${row.lottery_no},${row.draw_date},${row.num1},${row.num2},${row.num3},${row.num4},${row.num5},${row.num6},${row.num7}\n`;
      }
    } else if (type === 'qlc') {
      csv += '期号,开奖日期,基本号1,基本号2,基本号3,基本号4,基本号5,基本号6,基本号7,特别号\n';
      for (const row of data) {
        csv += `${row.lottery_no},${row.draw_date},${row.basic1},${row.basic2},${row.basic3},${row.basic4},${row.basic5},${row.basic6},${row.basic7},${row.special}\n`;
      }
    }
    
    return csv;
  }

  /**
   * 生成 SQL 文件（支持 MySQL 和 SQLite）
   */
  generateSQL(type, data, lotteryName, format = 'mysql') {
    const isSQLite = format === 'sqlite';
    
    let sql = `-- ${lotteryName} 数据导出\n`;
    sql += `-- 导出时间: ${new Date().toISOString()}\n`;
    sql += `-- 数据条数: ${data.length}\n`;
    sql += `-- 数据库格式: ${format.toUpperCase()}\n\n`;
    
    if (type === 'ssq') {
      sql += `-- 双色球数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS ssq_lottery (\n`;
      
      if (isSQLite) {
        sql += `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
        sql += `  lottery_no TEXT UNIQUE NOT NULL,\n`;
        sql += `  draw_date TEXT NOT NULL,\n`;
        sql += `  red1 TEXT NOT NULL,\n`;
        sql += `  red2 TEXT NOT NULL,\n`;
        sql += `  red3 TEXT NOT NULL,\n`;
        sql += `  red4 TEXT NOT NULL,\n`;
        sql += `  red5 TEXT NOT NULL,\n`;
        sql += `  red6 TEXT NOT NULL,\n`;
        sql += `  blue TEXT NOT NULL,\n`;
        sql += `  sorted_code TEXT NOT NULL,\n`;
        sql += `  created_at TEXT DEFAULT (datetime('now')),\n`;
        sql += `  updated_at TEXT DEFAULT (datetime('now'))\n`;
        sql += `);\n\n`;
      } else {
        sql += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
      sql += `  lottery_no VARCHAR(20) UNIQUE NOT NULL,\n`;
      sql += `  draw_date DATE NOT NULL,\n`;
      sql += `  red1 VARCHAR(2) NOT NULL,\n`;
      sql += `  red2 VARCHAR(2) NOT NULL,\n`;
      sql += `  red3 VARCHAR(2) NOT NULL,\n`;
      sql += `  red4 VARCHAR(2) NOT NULL,\n`;
      sql += `  red5 VARCHAR(2) NOT NULL,\n`;
      sql += `  red6 VARCHAR(2) NOT NULL,\n`;
      sql += `  blue VARCHAR(2) NOT NULL,\n`;
      sql += `  sorted_code VARCHAR(50) NOT NULL,\n`;
      sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
      sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n`;
      sql += isSQLite ? `);\n\n` : `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
      
      const insertCmd = isSQLite ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
      for (const row of data) {
        sql += `${insertCmd} INTO ssq_lottery (lottery_no, draw_date, red1, red2, red3, red4, red5, red6, blue, sorted_code) VALUES `;
        sql += `('${this.escapeSql(row.lottery_no)}', '${this.escapeSql(row.draw_date)}', `;
        sql += `'${row.red1}', '${row.red2}', '${row.red3}', '${row.red4}', '${row.red5}', '${row.red6}', `;
        sql += `'${row.blue}', '${this.escapeSql(row.sorted_code)}');\n`;
      }
    } else if (type === 'dlt') {
      sql += `-- 大乐透数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS dlt_lottery (\n`;
      
      if (isSQLite) {
        sql += `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
        sql += `  lottery_no TEXT UNIQUE NOT NULL,\n`;
        sql += `  draw_date TEXT NOT NULL,\n`;
        sql += `  front1 TEXT NOT NULL,\n`;
        sql += `  front2 TEXT NOT NULL,\n`;
        sql += `  front3 TEXT NOT NULL,\n`;
        sql += `  front4 TEXT NOT NULL,\n`;
        sql += `  front5 TEXT NOT NULL,\n`;
        sql += `  back1 TEXT NOT NULL,\n`;
        sql += `  back2 TEXT NOT NULL,\n`;
        sql += `  sorted_code TEXT NOT NULL,\n`;
        sql += `  created_at TEXT DEFAULT (datetime('now')),\n`;
        sql += `  updated_at TEXT DEFAULT (datetime('now'))\n`;
        sql += `);\n\n`;
      } else {
        sql += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
      sql += `  lottery_no VARCHAR(20) UNIQUE NOT NULL,\n`;
      sql += `  draw_date DATE NOT NULL,\n`;
      sql += `  front1 VARCHAR(2) NOT NULL,\n`;
      sql += `  front2 VARCHAR(2) NOT NULL,\n`;
      sql += `  front3 VARCHAR(2) NOT NULL,\n`;
      sql += `  front4 VARCHAR(2) NOT NULL,\n`;
      sql += `  front5 VARCHAR(2) NOT NULL,\n`;
      sql += `  back1 VARCHAR(2) NOT NULL,\n`;
      sql += `  back2 VARCHAR(2) NOT NULL,\n`;
      sql += `  sorted_code VARCHAR(50) NOT NULL,\n`;
      sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
      sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n`;
      sql += isSQLite ? `);\n\n` : `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
      
      const insertCmd = isSQLite ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
      for (const row of data) {
        sql += `${insertCmd} INTO dlt_lottery (lottery_no, draw_date, front1, front2, front3, front4, front5, back1, back2, sorted_code) VALUES `;
        sql += `('${this.escapeSql(row.lottery_no)}', '${this.escapeSql(row.draw_date)}', `;
        sql += `'${row.front1}', '${row.front2}', '${row.front3}', '${row.front4}', '${row.front5}', `;
        sql += `'${row.back1}', '${row.back2}', '${this.escapeSql(row.sorted_code)}');\n`;
      }
    } else if (type === 'qxc') {
      sql += `-- 七星彩数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS qxc_lottery (\n`;
      
      if (isSQLite) {
        sql += `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
        sql += `  lottery_no TEXT UNIQUE NOT NULL,\n`;
        sql += `  draw_date TEXT NOT NULL,\n`;
        sql += `  num1 TEXT NOT NULL,\n`;
        sql += `  num2 TEXT NOT NULL,\n`;
        sql += `  num3 TEXT NOT NULL,\n`;
        sql += `  num4 TEXT NOT NULL,\n`;
        sql += `  num5 TEXT NOT NULL,\n`;
        sql += `  num6 TEXT NOT NULL,\n`;
        sql += `  num7 TEXT NOT NULL,\n`;
        sql += `  sorted_code TEXT NOT NULL,\n`;
        sql += `  created_at TEXT DEFAULT (datetime('now')),\n`;
        sql += `  updated_at TEXT DEFAULT (datetime('now'))\n`;
        sql += `);\n\n`;
      } else {
        sql += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
      sql += `  lottery_no VARCHAR(20) UNIQUE NOT NULL,\n`;
      sql += `  draw_date DATE NOT NULL,\n`;
      sql += `  num1 VARCHAR(2) NOT NULL,\n`;
      sql += `  num2 VARCHAR(2) NOT NULL,\n`;
      sql += `  num3 VARCHAR(2) NOT NULL,\n`;
      sql += `  num4 VARCHAR(2) NOT NULL,\n`;
      sql += `  num5 VARCHAR(2) NOT NULL,\n`;
      sql += `  num6 VARCHAR(2) NOT NULL,\n`;
      sql += `  num7 VARCHAR(2) NOT NULL,\n`;
      sql += `  sorted_code VARCHAR(50) NOT NULL,\n`;
      sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
      sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n`;
      sql += isSQLite ? `);\n\n` : `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
      
      const insertCmd = isSQLite ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
      for (const row of data) {
        sql += `${insertCmd} INTO qxc_lottery (lottery_no, draw_date, num1, num2, num3, num4, num5, num6, num7, sorted_code) VALUES `;
        sql += `('${this.escapeSql(row.lottery_no)}', '${this.escapeSql(row.draw_date)}', `;
        sql += `'${row.num1}', '${row.num2}', '${row.num3}', '${row.num4}', '${row.num5}', '${row.num6}', '${row.num7}', `;
        sql += `'${this.escapeSql(row.sorted_code)}');\n`;
      }
    } else if (type === 'qlc') {
      sql += `-- 七乐彩数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS qlc_lottery (\n`;
      
      if (isSQLite) {
        sql += `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
        sql += `  lottery_no TEXT UNIQUE NOT NULL,\n`;
        sql += `  draw_date TEXT NOT NULL,\n`;
        sql += `  basic1 TEXT NOT NULL,\n`;
        sql += `  basic2 TEXT NOT NULL,\n`;
        sql += `  basic3 TEXT NOT NULL,\n`;
        sql += `  basic4 TEXT NOT NULL,\n`;
        sql += `  basic5 TEXT NOT NULL,\n`;
        sql += `  basic6 TEXT NOT NULL,\n`;
        sql += `  basic7 TEXT NOT NULL,\n`;
        sql += `  special TEXT NOT NULL,\n`;
        sql += `  sorted_code TEXT NOT NULL,\n`;
        sql += `  created_at TEXT DEFAULT (datetime('now')),\n`;
        sql += `  updated_at TEXT DEFAULT (datetime('now'))\n`;
        sql += `);\n\n`;
      } else {
        sql += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
      sql += `  lottery_no VARCHAR(20) UNIQUE NOT NULL,\n`;
      sql += `  draw_date DATE NOT NULL,\n`;
      sql += `  basic1 VARCHAR(2) NOT NULL,\n`;
      sql += `  basic2 VARCHAR(2) NOT NULL,\n`;
      sql += `  basic3 VARCHAR(2) NOT NULL,\n`;
      sql += `  basic4 VARCHAR(2) NOT NULL,\n`;
      sql += `  basic5 VARCHAR(2) NOT NULL,\n`;
      sql += `  basic6 VARCHAR(2) NOT NULL,\n`;
      sql += `  basic7 VARCHAR(2) NOT NULL,\n`;
      sql += `  special VARCHAR(2) NOT NULL,\n`;
      sql += `  sorted_code VARCHAR(50) NOT NULL,\n`;
      sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
      sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n`;
      sql += isSQLite ? `);\n\n` : `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
      
      const insertCmd = isSQLite ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
      for (const row of data) {
        sql += `${insertCmd} INTO qlc_lottery (lottery_no, draw_date, basic1, basic2, basic3, basic4, basic5, basic6, basic7, special, sorted_code) VALUES `;
        sql += `('${this.escapeSql(row.lottery_no)}', '${this.escapeSql(row.draw_date)}', `;
        sql += `'${row.basic1}', '${row.basic2}', '${row.basic3}', '${row.basic4}', '${row.basic5}', '${row.basic6}', '${row.basic7}', `;
        sql += `'${row.special}', '${this.escapeSql(row.sorted_code)}');\n`;
      }
    }
    
    return sql;
  }

  /**
   * 上传文件到 R2
   */
  async uploadToR2(fileName, content, contentType) {
    try {
      // 将内容转换为字符串或 ArrayBuffer
      let buffer;
      if (typeof content === 'string') {
        buffer = content;
      } else {
        buffer = content;
      }
      
      // 上传到 R2
      await this.r2Bucket.put(fileName, buffer, {
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
