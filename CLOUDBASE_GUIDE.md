# 腾讯云 CloudBase 静态网站托管部署指南

## 📊 费用说明

### 免费额度（永久有效）
- **存储空间**：1GB
- **流量**：5GB/月
- **CDN 加速**：200+ 国内节点

### 超出后按量付费
- 存储：0.1元/GB/天
- 流量：0.8元/GB

**对于你的项目（约 660KB）：永久免费！**

---

## 🚀 部署步骤

### 第一步：开通 CloudBase 服务

1. 访问 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 点击 **「新建」** 或 **「开通服务」**
3. 选择环境：
   - **环境名称**：`physics-simulator`（或自定义）
   - **套餐**：选择 **「免费版」** 或 **「按量付费」**
   - **地域**：选择 **广州** 或 **上海**（离你最近的区域）
4. 勾选同意协议，点击 **「新建」**
5. 等待环境创建（约 1-2 分钟）

### 第二步：安装 CloudBase CLI

```bash
# macOS
npm install -g @cloudbase/cli

# 验证安装
cloudbase -v
```

### 第三步：登录 CloudBase

```bash
cloudbase login
```

会打开浏览器，扫码或使用腾讯云账号登录。

### 第四步：部署网站

```bash
# 进入项目目录
cd /Users/williamshakespeare/Desktop/web\ collision\ app\ base\ on\ cannon-e/web-app

# 构建项目
npm run build

# 部署到 CloudBase
cloudbase hosting deploy dist
```

**第一次部署会要求选择环境**，选择你刚创建的环境。

### 第五步：访问网站

部署成功后，会显示访问地址：
```
https://xxx.tcb.qcloud.la/editor.html
```

或：

```
https://xxx.service.tcloudbase.com/editor.html
```

---

## 🎛️ 控制台部署方式（备用）

如果不想用命令行，也可以用控制台：

1. 进入 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境
3. 点击左侧 **「静态网站托管」**
4. 点击 **「上传文件」**
5. 选择 `dist` 目录中的所有文件：
   - `editor.html`
   - `assets/` 文件夹
6. 上传完成后访问提供的域名

---

## 🔄 更新网站

### 使用 CLI 自动更新

```bash
# 修改代码后
npm run build

# 重新部署
cloudbase hosting deploy dist
```

### 使用控制台手动更新

1. 在控制台删除旧文件
2. 上传新文件

---

## ⚙️ 配置自定义域名（可选）

如果有已备案的域名：

1. 在环境设置中，点击 **「域名管理」**
2. 添加自定义域名
3. 配置 DNS 解析（CNAME 记录）
4. 等待生效

---

## 📝 环境变量配置

如果需要环境变量：

1. 在环境设置中，点击 **「环境变量」**
2. 添加需要的变量
3. 在代码中通过 `process.env` 访问

---

## 🌐 访问地址说明

### 默认域名（无需备案）
```
https://xxx.tcb.qcloud.la/editor.html
或
https://xxx.service.tcloudbase.com/editor.html
```

### 自定义域名（需要备案）
```
https://physics.yourdomain.com/editor.html
```

---

## ✅ 部署检查清单

- [ ] 已开通 CloudBase 服务
- [ ] 已安装 CloudBase CLI
- [ ] 已登录 cloudbase
- [ ] 已构建项目（npm run build）
- [ ] 已部署到 CloudBase
- [ ] 已测试访问地址

---

## 🔍 故障排查

### 问题 1：cloudbase command not found

**解决：**
```bash
npm install -g @cloudbase/cli
```

### 问题 2：部署失败，提示环境不存在

**解决：**
1. 确认已在控制台创建环境
2. 运行 `cloudbase env:list` 查看环境列表
3. 使用 `cloudbase env:switch <环境ID>` 切换环境

### 问题 3：访问 404

**解决：**
1. 确认文件已上传成功
2. 检查访问地址是否正确
3. 在控制台检查文件列表

### 问题 4：部署成功但页面空白

**解决：**
1. 检查 JS 文件路径
2. 打开浏览器开发者工具查看错误
3. 确认 `assets/` 文件夹已上传

---

## 💡 最佳实践

### 1. 文件结构
```
dist/
├── editor.html
└── assets/
    └── main-xxx.js
```

### 2. 缓存配置
在控制台设置合适的缓存策略：
- HTML：不缓存
- JS/CSS：长期缓存（因为有 hash）

### 3. CDN 加速
CloudBase 默认开启 CDN，无需额外配置

### 4. HTTPS
默认提供 HTTPS，无需配置

---

## 📚 相关链接

- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [静态网站托管文档](https://docs.cloudbase.net/cli-v1/hosting)
- [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
- [价格文档](https://cloud.tencent.com/document/product/876/75213)

---

## 🚀 快速部署命令

```bash
# 1. 构建
npm run build

# 2. 部署
cloudbase hosting deploy dist

# 3. 完成！访问控制台提供的域名
```

就这么简单！

---

**提示：** 如果需要自动化脚本，运行 `./deploy-cloudbase.sh` 即可一键部署！
