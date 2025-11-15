#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Telegram Bot 测试脚本（支持代理）
"""

import os
import sys
import requests
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

print("=== Telegram Bot 测试（支持代理）===\n")

# 获取配置
bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
chat_id = os.getenv('TELEGRAM_CHAT_ID')
http_proxy = os.getenv('HTTP_PROXY') or os.getenv('http_proxy')
https_proxy = os.getenv('HTTPS_PROXY') or os.getenv('https_proxy')

if not bot_token or not chat_id:
    print("❌ Telegram 配置不完整")
    sys.exit(1)

print(f"✅ 配置检查")
print(f"   Bot Token: {bot_token[:10]}...{bot_token[-10:]}")
print(f"   Chat ID: {chat_id}")

# 代理配置
proxies = {}
if http_proxy:
    proxies['http'] = http_proxy
    print(f"   HTTP 代理: {http_proxy}")
if https_proxy:
    proxies['https'] = https_proxy
    print(f"   HTTPS 代理: {https_proxy}")

if not proxies:
    print("   ⚠️  未配置代理")
    print("   如果在中国大陆，可能需要配置代理访问 Telegram API")
    print()
    print("   配置方法：")
    print("   export HTTP_PROXY=http://127.0.0.1:7890")
    print("   export HTTPS_PROXY=http://127.0.0.1:7890")
    print()
    print("   或在 .env 文件中添加：")
    print("   HTTP_PROXY=http://127.0.0.1:7890")
    print("   HTTPS_PROXY=http://127.0.0.1:7890")
    print()

print()

# 测试 API 连接
print("测试 Telegram API 连接...")
api_url = f"https://api.telegram.org/bot{bot_token}/getMe"

try:
    response = requests.get(api_url, proxies=proxies if proxies else None, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('ok'):
            bot_info = data.get('result', {})
            print("✅ API 连接成功！")
            print(f"   Bot 名称: {bot_info.get('first_name')}")
            print(f"   Bot 用户名: @{bot_info.get('username')}")
            print(f"   Bot ID: {bot_info.get('id')}")
        else:
            print(f"❌ API 返回错误: {data}")
            sys.exit(1)
    elif response.status_code == 401:
        print("❌ Bot Token 无效")
        print("   请检查 TELEGRAM_BOT_TOKEN 配置")
        sys.exit(1)
    else:
        print(f"❌ HTTP 错误: {response.status_code}")
        print(f"   响应: {response.text}")
        sys.exit(1)
        
except requests.exceptions.Timeout:
    print("❌ 连接超时（10秒）")
    print()
    print("   解决方案：")
    print("   1. 检查网络连接")
    print("   2. 配置代理（如果在中国大陆）")
    print("   3. 检查防火墙设置")
    sys.exit(1)
    
except requests.exceptions.ProxyError as e:
    print(f"❌ 代理错误: {e}")
    print("   请检查代理配置是否正确")
    sys.exit(1)
    
except requests.exceptions.ConnectionError as e:
    print(f"❌ 连接错误: {e}")
    print()
    print("   可能原因：")
    print("   1. 网络不可达")
    print("   2. 需要配置代理")
    print("   3. DNS 解析失败")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ 未知错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# 发送测试消息
print("发送测试消息...")
send_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
message = """🎉 <b>Telegram Bot 测试成功！</b>

✅ 连接正常
📅 测试时间: 2025-11-15
🤖 机器人状态: 运行中
🌐 网络: 正常

<i>如果你看到这条消息，说明配置完全正确！</i>"""

try:
    response = requests.post(
        send_url,
        json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        },
        proxies=proxies if proxies else None,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('ok'):
            print("✅ 测试消息发送成功！")
            print()
            print("   📱 请打开 Telegram 查看消息")
            print()
        else:
            print(f"❌ 发送失败: {data}")
            sys.exit(1)
    elif response.status_code == 400:
        data = response.json()
        print(f"❌ 请求错误: {data.get('description')}")
        if 'chat not found' in data.get('description', '').lower():
            print("   Chat ID 可能不正确")
            print("   请确认 TELEGRAM_CHAT_ID 配置")
        sys.exit(1)
    else:
        print(f"❌ HTTP 错误: {response.status_code}")
        print(f"   响应: {response.text}")
        sys.exit(1)
        
except requests.exceptions.Timeout:
    print("❌ 发送超时")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ 发送错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=== ✅ 所有测试通过！===")
print()
print("🎉 Telegram Bot 配置正确且可用！")
print()
print("下一步：")
print("  - 运行 python lottery.py predict ssq 测试预测功能")
print("  - 运行 python scripts/daily_task.py 测试每日任务")
print("  - 部署到服务器后会自动发送通知")
