# 上线与变现合规清单

## 0. 最重要的一条：不要用 Azure 学生订阅托管这个站

微软官方 FAQ：Azure for Students 的产品「expressly for the support of education or teaching, noncommercial research」，且额度用完 / 12 个月到期不升级会**取消订阅、下架已部署资源**。挂广告属于商业用途，违反条款；且你的额度 **2026-12-10** 到期。学生额度只用于学习、原型与课程/研究 demo。

**Azure 学生订阅的正确用法**：开发、测试、演示原型、课程/研究项目（官方 FAQ 明确允许「为教育、非商业研究设计、开发、测试和演示软件应用」）。`azure/` 目录就是这层：Functions + Bicep + 同构 API，30 天内跑通、练会、留下代码；到期后清资源，资产仍在，随时可在按量付费订阅重建。**唯独不要把它当商业生产环境。**

站点的生产托管走 **Cloudflare Pages 免费层**（允许商用、静态流量不限）。免费层商用条款对比：

| 平台免费层 | 商用 | 备注 |
|---|---|---|
| Cloudflare Pages | 允许 | 静态请求不限；500 builds/月；不能在自有页面收集信用卡信息 |
| Netlify Starter | 允许 | 300 credits/月，用完站点暂停 |
| Vercel Hobby | **禁止** | 条款明确限非商用，挂广告或售卖即属商业 |
| GitHub Pages | 灰区 | 条款不允许在线商业 / 电商 / 以销售为主的站点 |
| 百度联盟 / 360 联盟 | — | 需 ICP 备案；境外主机无法备案，故本项目面向海外流量 + AdSense |

## 1. 上线前必须替换的占位符

占位符已全部处理完毕（`python3 verify.py --prelaunch` 实测 18 项全过）：

| 项目 | 状态 |
|---|---|
| canonical / sitemap / robots 域名 | 已替换成 `https://doctoral-toolbox.app.workbuddy.host`（17 处 / 10 文件） |
| 联系邮箱 | 已替换成 `qpengking@gmail.com`（`contact.html` 的 mailto 链接与显示文本） |
| `Last updated` | `privacy.html` 为 2026-11-10 |
| 页脚年份 | 脚本自动取当前年份，无需手改 |

一键复核（未替换则退出码非 0）：

```bash
python3 verify.py --prelaunch
```

- [x] `python3 verify.py --prelaunch` 全 PASS
- [ ] 将来若重建 Azure 原型：`ALLOWED_ORIGIN` 用真实域名，`authLevel: anonymous` 换成 API key / Easy Auth
- [ ] 自有域名（可选，非必须）：拿到后一次性替换 canonical / sitemap / robots 并重新发布

> 提示：公开页面的邮箱可能被爬虫收集垃圾邮件，属正常现象；若困扰可后续换成表单或图片形式。

## 2. 站点质量（AdSense 审核实际会看）

- [ ] 每页有唯一 `<title>` 与 meta description，canonical 指向真实域名
- [ ] 至少 8–12 页**实质原创内容**（当前 8 页：首页、2 工具、2 指南、About、Contact、Privacy；404 不计）
- [ ] 工具页含 700+ 英文词原创说明，不是「只有表单的工具壳」
- [ ] About / Contact / Privacy 三页齐全且可从每页导航到达
- [ ] 导航清晰，无死链（由 `verify.py` 实测）
- [ ] 移动端响应式（CSS 有 `@media` 断点；用手机实机打开确认）
- [ ] 无「正在建设中」页面、无空测试页、无占位 lorem ipsum
- [ ] 无采集内容、无自动生成页、无复制粘贴的第三方文章、无受版权保护的图表
- [ ] 站点已上线并能稳定访问数日后再提交 AdSense（不要在提交当天才上线）

## 3. 内容与版权

- [ ] 所有内容原创；引用 APA 规则属于描述性说明，不复制《Publication Manual》原文
- [ ] 明确声明与 American Psychological Association 无隶属 / 背书关系（见 `site/NOTICE.txt`）
- [ ] 不使用 Zotero、APA 等商标作为产品名称或暗示官方身份
- [ ] 所有字体为系统字体，无第三方图标 / 图片 / 模板
- [ ] 任何新增第三方组件：先更新 `LICENSE-AUDIT.md` 与 `site/NOTICE.txt`，保留版权与 NOTICE
- [ ] 不引入无 LICENSE 仓库、CC BY-NC 项目、AGPL 组件（详见授权核对表）

## 4. 隐私与 Cookie

- [ ] 工具纯前端运行，未上传、未写入 localStorage / cookie（可用浏览器网络面板实测）
- [ ] Privacy 政策说明当前状态与「若未来加广告」的处理方式
- [ ] 接入 AdSense 前：为 EEA / UK 访客加入合规的同意管理机制（CMP），非必要 cookie 需先获同意
- [ ] Privacy 中提供 Google Ads Settings / aboutads.info 退出链接（已具备）
- [ ] CCPA/CPRA 条款与「不出售个人信息」声明（已具备）
- [ ] 若有任何第三方脚本（分析、广告），同步更新 Privacy 与 NOTICE
- [ ] 不要求注册、不收集邮箱以外的个人信息；邮件订阅需单独告知用途

## 5. 广告接入（流量起量之后再做）

- [ ] 先有稳定原创内容与真实流量，再申请 AdSense
- [ ] 广告位不放在工具的输入区 / 输出区（避免干扰与误点）
- [ ] 广告不得超过页面内容量；遵守 "Valuable Inventory" 与 "Replicated Content" 政策
- [ ] 不得诱导点击（「支持我们请点广告」等表述一律禁止）
- [ ] 不投放于版权存疑内容旁边
- [ ] `_headers` 目前**未设置 CSP**——这是为广告脚本预留的；若将来加 CSP，需为 Google 广告域名放行
- [ ] 收益预期写实：普通工具/内容站 RPM 约 $2–5（教育/科研类英文流量可更高）；1,000 PV/天约 $60–150/月；月入 $1,000 需 20–50 万 PV/月量级

## 6. 变现阶梯（广告放最后）

1. **邮件列表**：每篇指南末尾的 checklist / 模板换取订阅，最早的资产
2. **Affiliate / CPS**：文献管理工具、 Grammarly 类写作工具、模板市场（需披露联盟关系）
3. **数字产品**：APA 7 提交 checklist、综合矩阵模板、DBA 论文排版模板包 —— 对 DBA 受众，一份模板的收入可能高于挂一年广告，且不依赖流量规模
4. **赞助 / 咨询**：面向院系写作中心、研究方法工作坊
5. **展示广告**：月 PV 上万后再接 AdSense；更大规模再评估 Mediavine / Raptive 门槛

## 7. 运营红线

- 不把学生额度、教育优惠、GitHub 学生包用于商业生产环境。
- 不做「批量生成工具页 / 伪原创」站点，这类站点是 AdSense 明确拒绝的 thin content。
- 不提供代写、降重、规避 AI 检测的服务（内容与商业双重风险）。
- 域名与站点文件本地留副本，随时可迁移，不锁死在任何免费额度上。
- 收益与流量数据以 Search Console / AdSense 后台实测为准，不用估算值对外宣称。
