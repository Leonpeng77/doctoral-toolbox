#!/usr/bin/env bash
# 双击这个文件即可：本地跑通整站 + API，并自动打开浏览器。
# 关掉这个终端窗口即全部停止，不会在后台留下进程。
cd "$(dirname "$0")" || exit 1
clear
echo "======================================================"
echo "  Doctoral Toolbox - 本地演示"
echo "======================================================"
echo
echo "第 1 步：实测检查（全部 PASS 才继续）"
echo
python3 verify.py || { echo; echo "检查未通过，请把上面的 FAIL 信息发给我。"; echo "按回车关闭..."; read -r _; exit 1; }
echo
echo "第 2 步：启动网站与 API"
echo

( cd site && python3 -m http.server 8080 >/dev/null 2>&1 ) &
SITE_PID=$!
node azure/local-server.js >/dev/null 2>&1 &
API_PID=$!

cleanup() {
  kill "$SITE_PID" "$API_PID" 2>/dev/null
}
trap cleanup EXIT

sleep 2
open "http://127.0.0.1:8080/" 2>/dev/null
open "http://127.0.0.1:7071/api/health" 2>/dev/null

echo "  网站      http://127.0.0.1:8080/"
echo "  API 健康  http://127.0.0.1:7071/api/health"
echo "  智能导入  http://127.0.0.1:8080/tools/reference-check.html#smart-import"
echo
echo "浏览器已自动打开。点工具页里的 Load messy sample 看效果。"
echo
echo "======================================================"
echo "  看完后，直接关掉这个终端窗口即可。"
echo "  想部署到 Azure：双击同目录下的 deploy.command"
echo "======================================================"
echo
wait
