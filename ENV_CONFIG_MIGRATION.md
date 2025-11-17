# 环境变量配置迁移说明

## 变更内容

将所有脚本中的硬编码配置迁移到 `.env` 文件中，提高安全性。

## 修改的文件

### 新增文件

1. **cloudflare-worker/.env.example** - 配置模板（可提交到 Git）
2. **cloudflare-worker/.env** - 实际配置（已在 .gitignore 中）
3. **cloudflare-worker/scripts/README.md** - 脚本使用说明

### 修改的脚本

所有脚本都已修改为从 `.env` 文件读取配置：

1. **cloudflare-worker/scripts/init.sh** - 自动初始化脚本
2. **cloudflare-worker/scripts/debug-init.sh** - 调试脚本
3. **cloudflare-worker/scripts/diagnose.sh** - 诊断脚本
4. **cloudflare-worker/scripts/test-connection.sh** - 连接测试脚本
5. **cloudflare-worker/scripts/init-with-proxy.sh** - 带代理的初始化脚本

### 修改的文档

1. **cloudflare-worker/README.md** - 添加了配置说明

## 使用方法

### 首次使用

```bash
# 1. 进入项目目录
cd cloudflare-worker

# 2. 复制配置模板
cp .env.example .env

# 3. 编辑配置文件
vim .env  # 或使用其他编辑器

# 4. 填写你的配置
WORKER_URL=https://your-worker.workers.dev
API_KEY=your-api-key-here
USE_PROXY=false
PROXY_PORT=7897

# 5. 运行脚本
cd scripts
./init.sh
```

### 配置项说明

| 配置项 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| WORKER_URL | 是 | Cloudflare Worker 的 URL | `https://lottery-prediction.githubmen.workers.dev` |
| API_KEY | 是 | API 认证密钥 | `d9464dbad6564438a37ff5245494152d` |
| USE_PROXY | 否 | 是否使用代理 | `true` 或 `false` |
| PROXY_PORT | 否 | 代理端口 | `7897` |

## 安全性改进

### 之前（硬编码）

```bash
# ❌ 不安全：敏感信息直接写在脚本中
WORKER_URL="https://lottery-prediction.githubmen.workers.dev"
API_KEY="d9464dbad6564438a37ff5245494152d"
```

问题：
- 敏感信息会被提交到 Git
- 难以管理多个环境的配置
- 容易泄露 API Key

### 现在（环境变量）

```bash
# ✅ 安全：从 .env 文件读取
source .env
echo "Worker URL: $WORKER_URL"
```

优点：
- `.env` 文件不会被提交到 Git
- 可以为不同环境使用不同的配置
- 敏感信息更安全

## 迁移步骤

如果你已经在使用旧版本的脚本：

1. **备份现有配置**
   ```bash
   # 记录你当前使用的 WORKER_URL 和 API_KEY
   ```

2. **创建 .env 文件**
   ```bash
   cd cloudflare-worker
   cp .env.example .env
   ```

3. **填写配置**
   ```bash
   # 编辑 .env，填入你之前使用的配置
   vim .env
   ```

4. **测试**
   ```bash
   cd scripts
   ./diagnose.sh  # 测试配置是否正确
   ```

5. **清理旧配置**
   ```bash
   # 如果你修改过脚本，可以恢复到原始版本
   git checkout cloudflare-worker/scripts/*.sh
   ```

## 常见问题

### Q: 我的 .env 文件会被提交到 Git 吗？

A: 不会。`.env` 已经添加到 `.gitignore` 中，Git 会自动忽略它。

### Q: 如何在多个环境中使用不同的配置？

A: 可以创建多个配置文件：
```bash
.env.dev      # 开发环境
.env.prod     # 生产环境
.env.test     # 测试环境
```

然后在运行脚本前指定：
```bash
cp .env.prod .env
./init.sh
```

### Q: 如果忘记创建 .env 文件会怎样？

A: 脚本会提示错误并退出：
```
❌ 错误：未找到配置文件 /path/to/.env
💡 请复制 .env.example 为 .env 并填写配置
   cp /path/to/.env.example /path/to/.env
```

### Q: 可以在脚本中覆盖 .env 的配置吗？

A: 可以。环境变量的优先级：
1. 命令行传入的环境变量（最高）
2. .env 文件中的配置
3. 脚本中的默认值（最低）

示例：
```bash
# 临时覆盖 WORKER_URL
WORKER_URL=https://test.workers.dev ./init.sh
```

### Q: 团队协作时如何共享配置？

A: 
1. **不要共享 .env 文件**（包含敏感信息）
2. **共享 .env.example 文件**（不包含敏感信息）
3. 每个成员根据 .env.example 创建自己的 .env
4. 通过安全渠道（如密码管理器）共享 API_KEY

## 检查清单

迁移完成后，请检查：

- [ ] 已创建 `.env` 文件
- [ ] `.env` 文件包含所有必需的配置项
- [ ] `.env` 文件不在 Git 版本控制中
- [ ] 运行 `./diagnose.sh` 测试配置是否正确
- [ ] 所有脚本都能正常运行
- [ ] 旧的硬编码配置已清理

## 相关文档

- [脚本使用说明](cloudflare-worker/scripts/README.md)
- [主 README](cloudflare-worker/README.md)
- [部署指南](cloudflare-worker/DEPLOY.md)
