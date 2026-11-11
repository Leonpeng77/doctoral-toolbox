# Doctoral Toolbox — 学术工具站启动包

## 已上线（2026-11-10 实测 200）

**网站在线地址**：`https://doctoral-toolbox.app.workbuddy.host/?sharecode=VXUSWE73DG`

实测：首页 / 两个工具页 / 两篇指南 / About / Contact / Privacy / CSS / JS 全部 200，站内导航正常；canonical、sitemap、robots 已指向真实地址，`python3 verify.py --prelaunch` 17 项全过。

**站点完全不依赖 Azure**：纯静态托管，所有工具在浏览器本地执行。Azure 开发原型 API 曾实测 200，但用户随后取消了学生订阅，资源组已被自动清除、端点已停用——这不影响站点任何功能。代码、Bicep、部署脚本全部保留，需要时可在新订阅重建。

**视觉**：首页 hero 加了本地 SVG 学术插画（`site/assets/img/hero-academic.svg`，4.4 KB，参考文献卡片线稿），零外部请求，窄屏自动隐藏、不压文字。线上实测 200。

**变现剧本**：见 `SELLING-PLAYBOOK.md`（平台已定为 Creem、四档产品与定价、交付链路、引流位、合规、时间线）；首批产品文件在 `products/`。

**规划**：`CONTENT-PLAN.md` 里 12 篇原创长文（已上线 2 篇）按优先级补齐 → 开邮件订阅 → 先做数字产品（APA 7 清单 / 综述矩阵模板 / DBA 排版包）→ affiliate / 赞助 → 月 PV 上万后才接展示广告。代码仓库会推到 GitHub（仅作版本备份与作品集，**不用 GitHub Pages 托管商业站点**），Cloudflare Pages 免费层作生产托管。全链路零固定成本；自有域名为可选项。

联系邮箱：`qpengking@gmail.com`（已写入 `contact.html`）。

> Azure for Students 官方条款："A credit card is not required"；额度耗尽时 "your Azure subscription will be disabled"，继续用须**主动联系支持升级**到即用即付。不存在自动转付费扣款。

## 从这里开始（不用记命令）

在 Finder 里打开本目录，**双击 `start.command`**：自动跑完全部实测检查、启动网站与 API、打开浏览器。关掉终端窗口即停止。

要部署到 Azure 时，**双击 `deploy.command`**：自动装 Azure CLI、弹浏览器登录、部署、验活，记录写入 `azure/LAST-DEPLOY.txt`。全程唯一需要本人操作的是浏览器里点一下登录。

> 现在不用买域名。Cloudflare Pages 会免费给一个 `xxx.pages.dev` 地址，等地址出来后我一次性替换全站 18 处占位。

面向 DBA / 博士生的英文学术写作工具站。定位是「机械环节的透明工具 + 可验证的原创指南」，而不是工具聚合站。
**已交付：可部署的完整站点 + 乱格式引用智能导入 + Azure 可迁移原型层 + 四份文档 + 可复跑的实测脚本。**

**核心判断**：这个站真正的壁垒不是又一个小工具，而是「把别人整理不了的乱格式引用一键结构化」。所以本轮把它做成站点能力，并用同一份代码在 Azure 上建了开发/演示原型——学生额度到期后，代码、API 契约与 Bicep 全部保留。生产站仍不放在学生订阅上（条款限教育/非商业研究），这是既定工程约束，不是待选项。

## 为什么选这个方向

- 用户即受众：DBA 写作、APA 7、文献综述流程是你自己每天在处理的真实痛点，原创内容不需要编。
- 英文教育 / 科研流量的广告与 affiliate 价值高于泛娱乐工具站（行业估算 RPM $8–25 vs $2–5）。
- 工具页与指南页组合，天然满足 AdSense 对「原创、有实质文字内容」的要求，避开纯工具站的 thin content 陷阱。
- 零第三方依赖 = 零授权审计面 + 纯前端运行 = 隐私声明最容易自证。

## 目录

```
academic-tools-site/
├── README.md                    ← 本文件
├── LICENSE-AUDIT.md             ← 13 个开源库授权实测表 + 复现命令
├── CONTENT-PLAN.md              ← 12 篇原创长文计划（2 篇已上线）
├── COMPLIANCE-CHECKLIST.md      ← 上线/版权/隐私/广告/变现合规清单
├── verify.py                    ← 实测验证脚本（跑一次看真实结果）
├── azure/                       ← Azure 开发/演示原型层（见 azure/README.md）
│   ├── README.md                   合规分层、架构、成本、迁移路径
│   ├── deploy.sh                   一键部署（Bicep + zip 发布）
│   ├── local-server.js             零依赖本机同构服务
│   ├── tests/run.js                29 条 handler 断言
│   ├── infra/main.bicep            声明式 IaC 参考（当前部署不依赖它）
│   └── function-app/               v3 编程模型：api/*/function.json + shared/handler.js
└── site/                        ← 直接部署这个目录
    ├── index.html               首页（英文原创）
    ├── about.html / contact.html / privacy.html
    ├── 404.html
    ├── tools/
    │   ├── apa7-citation.html       APA 7 引用生成器 + 英文长文说明
    │   └── reference-check.html     体检（14 条规则）+ 智能导入 + 英文长文说明
    ├── guides/
    │   ├── apa7-reference-list.html
    │   └── dba-literature-review-workflow.html
    ├── assets/css/style.css
    ├── assets/js/apa7.js              原创 APA 7 格式化逻辑
    ├── assets/js/reference-check.js   原创规则引擎
    ├── assets/js/reference-parser.js  原创乱格式引用解析器（站点与 Azure 共用）
    ├── NOTICE.txt                  第三方声明（当前为零依赖）
    ├── _headers / _redirects        Cloudflare Pages 配置
    ├── robots.txt / sitemap.xml
```

`apa7.js` / `reference-check.js` / `reference-parser.js` 是**唯一真源**：浏览器直接加载，Azure 部署时由 `deploy.sh` 复制进 `function-app/shared/vendor/`。改逻辑只改这三处，改完必须重跑验证。

## 本地运行

工具页用普通 `<script src>`，直接双击 `site/index.html` 也能用（无 ES module / CORS 问题）。但建议用本地服务器测试，路径行为更接近线上：

```bash
cd academic-tools-site/site
python3 -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/
```

## 实测验证

```bash
cd academic-tools-site
python3 verify.py
```

脚本会实际执行并打印：JS 语法、30 条 Node 断言（作者格式 / 21 作者规则 / DOI / 完整条目 / 规则命中 / 解析器回归）、136 条内部链接死链扫描、全站文件 HTTP 200、零远程加载检查、每页实测英文词数、SEO 与政策页可达性、Azure 29 条 handler 断言、本机起真实 API 服务实测 health/parse、占位符清单。**退出码非 0 表示有失败项。**

部署前加严格模式，未替换占位符会直接判定失败：

```bash
python3 verify.py --prelaunch
```

Azure 侧单独复跑：`node azure/tests/run.js`、`node azure/local-server.js`（`http://127.0.0.1:7071/api/health`）。

## 用 Azure 开始做（一条命令）

首次实跑暴露了三个真实环境问题，已按实测修掉：pip 连 PyPI 偶发超时（改走阿里云镜像 + 长超时）、**Terminal 里没有 npm**（原脚本在此中断）、Bicep CLI 需从 GitHub 下载（不可靠）。现在部署链是**零 npm、零 node_modules、零 Bicep 下载**：函数应用改 v3 编程模型，资源用纯 `az` CLI 创建。

`azure-cli 2.79.0` 已装在 `~/.azure-cli-venv`（Terminal 的 Python 3.9.6，pip 自动选了兼容版本），无需重装。你只需：

```bash
./azure/deploy.sh
```

脚本自动复用 az → 未登录则拉起浏览器 `az login` → 资源组 / 存储 / Linux 消耗型函数应用 → 复制共享 JS → 打 31 KB 的包 → zip 发布 → 打印 health/parse 端点并验活。**唯一需要你本人的是浏览器点一下登录。** 用完 `az group delete --name rg-doctoral-toolbox-dev --yes --no-wait`。详见 `azure/README.md`。

## 部署到 Cloudflare Pages

1. 先按 `COMPLIANCE-CHECKLIST.md` 第 1 节替换占位域名与联系邮箱，并更新 `sitemap.xml` / `robots.txt` / 各页 canonical。
2. `site/` 目录推到一个 GitHub 仓库（新建仓库时自己写 LICENSE，例如 MIT；别忘选 license）。
3. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git → 选仓库。
4. Build settings：Framework preset 选 **None**，Build command 留空，Build output directory 填 `site`。
5. 部署完成后绑定自定义域名（需把域名 NS 指向 Cloudflare），HTTPS 自动签发。
6. 验证：`https://你的域名/robots.txt`、`sitemap.xml`、两个工具页、三个政策页都能打开；手机实机检查响应式。
7. 接 Search Console 提交 sitemap，观察真实查询词后再写 `CONTENT-PLAN.md` 里第 3–12 篇。

> **不要用 Azure 学生订阅托管**。理由见合规清单第 0 节：条款限教育/非商业研究，且你的额度 2026-12-10 到期。学生额度留给练部署、CI/CD、Foundry/Copilot CLI 和研究原型。

## 30 天节奏

| 周 | 动作 |
|---|---|
| 1 | 替换占位符、部署上线、跑 `verify.py`、接 Search Console；发 CONTENT-PLAN #3 #4 |
| 2 | 发 #5 #6；补工具页的 Related guides 内链；开邮件订阅 |
| 3 | 发 #8 #9；上线第一份可下载 checklist / 矩阵模板；接 affiliate 或数字产品 |
| 4 | 发 #7 #10 #11；提交 AdSense（首轮被拒正常，按反馈补内容再申）；**不买量、不采集** |
| 5–12 | 按 Search Console 真实查询词补内容；月 PV 上万后再评估广告收益 |

## 已知边界（不要对外夸大）

- APA 7 工具覆盖 6 种常见文献类型，**不**自动改写标题大小写（会破坏专有名词与理论构念名），只给警告。
- 不解析贵族姓氏粒子、后缀、机构名内部逗号；复杂条目用 `Surname, Given` 格式并人工复核。
- 体检工具是 14 条启发式规则，看不到斜体、悬挂缩进、DOI 是否可解析、文献是否真实存在。
- 站内所有规则声明以 APA 手册 / 机构模板 / 期刊指南为准，工具不是风格权威。
- 收益数字一律为行业估算区间，实际以 AdSense 与 Search Console 后台实测为准。

## 文件修改约定

- 站内正文用**英文**；项目文档用中文。
- 新增任何第三方组件前，先跑 `LICENSE-AUDIT.md` 的复现命令，再更新 `site/NOTICE.txt`。
- 修改 JS 逻辑后必须重跑 `python3 verify.py`。
- 站点文件保持纯静态、零构建、零 CDN。
