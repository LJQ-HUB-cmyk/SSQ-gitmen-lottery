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
    const excelFileName = `${type}/${date}/${type}_lottery_${timestamp}.xlsx`;
    const sqlFileName = `${type}/${date}/${type}_lottery_${timestamp}.sql`;
    
    // 生成 Excel 文件
    const excelBuffer = await this.generateExcel(type, data, lotteryName);
    const excelUrl = await this.uploadToR2(excelFileName, excelBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // 生成 SQL 文件
    const sqlContent = this.generateSQL(type, data, lotteryName);
    const sqlUrl = await this.uploadToR2(sqlFileName, sqlContent, 'text/plain');
    
    console.log(`✅ ${lotteryName} 数据导出完成`);
    
    return {
      excel: excelUrl,
      sql: sqlUrl,
      count: data.length,
      timestamp: timestamp
    };
  }

  /**
   * 获取指定类型的全量数据
   */
  async getAllData(type) {
    const results = await this.db
      .prepare(`SELECT * FROM ${type}_lottery ORDER BY lottery_no ASC`)
      .all();
    
    return results.results || [];
  }

  /**
   * 生成 Excel 文件（使用简单的 XML 格式）
   * 注意：这里使用 SpreadsheetML 格式，这是一种基于 XML 的 Excel 格式
   */
  async generateExcel(type, data, lotteryName) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += ` <Worksheet ss:Name="${lotteryName}">\n`;
    xml += '  <Table>\n';
    
    // 表头
    if (type === 'ssq') {
      xml += '   <Row>\n';
      xml += '    <Cell><Data ss:Type="String">期号</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">开奖日期</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">红球1</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">红球2</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">红球3</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">红球4</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">红球5</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">红球6</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">蓝球</Data></Cell>\n';
      xml += '   </Row>\n';
      
      // 数据行
      for (const row of data) {
        xml += '   <Row>\n';
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.lottery_no)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.draw_date)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.red1}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.red2}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.red3}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.red4}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.red5}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.red6}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.blue}</Data></Cell>\n`;
        xml += '   </Row>\n';
      }
    } else if (type === 'dlt') {
      xml += '   <Row>\n';
      xml += '    <Cell><Data ss:Type="String">期号</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">开奖日期</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">前区1</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">前区2</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">前区3</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">前区4</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">前区5</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">后区1</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">后区2</Data></Cell>\n';
      xml += '   </Row>\n';
      
      for (const row of data) {
        xml += '   <Row>\n';
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.lottery_no)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.draw_date)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.front1}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.front2}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.front3}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.front4}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.front5}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.back1}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.back2}</Data></Cell>\n`;
        xml += '   </Row>\n';
      }
    } else if (type === 'qxc') {
      xml += '   <Row>\n';
      xml += '    <Cell><Data ss:Type="String">期号</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">开奖日期</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">号码1</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">号码2</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">号码3</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">号码4</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">号码5</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">号码6</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">号码7</Data></Cell>\n';
      xml += '   </Row>\n';
      
      for (const row of data) {
        xml += '   <Row>\n';
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.lottery_no)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.draw_date)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.num1}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.num2}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.num3}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.num4}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.num5}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.num6}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.num7}</Data></Cell>\n`;
        xml += '   </Row>\n';
      }
    } else if (type === 'qlc') {
      xml += '   <Row>\n';
      xml += '    <Cell><Data ss:Type="String">期号</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">开奖日期</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">基本号1</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">基本号2</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">基本号3</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">基本号4</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">基本号5</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">基本号6</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">基本号7</Data></Cell>\n';
      xml += '    <Cell><Data ss:Type="String">特别号</Data></Cell>\n';
      xml += '   </Row>\n';
      
      for (const row of data) {
        xml += '   <Row>\n';
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.lottery_no)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${this.escapeXml(row.draw_date)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.basic1}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.basic2}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.basic3}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.basic4}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.basic5}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.basic6}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.basic7}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${row.special}</Data></Cell>\n`;
        xml += '   </Row>\n';
      }
    }
    
    xml += '  </Table>\n';
    xml += ' </Worksheet>\n';
    xml += '</Workbook>';
    
    // 转换为 ArrayBuffer
    const encoder = new TextEncoder();
    return encoder.encode(xml);
  }

  /**
   * 生成 SQL 文件
   */
  generateSQL(type, data, lotteryName) {
    let sql = `-- ${lotteryName} 数据导出\n`;
    sql += `-- 导出时间: ${new Date().toISOString()}\n`;
    sql += `-- 数据条数: ${data.length}\n\n`;
    
    if (type === 'ssq') {
      sql += `-- 双色球数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS ssq_lottery (\n`;
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
      
      for (const row of data) {
        sql += `INSERT INTO ssq_lottery (lottery_no, draw_date, red1, red2, red3, red4, red5, red6, blue, sorted_code) VALUES `;
        sql += `('${this.escapeSql(row.lottery_no)}', '${this.escapeSql(row.draw_date)}', `;
        sql += `'${row.red1}', '${row.red2}', '${row.red3}', '${row.red4}', '${row.red5}', '${row.red6}', `;
        sql += `'${row.blue}', '${this.escapeSql(row.sorted_code)}');\n`;
      }
    } else if (type === 'dlt') {
      sql += `-- 大乐透数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS dlt_lottery (\n`;
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
      
      for (const row of data) {
        sql += `INSERT INTO dlt_lottery (lottery_no, draw_date, front1, front2, front3, front4, front5, back1, back2, sorted_code) VALUES `;
        sql += `('${this.escapeSql(row.lottery_no)}', '${this.escapeSql(row.draw_date)}', `;
        sql += `'${row.front1}', '${row.front2}', '${row.front3}', '${row.front4}', '${row.front5}', `;
        sql += `'${row.back1}', '${row.back2}', '${this.escapeSql(row.sorted_code)}');\n`;
      }
    } else if (type === 'qxc') {
      sql += `-- 七星彩数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS qxc_lottery (\n`;
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
      
      for (const row of data) {
        sql += `INSERT INTO qxc_lottery (lottery_no, draw_date, num1, num2, num3, num4, num5, num6, num7, sorted_code) VALUES `;
        sql += `('${this.escapeSql(row.lottery_no)}', '${this.escapeSql(row.draw_date)}', `;
        sql += `'${row.num1}', '${row.num2}', '${row.num3}', '${row.num4}', '${row.num5}', '${row.num6}', '${row.num7}', `;
        sql += `'${this.escapeSql(row.sorted_code)}');\n`;
      }
    } else if (type === 'qlc') {
      sql += `-- 七乐彩数据表\n`;
      sql += `CREATE TABLE IF NOT EXISTS qlc_lottery (\n`;
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
      
      for (const row of data) {
        sql += `INSERT INTO qlc_lottery (lottery_no, draw_date, basic1, basic2, basic3, basic4, basic5, basic6, basic7, special, sorted_code) VALUES `;
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
      // 将内容转换为 ArrayBuffer（如果还不是）
      let buffer;
      if (typeof content === 'string') {
        const encoder = new TextEncoder();
        buffer = encoder.encode(content);
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
   * 转义 XML 特殊字符
   */
  escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 转义 SQL 特殊字符
   */
  escapeSql(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "''");
  }
}
