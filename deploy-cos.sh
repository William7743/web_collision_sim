#!/bin/bash

echo "🚀 部署物理模拟器到腾讯云 COS"
echo "=================================="
echo ""

# 检查 COSCLI 是否安装
if ! command -v coscli &> /dev/null; then
    echo "⚠️  未检测到 coscli 命令"
    echo ""
    echo "请选择安装方式："
    echo ""
    echo "方式 1：使用 Homebrew 安装（推荐 macOS 用户）"
    echo "  brew tap tencent-cloud/tap"
    echo "  brew install coscli"
    echo ""
    echo "方式 2：下载二进制文件"
    echo "  访问：https://github.com/tencentyun/coscli/releases"
    echo "  下载对应系统的二进制文件"
    echo ""
    echo "安装完成后，请运行配置命令："
    echo "  coscli config"
    echo ""
    exit 1
fi

# 检查配置
if [ ! -f ~/.cos.yaml ]; then
    echo "⚠️  未检测到 COS 配置文件"
    echo ""
    echo "请先配置 COSCLI："
    echo "  coscli config"
    echo ""
    echo "配置时需要输入："
    echo "  - SecretID（从 https://console.cloud.tencent.com/cam/capi 获取）"
    echo "  - SecretKey"
    echo "  - 地域（如 ap-guangzhou）"
    echo ""
    exit 1
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

# 询问存储桶名称
read -p "请输入 COS 存储桶名称（如 physics-simulator）：" BUCKET_NAME

if [ -z "$BUCKET_NAME" ]; then
    echo "✗ 存储桶名称不能为空"
    exit 1
fi

# 询问地域
echo ""
echo "请选择地域："
echo "  1) ap-guangzhou  (广州)"
echo "  2) ap-shanghai   (上海)"
echo "  3) ap-beijing    (北京)"
echo "  4) ap-chengdu    (成都)"
read -p "请输入选项（默认 1）：" REGION_CHOICE

case $REGION_CHOICE in
    2) REGION="ap-shanghai" ;;
    3) REGION="ap-beijing" ;;
    4) REGION="ap-chengdu" ;;
    *) REGION="ap-guangzhou" ;;
esac

echo ""
echo "📤 正在部署到 COS..."
echo "存储桶：$BUCKET_NAME"
echo "地域：$REGION"
echo ""

# 同步文件到 COS
coscli sync -r dist/ cos://$BUCKET_NAME/ --delete

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ 部署成功！"
    echo ""
    echo "📌 访问地址："
    echo ""
    echo "你需要先在 COS 控制台开启静态网站托管："
    echo "  1. 访问：https://console.cloud.tencent.com/cos5"
    echo "  2. 进入存储桶：$BUCKET_NAME"
    echo "  3. 点击「基础配置」→「静态网站」→「开启」"
    echo "  4. 索引文档设为：editor.html"
    echo ""
    echo "开启后，访问地址格式为："
    echo "  https://$BUCKET_NAME-{appid}.cos.$REGION.myqcloud.com/editor.html"
    echo ""
    echo "💡 提示："
    echo "  - 可以配置 CDN 加速获得更好访问速度"
    echo "  - 绑定自定义域名需要备案"
    echo ""
else
    echo ""
    echo "✗ 部署失败"
    echo ""
    echo "请检查："
    echo "  1. 存储桶名称是否正确"
    echo "  2. 是否已创建存储桶"
    echo "  3. 配置是否正确（~/.cos.yaml）"
    echo ""
    exit 1
fi
