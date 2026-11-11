# Azure 原型层：把学生额度变成可迁移的技术资产

## 我替你定下的分层（不再让你选）

| 层 | 放在哪 | 用途 | 依据 |
|---|---|---|---|
| 生产网站 | Cloudflare Pages 免费层 | 对外访问、原创内容、未来广告 | 允许商用；学生订阅不允许商用 |
| 开发 / 测试 / 演示 API | **Azure for Students 订阅** | 解析服务原型、课程/研究演示、练 Functions + Bicep + CI/CD | 官方 FAQ 允许「为教育、非商业研究设计/开发/测试/演示软件应用」 |
| 商业化后的 API | 升级为即用即付订阅 | 真要变现时迁移 | 学生额度不可用于商业生产 |

Azure 学生版条款明确限定于教育、教学、非商业研究，以及为这些目的开发、测试、演示应用；且额度用完或 12 个月到期不升级会**取消订阅并下架资源**。你的额度 **2026-12-10 到期**。所以：

- **现在**：用这 30 天把云原生的东西真正跑通、练会、留下代码——这完全在条款允许范围内。
- **到期后**：`az group delete` 清掉资源，代码、Bicep、API 契约、测试全部留在本地，随时可在按量付费订阅上重建。额度清零不等于资产清零。
- **不要**：把挂广告的生产站放在这个订阅上。这不是偏好，是条款。

## 这个 API 做什么

`POST /api/parse`：粘贴任意乱格式参考文献（一行一条）→ 返回结构化字段、按 APA 7 重建的规范条目、逐条体检结果、置信度。

**零外部运行时依赖**：函数应用用 v3 编程模型（`api/*/function.json` + `index.js`），不需要 `@azure/functions`、不需要 `npm install`、不打包 `node_modules`。实测部署包仅 **31 KB / 15 个文件**。发布只依赖 `az` + `zip` + `curl`。

它解决的是手填表单之外的真实痛点：从 PDF、Word、Zotero 导出、旧稿里复制来的引用格式千奇百怪（`doi:` 前缀、`Vol.`、`and` 连接、全角标点、缺逗号的卷期、团体作者）。解析器是确定性规则，**不依赖任何大模型配额**——这点很重要，因为学生订阅通常开不了 Azure OpenAI / Foundry 模型资源。需要 AI 增强时，接口已预留，配好 endpoint 再接，规则引擎自动降级兜底。

## 架构：一次编写，本地与云端同构

```
site/assets/js/{apa7,reference-check,reference-parser}.js   ← 唯一真源
        │                                    │
        ├─ 浏览器 <script src> 直接执行        └─ deploy.sh 复制进 shared/vendor/
        │   （纯本地，零上传）                          │
        │                                    azure/function-app/shared/handler.js
        │                                            │
        │                        ┌───────────────────┴──────────────────┐
        │                  local-server.js                    Azure Functions v4
        │                  （零依赖，本机）                  （Linux Consumption Y1）
        └── 站点「Smart import」区块                    Standard_LRS Storage
```

同一个 `handler.js` 同时被本机 HTTP 服务和 Azure Functions 调用，所以本地测过的行为就是云端行为。**站点默认不调用云端 API**：智能导入在浏览器里用同一份 JS 本地执行，隐私承诺「草稿不离开设备」不破。

## 本机先跑（不需要 Azure 账号）

```bash
cd academic-tools-site
node azure/tests/run.js        # 37 条断言（含真实 Functions 入口）
node azure/local-server.js     # http://127.0.0.1:7071/api/health
curl -s -X POST http://127.0.0.1:7071/api/parse \
  -H 'Content-Type: application/json' \
  -d '{"text":"Smith, J. A. and Lee, B. (2024). Dynamic Capabilities And Firm Performance. Journal of Business Research, Vol. 142, pp. 45-67. doi:10.1016/j.jbusres.2023.114321"}'
```

## 你要配合的唯一一件事

**第一次实跑暴露三个真实环境问题，已按实测结果全部修掉：**

| 现象 | 实测原因 | 处理 |
|---|---|---|
| pip 报 `ReadTimeoutError ... pypi.org` | PyPI 偶发抖动（后续重试其实成功了）；实测阿里云镜像 0.109s、官方 0.375s、清华 0.651s | 全新安装走阿里云镜像 + `--timeout 60 --retries 10`；已装好的 venv 直接复用 |
| `ERROR: npm not found.`（首次部署在此中断） | Terminal 的 PATH 没有 npm，与助手执行环境不同 | **彻底去掉 npm 依赖**：函数应用改 v3 编程模型，`package.json` 无 dependencies，zip 不含 node_modules |
| Bicep CLI 需从 GitHub 自动下载 | 该网络下不可靠 | `deploy.sh` 改用纯 `az` CLI 建资源；`infra/main.bicep` 保留为声明式参考，装好 Bicep 后可切回 |

另外 Terminal 里的 `python3` 是 **3.9.6**（不是助手环境的 3.13），pip 自动选了兼容的 `azure-cli 2.79.0`，实测 `az` 正常运行。venv 已在 `~/.azure-cli-venv`，**不需要重装**。

所以现在只需在终端跑**一条命令**（或双击 `deploy.command`）：

```bash
./azure/deploy.sh
```

脚本自动：复用已装好的 az → 未登录时拉起浏览器完成 `az login` → 建资源组 / 存储账户 / Linux 消耗型函数应用 → 配置应用设置与 CORS → 复制共享 JS 进 `shared/vendor` → 打 31 KB 的包 → zip 发布 → 打印端点并验活。发布只依赖 `az` + `zip` + `curl`。

**唯一需要你本人做的是浏览器里点一下登录**——凭据交互我无法代替。其余没有需要选择或决定的地方。

部署前可覆盖的环境变量：`RG`、`LOCATION`（默认 eastus）、`APP_NAME`、`ALLOWED_ORIGIN`（默认 `https://doctoral-toolbox.app.workbuddy.host`）。

用完清理：`az group delete --name rg-doctoral-toolbox-dev --yes --no-wait`

## 资源与成本

实际部署只建 3 项（外加自动创建的消耗型计划）：资源组、Standard_LRS 存储账户、Linux Y1 Function App。没有 Log Analytics / App Insights、没有数据库、没有常驻 VM、没有 AI 模型配额——原型阶段不需要，也少两个联网步骤。`infra/main.bicep` 里的完整版本留作以后 IaC 化的目标。

消耗型计划自带每月免费执行额度，开发量级下对学生额度几乎不产生扣费。**仍建议在 Azure 门户给该订阅设一个月度预算告警**（例如 ¥100）并留意 12/10 到期日）——你的余额 ¥1,333.37 会随所有资源消耗，而不是只给这个 API 用。

## 安全与隐私设计

- 请求体上限 100,000 字符 / 200 条，超出直接 400 或截断，避免被刷。
- 不写数据库、不落盘、不记录提交文本；原型不接 Application Insights，因此没有任何请求内容或响应体被记录。
- 存储账户启用 `https-only`、`min-tls-version TLS1_2`、`allow-blob-public-access false`。
- CORS 白名单只允许你的真实域名与本地开发地址；`authLevel: anonymous` 仅适用于这个无状态的开发原型，商业化前必须换成 API key / Easy Auth。
- 站点侧不上传用户文本；云端 API 是独立的可选能力。

## 到期后的迁移路径

1. `az group delete` 清理学生订阅资源。
2. 新建即用即付订阅（或升级原订阅），改 `RG` 环境变量，重跑 `./azure/deploy.sh`。
3. 站点若要调用云端 API：在 `site/` 加一个显式勾选的「批量云端处理」开关，更新 `privacy.html` 与 `NOTICE.txt`，把 `ALLOWED_ORIGIN` 换成真实域名。
4. 届时再评估是否接 Azure AI 增强；规则引擎作为降级路径保留。

## 状态更新（2026-11-10 23:0x）

用户随后**取消了 Azure 学生订阅**。实测：资源组 `rg-doctoral-toolbox-dev` 已不存在（`az group exists` 返回 false），云端端点返回 403，即所有资源已被自动清除，**不再产生任何费用**。下面的端点记录保留为排障历史。

**网站不受影响**：已发布在 `https://doctoral-toolbox.app.workbuddy.host/?sharecode=VXUSWE73DG`，纯静态、浏览器本地执行，从不调用这个 API。

**关于扣费的官方依据**（Azure for Students offer 条款原文）：
- "A credit card is not required for the Azure for Students offer."（注册时无需信用卡，没有扣款通道）
- "If you exhaust your available credits, your Azure subscription will be disabled."（额度耗尽是停用，不是转付费）
- 继续使用需 "upgrade to a Pay-As-You-Go subscription by contacting Azure Support"，即**必须主动申请**，无自动转换。

## 部署成功（2026-11-10 22:4x 实测，现已清理）

```
Health : https://func-doctoral-toolbox-3b5ea4.azurewebsites.net/api/health
Parse  : https://func-doctoral-toolbox-3b5ea4.azurewebsites.net/api/parse
```

- `/api/health` → **200**，`"mode": "azure"`, `rules: 14`
- `POST /api/parse` 真实调用 → **200**，1 条乱格式引用重建成功，`residual issues: 0`
- 订阅 `Azure subscription 1` / 资源组 `rg-doctoral-toolbox-dev` / East US / Node 22 Linux 消耗型

**排障中修掉的四个真实问题**（都已固化进 `deploy.sh`）：全新订阅需注册 `Microsoft.Storage` / `Microsoft.Web` / `Microsoft.Insights`；Node 20 已 EOL，运行时版本改为向 Azure 动态查询；`WEBSITE_RUN_FROM_PACKAGE=1` 与 zip 部署冲突；**v3 函数目录必须放在包根目录 `parse/` `health/`，不能放进 `api/`**（`api` 只是 URL 前缀）。发布后主动重启一次，避免首部署 503。

用完清理：`az group delete --name rg-doctoral-toolbox-dev --yes --no-wait`

## 实测状态（2026-11-10）

- `node azure/tests/run.js` → **37 条断言通过**（含 v3 `function.json` 绑定与真实 Functions 入口调用）；3 条乱格式样例重建后体检剩余 **0 issues**。
- `azure/local-server.js` 零依赖启动，`/api/health`（status=ok, rules=14）与 `/api/parse`（count=2, avgConfidence=0.83, residualIssues=0）由 `verify.py` 起真实进程实测。
- 模拟打包实测：zip **31 KB / 15 文件 / 0 个 node_modules**；`function.json` 两处 JSON 合法；`deploy.sh` 通过 `bash -n`。
- 全项目 `python3 verify.py` → **16 项检查全过**（30 条 Node 断言、136 条内链、18 文件 HTTP 200、0 远程加载、8 页 SEO 要素）。
- `azure-cli 2.79.0` 已装在 `~/.azure-cli-venv`（Python 3.9.6），实测可执行。**首次部署在 `npm not found` 中断**，已改为零 npm 方案，尚未在真实订阅跑通。
- `python3 verify.py --prelaunch` 当前按设计**失败**（18 处域名占位未替换），替换后应转 PASS。
