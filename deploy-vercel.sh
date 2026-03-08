#!/bin/bash

echo "🚀 部署物理模拟器到 Vercel"
echo "=============================="
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
fi

echo "✓ Vercel CLI 已就绪"
echo ""

# 构建项目
echo "🔨 正在构建项目..."
rm -rf dist
npm run build

if [ $? -eq 0 ]; then
    echo "✓ 构建成功！"
    echo ""
    echo "📤 正在部署到 Vercel..."
    echo "提示：如果第一次使用，会提示你登录和确认设置"
    echo ""

    # 部署
    vercel --prod
else
    echo "✗ 构建失败"
    exit 1
fi
