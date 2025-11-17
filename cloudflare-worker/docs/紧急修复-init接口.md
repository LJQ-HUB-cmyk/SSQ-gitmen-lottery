# 紧急修复：/init 接口错误

## 🐛 问题

执行 `/init` 接口时报错：
```
Cannot read properties of undefined (reading 'duration')
```

## 🔍 原因

D1 数据库的 `exec()` 方法在某些情况下返回的结果没有 `duration` 属性，导致错误。

## ✅ 解决方案

将 `db.exec(sql)` 改为使用 `prepare().run()` 方法，分别执行每个 SQL 语句。

### 修改前

```javascript
async init() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ssq_lottery (...);
    CREATE INDEX IF NOT EXISTS idx_lottery_no ...;
    CREATE INDEX IF NOT EXISTS idx_draw_date ...;
  `;
  
  await this.db.exec(sql);  // ❌ 可能出错
}
```

### 修改后

```javascript
async init() {
  try {
    // 创建表
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS ssq_lottery (...)
    `).run();  // ✅ 使用 prepare().run()

    // 创建索引
    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_lottery_no ...
    `).run();
    
    // ... 其他索引
  } catch (error) {
    // 错误处理
  }
}
```

## 🚀 部署

修复后需要重新部署：

```bash
cd cloudflare-worker
npx wrangler deploy
```

## 🧪 测试

部署后测试：

```bash
export http_proxy="http://127.0.0.1:7897"
export https_proxy="http://127.0.0.1:7897"

curl -X POST "https://lottery-prediction.githubmen.workers.dev/init" \
  -H "Authorization: Bearer d9464dbad6564438a37ff5245494152d" | jq '.'
```

**预期结果**：
```json
{
  "success": true,
  "message": "批量导入完成",
  "inserted": 100,
  "skipped": 0,
  "total": 100,
  "batch_size": 100
}
```

## 📝 相关文件

- `cloudflare-worker/src/utils/database.js` - 已修复

---

**修复时间**：2025-11-17  
**状态**：✅ 已修复，待部署
