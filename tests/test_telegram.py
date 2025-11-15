#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Telegram Bot 测试脚本
"""

import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

print("=== Telegram Bot 测试 ===\n")

# 1. 检查配置
print("1. 检查配置...")
bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
chat_id = os.getenv('TELEGRAM_CHAT_ID')

if bot_token:
    print(f"   ✅ Bot Token: {bot_token[:10]}...{bot_token[-10:]}")
else:
    print("   ❌ Bot Token 未配置")
    sys.exit(1)

if chat_id:
    print(f"   ✅ Chat ID: {chat_id}")
else:
    print("   ❌ Chat ID 未配置")
    sys.exit(1)

print()

# 2. 导入模块
print("2. 导入 TelegramBot 模块...")
try:
    from core.telegram_bot import TelegramBot
    print("   ✅ 模块导入成功")
except Exception as e:
    print(f"   ❌ 模块导入失败: {e}")
    sys.exit(1)

print()

# 3. 创建实例
print("3. 创建 TelegramBot 实例...")
try:
    bot = TelegramBot(bot_token=bot_token, chat_id=chat_id)
    print("   ✅ 实例创建成功")
except Exception as e:
    print(f"   ❌ 实例创建失败: {e}")
    sys.exit(1)

print()

# 4. 测试连接
print("4. 测试 Bot 连接...")
try:
    result = bot.test_connection()
    if result:
        print("   ✅ 连接测试成功！")
        print(f"   Bot 信息: {result}")
    else:
        print("   ❌ 连接测试失败")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ 连接测试异常: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# 5. 发送测试消息
print("5. 发送测试消息...")
test_message = """
🎉 <b>Telegram Bot 测试</b>

✅ 连接成功！
📅 测试时间: 2025-11-15
🤖 机器人状态: 正常

这是一条测试消息，如果你收到了这条消息，说明 Telegram Bot 配置正确！
"""

try:
    success = bot.send_message(test_message)
    if success:
        print("   ✅ 测试消息发送成功！")
        print("   请检查你的 Telegram 是否收到消息")
    else:
        print("   ❌ 测试消息发送失败")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ 发送消息异常: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()
print("=== 测试完成 ===")
print()
print("✅ 所有测试通过！Telegram Bot 配置正确且可用。")
