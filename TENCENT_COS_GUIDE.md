# 腾讯云 COS 静态网站托管部署指南

## 📊 免费额度

腾讯云 COS 为新用户提供：
- **存储空间**：50GB
- **流量**：每月 10-50GB
- **请求次数**：每月 100 万次

对于你的物理模拟器项目，这个额度完全够用！

---

## 🚀 部署步骤（手动方式 - 推荐新手）

### 第一步：注册并开通腾讯云 COS

1. 访问 [腾讯云官网](https://cloud.tencent.com/)
2. 注册/登录账号
3. 进入 [对象存储 COS 控制台](https://console.cloud.tencent.com/cos5)
4. 开通 COS 服务（首次开通有免费额度）

### 第二步：创建存储桶（Bucket）

1. 在 COS 控制台，点击 **「创建存储桶」**
2. 填写配置：
   - **存储桶名称**：`physics-simulator`（或自定义，全局唯一）
   - **地域**：选择 **广州** 或 **上海**（离你最近的区域）
   - **访问权限**：选择 **「公有读私有写」**
3. 点击 **「创建」**

### 第三步：上传网站文件

1. 进入刚创建的存储桶
2. 点击左侧菜单 **「文件列表」**
3. 点击 **「上传文件」**
4. 选择以下文件上传：
   - `editor.html`（主页面）
   - `assets/` 文件夹（包含 JS 文件）

**或者**，将整个 `dist` 目录的内容上传。

### 第四步：开启静态网站托管

1. 在存储桶页面，点击左侧菜单 **「基础配置」**
2. 向下滚动找到 **「静态网站」**
3. 点击 **「编辑」**
4. 配置：
   - **状态**：选择 **「开启」**
   - **索引文档**：`editor.html`
   - **错误文档**：`editor.html`（SPA 应用需要）
5. 点击 **「保存」**

### 第五步：获取访问地址

开启静态网站后，会显示访问地址：
```
https://physics-simulator-{appid}.cos.ap-guangzhou.myqcloud.com/editor.html
```

这个地址就可以直接访问了！

### 第六步：（可选）配置 CDN 加速

1. 在存储桶页面，点击左侧菜单 **「域名管理」**
2. 点击 **「开启 CDN 加速」**
3. 配置：
   - **加速域名**：可以使用 COS 提供的默认域名（无需备案）
   - 或绑定自定义域名（需要备案）
4. 等待配置生效（几分钟）

---

## 🛠️ 自动化部署（进阶）

### 使用 COSCLI 命令行工具

#### 1. 安装 COSCLI

```bash
# macOS
brew tap tencent-cloud/tap
brew install coscli

# 或下载二进制文件
# https://github.com/tencentyun/coscli/releases
```

#### 2. 配置

```bash
coscli config
```

输入你的：
- SecretID
- SecretKey
- 地域（ap-guangzhou）

#### 3. 同步文件

```bash
# 进入项目目录
cd /Users/williamshakespeare/Desktop/web\ collision\ app\ base\ on\ cannon-e/web-app

# 构建项目
npm run build

# 同步到 COS
coscli sync -r dist/ cos://physics-simulator/ --delete
```

#### 4. 创建快捷部署脚本

我可以帮你创建一个 `deploy-cos.sh` 脚本，一键部署！

---

## 📝 更新网站

### 手动更新

1. 构建新版本：
   ```bash
   npm run build
   ```

2. 在 COS 控制台删除旧文件
3. 上传新文件

### 自动更新（使用 COSCLI）

```bash
npm run build
coscli sync -r dist/ cos://physics-simulator/ --delete
```

---

## 🔑 获取密钥

如果需要使用自动化工具：

1. 访问 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 点击 **「新建密钥」**
3. 保存 `SecretId` 和 `SecretKey`（妥善保管！）

---

## ✅ 部署检查清单

- [ ] 已注册腾讯云账号
- [ ] 已开通 COS 服务
- [ ] 已创建存储桶（公有读私有写）
- [ ] 已上传文件
- [ ] 已开启静态网站托管
- [ ] 已测试访问地址
- [ ] （可选）已配置 CDN 加速

---

## 🌐 访问地址格式

### COS 默认域名（无需备案）
```
https://{bucket-name}-{appid}.cos.{region}.myqcloud.com/editor.html
```

示例：
```
https://physics-simulator-1234567890.cos.ap-guangzhou.myqcloud.com/editor.html
```

### CDN 加速域名（可选）
```
https://{bucket-name}-{appid}.cdn.{region}.myqcloud.com/editor.html
```

---

## 💡 最佳实践

### 1. 文件组织
```
存储桶根目录/
├── editor.html          # 主页面
└── assets/
    └── main-xxx.js      # 构建后的 JS
```

### 2. 缓存配置
在 COS 控制台设置合适的缓存时间：
- HTML 文件：不缓存或短时间
- JS/CSS 文件：长时间缓存（因为文件名有 hash）

### 3. HTTPS
COS 默认提供 HTTPS 访问，无需额外配置

---

## 🔍 故障排查

### 问题 1：访问 403 Forbidden
- 检查存储桶权限是否为「公有读私有写」

### 问题 2：访问 404 Not Found
- 检查文件路径是否正确
- 确认静态网站已开启

### 问题 3：页面空白
- 检查 JS 文件路径
- 打开浏览器开发者工具查看错误

---

## 📚 相关链接

- [腾讯云 COS 官方文档](https://cloud.tencent.com/document/product/436)
- [静态网站托管配置](https://cloud.tencent.com/document/product/436/9512)
- [COSCLI 使用指南](https://cloud.tencent.com/document/product/436/63679)
- [免费额度说明](https://cloud.tencent.com/document/product/436/6240)

---

## 💰 费用说明

超出免费额度后的费用（参考）：
- **存储容量**：¥0.118/GB/月（标准存储）
- **下行流量**：¥0.5/GB（外网下行）
- **请求次数**：¥0.01/万次

对于小型静态网站，免费额度基本足够！

---

**提示**：如果需要自动化部署脚本，告诉我，我可以帮你创建！
