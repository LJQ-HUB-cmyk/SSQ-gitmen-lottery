/**
 * 大乐透爬虫 - Cloudflare Worker 版本
 * 数据源：500.com
 */

export class DLTSpider {
  constructor() {
    // 数据源：500彩票网（稳定可靠）
    this.baseUrl = 'https://datachart.500.com/dlt/history/newinc/history.php';
    
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.500.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };
    // 移除延迟，提高执行速度
    this.lastRequestTime = 0;
  }

  /**
   * 延迟函数（保留用于批量爬取时的节流）
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取最新一期数据（直接使用 500.com）
   * 注意：500.com 返回的数据已按期号从新到旧排序，第一条即为最新
   */
  async fetchLatest() {
    console.log('从 500.com 获取大乐透最新数据...');
    
    const url = this.baseUrl;
    
    const response = await fetch(url, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // 解析 HTML 获取最新一期数据（只解析第一条）
    // 500.com 默认按期号降序排列，第一条就是最新的
    const data = this.parse500Html(html, true);
    
    if (!data || data.length === 0) {
      throw new Error('500.com 未返回数据');
    }
    
    // 返回最新一期（第一条）
    return data[0];
  }

  /**
   * 从 500.com 按期号范围获取数据
   * @param {string} startIssue - 开始期号（5位格式，如 '07001'）
   * @param {string} endIssue - 结束期号（5位格式，如 '07200'）
   */
  async fetch500comByRange(startIssue, endIssue) {
    const url = `${this.baseUrl}?start=${startIssue}&end=${endIssue}`;
    
    console.log(`      📊 数据源: 500.com (大乐透)`);
    console.log(`      🔗 查询: start=${startIssue}, end=${endIssue}`);
    
    const response = await fetch(url, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // 解析 HTML
    const data = this.parse500Html(html);
    
    return data;
  }



  /**
   * 解析 500.com 的 HTML 数据
   * @param {string} html - HTML 内容
   * @param {boolean} onlyFirst - 是否只解析第一条（用于获取最新数据）
   */
  parse500Html(html, onlyFirst = false) {
    const results = [];
    
    try {
      // 使用正则表达式提取表格数据
      const tbodyMatch = html.match(/<tbody[^>]*id="tdata"[^>]*>([\s\S]*?)<\/tbody>/i);
      
      if (!tbodyMatch) {
        console.log('未找到数据表格');
        return results;
      }
      
      const tbody = tbodyMatch[1];
      
      // 先移除 HTML 注释
      const cleanTbody = tbody.replace(/<!--[\s\S]*?-->/g, '');
      
      // 提取每一行 <tr>...</tr>
      const trMatches = cleanTbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      for (const trMatch of trMatches) {
        const tr = trMatch[1];
        
        // 提取所有 <td>
        const tdMatches = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        
        if (tdMatches.length < 10) continue;
        
        try {
          // 提取文本内容
          const texts = tdMatches.map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').replace(/,/g, '').trim());
          
          // 500.com 大乐透表格结构：
          // 第0列: 期号（如 "25131"，需要补全为 "2025131"）
          // 第1-5列: 前区号码
          // 第6-7列: 后区号码
          // ...
          // 最后一列: 开奖日期
          
          let lotteryNo = texts[0];
          
          // 补全期号：如果是5位数字，补全为7位（加上年份前缀20）
          if (lotteryNo && /^\d{5}$/.test(lotteryNo)) {
            lotteryNo = '20' + lotteryNo;
          }
          
          // 前区（第1-5列）
          const frontBalls = texts.slice(1, 6).filter(t => t && /^\d+$/.test(t)).map(t => t.padStart(2, '0'));
          
          // 后区（第6-7列）
          const backBalls = texts.slice(6, 8).filter(t => t && /^\d+$/.test(t)).map(t => t.padStart(2, '0'));
          
          // 开奖日期（最后一列）
          const drawDate = texts[texts.length - 1];
          
          // 验证数据完整性
          if (lotteryNo && 
              frontBalls.length === 5 && 
              backBalls.length === 2 && 
              drawDate &&
              /^\d{7}$/.test(lotteryNo) &&
              /^\d{4}-\d{2}-\d{2}$/.test(drawDate)) {
            
            results.push({
              lottery_no: lotteryNo,
              draw_date: drawDate,
              front1: frontBalls[0],
              front2: frontBalls[1],
              front3: frontBalls[2],
              front4: frontBalls[3],
              front5: frontBalls[4],
              back1: backBalls[0],
              back2: backBalls[1],
              front_balls: frontBalls,
              back_balls: backBalls,
              sorted_code: [...frontBalls].sort().join(',') + '-' + [...backBalls].sort().join(',')
            });
            
            // 如果只需要第一条，立即返回
            if (onlyFirst && results.length === 1) {
              console.log(`成功解析最新数据: ${lotteryNo}`);
              return results;
            }
          }
        } catch (e) {
          console.error('解析行数据失败:', e);
        }
      }
      
      if (!onlyFirst) {
        console.log(`成功解析 ${results.length} 条数据`);
      }
    } catch (error) {
      console.error('解析 500.com HTML 失败:', error);
    }
    
    return results;
  }
}
