# Telegram 代理配置指南

## 问题说明

如果你在中国大陆，访问 Telegram API 可能会遇到网络连接问题，需要配置代理。

## 测试结果

```
❌ 连接超时（10秒）
   可能原因：
   1. 网络连接问题
   2. 需要代理访问 Telegram API
   3. 防火墙阻止
```

## 解决方案

### 方案一：配置系统代理（推荐）

如果你已经有代理工具（如 Clash、V2Ray、Shadowsocks 等），通常它们会在本地启动一个 HTTP 代理，默认端口通常是：
- `7890` (Clash)
- `1087` (Shadowsocks)
- `10809` (V2Ray)

#### 1. 在 .env 文件中添加代理配置

```bash
# Telegram 代理配置（如果需要）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

#### 2. 或者使用环境变量

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
```

### 方案二：使用 Socks5 代理

如果你的代理是 Socks5 协议：

```bash
# .env 文件
HTTP_PROXY=socks5://127.0.0.1:1080
HTTPS_PROXY=socks5://127.0.0.1:1080
```

### 方案三：Docker 容器中配置代理

如果使用 Docker 部署，在 `docker-compose.yml` 中添加：

```yaml
services:
  lottery-ssq:
    environment:
      - HTTP_PROXY=http://host.docker.internal:7890
      - HTTPS_PROXY=http://host.docker.internal:7890
```

注意：Docker 容器中使用 `host.docker.internal` 访问宿主机的代理。

## 如何找到代理端口

### Clash

1. 打开 Clash
2. 查看 "端口" 或 "Port" 设置
3. 通常是 `7890`

### V2Ray

1. 打开 V2Ray 配置
2. 查看 HTTP 代理端口
3. 通常是 `10809`

### Shadowsocks

1. 打开 Shadowsocks
2. 查看本地代理端口
3. 通常是 `1087`

## 测试代理配置

### 1. 测试代理是否可用

```bash
# 测试 HTTP 代理
curl -x http://127.0.0.1:7890 https://www.google.com -I

# 测试 Socks5 代理
curl -x socks5://127.0.0.1:1080 https://www.google.com -I
```

### 2. 测试 Telegram Bot

配置好代理后，运行测试脚本：

```bash
python test_telegram_proxy.py
```

如果看到：

```
✅ API 连接成功！
   Bot 名称: xxx
   Bot 用户名: @xxx
   Bot ID: xxx

✅ 测试消息发送成功！
```

说明配置成功！

## 常见问题

### Q1: 代理配置后仍然超时

**可能原因：**
1. 代理端口不正确
2. 代理工具未启动
3. 代理工具未开启系统代理模式

**解决方法：**
1. 检查代理工具是否运行
2. 确认代理端口号
3. 尝试在浏览器中访问 https://telegram.org 测试代理

### Q2: Docker 容器中无法使用代理

**解决方法：**

使用 `host.docker.internal` 而不是 `127.0.0.1`：

```yaml
environment:
  - HTTP_PROXY=http://host.docker.internal:7890
  - HTTPS_PROXY=http://host.docker.internal:7890
```

### Q3: 不想使用代理

如果你不在中国大陆，或者有其他方式访问 Telegram：

1. 不配置代理环境变量
2. 确保网络可以直接访问 `api.telegram.org`
3. 运行测试脚本验证

### Q4: 代理认证

如果代理需要用户名和密码：

```bash
HTTP_PROXY=http://username:password@127.0.0.1:7890
HTTPS_PROXY=http://username:password@127.0.0.1:7890
```

## 生产环境建议

### 服务器部署

如果部署到海外服务器（如 AWS、GCP、Azure），通常不需要代理。

如果部署到国内服务器：

1. **推荐方案**：使用海外服务器
2. **备选方案**：配置稳定的代理服务
3. **注意事项**：确保代理服务稳定可靠

### 代理稳定性

生产环境中，代理的稳定性很重要：

1. 使用专业的代理服务
2. 配置代理重试机制
3. 监控代理可用性
4. 准备备用代理

## 测试脚本说明

项目提供了三个测试脚本：

1. **test_telegram.py** - 基础测试（可能超时）
2. **test_telegram_quick.py** - 快速测试（5秒超时）
3. **test_telegram_proxy.py** - 支持代理的测试（推荐）

推荐使用 `test_telegram_proxy.py`，它会：
- 自动检测代理配置
- 提供详细的错误信息
- 给出解决方案建议

## 配置示例

### 完整的 .env 配置

```bash
# 数据库配置
MYSQL_HOST=your_host
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# Telegram 配置
TELEGRAM_BOT_TOKEN=123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789

# 代理配置（如果需要）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890

# 其他配置...
```

## 验证清单

配置完成后，检查：

- [ ] 代理工具已启动
- [ ] 代理端口正确
- [ ] .env 文件中已添加代理配置
- [ ] 运行 `test_telegram_proxy.py` 测试成功
- [ ] Telegram 收到测试消息

## 需要帮助？

如果仍然无法连接：

1. 检查代理工具日志
2. 尝试不同的代理端口
3. 确认网络环境
4. 查看项目 Issues

---

**提示**: 如果你在海外或网络环境良好，可能不需要配置代理。
