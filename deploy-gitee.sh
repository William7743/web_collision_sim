#!/bin/bash

echo "🚀 部署物理模拟器到 Gitee Pages"
echo "==================================="
echo ""

# 检查 Git 仓库
if [ ! -d .git ]; then
    echo "⚠️  当前目录不是 Git 仓库"
    echo "正在初始化 Git 仓库..."
    git init
    echo "✓ Git 仓库已初始化"
    echo ""
fi

# 构建项目
echo "🔨 正在构建项目..."
rm -rf dist
npm run build

if [ $? -ne 0 ]; then
    echo "✗ 构建失败"
    exit 1
fi

echo "✓ 构建成功！"
echo ""

# 检查是否有远程仓库
if git remote get-url origin &> /dev/null; then
    echo "📤 已配置远程仓库："
    git remote -v
    echo ""
    echo "📦 正在提交更改..."
    git add .
    git commit -m "chore: update dist for Gitee Pages" || echo "没有新的更改需要提交"
    echo ""
    echo "✓ 代码已提交"
    echo ""
    echo "🚀 正在推送到远程仓库..."
    git push origin $(git branch --show-current)
    echo ""
    echo "✓ 推送成功！"
else
    echo "⚠️  未配置远程仓库"
    echo ""
    echo "请按以下步骤操作："
    echo ""
    echo "1️⃣  在 Gitee 创建新仓库"
    echo "   访问：https://gitee.com/"
    echo "   点击右上角「+」→「新建仓库」"
    echo ""
    echo "2️⃣  填写仓库信息："
    echo "   - 仓库名称：physics-simulator（或自定义）"
    echo "   - 是否公开：✓ 公开（私有仓库无法使用 Pages）"
    echo "   - 使用 .gitignore：可选"
    echo "   - 使用 Readme 模板：可选"
    echo ""
    echo "3️⃣  添加远程仓库并推送："
    echo "   git remote add origin https://gitee.com/你的用户名/physics-simulator.git"
    echo "   git branch -M master"
    echo "   git push -u origin master"
    echo ""
    echo "4️⃣  在 Gitee 启用 Pages 服务："
    echo "   - 进入仓库页面"
    echo "   - 点击上方「服务」→「Gitee Pages」"
    echo "   - 选择部署分支：master"
    echo "   - 部署目录：留空（根目录）或填写 /dist"
    echo "   - 点击「启动」按钮"
    echo ""
    echo "5️⃣  访问你的网站："
    echo "   https://你的用户名.gitee.io/physics-simulator"
    echo ""
    exit 0
fi

echo ""
echo "==================================="
echo "✅ 部署准备完成！"
echo ""
echo "📌 接下来的步骤："
echo ""
echo "1. 在 Gitee 启用 Pages 服务："
echo "   - 访问：https://gitee.com/"
echo "   - 进入你的仓库"
echo "   - 点击「服务」→「Gitee Pages」"
echo ""
echo "2. 配置 Pages："
echo "   - 部署分支：$(git branch --show-current)"
echo "   - 部署目录：/dist（如果是构建后的文件）"
echo "   - 点击「启动」或「更新」"
echo ""
echo "3. 等待部署完成（通常需要几秒钟）"
echo ""
echo "4. 访问你的网站："
echo "   格式：https://你的用户名.gitee.io/仓库名"
echo ""
echo "📚 注意事项："
echo "   - 必须是公开仓库才能使用 Gitee Pages"
echo "   - 每次更新需要手动点击「更新」按钮"
echo "   - 首次启用需要实名认证"
echo "   - 免费版不支持自定义域名"
echo ""
echo "🔗 相关链接："
echo "   - Gitee Pages 文档：https://pages.gitee.io/"
echo ""
