# 内容计划：前 12 篇原创长文

**定位**：英文、面向 DBA / 博士生 / 早期研究者，围绕「学术写作的机械环节 + 可复现研究流程」。
**为什么是英文**：教育 / 科研 / B2B 类英文流量的广告 RPM 明显高于泛娱乐（行业估算 $8–25 vs $2–5），且这类读者搜索意图明确、可转化为模板与工具付费。
**核心原则**：每篇必须提供**可验证的原创价值**（规则解释、worked example、checklist、表格、决策树），不能是工具的复述，更不能采集或改写他人内容——这是 AdSense「thin content / replicated content」的红线。

已交付 2 篇，作为后续 10 篇的模板。每篇正文目标 900–1,500 英文词。

## 已完成（站点内已上线）

| # | 标题 | 文件 | 实测词数 |
|---|---|---|---|
| 1 | The APA 7 reference list, checked line by line | `site/guides/apa7-reference-list.html` | 1181 |
| 2 | A reproducible literature review workflow for doctoral students | `site/guides/dba-literature-review-workflow.html` | 1184 |
| 3 | APA 7 in-text citations, decided in one page | `site/guides/apa7-in-text-citations.html` | 1464 |
| 4 | APA 6 to APA 7: what actually changed | `site/guides/apa6-to-apa7.html` | 1217 |
| 5 | Why your reference manager keeps exporting Title Case | `site/guides/title-case-problem.html` | 1118 |
| 6 | Citing a dissertation or thesis in APA 7 | `site/guides/apa7-dissertations.html` | 1094 |

**进度：12 篇计划中已上线 6 篇。** 全部词数由 `verify.py` 剥离标签后实测。六篇之间已建立互链（每篇 4–6 条出链），236 条站内相对链接零死链。

工具页正文实测：`apa7-citation.html` 923 词、`reference-check.html` 1324 词（含智能导入说明）。词数由 `verify.py` 剥离标签后实测，非估算。

**差异化能力（已上线）**：智能导入把乱格式引用结构化重建，覆盖 `and`/`&` 混用、`doi:` 前缀、`Vol.`/`pp.`、缺逗号的卷期、团体作者、全角标点、版本号重复；刻意不改标题大小写。这是内容选题之外的产品壁垒，第 3–12 篇应围绕它写「为什么自动转换会出错」「导入后如何复核」等关联长尾，形成工具 ↔ 内容的内链闭环。

## 待写 10 篇（按优先级排序）

### 3. APA 7 in-text citations: every rule in one page ✅ 已上线
- **目标词**：`apa 7 in-text citation rules` / `apa 7 multiple authors in text`
- **意图**：查规则（最高频、常青、易排名）
- **大纲**：括号式 vs 叙述式；1/2/3+ 作者；`et al.` 从第一次引用起；团体作者缩写规则；同作者同年 a/b；无日期与无页码；直接引用页码；个人通信；多个文献在同一括号内排序
- **原创点**：一张「作者数 × 引用形式」决策表 + 10 组正误对照
- **内链**：→ APA 7 生成器、参考文献列表指南
- **CTA**：用生成器检查作者串

### 4. APA 7 vs APA 6: what actually changed in your reference list ✅ 已上线
- **目标词**：`apa 6 vs apa 7 changes` / `apa 7 publisher location`
- **意图**：迁移排查
- **大纲**：出版社地点取消；`Retrieved from` 取消；DOI 统一为 URL；20 位作者规则；`[Doctoral dissertation]` 方括号描述；网页与社交媒体条目；无障碍语言
- **原创点**：可直接跑的「旧稿迁移 checklist」，配迁移前后对照
- **内链**：→ 参考文献体检工具（用 `doi:` / `Retrieved from` 规则反查）

### 5. Why your reference manager keeps exporting Title Case (and how to fix it) ✅ 已上线
- **目标词**：`zotero title case apa` / `sentence case reference list`
- **意图**：具体故障排查（长尾、转化好）
- **大纲**：数据库存储的是 Title Case；保护专有名词的字段；批量转换的风险；逐条人工复核流程；为何自动转换会破坏缩写与理论构念名
- **原创点**：一份「不可自动小写」的术语清单（SEM、Tobin's Q、Dynamic Capabilities、机构名等）
- **内链**：→ APA 7 生成器（说明为何工具拒绝自动改写标题）

### 6. How to cite a dissertation, thesis and institutional repository in APA 7 ✅ 已上线
- **目标词**：`apa 7 cite dissertation` / `apa 7 thesis proquest`
- **意图**：DBA 学生高相关，竞争低
- **大纲**：已发表 vs 未发表；方括号描述；机构名；ProQuest / 机构库；博士论文 vs 硕士论文；引用自己未发表的论文
- **原创点**：6 种情形的模板表
- **内链**：→ 生成器的 thesis 类型

### 7. Citing AI tools, datasets and software in APA 7
- **目标词**：`apa 7 cite chatgpt` / `apa cite software dataset`
- **意图**：高增长话题，时效性带来自然流量
- **大纲**：生成式 AI 输出的归类；软件与数据集条目；版本、URL、访问日期；机构政策优先；为何不应把 AI 列为作者
- **原创点**：把「该引用什么」写成决策树，并明确研究伦理边界
- **注意**：涉及 AI 使用政策时只描述通行做法，声明以期刊与机构政策为准

### 8. The doctoral dissertation template audit: 40 things to check before submission
- **目标词**：`dissertation formatting checklist` / `doctoral thesis template`
- **意图**：高转化 checklist，适合做可下载版本
- **大纲**：页边距、行距、页码、标题层级、表格与图、附录、参考文献悬挂缩进、PDF/A、书签、字体嵌入、文件命名
- **原创点**：按「提交前 7 天 / 24 小时 / 1 小时」分组，而不是平铺清单
- **CTA**：可下载 checklist（数字产品的第一个候选）

### 9. Building a synthesis matrix that writes your literature review for you
- **目标词**：`synthesis matrix literature review` / `literature review matrix template`
- **意图**：紧接着已完成的第 2 篇，吃内链与专题权重
- **大纲**：矩阵 vs 注释书目；列设计；编码一致性；从列里读出主题；把矩阵转成段落结构；常见反模式
- **原创点**：给出完整空表头 + 3 行真实结构的示例（非虚构数据，明确标注为示例）
- **CTA**：矩阵模板下载

### 10. Search strings that survive an examiner: a practical log format
- **目标词**：`systematic search log template` / `database search string doctoral`
- **意图**：方法章节刚需
- **大纲**：概念桶与同义词；布尔语法差异；字段限定；命中数记录；去重计数；可复跑性；附录写法
- **原创点**：一份可直接复制的 CSV 表头与日志规范

### 11. Turnitin, similarity and AI-detection reports: what doctoral students should actually do
- **目标词**：`turnitin similarity score doctoral` / `ai detection report thesis`
- **意图**：极高搜索量，需谨慎处理
- **大纲**：相似度分数不是抄袭判定；报告各部分的含义；排除项的合理范围；学校政策优先；如何在不破坏检测结论的前提下做词级/标点级修订；申诉材料准备
- **红线**：**不提供任何规避检测、代写、降 AI 率的服务或技巧**；只讲合规理解与流程，并明确声明机构政策优先
- **原创点**：把「修订后要不要重测」写成决策流程

### 12. AI governance in the public sector: a reading map for doctoral researchers
- **目标词**：`ai governance public sector literature` / `public sector innovation ai`
- **意图**：与你 PJPA 论文同主题的学术引流，高价值英文流量
- **大纲**：概念边界；主要理论视角；公共部门创新的测量；治理与问责；代表性研究脉络；研究缺口；术语表
- **原创点**：术语表 + 按理论视角分组的阅读地图（不是罗列文献）
- **注意**：只引用公开可核实文献，不搬运受版权保护的全文或图表；可为论文与学术身份引流

## 发布与内链节奏

| 周 | 动作 |
|---|---|
| 1 | 发布 #3、#4（最高频规则类），两篇互链并链到两个工具 |
| 2 | 发布 #5、#6，开始把工具页的 "Related guides" 补上 |
| 3 | 发布 #8、#9，上线第一份可下载 checklist / 矩阵模板，开邮件订阅 |
| 4 | 发布 #7、#10、#11，补齐所有内链；提交 AdSense（首轮被拒属正常） |
| 5–8 | 发布 #12 及其余；接 Search Console 看真实查询词，据此调整标题与补充段落 |

## 写法约束（每篇都适用）

- 每篇至少一个 worked example 或可复制模板，不能只有解释。
- 规则类内容必须声明「以 APA 手册 / 机构模板 / 期刊指南为准」。
- 不复述工具页已有段落，工具页与指南页互链但不重复。
- 不采集、不改写他人文章、不生成「伪原创」批量页；宁可少发。
- 所有统计数字、政策条款标注来源与日期；无法核实的不写。
- 页面必备：`<title>`、meta description、canonical、面包屑/内链、About/Contact/Privacy 可达。
