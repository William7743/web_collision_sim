#!/bin/bash

echo "🚀 物理模拟器部署助手"
echo "===================="
echo ""
echo "请选择部署方式："
echo "1. Netlify (最简单，拖拽部署)"
echo "2. Vercel (快速，命令部署)"
echo "3. GitHub Pages (需要git)"
echo "4. 本地临时分享 (ngrok)"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
  1)
    echo ""
    echo "📦 Netlify 部署步骤："
    echo "1. 访问 https://app.netlify.com/drop"
    echo "2. 把以下文件夹拖到网页上："
    echo "   /Users/williamshakespeare/Desktop/bullet-collision/web-app"
    echo "3. 等待几秒，获得你的链接！"
    echo ""
    open "https://app.netlify.com/drop"
    ;;
  2)
    echo ""
    echo "📦 检查是否安装了 Vercel CLI..."
    if command -v vercel &> /dev/null; then
      echo "✓ Vercel CLI 已安装"
      echo "开始部署..."
      vercel --prod
    else
      echo "✗ Vercel CLI 未安装"
      echo "正在安装..."
      npm install -g vercel
      echo "安装完成！请重新运行此脚本选择选项 2"
    fi
    ;;
  3)
    echo ""
    echo "📦 GitHub Pages 部署步骤："
    echo "1. 在 GitHub 上创建新仓库"
    echo "2. 运行以下命令上传代码："
    echo ""
    echo "   cd /Users/williamshakespeare/Desktop/bullet-collision/web-app"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin https://github.com/你的用户名/仓库名.git"
    echo "   git push -u origin main"
    echo ""
    echo "3. 在仓库设置中启用 GitHub Pages"
    echo "   Settings → Pages → Source: main branch"
    echo ""
    ;;
  4)
    echo ""
    echo "📦 临时分享 (ngrok)："
    echo "1. 先启动开发服务器（如果还没启动）："
    echo "   npm run dev"
    echo ""
    echo "2. 在新终端窗口运行："
    echo "   ngrok http 5174"
    echo ""
    echo "3. 复制显示的链接分享给朋友（2小时内有效）"
    echo ""
    if command -v ngrok &> /dev/null; then
      echo "✓ ngrok 已安装"
      read -p "是否现在启动 ngrok? (y/n): " start_ngrok
      if [ "$start_ngrok" = "y" ]; then
        ngrok http 5174
      fi
    else
      echo "✗ ngrok 未安装"
      echo "安装方法："
      echo "   brew install ngrok"
    fi
    ;;
  *)
    echo "无效选项"
    exit 1
    ;;
esac
