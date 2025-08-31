# Cloudflare 部署指南

本项目支持使用 Wrangler 部署到 Cloudflare Pages 和 Workers。

## 前置要求

1. 安装 Node.js (推荐 18+)
2. 拥有 Cloudflare 账户
3. 安装项目依赖

## 安装依赖

```bash
pnpm install
# 或
npm install
```

## 配置 Wrangler

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 配置项目

编辑 `wrangler.toml` 文件，修改以下配置：

```toml
name = "your-app-name"  # 修改为你的应用名称

[env.production]
name = "your-app-name-production"  # 生产环境名称
```

## 部署命令

### React 应用部署 (Cloudflare Pages)

#### 1. 构建项目

```bash
npm run build
# 或
pnpm build
```

#### 2. 本地预览

```bash
npm run pages:dev
# 或
pnpm pages:dev
```

#### 3. 部署到 Pages

```bash
# 部署到默认环境
npm run pages:deploy
# 或
pnpm pages:deploy

# 部署到生产环境
npm run pages:publish
# 或
pnpm pages:publish
```

### Worker 部署 (CORS 代理)

#### 开发环境

```bash
npm run worker:dev
# 或
pnpm worker:dev
```

#### 部署 Worker

```bash
npm run worker:deploy
# 或
pnpm worker:deploy
```

### 查看日志

```bash
npm run worker:tail
# 或
pnpm worker:tail
```

## 环境配置

### 环境变量

在 Cloudflare Dashboard 中设置环境变量，或使用 wrangler 命令：

```bash
# 设置环境变量
wrangler secret put SECRET_NAME

# 列出环境变量
wrangler secret list
```

### 自定义域名

在 `wrangler.toml` 中配置自定义域名：

```toml
[env.production]
routes = [
  { pattern = "api.yourdomain.com/*", custom_domain = true }
]
```

## Worker 功能

当前 Worker 提供 CORS 代理功能，支持：

- GET、POST、HEAD、OPTIONS 请求
- 跨域请求处理
- 允许的域名：`https://img.nn.ci`、`http://localhost:5173`

### 使用方式

```
https://your-worker.your-subdomain.workers.dev/API-URL
```

例如：
```
https://imgbed-worker.example.workers.dev/https://api.example.com/upload
```

## 故障排除

### 常见问题

1. **部署失败**
   - 检查 `wrangler.toml` 配置
   - 确保已登录 Cloudflare
   - 检查 Worker 名称是否唯一

2. **CORS 错误**
   - 检查 `allowUrls` 配置
   - 确保请求来源在允许列表中

3. **权限问题**
   - 确保 Cloudflare 账户有 Workers 权限
   - 检查 API Token 权限

### 调试

使用 wrangler 调试工具：

```bash
# 查看 Worker 详情
wrangler whoami

# 列出所有 Workers
wrangler list

# 删除 Worker
wrangler delete your-worker-name
```

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
