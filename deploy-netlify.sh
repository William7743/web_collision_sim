#!/bin/bash

echo "🚀 部署物理模拟器到 Netlify"
echo "=============================="
echo ""

# 检查是否安装了 Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "📦 正在安装 Netlify CLI..."
    npm install -g netlify-cli
fi

echo "✓ Netlify CLI 已就绪"
echo ""

# 构建项目
echo "🔨 正在构建项目..."
rm -rf dist
npm run build

if [ $? -eq 0 ]; then
    echo "✓ 构建成功！"
    echo ""

    # 部署
    echo "📤 正在部署到 Netlify..."
    netlify deploy --prod --dir=dist
else
    echo "✗ 构建失败"
    exit 1
fi
