# 履行手册：从一封邮件到一次成交

这是闭环里唯一需要**你本人**动手的部分。其它环节都已经自动化或写好了。目标不是"做销售"，是**在别人卡住的那 10 分钟里出现，然后让他们知道有个真人懂这个**。

前 10 单请全部手工做。不要注册收款平台，不要建自动化。你要先知道人们到底卡在哪，才知道该卖什么。

---

## 第 0 步：准备（一次，20 分钟）

1. 用 Gmail 建一个标签 `DT-leads`，把网站发来的邮件自动打标（过滤器：主题含 `APA 7` 或 `matrix` 或 `checklist`）。
2. 建一个收款方式。**前 10 单最省事的两种**：
   - 支付宝收款码（微信也行）——适合国内转账；
   - 或直接用 PayPal 好友付款链接。
   - **不要**为了 10 单去注册 Creem/Paddle，那是后面的事。
3. 把这两个文件放在手边能立刻附上的位置：
   - `products/dist/apa7-submission-checklist.pdf`（3 页，67 项）
   - `products/literature-review-matrix.csv`（14 列，含 3 行示例）
4. 本机重新生成 PDF 的命令：`.buildenv/bin/python build_pdf.py`

---

## 第 1 步：收到"帮我看一条引用"——24 小时内回复

这是最高价值的接触，**优先于其它所有事**。对方正在被卡住，此时你的帮助最值钱。

### 回复模板（照改即可，不要写长）

```
Subject: Re: One APA 7 reference to check

Hi [名字],

Thanks for sending this. Here's what I see:

[原引用]

Two things to fix:
1. [具体问题，一句话] — [怎么改]
2. [具体问题，一句话] — [怎么改]

Corrected version:
[改好的引用]

The [期刊名 / 卷号] is the part people most often miss in plain text.
Full rule here if you want it: https://doctoral-toolbox.app.workbuddy.host/guides/apa7-reference-list.html

I've attached the 67-point checklist I use before submitting — it covers the
italics and hanging indents that an auditor can't see in plain text.

If another entry trips you up, just reply to this email.

— Qi
```

### 三条铁律

- **先给答案，再谈自己。** 前 80% 是修正和解释，最后 20% 才提清单。
- **不要一上来推产品。** 第一次接触只帮忙，不卖东西。对方会记住你。
- **绝不要求、也不接受未发表的章节或数据。** 网站文案已经说明了，邮件里再守一次。

### 判断这是不是"会付费的人"

出现下面任一信号，在`leads.csv` 标 `warm`：
- 一次发了 3 条以上引用
- 提到"明天要交 / deadline / 导师退回"
- 问"有没有模板 / 能不能直接给我一份"
- 主动说了自己的身份（DBA / 博士 / 讲师）

**没有这些信号也照帮。** 这类人会成为转发你网站的那个人。

---

## 第 2 步：48 小时后——一次跟进，只一次

不要"定期发邮件"。只发这一封，然后停。

```
Subject: The matrix I mentioned

Hi [名字],

Following up once, then I'll leave you alone.

I turned the approach in that guide into a 14-column synthesis matrix —
it has a coding-confidence field and a PDF-page pointer, so every claim
traces back to a source. It's what I used on my own review.

If it would save you time: $9, and I'll send the file the same day.
Just reply "matrix" and I'll send payment details.

If not, the CSV version is free — say the word and I'll attach it.

— Qi
```

**这封信的作用是让人有机会说"要"。** 不催、不打折、不搞限时。说"要"的人，当场发付款方式，收到款当天发文件。

说"不用"的人，标 `closed`，不再联系。说"免费版就好"的人，发 CSV，标 `free`——他们以后可能回来。

---

## 第 3 步：把每一次帮忙变成下一篇内容

这是飞轮的关键，也是你相对模板农场的真正优势。

每处理完一封邮件，在 `ops/leads.csv` 里记一行，尤其**"哪里卡住"这一列**。当你发现同一个问题出现第 3 次，就写一篇指南。

- 三个人搞不清 sentence case → 写《Why your reference manager keeps exporting Title Case》
- 三个人问团体作者 → 写《Corporate authors in APA 7》
- 三个人卡在中文文献 → 写《Citing Chinese sources in an English APA 7 dissertation》

这篇新指南会被同样卡住的人搜到 → 他们来到工具页 → 发邮件给你 → 飞轮转一圈。

**你不需要买流量。每一个付费用户的问题，都是下一篇免费内容的选题。**

---

## 第 4 步：收款与交付（前 10 单手工）

1. 对方说"要" → 回复你的支付宝/微信/PayPal 收款信息
2. 收到款 → **当天**把文件发过去（速度快本身就是产品的一部分）
3. 附一句：`If anything in the file doesn't fit your template, reply and I'll adjust it.` ——这句话会带来改版需求和复购
4. 在 `leads.csv` 记 `paid / 金额 / 日期`
5. 累计到 **3 笔真实付款** 后，才考虑注册 Creem 做自动化（见 `SELLING-PLAYBOOK.md`）

---

## 一句话记住

> 别人卡住的那 10 分钟，你出现、给答案、附清单。
> 48 小时后问一次要不要模板。
> 然后把这次卡住的点写成下一篇指南。

重复这个循环 10 次，你会比任何商业计划都更清楚这个站该卖什么。
