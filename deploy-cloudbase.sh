#!/bin/bash

echo "🚀 部署物理模拟器到腾讯云 CloudBase"
echo "====================================="
echo ""

# 检查 cloudbase CLI 是否安装
if ! command -v cloudbase &> /dev/null; then
    echo "⚠️  未检测到 CloudBase CLI"
    echo ""
    echo "正在安装 CloudBase CLI..."
    npm install -g @cloudbase/cli

    if [ $? -ne 0 ]; then
        echo "✗ 安装失败"
        echo "请手动运行：npm install -g @cloudbase/cli"
        exit 1
    fi

    echo "✓ CloudBase CLI 安装成功！"
    echo ""
fi

# 检查是否已登录
echo "🔐 检查登录状态..."
if ! cloudbase env:list &> /dev/null; then
    echo ""
    echo "⚠️  未登录 CloudBase"
    echo ""
    echo "请先登录："
    echo "  cloudbase login"
    echo ""
    echo "运行后会打开浏览器，请使用腾讯云账号扫码登录"
    echo ""
    exit 1
fi

echo "✓ 已登录"
echo ""

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

# 列出可用环境
echo "📋 可用的 CloudBase 环境："
cloudbase env:list
echo ""

# 询问是否部署
read -p "确认部署到 CloudBase？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "✗ 已取消部署"
    exit 0
fi

echo ""
echo "📤 正在部署到 CloudBase..."
echo ""

# 部署
cloudbase hosting deploy dist

if [ $? -eq 0 ]; then
    echo ""
    echo "====================================="
    echo "✅ 部署成功！"
    echo ""
    echo "📌 访问步骤："
    echo ""
    echo "1. 访问 CloudBase 控制台："
    echo "   https://console.cloud.tencent.com/tcb"
    echo ""
    echo "2. 选择你的环境"
    echo ""
    echo "3. 点击「静态网站托管」"
    echo ""
    echo "4. 查看访问域名（格式如下）："
    echo "   https://xxx.tcb.qcloud.la/editor.html"
    echo "   或"
    echo "   https://xxx.service.tcloudbase.com/editor.html"
    echo ""
    echo "💡 提示："
    echo "  - 首次部署可能需要几分钟生效"
    echo "  - 国内访问速度极快"
    echo "  - 永久免费额度：1GB 存储 + 5GB 流量/月"
    echo ""
else
    echo ""
    echo "✗ 部署失败"
    echo ""
    echo "请检查："
    echo "  1. 是否已创建 CloudBase 环境"
    echo "  2. 是否已登录 (cloudbase login)"
    echo "  3. 网络连接是否正常"
    echo ""
    exit 1
fi
