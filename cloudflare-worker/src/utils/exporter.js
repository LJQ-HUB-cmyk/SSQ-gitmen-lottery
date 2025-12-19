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
    
    // 生成 CSV 文件（Excel 可以直接打开）
    const csvContent = this.generateCSV(type, data, lotteryName);
    const csvUrl = await this.uploadToR2(csvFileName, csvContent, 'text/csv; charset=utf-8');
    
    // 生成 SQL 文件（MySQL 格式）
    const sqlContent = this.generateSQL(type, data, lotteryName, 'mysql');
    const sqlUrl = await this.uploadToR2(sqlFileName, sqlContent, 'text/plain');
    
    // 生成 SQLite 格式的 SQL 文件
    const sqliteContent = this.generateSQL(type, data, lotteryName, 'sqlite');
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
    const insertCmd = isSQLite ? 'INSERT OR IGNORE' : 'INSERT IGNORE';
    
    let sql = `-- ${lotteryName} 数据导出\n`;
    sql += `-- 导出时间: ${new Date().toISOString()}\n`;
    sql += `-- 数据条数: ${data.length}\n`;
    sql += `-- 数据库格式: ${format.toUpperCase()}\n\n`;
    
    // 根据彩票类型生成对应的表结构和数据
    const tableConfigs = {
      ssq: {
        tableName: 'ssq_lottery',
        columns: isSQLite 
          ? ['lottery_no TEXT', 'draw_date TEXT', 'red1 TEXT', 'red2 TEXT', 'red3 TEXT', 'red4 TEXT', 'red5 TEXT', 'red6 TEXT', 'blue TEXT', 'sorted_code TEXT']
          : ['lottery_no VARCHAR(20)', 'draw_date DATE', 'red1 VARCHAR(2)', 'red2 VARCHAR(2)', 'red3 VARCHAR(2)', 'red4 VARCHAR(2)', 'red5 VARCHAR(2)', 'red6 VARCHAR(2)', 'blue VARCHAR(2)', 'sorted_code VARCHAR(50)'],
        fields: ['lottery_no', 'draw_date', 'red1', 'red2', 'red3', 'red4', 'red5', 'red6', 'blue', 'sorted_code']
      },
      dlt: {
        tableName: 'dlt_lottery',
        columns: isSQLite
          ? ['lottery_no TEXT', 'draw_date TEXT', 'front1 TEXT', 'front2 TEXT', 'front3 TEXT', 'front4 TEXT', 'front5 TEXT', 'back1 TEXT', 'back2 TEXT', 'sorted_code TEXT']
          : ['lottery_no VARCHAR(20)', 'draw_date DATE', 'front1 VARCHAR(2)', 'front2 VARCHAR(2)', 'front3 VARCHAR(2)', 'front4 VARCHAR(2)', 'front5 VARCHAR(2)', 'back1 VARCHAR(2)', 'back2 VARCHAR(2)', 'sorted_code VARCHAR(50)'],
        fields: ['lottery_no', 'draw_date', 'front1', 'front2', 'front3', 'front4', 'front5', 'back1', 'back2', 'sorted_code']
      },
      qxc: {
        tableName: 'qxc_lottery',
        columns: isSQLite
          ? ['lottery_no TEXT', 'draw_date TEXT', 'num1 TEXT', 'num2 TEXT', 'num3 TEXT', 'num4 TEXT', 'num5 TEXT', 'num6 TEXT', 'num7 TEXT', 'sorted_code TEXT']
          : ['lottery_no VARCHAR(20)', 'draw_date DATE', 'num1 VARCHAR(2)', 'num2 VARCHAR(2)', 'num3 VARCHAR(2)', 'num4 VARCHAR(2)', 'num5 VARCHAR(2)', 'num6 VARCHAR(2)', 'num7 VARCHAR(2)', 'sorted_code VARCHAR(50)'],
        fields: ['lottery_no', 'draw_date', 'num1', 'num2', 'num3', 'num4', 'num5', 'num6', 'num7', 'sorted_code']
      },
      qlc: {
        tableName: 'qlc_lottery',
        columns: isSQLite
          ? ['lottery_no TEXT', 'draw_date TEXT', 'basic1 TEXT', 'basic2 TEXT', 'basic3 TEXT', 'basic4 TEXT', 'basic5 TEXT', 'basic6 TEXT', 'basic7 TEXT', 'special TEXT', 'sorted_code TEXT']
          : ['lottery_no VARCHAR(20)', 'draw_date DATE', 'basic1 VARCHAR(2)', 'basic2 VARCHAR(2)', 'basic3 VARCHAR(2)', 'basic4 VARCHAR(2)', 'basic5 VARCHAR(2)', 'basic6 VARCHAR(2)', 'basic7 VARCHAR(2)', 'special VARCHAR(2)', 'sorted_code VARCHAR(50)'],
        fields: ['lottery_no', 'draw_date', 'basic1', 'basic2', 'basic3', 'basic4', 'basic5', 'basic6', 'basic7', 'special', 'sorted_code']
      }
    };
    
    const config = tableConfigs[type];
    if (!config) {
      throw new Error(`不支持的彩票类型: ${type}`);
    }
    
    // 生成 CREATE TABLE 语句
    sql += `-- ${lotteryName}数据表\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${config.tableName} (\n`;
    
    if (isSQLite) {
      sql += `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    } else {
      sql += `  id INT AUTO_INCREMENT PRIMARY KEY,\n`;
    }
    
    sql += `  ${config.columns.map(col => col + ' NOT NULL').join(',\n  ')},\n`;
    
    if (isSQLite) {
      sql += `  created_at TEXT DEFAULT (datetime('now')),\n`;
      sql += `  updated_at TEXT DEFAULT (datetime('now')),\n`;
      sql += `  UNIQUE(lottery_no)\n`;
      sql += `);\n\n`;
    } else {
      sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
      sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
      sql += `  UNIQUE KEY unique_lottery_no (lottery_no)\n`;
      sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    }
    
    // 生成 INSERT 语句
    for (const row of data) {
      const values = config.fields.map(field => {
        const value = row[field];
        return `'${this.escapeSql(value)}'`;
      }).join(', ');
      
      sql += `${insertCmd} INTO ${config.tableName} (${config.fields.join(', ')}) VALUES (${values});\n`;
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
