# 🍎 Mac用户专用指南 - 约束创建功能

## ✅ 已修复的问题

### 问题1：Command+单击不工作
**状态**: ✅ 已修复

现在同时支持：
- Mac: `⌘ Command + 点击`
- Windows/Linux: `Ctrl + 点击`

### 问题2：看不到绿色高亮
**解决方案**: 已添加完整的视觉反馈

---

## 🎯 快速测试步骤

### 第1步：打开编辑器
```
http://localhost:5173/editor.html
```

### 第2步：添加刚体
1. 点击左侧的"📦 盒子"按钮2次
2. 你应该看到2个盒子出现在列表中

### 第3步：选择刚体用于约束（新功能）
**Mac用户操作：**
1. 按住 `⌘ Command` 键
2. 同时点击第1个盒子
3. 盒子应该变成**绿色**
4. 列表项下方显示"✓ 已选择用于约束"
5. 左侧显示"[✓ 盒子 1]"标签
6. 继续按住 `⌘ Command` 点击第2个盒子
7. 第2个盒子也变成绿色

**Windows用户操作：**
- 用 `Ctrl` 键代替 `⌘ Command` 键

### 第4步：创建约束
1. 选择2个刚体后，"⚡ 创建约束"按钮应该可点击
2. 选择约束类型（铰链/点对点/距离/固定）
3. 点击"⚡ 创建约束"按钮
4. 约束列表中显示新创建的约束

### 第5步：运行测试
1. 点击顶部"▶ 运行模拟"按钮
2. 观察两个盒子的连接效果

---

## 🔍 调试步骤

### 如果仍然不工作，请按F12打开Console

#### 测试1：检查编辑器加载
在Console中输入：
```javascript
console.log('Editor exists:', typeof editor !== 'undefined');
```
应该输出：`Editor exists: true`

#### 测试2：检查事件处理
添加2个盒子后，在Console中输入：
```javascript
// 手动触发选择
editor.handleConstraintSelection(1);
```

然后查看：
1. 是否输出日志："选择刚体用于约束: 1"
2. 第1个盒子是否变成绿色
3. 左侧是否显示"[✓ 盒子 1]"

#### 测试3：检查键盘事件
按住`⌘`点击盒子时，在Console中查看是否输出：
```
刚体列表项点击, id: 1
ctrlKey: false
metaKey: true
检测到修饰键，选择用于创建约束
```

如果看到`metaKey: true`，说明Command键被正确检测到。

---

## 🎨 视觉反馈说明

### 状态1：未选择
```
┌─────────────┐
│ 盒子 1      │  ← 白色背景
│ 盒子        │
└─────────────┘
```

### 状态2：选中编辑中（点击）
```
┌─────────────┐
│ 盒子 1      │  ← 蓝色背景 (#0af)
│ 盒子        │
└─────────────┘
```

### 状态3：选中用于约束（⌘+点击）
```
┌─────────────┐
│ 盒子 1      │  ← 绿色背景 (#2a5a2a)
│ 盒子        │  ← 绿色边框 (#4f4)
│ ✓ 已选择... │  ← 提示文字
└─────────────┘
```

---

## 🐛 故障排除

### 问题1：按⌘+点击没有反应

**检查清单：**
- [ ] 确认在编辑模式（左上角显示"编辑模式"）
- [ ] 确认在左侧"刚体列表"中点击，不是在3D视图中
- [ ] 确认按住的是⌘ Command键（不是Ctrl或Option）
- [ ] 确认有2个或更多刚体存在

**测试命令：**
```javascript
// 在Console中执行
editor.addBox();
editor.addBox();

// 手动测试
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
console.log('Is Mac:', isMac);
console.log('Bodies count:', editor.bodies.length);
```

### 问题2：盒子不变绿色

**可能原因：**
1. CSS没有加载
2. JavaScript错误

**解决方案：**
1. 硬刷新页面（⌘+Shift+R）
2. 在Console中查看是否有错误
3. 检查是否有绿色高亮的CSS类：

```javascript
// 检查CSS
const item = document.querySelector('.body-item');
console.log('Element classes:', item.className);
```

### 问题3：看不到"创建约束"按钮

**检查清单：**
- [ ] 访问的是 `editor.html`（不是 `index.html`）
- [ ] 左侧面板有"添加约束"区域
- [ ] 有一个大的"⚡ 创建约束"按钮

**如果看不到按钮：**
```bash
# 重启服务器
lsof -ti :5173 | xargs kill -9
npm run dev
```

然后在无痕模式下重新打开编辑器。

---

## 📊 Console日志说明

### 正常情况应该看到的日志：

```
刚体列表项点击, id: 1
ctrlKey: false
metaKey: true
检测到修饰键，选择用于创建约束
选择刚体用于约束: 1
添加选择，当前已选择: [1]
```

```
刚体列表项点击, id: 2
ctrlKey: false
metaKey: true
检测到修饰键，选择用于创建约束
选择刚体用于约束: 2
添加选择，当前已选择: [1, 2]
```

### 如果看到错误：

```
点击事件处理错误: TypeError: ...
```
→ 请截图并提供完整的错误堆栈

---

## 🎓 完整示例

### 示例：创建一个简单的钟摆

```
1. 添加1个盒子（位置: 0, 5, 0）
2. ⌘+点击盒子（变绿）
3. 选择"点对点"约束
4. 点击"⚡ 创建约束"
5. 运行模拟
6. 盒子应该像钟摆一样摆动
```

### 示例：创建双摆

```
1. 添加2个盒子
   - 盒子1: 位置 (0, 8, 0)
   - 盒子2: 位置 (0, 6, 0)

2. ⌘+点击盒子1（变绿）

3. ⌘+点击盒子2（也变绿）

4. 选择"铰链约束"

5. 点击"⚡ 创建约束"

6. 运行模拟

7. 两个盒子应该连接并摆动
```

---

## ⌨️ Mac键盘快捷键

| 操作 | 快捷键 |
|------|--------|
| 选择刚体编辑 | 单击 |
| 选择刚体用于约束 | ⌘ + 单击 |
| 取消约束选择 | ⌘ + 单击已选择的 |
| 删除选中刚体 | Delete键 |
| 强制刷新 | ⌘ + Shift + R |
| 打开Console | ⌘ + Option + J |

---

## 📞 需要帮助？

### 提供以下信息：

1. **Mac版本** (关于本机 → 更多信息)
2. **浏览器版本** (Chrome/Safari/Firefox)
3. **Console中的完整日志**
   - 打开Console（F12或⌘+Option+J）
   - 点击盒子时截图所有输出
4. **截图**
   - 整个编辑器界面
   - 左侧面板
   - 右侧面板

### 快速诊断命令

在Console中粘贴以下代码：

```javascript
// 诊断脚本
console.log('=== 编辑器诊断 ===');
console.log('1. 编辑器存在:', typeof editor !== 'undefined');
console.log('2. 刚体数量:', editor.bodies.length);
console.log('3. 约束数量:', editor.constraints.length);
console.log('4. 已选择用于约束:', editor.selectedBodiesForConstraint);
console.log('5. Mac系统:', navigator.platform.includes('Mac'));
console.log('6. 编辑模式:', editor.mode);

// 测试UI更新
if (editor.bodies.length >= 2) {
    console.log('\n=== 测试约束选择 ===');
    editor.handleConstraintSelection(editor.bodies[0].id);
    console.log('第1个刚体已选择');
    console.log('请检查是否变绿');
}
```

---

## ✅ 成功标志

### 以下都正常说明功能工作正常：

- [ ] 打开 `http://localhost:5173/editor.html`
- [ ] 添加2个盒子
- [ ] ⌘+点击第1个盒子 → 变成绿色
- [ ] 左侧显示"[✓ 盒子 1]"
- [ ] ⌘+点击第2个盒子 → 也变成绿色
- [ ] 左侧显示"[✓ 盒子 1] [✓ 盒子 2]"
- [ ] "⚡ 创建约束"按钮可点击（不再是灰色）
- [ ] 点击"创建约束"后约束列表中显示新约束
- [ ] 运行模拟后两个盒子被连接在一起

---

**最后提醒**：
- 必须在编辑模式下（不是运行模式）
- 必须在左侧"刚体列表"中点击（不是3D视图）
- Mac用⌘ Command，Windows用Ctrl
- 看到绿色高亮表示成功选择

**立即测试**：
1. 清除缓存（⌘+Shift+R）
2. 打开 http://localhost:5173/editor.html
3. 添加2个盒子
4. ⌘+点击第1个盒子（应该变绿）
5. 如果成功，🎉功能正常！

如果还有问题，请复制上面的"快速诊断命令"到Console中运行，并提供输出结果。
