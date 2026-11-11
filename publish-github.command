#!/usr/bin/env bash
# 双击这个文件：用【你的】GitHub 账号建仓库并推送。
# 全程只需你在浏览器里登录一次 GitHub，其余自动完成。
set -euo pipefail

cd "$(dirname "$0")"
LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"
export PATH="$LOCAL_BIN:$PATH"
export GIT_TERMINAL_PROMPT=0

clear
echo "======================================================"
echo "  发布 Doctoral Toolbox 到你的 GitHub"
echo "======================================================"
echo
echo "  仓库会在【你的账号】下创建，名字 doctoral-toolbox。"
echo "  你只需要：在弹出的浏览器里登录 GitHub 一次。"
echo

if ! command -v gh >/dev/null 2>&1; then
  echo "== 1/4 安装 GitHub CLI（不需要 Homebrew / sudo）=="
  TAG="$(curl -s --max-time 20 https://api.github.com/repos/cli/cli/releases/latest \
        | python3 -c 'import sys,json; print(json.load(sys.stdin)["tag_name"])')"
  VERSION="${TAG#v}"
  ARCH="$(uname -m)"
  case "$ARCH" in
    arm64) GH_ARCH="arm64" ;;
    x86_64) GH_ARCH="amd64" ;;
    *) echo "未知架构 $ARCH"; exit 1 ;;
  esac
  ASSET="gh_${VERSION}_macOS_${GH_ARCH}.zip"
  URL="https://github.com/cli/cli/releases/download/${TAG}/${ASSET}"
  echo "   下载 $ASSET"
  TMP="$(mktemp -d)"
  curl -fL --retry 3 --max-time 180 "$URL" -o "$TMP/gh.zip"
  unzip -q "$TMP/gh.zip" -d "$TMP"
  cp "$TMP/gh_${VERSION}_macOS_${GH_ARCH}/bin/gh" "$LOCAL_BIN/gh"
  chmod +x "$LOCAL_BIN/gh"
  rm -rf "$TMP"
  echo "   已安装到 $LOCAL_BIN/gh"
  "$LOCAL_BIN/gh" --version
else
  echo "== 1/4 GitHub CLI 已存在，跳过安装 =="
fi

echo
if [ -n "${GH_TOKEN:-}" ]; then
  echo "== 2/4 用环境变量中的令牌登录（不走浏览器，最稳）=="
  printf '%s' "$GH_TOKEN" | gh auth login --with-token
elif [ -f "$HOME/.config/gh/token.txt" ]; then
  echo "== 2/4 用本地令牌文件登录（不走浏览器）=="
  gh auth login --with-token < "$HOME/.config/gh/token.txt"
elif ! gh auth status >/dev/null 2>&1; then
  echo "== 2/4 登录 GitHub =="
  echo
  echo "   重要：这台 Mac 的代理会掐掉浏览器提交，所以不要用 Mac 浏览器授权。"
  echo "   看到 XXXX-XXXX 的码之后，请用【手机浏览器】打开"
  echo "       https://github.com/login/device"
  echo "   登录 Leonpeng488 并输入该码——手机走流量，不经过这台 Mac 的代理。"
  echo "   码同时会记录到 $HOME/.config/gh/auth-output.log，方便核对。"
  echo
  AUTH_LOG="$HOME/.config/gh/auth-output.log"
  rm -f "$AUTH_LOG"
  script -q "$AUTH_LOG" "$LOCAL_BIN/gh" auth login --web --git-protocol https --scopes repo,workflow
  if ! gh auth status >/dev/null 2>&1; then
    echo
    echo "   登录尚未完成。两个选择："
    echo "   1) 若已拿到码，用手机浏览器访问 github.com/login/device 完成授权；"
    echo "   2) 或把 ghp_ 开头的令牌写入 $HOME/.config/gh/token.txt，重新双击本脚本。"
    exit 1
  fi
else
  echo "== 2/4 已登录，跳过 =="
  gh auth status 2>&1 | head -4
fi

ACCOUNT="$(gh api user --jq .login)"
echo
echo "   已登录账号: $ACCOUNT"

echo
echo "== 3/4 在你的账号下创建仓库并推送 =="
REPO="doctoral-toolbox"
if gh repo view "$ACCOUNT/$REPO" >/dev/null 2>&1; then
  echo "   $ACCOUNT/$REPO 已存在，改为推送更新。"
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "https://github.com/$ACCOUNT/$REPO.git"
  else
    git remote add origin "https://github.com/$ACCOUNT/$REPO.git"
  fi
  git branch -M main
  git push -u origin main
else
  gh repo create "$REPO" \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "Free APA 7 tools and reproducible writing workflows for doctoral researchers"
fi

echo
echo "== 4/4 验证 =="
git fetch origin main >/dev/null 2>&1
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "   推送成功，本地与远端一致。"
else
  echo "   提交不一致，请检查：LOCAL=$LOCAL REMOTE=$REMOTE"
fi

echo
echo "======================================================"
echo "  仓库地址: https://github.com/$ACCOUNT/$REPO"
echo "  已推送 $(git ls-files | wc -l | tr -d ' ') 个文件"
echo "======================================================"
echo
echo "按回车关闭窗口..."
read -r _
