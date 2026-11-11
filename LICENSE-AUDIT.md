# 第三方授权实测核对表

**核实日期**：2026-11-10
**核实方式**：GitHub REST API `/repos/{owner}/{repo}/license` 取 `license.spdx_id`；对 `NOASSERTION` / `Not Found` 的项目，进一步读取原始 `LICENSE` / `COPYING` / `README.md` 原文判断。结论来自实测返回，不来自记忆或仓库页面描述。

## 一、实测原始结果

| 仓库 | API 返回 SPDX | API 返回 name | 原始文件复核 |
|---|---|---|---|
| `citation-js/citation-js` | `MIT` | MIT License | — |
| `mozilla/pdf.js` | `Apache-2.0` | Apache License 2.0 | — |
| `KaTeX/KaTeX` | `MIT` | MIT License | — |
| `markedjs/marked` | `NOASSERTION` | Other | `LICENSE` 正文为 MIT 授权条款 + 贡献者 CLA 声明 |
| `mwilliamson/mammoth.js` | `BSD-2-Clause` | BSD 2-Clause "Simplified" License | — |
| `dolanmiu/docx` | `MIT` | MIT License | — |
| `SheetJS/sheetjs` | `Apache-2.0` | Apache License 2.0 | — |
| `chartjs/Chart.js` | `MIT` | MIT License | — |
| `PapaParse/PapaParse` | `MIT` | MIT License | — |
| `citation-style-language/styles` | `Not Found` | — | `README.md` Licensing 段：CC BY-SA 3.0，且要求署名 CSL 项目并链接 citationstyles.org |
| `jgm/pandoc` | `GPL-2.0` | GNU General Public License v2.0 | `COPYING.md` 为 GPL v2 全文 |
| `zotero/zotero` | `NOASSERTION` | Other | `COPYING` 原文："under the GNU Affero General Public License, version 3 (AGPLv3)"，且 Zotero 名称为注册商标 |
| `JabRef/jabref` | `MIT` | MIT License | — |

> **重要教训**：`markedjs/marked` 和 `zotero/zotero` 的 API 元数据都是 `NOASSERTION`，但一个是 MIT、一个是 AGPLv3，性质完全相反；`citation-style-language/styles` 的 API 甚至返回 `Not Found`，实际授权写在 README 里。**只看 API 字段会误判**，必须读原始文件。这正是「搬 GitHub 工具」最容易踩的坑。

## 二、可否商用与附带义务

| 项目 | 打算用在哪 | 商用 | 义务 / 限制 | 结论 |
|---|---|---|---|---|
| `citation-js/citation-js` (MIT) | 后续做 BibTeX / DOI 转 APA | 允许 | 保留版权与许可声明 | 候选，安全 |
| `mozilla/pdf.js` (Apache-2.0) | 后续浏览器内 PDF 预览 | 允许 | 保留 NOTICE，专利授权条款，修改需标注 | 候选，安全 |
| `KaTeX/KaTeX` (MIT) | 后续公式渲染 | 允许 | 保留版权声明 | 候选，安全 |
| `markedjs/marked` (MIT 条款) | 后续 Markdown 渲染 | 允许 | 保留版权声明；API 元数据不准，需人工记录 | 候选，但须在 NOTICE 备注 |
| `mwilliamson/mammoth.js` (BSD-2-Clause) | 后续 docx → HTML | 允许 | 保留版权与免责声明 | 候选，安全 |
| `dolanmiu/docx` (MIT) | 后续导出 .docx | 允许 | 保留版权声明 | 候选，安全 |
| `SheetJS/sheetjs` (Apache-2.0) | 后续 xlsx 读写 | 允许 | 保留 NOTICE | 候选，安全 |
| `chartjs/Chart.js` (MIT) | 后续图表 | 允许 | 保留版权声明 | 候选，安全 |
| `PapaParse/PapaParse` (MIT) | 后续 CSV 解析 | 允许 | 保留版权声明 | 候选，安全 |
| `JabRef/jabref` (MIT) | 仅作为文献管理工具推荐，不嵌入 | 允许 | — | 仅外链 |
| `citation-style-language/styles` (CC BY-SA 3.0) | APA 7 CSL 样式文件 | 允许 | **署名 + 链接 citationstyles.org**；再分发样式需同样 CC BY-SA，且保留作者列表；SA 会传染衍生的样式文件 | **暂不引入**，若引入须单列署名与 SA 说明 |
| `jgm/pandoc` (GPL-2.0) | 服务端文档转换 CLI | 允许 | 若分发衍生作品须同许可开源；仅作为独立进程调用且不分发，通常不触发，但需个案确认 | **暂不引入** |
| `zotero/zotero` (AGPL-3.0) | 文献管理 | 允许 | **网络使用即触发源码提供义务**；Zotero 名称是注册商标，不可用于产品命名 | **不引入**，只做中性外链 |

补充的通用红线（GitHub 官方文档与 OSI 说明）：

- **没有 LICENSE 文件的仓库 = 默认保留全部权利**。公开只是可以「看」，不等于可以复制、修改、再分发或上生产。
- `CC BY-NC*`、`BSL`、自定义 "non-commercial" 许可：**挂广告即属商业使用**，直接排除。
- GPL/LGPL/AGPL 允许商用，但有源码开放义务；AGPL 尤其针对「以网络服务形式提供」的场景。
- 模板、图标、字体、图片常与代码分属不同授权，必须单独核对。

## 三、本站当前状态

**运行时第三方依赖：0。** `site/NOTICE.txt` 记录了这一点。所有 HTML / CSS / JavaScript 均为本项目原创，字体使用访客系统字体，无 CDN、无分析脚本、无广告脚本。因此现阶段没有任何嵌入第三方代码带来的署名或许可义务。

这不是偷懒，是刻意的选择：零依赖 = 零授权审计面 + 零供应链 + 离线可用 + 审核时对「隐私声明」的解释最干净。等确实需要 BibTeX 解析、PDF 预览等功能时，再从上表的「候选，安全」列里挑，并**先更新 NOTICE.txt 与本表**。

## 四、复现核实（可自行重跑）

```bash
for r in citation-js/citation-js mozilla/pdf.js KaTeX/KaTeX markedjs/marked \
         mwilliamson/mammoth.js dolanmiu/docx SheetJS/sheetjs chartjs/Chart.js \
         PapaParse/PapaParse citation-style-language/styles jgm/pandoc \
         zotero/zotero JabRef/jabref; do
  printf "%-42s " "$r"
  curl -s -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$r/license" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); l=d.get('license') or {}; print(l.get('spdx_id','NONE'),'|',l.get('name','-'))"
done
```

含糊项复核：

```bash
curl -s -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/markedjs/marked/license" \
| python3 -c "import sys,json,base64; print(base64.b64decode(json.load(sys.stdin)['content']).decode()[:900])"
curl -s https://raw.githubusercontent.com/zotero/zotero/main/COPYING | head -20
curl -s https://raw.githubusercontent.com/citation-style-language/styles/master/README.md | grep -i -A 6 'Licensing'
```

> 授权可能随版本变化。每次引入新依赖前重新跑一次，并把日期与结论追加到本表，不要沿用旧结论。
