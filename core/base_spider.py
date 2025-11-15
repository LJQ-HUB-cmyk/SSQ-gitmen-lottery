"""
公共爬虫基类
提供通用的HTTP请求、重试机制等功能
"""

import requests
import logging
import time
import random
from typing import Dict

logger = logging.getLogger(__name__)


class BaseSpider:
    """爬虫基类，提供通用的请求和重试功能"""

    # 多个User-Agent轮换，模拟不同浏览器
    USER_AGENTS = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]

    def __init__(self, timeout: int = 10, retry_times: int = 3, min_delay: float = 0.5, max_delay: float = 2.0):
        """
        初始化爬虫

        Args:
            timeout: 请求超时时间（秒）
            retry_times: 失败重试次数
            min_delay: 最小请求间隔（秒）
            max_delay: 最大请求间隔（秒）
        """
        self.timeout = timeout
        self.retry_times = retry_times
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.session = requests.Session()
        self.last_request_time = 0
        
        # 设置连接池
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,
            pool_maxsize=20,
            max_retries=0  # 我们自己处理重试
        )
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

    def _get_headers(self) -> Dict:
        """获取随机请求头，模拟真实浏览器"""
        return {
            'User-Agent': random.choice(self.USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
        }

    def _random_delay(self):
        """随机延迟，模拟人类浏览行为"""
        # 确保距离上次请求至少间隔min_delay
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        
        # 额外随机延迟
        delay = random.uniform(0, self.max_delay - self.min_delay)
        if delay > 0:
            time.sleep(delay)
        
        self.last_request_time = time.time()

    def fetch_with_retry(self, url: str, params: Dict = None, method: str = 'GET', referer: str = None) -> requests.Response:
        """
        带重试机制的HTTP请求，模拟人类浏览行为

        Args:
            url: 请求URL
            params: 请求参数
            method: 请求方法 (GET/POST)
            referer: 来源页面URL

        Returns:
            Response对象

        Raises:
            requests.RequestException: 请求失败
        """
        for attempt in range(self.retry_times):
            try:
                # 随机延迟，模拟人类浏览
                self._random_delay()
                
                # 获取随机请求头
                headers = self._get_headers()
                if referer:
                    headers['Referer'] = referer
                
                if method.upper() == 'GET':
                    response = self.session.get(
                        url,
                        params=params,
                        headers=headers,
                        timeout=self.timeout,
                        allow_redirects=True
                    )
                else:
                    response = self.session.post(
                        url,
                        data=params,
                        headers=headers,
                        timeout=self.timeout,
                        allow_redirects=True
                    )
                
                # 检查响应状态
                if response.status_code == 429:  # Too Many Requests
                    wait_time = int(response.headers.get('Retry-After', 60))
                    logger.warning(f"请求过于频繁，等待 {wait_time} 秒...")
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                
                # 成功后随机短暂延迟，模拟阅读时间
                time.sleep(random.uniform(0.1, 0.3))
                
                return response
                
            except requests.Timeout as e:
                logger.warning(f"第 {attempt + 1} 次请求超时: {e}")
                if attempt < self.retry_times - 1:
                    # 指数退避 + 随机抖动
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(wait_time)
                else:
                    logger.error(f"请求超时，已重试 {self.retry_times} 次")
                    raise
                    
            except requests.RequestException as e:
                logger.warning(f"第 {attempt + 1} 次请求失败: {e}")
                if attempt < self.retry_times - 1:
                    # 指数退避 + 随机抖动
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(wait_time)
                else:
                    logger.error(f"请求失败，已重试 {self.retry_times} 次")
                    raise
