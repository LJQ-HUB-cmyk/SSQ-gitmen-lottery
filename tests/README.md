# 测试文件目录

本目录包含项目的测试脚本和测试报告。

## 📁 目录结构

```
tests/
├── README.md                      # 本文件
├── test_telegram.py               # Telegram Bot 基础测试
├── test_telegram_quick.py         # Telegram Bot 快速测试
├── test_telegram_proxy.py         # Telegram Bot 代理测试（推荐）
├── TELEGRAM_TEST_REPORT.md        # 测试报告
└── TELEGRAM_TEST_SUCCESS.md       # 成功测试报告
```

## 🧪 测试脚本

### test_telegram_proxy.py（推荐）

支持代理配置的 Telegram Bot 测试脚本。

**使用方法：**
```bash
python tests/test_telegram_proxy.py
```

**功能：**
- 检查配置是否正确
- 测试 API 连接
- 发送测试消息
- 自动检测代理配置
- 提供详细的错误信息

### test_telegram_quick.py

快速测试脚本（5秒超时）。

**使用方法：**
```bash
python tests/test_telegram_quick.py
```

### test_telegram.py

基础测试脚本。

**使用方法：**
```bash
python tests/test_telegram.py
```

## 🔧 本地测试配置

### 如果在中国大陆本地测试

需要在 `.env` 文件中配置代理：

```bash
# 代理配置（仅本地开发需要）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

常见代理端口：
- Clash: `7890`
- V2Ray: `10809`
- Shadowsocks: `1087`

### 如果在海外或生产环境

**不需要配置代理**，注释掉或删除代理配置：

```bash
# HTTP_PROXY=http://127.0.0.1:7890
# HTTPS_PROXY=http://127.0.0.1:7890
```

## 📊 测试报告

### TELEGRAM_TEST_SUCCESS.md

成功测试的完整报告，包含：
- 配置验证结果
- API 连接测试结果
- 消息发送测试结果
- 功能可用性状态
- 下一步操作建议

### TELEGRAM_TEST_REPORT.md

测试过程记录和问题分析。

## ⚠️ 重要提示

### 本地开发 vs 生产环境

| 环境 | 是否需要代理 | 配置方式 |
|------|-------------|---------|
| 本地开发（中国大陆） | ✅ 需要 | 在 .env 中配置 HTTP_PROXY |
| 生产环境（海外服务器） | ❌ 不需要 | 注释掉或删除代理配置 |
| 生产环境（国内服务器） | ✅ 需要 | 配置稳定的代理服务 |

### 部署前检查

在部署到生产环境前：

1. **检查 .env 文件**
   - 确认 Telegram 配置正确
   - 如果是海外服务器，注释掉代理配置
   - 如果是国内服务器，配置稳定的代理

2. **运行测试**
   ```bash
   python tests/test_telegram_proxy.py
   ```

3. **验证功能**
   - 确认收到测试消息
   - 检查消息格式正确
   - 验证 Bot 信息

## 📚 相关文档

- **[Telegram 配置指南](../docs/guides/TELEGRAM_SETUP.md)** - 如何创建 Bot
- **[代理配置指南](../docs/TELEGRAM_PROXY_SETUP.md)** - 代理配置详细说明
- **[部署指南](../docs/deployment/DOCKER_DEPLOYMENT.md)** - 生产环境部署

## 🚀 快速开始

### 1. 配置 Telegram

在 `.env` 文件中填写：
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 2. 配置代理（如果需要）

如果在中国大陆本地测试：
```bash
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

### 3. 运行测试

```bash
python tests/test_telegram_proxy.py
```

### 4. 检查结果

- ✅ 看到 "所有测试通过" 消息
- ✅ Telegram 收到测试消息
- ✅ 可以开始使用项目

## 💡 提示

- 测试脚本会自动检测代理配置
- 如果连接失败，会提供详细的错误信息和解决方案
- 生产环境部署时，记得移除或注释代理配置

---

**最后更新**: 2025-11-15  
**版本**: v2.2.2
