# Gitee Pages 部署指南

## 📖 简介

**Gitee Pages** 是 Gitee 提供的静态网页托管服务，特别适合中国大陆用户：

- ✅ **国内访问最快**：服务器位于上海
- ✅ **完全免费**：无限制托管
- ✅ **简单易用**：几步即可完成部署
- ✅ **自动 HTTPS**：免费 SSL 证书
- ⚠️ **限制**：免费版不支持自定义域名，需手动更新

## 🚀 快速开始

### 方法一：使用自动部署脚本（推荐）

```bash
cd web-app
./deploy-gitee.sh
```

脚本会自动：
1. 检查并初始化 Git 仓库
2. 构建项目（npm run build）
3. 提交代码并推送

### 方法二：手动部署

#### 第一步：准备项目

```bash
# 进入项目目录
cd web-app

# 构建 dist 目录
npm run build

# 初始化 Git 仓库
git init

# 创建 .gitignore
cat > .gitignore << EOF
node_modules/
.DS_Store
.vscode/
.idea/
*.log
EOF
```

#### 第二步：在 Gitee 创建仓库

1. 访问 [Gitee.com](https://gitee.com/)
2. 注册/登录账号
3. 点击右上角 **「+」** → **「新建仓库」**

4. 填写仓库信息：
   - **仓库名称**：`physics-simulator`（或自定义）
   - **仓库介绍**：物理模拟器（可选）
   - **是否公开**：✅ **必须选择公开**（私有仓库无法使用 Pages）
   - 其他选项可选

5. 点击 **「创建」**

#### 第三步：推送代码到 Gitee

```bash
# 添加远程仓库（替换成你的用户名）
git remote add origin https://gitee.com/你的用户名/physics-simulator.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 推送到 Gitee（如果使用 main 分支，替换 master 为 main）
git branch -M master
git push -u origin master
```

#### 第四步：启用 Gitee Pages

1. 进入你的 Gitee 仓库页面
2. 点击上方菜单 **「服务」** → **「Gitee Pages」**
3. 首次使用需要实名认证（需要身份证）
4. 配置 Pages：
   - **部署分支**：`master`（或 `main`）
   - **部署目录**：
     - 如果是构建后的文件：`/dist`
     - 如果是根目录的 HTML：留空（根目录）
   - 点击 **「启动」** 按钮

5. 等待几秒后，会显示：
   ```
   ✅ 网站已正式发布
   🌐 访问地址：https://你的用户名.gitee.io/physics-simulator
   ```

## 📝 部署 dist 目录

如果你的项目使用 Vite 构建，部署 `dist` 目录的方法：

### 方法一：直接在仓库根目录构建

```bash
# 1. 构建
npm run build

# 2. 将 dist 目录的内容移到根目录
cp -r dist/* .

# 3. 提交并推送
git add .
git commit -m "Deploy to Gitee Pages"
git push origin master
```

然后在 Gitee Pages 中设置部署目录为 **根目录（留空）**。

### 方法二：使用 gh-pages 分支

```bash
# 1. 安装 gh-pages 工具
npm install -g gh-pages

# 2. 构建项目
npm run build

# 3. 部署到 gh-pages 分支
gh-pages -d dist

# 4. 推送到 Gitee
git push origin gh-pages
```

然后在 Gitee Pages 中设置部署分支为 **gh-pages**，部署目录为 **根目录**。

### 方法三：修改 vite.config.js

修改 `vite.config.js`，将构建输出改为根目录：

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '.',  // 输出到根目录
    rollupOptions: {
      input: {
        main: './editor.html'
      }
    }
  }
});
```

构建后直接推送即可：
```bash
npm run build
git add .
git commit -m "Deploy"
git push origin master
```

## 🔄 更新网站

### 手动更新（Gitee Pages 必需）

Gitee Pages **不会自动检测代码更新**，需要手动触发：

1. 推送新代码：
   ```bash
   git add .
   git commit -m "Update website"
   git push origin master
   ```

2. 进入仓库 → **「服务」** → **「Gitee Pages」**

3. 点击 **「更新」** 按钮

4. 等待几秒后刷新网站

### 自动更新（可选）

使用 Gitee Webhook 可以实现自动更新，但需要额外配置服务器。

## ⚙️ 高级配置

### 绑定自定义域名（付费功能）

免费版 Gitee Pages **不支持自定义域名**。

如需自定义域名，需要升级到 Gitee Pages 专业版（付费）。

### 多页面应用配置

如果是 SPA（单页应用），可能需要配置 404 页面重定向到 index.html。

在仓库根目录创建 `404.html`，内容与 `index.html` 相同。

### 环境变量

Gitee Pages 是纯静态托管，**不支持环境变量**。

如有需要，可在构建时将配置写入 JavaScript 文件。

## 📊 部署对比

| 特性 | Gitee Pages | Vercel | Netlify | GitHub Pages |
|------|------------|--------|---------|--------------|
| 国内访问速度 | ⚡️ **最快** | 🐌 慢 | 🐌 慢 | 🐌 很慢 |
| 免费额度 | ✅ 无限制 | ⚠️ 有限制 | ⚠️ 有限制 | ✅ 无限制 |
| 自动部署 | ❌ 需手动 | ✅ 自动 | ✅ 自动 | ✅ 自动 |
| 自定义域名 | ❌ 付费 | ✅ 免费 | ✅ 免费 | ✅ 免费 |
| HTTPS 证书 | ✅ 免费 | ✅ 免费 | ✅ 免费 | ✅ 免费 |
| 国内访问稳定性 | ✅ 稳定 | ⚠️ 一般 | ⚠️ 一般 | ❌ 不稳定 |

## 🐛 常见问题

### Q1: 为什么点击「启动」后没有反应？

- 检查仓库是否为 **公开仓库**（私有仓库无法使用 Pages）
- 确保已完成 **实名认证**
- 检查仓库中是否有 `index.html` 文件
- 清除浏览器缓存后重试

### Q2: 部署后页面空白？

- 检查 `index.html` 中的资源路径是否正确
- 如果使用 Vue/React 等框架，确保 `base` 路径配置正确
- 打开浏览器开发者工具查看错误信息

### Q3: 如何更新网站？

Gitee Pages **不会自动更新**，需要：
1. 推送新代码到仓库
2. 进入仓库 →「服务」→「Gitee Pages」
3. 点击「更新」按钮

### Q4: 为什么国内推荐 Gitee Pages？

- **速度快**：服务器在上海，国内访问速度最快
- **稳定**：不会像 GitHub Pages 那样间歇性被墙
- **免费**：完全免费无限制
- **简单**：配置简单，几分钟即可部署

### Q5: Gitee Pages 有流量限制吗？

**没有流量限制**，可以放心使用。

### Q6: 可以部署多个网站吗？

可以！每个 Gitee 仓库都可以启用 Pages 服务，每个仓库对应一个网站。

### Q7: 如何删除已部署的网站？

进入仓库 →「服务」→「Gitee Pages」→ 点击「停止」按钮。

## 💡 最佳实践建议

### 对于中国用户

**推荐使用 Gitee Pages**：
- 国内访问速度最快
- 完全免费无限制
- 不会出现访问问题

### 需要国际访问

可以同时部署到多个平台：
- **国内用户**：Gitee Pages
- **国际用户**：Vercel / Cloudflare Pages

### 需要自动部署

考虑使用 **Vercel** 或 **Cloudflare Pages**：
- Git 推送后自动构建部署
- 支持自定义域名
- 国际访问友好

### 需要自定义域名（免费）

推荐使用 **Vercel** 或 **Cloudflare Pages**：
- 免费支持自定义域名
- 自动 HTTPS 证书
- 全球 CDN 加速

## 🔗 相关资源

- [Gitee Pages 官方文档](https://pages.gitee.io/)
- [Gitee 主页](https://gitee.com/)
- [Vite 构建工具文档](https://vitejs.dev/)
- [Git 基础教程](https://git-scm.com/docs/gittutorial)

## 📝 总结

**Gitee Pages 是中国大陆用户的首选**：

✅ **优势**：
- 国内访问速度最快
- 完全免费
- 配置简单
- 稳定可靠

⚠️ **限制**：
- 需手动更新（不支持自动部署）
- 免费版不支持自定义域名
- 必须是公开仓库
- 需要实名认证

**适用场景**：
- 个人项目展示
- 静态网站托管
- 不需要频繁更新的内容
- 主要面向中国用户

---

**提示**：如果需要更高级的功能（自动部署、自定义域名等），可以考虑同时部署到 Vercel 或 Cloudflare Pages。
