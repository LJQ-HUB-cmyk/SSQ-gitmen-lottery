#!/bin/bash

# GitHub 仓库设置脚本
# 用于快速替换 README.md 中的占位符

set -e

echo "=== GitHub 仓库设置脚本 ==="
echo ""

# 获取用户输入
read -p "请输入你的 GitHub 用户名: " GITHUB_USERNAME
read -p "请输入你的名字: " YOUR_NAME
read -p "请输入仓库名称 (默认: lottery-prediction): " REPO_NAME
REPO_NAME=${REPO_NAME:-lottery-prediction}

echo ""
echo "确认信息："
echo "  GitHub 用户名: $GITHUB_USERNAME"
echo "  名字: $YOUR_NAME"
echo "  仓库名称: $REPO_NAME"
echo ""
read -p "确认无误？(y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

echo ""
echo "开始替换..."

# 备份原文件
cp README.md README.md.bak
cp docs/STAR_GUIDE.md docs/STAR_GUIDE.md.bak

# 替换 README.md
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your-username/$GITHUB_USERNAME/g" README.md
    sed -i '' "s/Your Name/$YOUR_NAME/g" README.md
    sed -i '' "s/lottery-prediction/$REPO_NAME/g" README.md
    
    sed -i '' "s/your-username/$GITHUB_USERNAME/g" docs/STAR_GUIDE.md
    sed -i '' "s/lottery-prediction/$REPO_NAME/g" docs/STAR_GUIDE.md
else
    # Linux
    sed -i "s/your-username/$GITHUB_USERNAME/g" README.md
    sed -i "s/Your Name/$YOUR_NAME/g" README.md
    sed -i "s/lottery-prediction/$REPO_NAME/g" README.md
    
    sed -i "s/your-username/$GITHUB_USERNAME/g" docs/STAR_GUIDE.md
    sed -i "s/lottery-prediction/$REPO_NAME/g" docs/STAR_GUIDE.md
fi

echo "✅ 替换完成！"
echo ""
echo "已创建备份文件："
echo "  - README.md.bak"
echo "  - docs/STAR_GUIDE.md.bak"
echo ""
echo "请检查替换结果，如有问题可以从备份恢复。"
echo ""
echo "下一步："
echo "  1. 检查 README.md 中的链接"
echo "  2. 添加 LICENSE 文件"
echo "  3. 设置 GitHub Topics"
echo "  4. 推送到 GitHub"
echo ""
echo "详细说明请查看 GITHUB_SETUP.md"
