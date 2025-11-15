#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Telegram Bot 快速测试脚本（设置短超时）
"""

import os
import sys
import requests
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

print("=== Telegram Bot 快速测试 ===\n")

# 获取配置
bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
chat_id = os.getenv('TELEGRAM_CHAT_ID')

if not bot_token or not chat_id:
    print("❌ 配置不完整")
    print(f"   Bot Token: {'已配置' if bot_token else '未配置'}")
    print(f"   Chat ID: {'已配置' if chat_id else '未配置'}")
    sys.exit(1)

print(f"✅ 配置检查通过")
print(f"   Bot Token: {bot_token[:10]}...{bot_token[-10:]}")
print(f"   Chat ID: {chat_id}")
print()

# 测试 API 连接（5秒超时）
print("测试 Telegram API 连接...")
api_url = f"https://api.telegram.org/bot{bot_token}/getMe"

try:
    response = requests.get(api_url, timeout=5)
    
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
    else:
        print(f"❌ HTTP 错误: {response.status_code}")
        print(f"   响应: {response.text}")
        sys.exit(1)
        
except requests.exceptions.Timeout:
    print("❌ 连接超时（5秒）")
    print("   可能原因：")
    print("   1. 网络连接问题")
    print("   2. 需要代理访问 Telegram API")
    print("   3. 防火墙阻止")
    sys.exit(1)
    
except requests.exceptions.ConnectionError as e:
    print(f"❌ 连接错误: {e}")
    print("   可能需要配置代理或检查网络")
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

如果你看到这条消息，说明配置完全正确！"""

try:
    response = requests.post(
        send_url,
        json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        },
        timeout=5
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('ok'):
            print("✅ 测试消息发送成功！")
            print("   请检查你的 Telegram 查看消息")
        else:
            print(f"❌ 发送失败: {data}")
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

print()
print("=== ✅ 所有测试通过！===")
print()
print("Telegram Bot 配置正确且可用！")
