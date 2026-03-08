#!/bin/bash

echo "🚀 部署物理模拟器到腾讯云 Coding Pages"
echo "================================================"
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

# 创建 .coding-pages.yml 配置
echo "📝 正在创建 Coding Pages 配置文件..."
cat > .coding-pages.yml << 'EOF'
# 腾讯云 Coding Pages 配置
version: 2.0
# 构建配置
build:
  # 构建命令
  command: npm run build
  # 构建产物目录
  artifacts:
    - source: dist
      destination: /


# 部署配置
deploy:
  # 部署目录
  source: dist
EOF

echo "✓ 配置文件已创建"
echo ""

# 检查是否有远程仓库
if git remote get-url origin &> /dev/null; then
    echo "📤 已配置远程仓库："
    git remote -v
    echo ""
    echo "📦 正在提交更改..."
    git add .
    git commit -m "chore: prepare for Coding Pages deployment" || echo "没有新的更改需要提交"
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
    echo "1️⃣  在 Coding.net 创建新项目"
    echo "   访问：https://coding.net/"
    echo "   点击「新建项目」→ 选择「DevOps 项目」"
    echo ""
    echo "2️⃣  添加远程仓库（选择其一）："
    echo "   如果使用 Coding.net："
    echo "   git remote add origin https://e.coding.net/你的用户名/项目名.git"
    echo ""
    echo "   如果使用 Gitee："
    echo "   git remote add origin https://gitee.com/你的用户名/项目名.git"
    echo ""
    echo "3️⃣  推送代码："
    echo "   git push -u origin master"
    echo "   或"
    echo "   git push -u origin main"
    echo ""
    echo "4️⃣  在 Coding.net 配置 Pages："
    echo "   - 进入项目 → 「持续部署」→ 「静态网站」"
    echo "   - 点击「新建静态网站」"
    echo "   - 配置："
    echo "     * 网站名称：physics-simulator（或自定义）"
    echo "     * 构建来源：选择仓库"
    echo "     * 构建命令：npm run build"
    echo "     * 发布目录：dist"
    echo "     * 分支：master（或 main）"
    echo ""
    exit 0
fi

echo ""
echo "================================================"
echo "✅ 部署准备完成！"
echo ""
echo "📌 接下来的步骤："
echo ""
echo "1. 在 Coding.net 配置 Pages 服务："
echo "   - 访问：https://coding.net/"
echo "   - 进入你的项目"
echo "   - 点击左侧「持续部署」→「静态网站」"
echo "   - 点击「新建静态网站」"
echo ""
echo "2. 填写配置："
echo "   - 网站名称：physics-simulator"
echo "   - 仓库：选择你推送的仓库"
echo "   - 分支：$(git branch --show-current)"
echo "   - 构建命令：npm install && npm run build"
echo "   - 发布目录：dist"
echo ""
echo "3. 高级配置（可选）："
echo "   - 自定义域名：在「域名管理」中绑定"
echo "   - HTTPS：自动启用，免费证书"
echo "   - CDN：自动开启 COS + CDN 加速"
echo ""
echo "📚 详细文档："
echo "   https://help.coding.net/docs/pages/"
echo ""
