/**
 * 双色球爬虫 - Cloudflare Worker 版本
 * 支持爬取最新数据和全量历史数据
 */

export class SSQSpider {
  constructor() {
    this.apiUrl = 'https://jc.zhcw.com/port/client_json.php';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://www.zhcw.com/',
      'Accept': 'application/json, text/plain, */*'
    };
    this.minDelay = 500;  // 最小延迟 500ms
    this.maxDelay = 2000; // 最大延迟 2000ms
    this.lastRequestTime = 0;
  }

  /**
   * 随机延迟，模拟人类行为
   */
  async randomDelay() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    
    if (elapsed < this.minDelay) {
      await this.sleep(this.minDelay - elapsed);
    }
    
    const extraDelay = Math.random() * (this.maxDelay - this.minDelay);
    if (extraDelay > 0) {
      await this.sleep(extraDelay);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取最新一期数据
   */
  async fetchLatest() {
    try {
      await this.randomDelay();
      
      // 获取最近的期号列表
      const params = new URLSearchParams({
        transactionType: '10001003',
        lotteryId: '1',
        count: '1',
        tt: Date.now().toString()
      });

      const response = await fetch(`${this.apiUrl}?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.resCode !== '000000') {
        throw new Error(`API错误: ${data.resCode}`);
      }

      const issues = data.issue || [];
      if (issues.length === 0) {
        console.log('未获取到期号');
        return null;
      }

      // 获取最新期号的详细信息
      const latestIssue = issues[0];
      const detail = await this.fetchIssueDetail(latestIssue);
      
      return detail;
    } catch (error) {
      console.error('爬取最新数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定期号的详细信息
   */
  async fetchIssueDetail(issue) {
    try {
      await this.randomDelay();
      
      const params = new URLSearchParams({
        transactionType: '10001002',
        lotteryId: '1',
        issue: issue,
        tt: Date.now().toString()
      });

      const response = await fetch(`${this.apiUrl}?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.resCode !== '000000') {
        return null;
      }

      // 解析红球和蓝球
      const redStr = data.frontWinningNum || data.seqFrontWinningNum || '';
      const blueStr = data.backWinningNum || data.seqBackWinningNum || '';

      if (!redStr || !blueStr) {
        return null;
      }

      const redBalls = redStr.match(/\d+/g).map(n => n.padStart(2, '0'));
      const blueBall = blueStr.match(/\d+/g)[0].padStart(2, '0');

      return {
        lottery_no: data.issue || issue,
        draw_date: (data.openTime || '').substring(0, 10),
        red1: redBalls[0],
        red2: redBalls[1],
        red3: redBalls[2],
        red4: redBalls[3],
        red5: redBalls[4],
        red6: redBalls[5],
        blue: blueBall,
        red_balls: redBalls,
        blue_ball: blueBall,
        sorted_code: redBalls.sort().join(',') + '-' + blueBall
      };
    } catch (error) {
      console.error(`获取期号 ${issue} 详情失败:`, error);
      return null;
    }
  }

  /**
   * 获取全量历史数据（分批获取）
   * @param {number} maxCount - 最大获取数量，默认1000
   */
  async fetchAll(maxCount = 1000) {
    try {
      console.log(`开始获取全量数据，最多 ${maxCount} 期...`);
      
      await this.randomDelay();
      
      // 获取期号列表
      const params = new URLSearchParams({
        transactionType: '10001003',
        lotteryId: '1',
        count: Math.min(maxCount, 1000).toString(),
        tt: Date.now().toString()
      });

      const response = await fetch(`${this.apiUrl}?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.resCode !== '000000') {
        throw new Error(`API错误: ${data.resCode}`);
      }

      const issues = data.issue || [];
      console.log(`获取到 ${issues.length} 个期号`);

      const allData = [];
      
      // 分批处理，每批100个
      const batchSize = 100;
      for (let i = 0; i < issues.length; i += batchSize) {
        const batch = issues.slice(i, i + batchSize);
        console.log(`处理第 ${i + 1}-${Math.min(i + batchSize, issues.length)} 期...`);
        
        for (const issue of batch) {
          const detail = await this.fetchIssueDetail(issue);
          if (detail) {
            allData.push(detail);
          }
          
          // 每10个请求后稍作延迟
          if (allData.length % 10 === 0) {
            await this.sleep(100);
          }
        }
        
        // 每批之间延迟
        if (i + batchSize < issues.length) {
          await this.sleep(1000);
        }
      }

      console.log(`全量爬取完成，共获取 ${allData.length} 条数据`);
      return allData;
    } catch (error) {
      console.error('全量爬取失败:', error);
      throw error;
    }
  }

  /**
   * 按日期范围获取数据
   */
  async fetchByDateRange(startDate, endDate) {
    try {
      await this.randomDelay();
      
      const params = new URLSearchParams({
        transactionType: '10001001',
        lotteryId: '1',
        startDate: startDate,
        endDate: endDate,
        pageNum: '1',
        pageSize: '100',
        type: '2',
        tt: Date.now().toString()
      });

      const response = await fetch(`${this.apiUrl}?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.resCode !== '000000') {
        return [];
      }

      const records = data.pageList || [];
      const results = [];

      for (const record of records) {
        try {
          const redStr = record.frontWinningNum || record.seqFrontWinningNum || '';
          const blueStr = record.backWinningNum || record.seqBackWinningNum || '';

          if (!redStr || !blueStr) continue;

          const redBalls = redStr.match(/\d+/g).map(n => n.padStart(2, '0'));
          const blueBall = blueStr.match(/\d+/g)[0].padStart(2, '0');

          results.push({
            lottery_no: record.issue,
            draw_date: (record.openTime || '').substring(0, 10),
            red1: redBalls[0],
            red2: redBalls[1],
            red3: redBalls[2],
            red4: redBalls[3],
            red5: redBalls[4],
            red6: redBalls[5],
            blue: blueBall,
            red_balls: redBalls,
            blue_ball: blueBall,
            sorted_code: redBalls.sort().join(',') + '-' + blueBall
          });
        } catch (e) {
          console.error('解析记录失败:', e);
        }
      }

      return results;
    } catch (error) {
      console.error('按日期范围获取数据失败:', error);
      return [];
    }
  }
}
