#!/usr/bin/env bash
# 拿到 PAT 后：把令牌写到 $HOME/.config/gh/token.txt，然后双击本文件。
# 全程不走浏览器、不走设备码，只用本地令牌登录并推送。
set -euo pipefail

cd "$(dirname "$0")"
GH="$HOME/.local/bin/gh"
TOKEN_FILE="$HOME/.config/gh/token.txt"
LOG="$HOME/.config/gh/push-result.log"
: > "$LOG"

echo "======================================================"
echo "  用令牌完成 GitHub 发布"
echo "======================================================"
echo

if [ ! -s "$TOKEN_FILE" ]; then
  echo "未找到令牌文件：$TOKEN_FILE"
  echo "请先把 ghp_ 开头的令牌粘贴进这个文件并保存，再双击本脚本。"
  echo "按回车关闭..."; read -r _; exit 1
fi

if ! "$GH" auth status >/dev/null 2>&1; then
  echo "== 1/4 用本地令牌登录（不走浏览器）=="
  "$GH" auth login --with-token < "$TOKEN_FILE" 2>&1 | tee -a "$LOG"
fi

ACCOUNT="$("$GH" api user --jq .login 2>&1)"
if [ -z "$ACCOUNT" ] || printf '%s' "$ACCOUNT" | grep -qi "error\|Bad credentials"; then
  echo "令牌无效或权限不足。原始返回：$ACCOUNT"
  echo "按回车关闭..."; read -r _; exit 1
fi
echo "   账号: $ACCOUNT"
echo

echo "== 2/4 创建或检查仓库 =="
if "$GH" repo view "$ACCOUNT/doctoral-toolbox" >/dev/null 2>&1; then
  echo "   $ACCOUNT/doctoral-toolbox 已存在，复用。"
  git remote get-url origin >/dev/null 2>&1 \
    && git remote set-url origin "https://github.com/$ACCOUNT/doctoral-toolbox.git" \
    || git remote add origin "https://github.com/$ACCOUNT/doctoral-toolbox.git"
else
  "$GH" repo create doctoral-toolbox --public --source=. --remote=origin \
    --push --description "Free APA 7 tools and reproducible writing workflows for doctoral researchers" 2>&1 | tee -a "$LOG"
fi

echo "== 3/4 确保分支与远端一致 =="
git branch -M main
git push -u origin main 2>&1 | tee -a "$LOG"

echo "== 4/4 验证 =="
git fetch origin main >/dev/null 2>&1
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main 2>/dev/null || echo 'N/A')"
echo "   本地  : $LOCAL"
echo "   远端  : $REMOTE"
echo "   文件数: $(git ls-files | wc -l | tr -d ' ')"
if [ "$LOCAL" = "$REMOTE" ]; then
  echo
  echo "======================================================"
  echo "  推送成功：https://github.com/$ACCOUNT/doctoral-toolbox"
  echo "======================================================"
else
  echo "   警告：本地与远端提交不一致，请把上面的输出发我。"
fi

echo
echo "完整日志: $LOG"
echo "按回车关闭窗口..."; read -r _
