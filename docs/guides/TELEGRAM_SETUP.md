# Telegram 机器人配置指南

## 1. 创建 Telegram 机器人

### 步骤 1: 找到 BotFather

1. 打开 Telegram
2. 搜索 `@BotFather`（官方机器人创建工具）
3. 点击开始对话

### 步骤 2: 创建新机器人

1. 发送命令：`/newbot`
2. BotFather 会要求你提供机器人名称
3. 输入机器人名称，例如：`我的彩票助手`
4. 然后要求提供用户名（必须以 `bot` 结尾）
5. 输入用户名，例如：`my_lottery_bot`

### 步骤 3: 获取 Bot Token

创建成功后，BotFather 会返回一个 Token，格式如下：

```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**⚠️ 重要：请妥善保管此 Token，不要泄露给他人！**

## 2. 获取 Chat ID

### 方法 1: 使用 @userinfobot（推荐）

1. 在 Telegram 中搜索 `@userinfobot`
2. 点击开始对话
3. 发送任意消息
4. 机器人会返回你的用户信息，包括 Chat ID

### 方法 2: 使用 @getidsbot

1. 在 Telegram 中搜索 `@getidsbot`
2. 点击开始对话
3. 发送 `/start`
4. 机器人会返回你的 Chat ID

### 方法 3: 通过 API 获取

1. 给你创建的机器人发送一条消息
2. 在浏览器中访问：
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   将 `<YOUR_BOT_TOKEN>` 替换为你的 Bot Token

3. 在返回的 JSON 中找到 `"chat":{"id":123456789}`
4. 这个数字就是你的 Chat ID

## 3. 配置到项目

### 编辑 .env 文件

```bash
# Telegram 机器人配置
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 测试配置

```bash
# 本地测试
python -c "
from core.telegram_bot import TelegramBot
bot = TelegramBot()
if bot.test_connection():
    print('✓ 连接成功')
    bot.send_message('测试消息')
else:
    print('✗ 连接失败')
"

# Docker 测试
docker-compose exec lottery-prediction python -c "
from core.telegram_bot import TelegramBot
bot = TelegramBot()
bot.test_connection()
bot.send_message('测试消息')
"
```

## 4. 通知内容示例

### 每日报告

```
📊 双色球每日报告

━━━━━━━━━━━━━━━
🎰 最新开奖

📅 期号: 2025131
📆 日期: 2025-11-13

🔴 红球: 03 13 14 18 24 31
🔵 蓝球: 03

━━━━━━━━━━━━━━━
🔮 下期预测

组合 1:
🔴 06 07 17 22 26 32
🔵 15

组合 2:
🔴 06 08 17 22 26 32
🔵 15

组合 3:
🔴 02 07 17 22 26 32
🔵 15

━━━━━━━━━━━━━━━
📈 统计信息

高频红球: 17(765), 26(757), 14(755), 22(748), 18(745)
高频蓝球: 15(270), 16(264), 1(258)

━━━━━━━━━━━━━━━
⚠️ 仅供参考，理性购彩
```

## 5. 常见问题

### Q: 机器人收不到消息？

A: 检查以下几点：
1. 确认 Bot Token 和 Chat ID 正确
2. 确认已给机器人发送过至少一条消息
3. 检查网络连接
4. 查看容器日志：`docker-compose logs -f`

### Q: 如何给多个人发送通知？

A: 有两种方式：

**方式 1: 创建群组**
1. 创建一个 Telegram 群组
2. 将机器人添加到群组
3. 获取群组的 Chat ID（负数）
4. 在 .env 中使用群组 Chat ID

**方式 2: 多个 Chat ID**
修改代码支持多个 Chat ID（需要自行实现）

### Q: 如何自定义通知内容？

A: 编辑 `core/telegram_bot.py` 文件中的消息模板。

### Q: 如何禁用 Telegram 通知？

A: 在 .env 中删除或注释掉 Telegram 配置：

```bash
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
```

### Q: 机器人被限流怎么办？

A: Telegram 有速率限制：
- 每秒最多 30 条消息
- 每分钟最多 20 条消息到同一个群组

如果触发限流，程序会自动等待。

## 6. 高级配置

### 自定义消息格式

编辑 `core/telegram_bot.py`：

```python
def send_daily_report(self, ...):
    message = f"""
    # 自定义你的消息格式
    """
    return self.send_message(message)
```

### 添加按钮

```python
def send_message_with_buttons(self, text: str):
    url = f"{self.api_url}/sendMessage"
    data = {
        'chat_id': self.chat_id,
        'text': text,
        'reply_markup': {
            'inline_keyboard': [[
                {'text': '查看详情', 'url': 'https://example.com'}
            ]]
        }
    }
    response = requests.post(url, json=data)
```

### 发送图片

```python
def send_photo(self, photo_path: str, caption: str = ''):
    url = f"{self.api_url}/sendPhoto"
    with open(photo_path, 'rb') as photo:
        files = {'photo': photo}
        data = {
            'chat_id': self.chat_id,
            'caption': caption
        }
        response = requests.post(url, files=files, data=data)
```

## 7. 安全建议

1. **保护 Token**
   - 不要将 Token 提交到 Git
   - 不要在公开场合分享
   - 定期更换 Token

2. **限制访问**
   - 只给信任的人提供 Chat ID
   - 考虑使用私有群组
   - 启用两步验证

3. **监控使用**
   - 定期检查机器人日志
   - 监控异常消息
   - 及时处理问题

## 8. 参考资源

- [Telegram Bot API 文档](https://core.telegram.org/bots/api)
- [BotFather 命令列表](https://core.telegram.org/bots#6-botfather)
- [Telegram Bot 最佳实践](https://core.telegram.org/bots/faq)
