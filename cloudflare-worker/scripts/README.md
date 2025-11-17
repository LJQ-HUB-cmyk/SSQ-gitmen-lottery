# 脚本使用说明

## 配置

所有脚本都从 `.env` 文件读取配置，不再硬编码敏感信息。

### 首次使用

1. 复制配置模板：
   ```bash
   cd cloudflare-worker
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填写你的配置：
   ```bash
   # Cloudflare Worker 配置
   WORKER_URL=https://your-worker.workers.dev
   API_KEY=your-api-key-here
   
   # 代理配置（可选）
   USE_PROXY=false
   PROXY_PORT=7897
   ```

3. 保存后即可运行脚本

### 安全说明

- `.env` 文件已添加到 `.gitignore`，不会被提交到 Git
- `.env.example` 是配置模板，可以安全提交
- 请勿将 `.env` 文件分享给他人

## 可用脚本

### 1. init.sh - 自动初始化脚本

批量导入历史数据，支持断点续传。

```bash
cd cloudflare-worker/scripts
./init.sh
```

特点：
- 自动从 `.env` 读取配置
- 支持代理（在 `.env` 中配置）
- 每次爬取 100 期
- 自动从数据库最旧期号往前爬取
- 间隔 120 秒执行下一次

### 2. debug-init.sh - 调试脚本

查看 API 的详细响应，用于排查问题。

```bash
./debug-init.sh
```

### 3. diagnose.sh - 完整诊断

全面检查 Worker 的运行状态。

```bash
./diagnose.sh
```

检查项目：
- Worker 是否可访问
- `/latest` 接口是否正常
- `/stats` 接口是否正常
- API 认证是否成功
- 数据库数据量

### 4. test-connection.sh - 连接测试

测试本地到 Worker 的网络连接。

```bash
./test-connection.sh
```

包含：
- curl 测试
- Python 测试（如果安装了 Python）
- 浏览器测试方法说明

### 5. init-with-proxy.sh - 带代理的初始化

强制使用代理进行初始化（已废弃，建议在 `.env` 中配置代理）。

```bash
./init-with-proxy.sh
```

## 环境变量说明

### WORKER_URL
- 类型：字符串
- 必填：是
- 说明：Cloudflare Worker 的 URL
- 示例：`https://lottery-prediction.githubmen.workers.dev`

### API_KEY
- 类型：字符串
- 必填：是（需要认证的接口）
- 说明：API 认证密钥，需要与 Worker KV 中配置的一致
- 示例：`d9464dbad6564438a37ff5245494152d`

### USE_PROXY
- 类型：布尔值（true/false）
- 必填：否
- 默认值：false
- 说明：是否使用代理

### PROXY_PORT
- 类型：数字
- 必填：否（USE_PROXY=true 时需要）
- 默认值：7897
- 说明：代理服务器端口

## 常见问题

### Q: 如何获取 API_KEY？

A: API_KEY 存储在 Cloudflare Worker 的 KV 命名空间中：
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages → KV
3. 找到你的 KV 命名空间
4. 查看 `API_KEY` 的值

### Q: 脚本提示找不到 .env 文件？

A: 请先复制配置模板：
```bash
cp cloudflare-worker/.env.example cloudflare-worker/.env
```
然后编辑 `.env` 文件填写配置。

### Q: 如何使用代理？

A: 在 `.env` 文件中设置：
```bash
USE_PROXY=true
PROXY_PORT=7897
```

### Q: 可以在不同项目中使用不同的配置吗？

A: 可以。每个项目的 `.env` 文件是独立的，互不影响。

### Q: 如何查看脚本执行日志？

A: 脚本会输出详细日志到终端。如需保存日志：
```bash
./init.sh 2>&1 | tee init.log
```

## 最佳实践

1. **首次使用**：先运行 `diagnose.sh` 检查 Worker 状态
2. **初始化数据**：运行 `init.sh` 批量导入历史数据
3. **遇到问题**：运行 `debug-init.sh` 查看详细响应
4. **定期更新**：设置 cron 任务定期运行 Worker 的 `/run` 接口

## 安全建议

1. 不要将 `.env` 文件提交到 Git
2. 不要在公开场合分享 API_KEY
3. 定期更换 API_KEY
4. 使用强密码生成器生成 API_KEY
