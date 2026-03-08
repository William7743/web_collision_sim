# 🔧 问题诊断和解决指南

## 问题：看不到新功能

### ✅ 第一步：确认访问正确的页面

**⚠️ 重要：你必须访问 editor.html，而不是 index.html！**

```
✅ 正确：http://localhost:5173/editor.html
❌ 错误：http://localhost:5173/index.html（这是主页）
❌ 错误：http://localhost:5173/（会跳转到主页）
```

### ✅ 第二步：清除浏览器缓存

**方法1：强制刷新**
- Windows/Linux: `Ctrl + F5` 或 `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**方法2：清除缓存**
1. 按 `F12` 打开开发者工具
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

**方法3：无痕模式**
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Safari: `Cmd + Shift + N`

在无痕模式中访问编辑器

### ✅ 第三步：检查JavaScript是否加载

1. 打开 http://localhost:5173/editor.html
2. 按 `F12` 打开开发者工具
3. 点击 `Console` 标签
4. 输入以下命令并回车：

```javascript
console.log('Editor exists:', typeof editor !== 'undefined');
console.log('Editor methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(editor)).slice(0, 10));
```

如果输出显示 `Editor exists: true`，说明编辑器加载成功。

### ✅ 第四步：手动测试速度设置

在Console中输入：

```javascript
// 添加一个测试盒子
editor.addBox();

// 设置速度
editor.updateVelocity('x', 5);
editor.updateVelocity('y', 10);

// 检查是否设置成功
console.log('Velocity:', editor.bodies[0].config.velocity);
```

### ✅ 第五步：重启开发服务器

```bash
# 1. 停止当前服务器（Ctrl+C）

# 2. 清理端口
lsof -ti :5173 | xargs kill -9

# 3. 重新启动
cd /Users/williamshakespeare/Desktop/bullet-collision/web-app
npm run dev
```

### ✅ 第六步：使用不同的浏览器

如果Chrome不工作，尝试：
- Firefox
- Safari
- Edge

---

## 🎯 功能清单

### 你应该能看到：

#### 左侧面板
- ✅ "添加刚体"区域（4个按钮）
- ✅ "刚体列表"区域
- ✅ "添加约束"区域
  - "已选择的刚体:"显示
  - 约束类型下拉框
  - **"⚡ 创建约束"按钮**（新增）

#### 右侧面板（选中刚体后）
- ✅ "基本参数"区域
  - 名称
  - 质量
  - 摩擦力
  - 弹性
- ✅ "位置"区域（X/Y/Z输入框）
- ✅ **"初始速度"区域**（新增）
  - X/Y/Z输入框
  - 提示文字："刚体在开始时的线速度"
- ✅ **"初始角速度"区域**（新增）
  - X/Y/Z输入框
  - 提示文字："刚体在开始时的旋转速度"
- ✅ "尺寸"区域（根据类型不同）

#### 顶部工具栏
- ✅ 标题："🎨 自定义碰撞编辑器"
- ✅ 模式指示器（编辑模式/运行模式）
- ✅ "▶ 运行模拟"按钮
- ✅ "⏹ 停止"按钮
- ✅ "↺ 重置位置"按钮
- ✅ "💾 保存场景"按钮
- ✅ "📂 加载场景"按钮
- ✅ "🗑 清空"按钮

---

## 🐛 常见错误和解决方案

### 错误1：空白页面

**症状：** 页面完全空白，什么都没有

**解决方案：**
1. 检查Console是否有错误
2. 确认访问的是 `/editor.html`
3. 检查网络连接

### 错误2：看到3D画布但看不到控制面板

**症状：** 只能看到黑色背景和网格

**解决方案：**
1. 按F12查看是否有JavaScript错误
2. 检查 `editor.js` 是否成功加载（Network标签）
3. 清除缓存后重试

### 错误3：看到面板但看不到速度设置

**症状：** 右侧面板只有基本参数，没有速度设置

**可能原因：**
1. 没有选中刚体
2. JavaScript代码未执行
3. 浏览器缓存了旧版本

**解决方案：**
```javascript
// 在Console中执行
editor.addBox();
editor.selectBody(1);
editor.updateParamsPanel();
```

### 错误4：无法创建约束

**症状：** Ctrl+点击没有反应

**解决方案：**
1. 确保按住了Ctrl键（Mac用Cmd）
2. 在左侧"刚体列表"中点击，不是在3D视图中
3. 应该看到刚体变成绿色
4. 选择2个后"创建约束"按钮应该可点击

---

## 📸 界面截图参考

### 速度设置应该长这样：

```
┌─────────────────────────────────┐
│ 右侧参数面板                     │
├─────────────────────────────────┤
│ 基本参数                         │
│ 名称: [盒子 1         ]         │
│ 质量: [1.0           ] kg       │
│ 摩擦力: [0.3         ]          │
│ 弹性: [0.3         ]          │
├─────────────────────────────────┤
│ 位置                             │
│ [0.00] [0.00] [0.00]           │
├─────────────────────────────────┤
│ 初始速度 ⭐ 新功能               │
│ [0.00] [0.00] [0.00]           │
│ 刚体在开始时的线速度              │
├─────────────────────────────────┤
│ 初始角速度 ⭐ 新功能             │
│ [0.00] [0.00] [0.00]           │
│ 刚体在开始时的旋转速度            │
└─────────────────────────────────┘
```

### 约束设置应该长这样：

```
┌─────────────────────────────────┐
│ 添加约束                         │
├─────────────────────────────────┤
│ 💡 在刚体列表中按住 Ctrl 点击... │
├─────────────────────────────────┤
│ 已选择的刚体: ⭐ 新功能          │
│ [✓ 盒子 1] [✓ 盒子 2]          │
├─────────────────────────────────┤
│ 约束类型                         │
│ [🔗 铰链约束 - 像门铰链...  ▼] │
├─────────────────────────────────┤
│ [⚡ 创建约束] ⭐ 新按钮          │
├─────────────────────────────────┤
│ 约束列表:                        │
│ • 铰链约束-1                     │
│   盒子 1 ↔ 盒子 2               │
└─────────────────────────────────┘
```

---

## 🔍 完整诊断流程

### 步骤1：确认文件存在

```bash
ls -la /Users/williamshakespeare/Desktop/bullet-collision/web-app/editor.html
ls -la /Users/williamshakespeare/Desktop/bullet-collision/web-app/js/editor.js
```

### 步骤2：确认代码存在

```bash
# 检查速度设置代码
grep "初始速度" /Users/williamshakespeare/Desktop/bullet-collision/web-app/js/editor.js

# 检查约束UI代码
grep "创建约束" /Users/williamshakespeare/Desktop/bullet-collision/web-app/editor.html

# 检查速度方法
grep "updateVelocity" /Users/williamshakespeare/Desktop/bullet-collision/web-app/js/editor.js
```

预期输出：
- `初始速度` 应该出现2次
- `创建约束` 应该出现多次
- `updateVelocity` 应该出现

### 步骤3：在浏览器中测试

打开 http://localhost:5173/editor.html 后，在Console中输入：

```javascript
// 测试1：编辑器是否存在
console.log('Editor:', typeof editor);

// 测试2：添加刚体
editor.addBox();

// 测试3：选中刚体
editor.selectBody(1);

// 测试4：设置速度
editor.updateVelocity('x', 5);
editor.updateAngularVelocity('y', 3);

// 测试5：检查参数
console.log('Config:', editor.bodies[0].config);

// 测试6：刷新UI
editor.updateParamsPanel();
```

### 步骤4：查看生成的HTML

```javascript
// 查看右侧面板的HTML
console.log(document.getElementById('params-container').innerHTML);
```

应该包含"初始速度"和"初始角速度"文字。

---

## 🆘 仍然不行？

### 方法1：完全重新加载

1. 关闭所有浏览器标签
2. 在终端中：`lsof -ti :5173 | xargs kill -9`
3. 等待5秒
4. `npm run dev`
5. 等待服务器启动
6. 使用无痕模式打开 http://localhost:5173/editor.html

### 方法2：检查Vite缓存

```bash
# 清理Vite缓存
rm -rf node_modules/.vite

# 重启服务器
npm run dev
```

### 方法3：使用测试页面

访问 http://localhost:5173/test-features.html
- 这个页面有详细的测试步骤
- 包含界面预览
- 有故障排除指南

---

## 📞 获取帮助

如果以上方法都不行，请提供：

1. 浏览器的Console截图（F12 → Console）
2. Network标签的截图（显示editor.js是否加载）
3. 你看到的具体界面描述
4. 你尝试了哪些步骤

---

**最后确认：**
- ✅ 访问的是 `http://localhost:5173/editor.html`（不是index.html）
- ✅ 服务器正在运行（`npm run dev`）
- ✅ 清除了浏览器缓存（Ctrl+F5）
- ✅ 选中了一个刚体后查看右侧面板

**如果这些都做了还是看不到，请访问测试页面：**
http://localhost:5173/test-features.html
