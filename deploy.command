#!/usr/bin/env bash
# 双击这个文件即可：部署 Azure 开发原型。
# 全程自动；唯一需要你本人的是浏览器里点一下 Azure 登录。
cd "$(dirname "$0")" || exit 1
clear
echo "======================================================"
echo "  部署到 Azure（开发 / 研究原型）"
echo "======================================================"
echo
echo "会自动完成：复用/安装 Azure CLI → 浏览器登录 →"
echo "建资源组、存储、函数应用 → 打包发布 → 打印端点并验活。"
echo "不需要 npm，也不需要联网下载 Bicep。"
echo
echo "弹出的浏览器里登录你的 GGU 学生账号即可，其余不用管。"
echo
echo "======================================================"
echo

mkdir -p azure
./azure/deploy.sh 2>&1 | tee azure/LAST-DEPLOY.txt
STATUS=${PIPESTATUS[0]}

echo
echo "======================================================"
if [ "$STATUS" -eq 0 ]; then
  echo "  部署完成。完整记录已存到 azure/LAST-DEPLOY.txt"
  echo "  里面有 Health 和 Parse 两个地址。"
else
  echo "  部署未成功（退出码 $STATUS）。"
  echo "  把 azure/LAST-DEPLOY.txt 发给我，我来判断下一步。"
fi
echo "======================================================"
echo
echo "按回车关闭窗口..."
read -r _
