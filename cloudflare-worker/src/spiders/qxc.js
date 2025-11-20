/**
 * 七星彩爬虫 - Cloudflare Worker 版本
 */

export class QXCSpider {
  constructor() {
    this.baseUrl = 'https://datachart.500.com/qxc/history/inc/history.php';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  /**
   * 爬取七星彩数据
   * @param {string} startIssue - 起始期号（5位，如 04101）
   * @param {string} endIssue - 结束期号（5位，如 04200）
   *                           如果为 null，则从 startIssue 开始获取全量数据（扩展功能）
   * @returns {Array} 数据数组
   */
  async fetch(startIssue, endIssue) {
    if (!startIssue && !endIssue) {
      console.log('从 500.com 获取七星彩最新数据...');
      
      const response = await fetch(this.baseUrl, {
        headers: this.headers
      });

      if (!response.ok) {
        if (typeof handleNetworkError !== 'undefined') {
          await handleNetworkError(globalThis.env, response.status, this.baseUrl, 'qxc');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const data = this.parse500Html(html, true);
      
      return data;
    }

    // 扩展功能：不传 endIssue 时，从 startIssue 开始获取全量数据
    let url;
    if (endIssue === null || endIssue === undefined) {
      url = `${this.baseUrl}?start=${startIssue}`;
      console.log(`从 500.com 获取七星彩全量数据（从 ${startIssue} 开始）`);
    } else {
      url = `${this.baseUrl}?start=${startIssue}&end=${endIssue}`;
      console.log(`从 500.com 获取七星彩期号范围数据: ${startIssue} - ${endIssue}`);
    }
    
    const response = await fetch(url, {
      headers: this.headers
    });

    if (!response.ok) {
      if (typeof handleNetworkError !== 'undefined') {
        await handleNetworkError(globalThis.env, response.status, url, 'qxc');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const data = this.parse500Html(html);
    
    return data;
  }

  /**
   * 解析 500.com HTML
   * HTML 结构：
   * <tr class="t_tr1">
   *   <td class="t_tr1">25133</td>           <!-- 期号 -->
   *   <td class="cfont2">2 4 7 9 1 3 4...</td> <!-- 号码 -->
   *   <td>30</td>                             <!-- 和值 -->
   *   <td class="t_tr1">16814218</td>        <!-- 销售额 -->
   *   <td class="t_tr1">2025-11-18</td>      <!-- 日期 -->
   * </tr>
   */
  parse500Html(html, latestOnly = false) {
    const data = [];
    
    // 使用更灵活的正则表达式，不依赖于<span>标签
    // 匹配: <tr...> ... <td...>期号</td><td...>号码</td> ... <td...>日期</td>
    const rowRegex = /<tr[^>]*>.*?<td[^>]*>(\d+)<\/td><td[^>]*>([\d\s]+)<\/td>.*?<td[^>]*>[\d,]+<\/td>.*?<td[^>]*>[\d,]+<\/td>.*?<td[^>]*>([\d-]+)<\/td>/gs;
    
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const lotteryNo = match[1];
      const numbersStr = match[2].trim();
      const drawDate = match[3];
      
      // 补全期号为7位
      const fullLotteryNo = lotteryNo.length === 5 ? '20' + lotteryNo : lotteryNo;
      
      // 解析7个数字
      const numbers = numbersStr.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
      
      if (numbers.length === 7) {
        data.push({
          lottery_no: fullLotteryNo,
          draw_date: drawDate,
          numbers: numbers
        });
      }
      
      if (latestOnly && data.length > 0) {
        break;
      }
    }
    
    console.log(`成功解析 ${data.length} 条七星彩数据`);
    return data;
  }

  /**
   * 兼容旧接口
   */
  async fetchLatest() {
    const data = await this.fetch();
    return data[0];
  }
}
