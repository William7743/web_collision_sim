# 腾讯云 Coding Pages 部署指南

## 📖 简介

腾讯云 Coding Pages 是一个免费的静态网站托管服务，特别适合中国大陆用户：
- ✅ **完全免费**：无限制托管
- ✅ **国内访问快**：服务器在中国大陆
- ✅ **免费 HTTPS**：自动配置 SSL 证书
- ✅ **自定义域名**：可绑定自己的域名
- ✅ **CDN 加速**：与 COS/CDN 联动
- ✅ **Git 自动部署**：代码推送后自动构建部署

## 🚀 快速开始

### 方法一：使用自动部署脚本

```bash
cd web-app
./deploy-coding.sh
```

脚本会自动：
1. 检查并初始化 Git 仓库
2. 构建项目（npm run build）
3. 创建配置文件
4. 提交代码并推送

### 方法二：手动部署

#### 1️⃣ 准备项目

```bash
# 进入项目目录
cd web-app

# 构建 dist 目录
npm run build

# 初始化 Git 仓库（如果还没有）
git init

# 创建 .gitignore
cat > .gitignore << EOF
node_modules/
.DS_Store
.vscode/
.idea/
EOF
```

#### 2️⃣ 推送代码到 Git 仓库

**选择 A：使用 Coding.net（推荐）**

1. 访问 https://coding.net/
2. 注册/登录账号
3. 点击「新建项目」
4. 选择「DevOps 项目」
5. 填写项目信息：
   - 项目名称：`physics-simulator`
   - 项目描述：`物理模拟器`
   - 可见性：公开或私有

6. 创建后，添加远程仓库并推送：

```bash
git remote add origin https://e.coding.net/你的用户名/physics-simulator.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

**选择 B：使用 Gitee**

1. 访问 https://gitee.com/
2. 注册/登录账号
3. 点击「新建仓库」
4. 填写仓库信息：
   - 仓库名称：`physics-simulator`
   - 是否公开：公开或私有

5. 创建后，添加远程仓库并推送：

```bash
git remote add origin https://gitee.com/你的用户名/physics-simulator.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

#### 3️⃣ 在 Coding.net 配置 Pages 服务

1. 登录 [Coding.net](https://coding.net/)
2. 进入你的项目
3. 点击左侧菜单「持续部署」→「静态网站」
4. 点击「新建静态网站」

5. 填写配置信息：

   | 配置项 | 值 |
   |--------|-----|
   | 网站名称 | physics-simulator |
   | 仓库 | 选择你推送的仓库 |
   | 分支 | main（或 master） |
   | 构建命令 | `npm install && npm run build` |
   | 发布目录 | `dist` |
   | 404 页面 | /index.html |

6. 点击「保存」开始部署

#### 4️⃣ 部署成功

部署完成后，你会获得：
- **免费子域名**：`https://xxx.coding-pages.com`
- **自动 HTTPS**：已启用 SSL 证书
- **CDN 加速**：已自动配置

## ⚙️ 高级配置

### 绑定自定义域名

1. 在域名管理页面，点击「绑定域名」
2. 输入你的域名（如：`physics.example.com`）
3. 按照提示配置 DNS 解析：
   - 记录类型：CNAME
   - 主机记录：physics
   - 记录值：你的 Coding Pages 域名

4. 等待 DNS 生效后，Coding 会自动签发 SSL 证书

### 配置自动部署

在 `.coding-pages.yml` 中配置自动触发部署：

```yaml
version: 2.0
build:
  command: npm install && npm run build
  artifacts:
    - source: dist
      destination: /
```

每次推送代码到仓库，Coding 会自动：
1. 检测到代码更新
2. 执行构建命令
3. 部署到 Pages 服务

### 环境变量配置

如果项目需要环境变量：

1. 在静态网站设置中找到「环境变量」
2. 添加需要的环境变量（如 API_KEY、NODE_ENV 等）

## 📊 部署对比

| 特性 | Coding Pages | Vercel | Netlify |
|------|-------------|--------|---------|
| 国内访问速度 | ⚡️ 快 | 🐌 慢 | 🐌 慢 |
| 免费额度 | ✅ 无限制 | ⚠️ 有限制 | ⚠️ 有限制 |
| 自定义域名 | ✅ 免费 | ✅ 免费 | ✅ 免费 |
| HTTPS 证书 | ✅ 自动 | ✅ 自动 | ✅ 自动 |
| CDN 加速 | ✅ 国内 | ❌ 国外 | ❌ 国外 |
| 部署速度 | ⚡️ 快 | ⚡️ 快 | ⚡️ 快 |

## 🐛 常见问题

### Q: 构建失败怎么办？

检查以下几点：
1. `package.json` 中的构建脚本是否正确
2. `vite.config.js` 配置是否正确
3. 构建命令应该是 `npm run build`
4. 发布目录应该是 `dist`

### Q: 页面 404？

1. 检查发布目录是否为 `dist`
2. 确认 `dist` 目录中有 `index.html` 文件
3. 检查路由模式（如使用 History API，需配置 SPA 路由）

### Q: 如何更新网站？

只需推送新的代码：
```bash
git add .
git commit -m "Update website"
git push
```

Coding Pages 会自动检测并重新部署。

### Q: 如何查看部署日志？

1. 进入项目的「持续部署」→「静态网站」
2. 点击你的网站
3. 查看「部署记录」和「构建日志」

## 📚 相关资源

- [Coding Pages 官方文档](https://help.coding.net/docs/pages/)
- [Vite 构建工具](https://vitejs.dev/)
- [Git 基础教程](https://git-scm.com/docs/gittutorial)

## 🎯 总结

对于中国大陆用户，**Coding Pages 是最佳选择**：
- 国内访问速度快且稳定
- 完全免费无限制
- 配置简单，支持 Git 自动部署
- 与 COS/CDN 深度集成

如果需要国际访问，可以同时部署到多个平台（Coding + Vercel/Netlify）。
