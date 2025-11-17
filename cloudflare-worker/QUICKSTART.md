# 快速开始

## 3 步完成初始化

### 1️⃣ 配置

```bash
cd cloudflare-worker
cp .env.example .env
vim .env
```

填写：
```bash
WORKER_URL=https://your-worker.workers.dev
API_KEY=your-api-key-here
```

### 2️⃣ 检查

```bash
cd scripts
./diagnose.sh
```

确保所有检查通过 ✅

### 3️⃣ 初始化

```bash
./init.sh
```

等待完成（约 1-2 小时）

## 完成！

查看数据：
```bash
curl -s "$WORKER_URL/stats"
```

## 需要帮助？

查看详细文档：
- [脚本使用说明](scripts/README.md)
- [主文档](README.md)
- [部署指南](DEPLOY.md)

## 常见问题

**Q: 如何后台运行？**
```bash
nohup ./init.sh > init.log 2>&1 &
```

**Q: 如何自动跨天继续？**

在 `.env` 中设置：
```bash
AUTO_CONTINUE=true
```

**Q: 如何查看进度？**
```bash
tail -f init.log
```
