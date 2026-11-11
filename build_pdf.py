#!/usr/bin/env python3
"""Build the free lead-magnet PDF from the Markdown checklist.

This is a local build tool, not part of the website. It needs reportlab:
    python3 -m venv .buildenv
    .buildenv/bin/pip install -i https://mirrors.aliyun.com/pypi/simple/ reportlab
    .buildenv/bin/python build_pdf.py

Output: products/dist/apa7-submission-checklist.pdf
"""
from pathlib import Path
import re

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    ListFlowable, ListItem, Table, TableStyle, HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "products" / "apa7-submission-checklist.md"
OUT_DIR = ROOT / "products" / "dist"
OUT = OUT_DIR / "apa7-submission-checklist.pdf"

INK = colors.HexColor("#1f2320")
MUTED = colors.HexColor("#5d645e")
ACCENT = colors.HexColor("#1f5f52")
SOFT = colors.HexColor("#e9f2ee")
LINE = colors.HexColor("#dcded6")

SERIF = "Times-Roman"
SERIF_B = "Times-Bold"
SANS = "Helvetica"

styles = getSampleStyleSheet()
S = {
    "title": ParagraphStyle("title", fontName=SERIF_B, fontSize=22, leading=26,
                            textColor=INK, spaceAfter=8, alignment=TA_CENTER),
    "subtitle": ParagraphStyle("subtitle", fontName=SANS, fontSize=9.5, leading=14,
                               textColor=MUTED, alignment=TA_CENTER, spaceAfter=4),
    "note": ParagraphStyle("note", fontName=SANS, fontSize=9, leading=13,
                           textColor=MUTED, alignment=TA_LEFT),
    "h2": ParagraphStyle("h2", fontName=SERIF_B, fontSize=13.5, leading=17,
                         textColor=ACCENT, spaceBefore=14, spaceAfter=6,
                         keepWithNext=True),
    "body": ParagraphStyle("body", fontName=SERIF, fontSize=10.2, leading=14.5,
                           textColor=INK, spaceAfter=6),
    "check": ParagraphStyle("check", fontName=SANS, fontSize=9.2, leading=13,
                            textColor=INK),
    "box": ParagraphStyle("box", fontName=SANS, fontSize=9.2, leading=13.5,
                          textColor=INK),
    "footer": ParagraphStyle("footer", fontName=SANS, fontSize=8, textColor=MUTED,
                             alignment=TA_CENTER),
}


def inline(text):
    """Convert the small amount of Markdown inline markup we use."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r'<font face="Courier" size="8.6">\1</font>', text)
    text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", text)
    return text


def parse(md):
    lines = md.splitlines()
    blocks, items, para = [], [], []
    for raw in lines:
        line = raw.rstrip()
        if line.startswith("# "):
            continue
        if line.startswith("## "):
            if para:
                blocks.append(("p", " ".join(para))); para = []
            if items:
                blocks.append(("checks", items)); items = []
            blocks.append(("h2", line[3:].strip()))
            continue
        if line.startswith("> "):
            if para:
                blocks.append(("p", " ".join(para))); para = []
            if items:
                blocks.append(("checks", items)); items = []
            blocks.append(("note", line[2:].strip()))
            continue
        if line.startswith("- [ ] "):
            if para:
                blocks.append(("p", " ".join(para))); para = []
            items.append(line[6:].strip())
            continue
        if re.match(r"^\d+\.\s", line):
            if para:
                blocks.append(("p", " ".join(para))); para = []
            if items:
                blocks.append(("checks", items)); items = []
            blocks.append(("num", re.sub(r"^\d+\.\s", "", line)))
            continue
        if not line.strip():
            if para:
                blocks.append(("p", " ".join(para))); para = []
            if items:
                blocks.append(("checks", items)); items = []
            continue
        para.append(line.strip())
    if para:
        blocks.append(("p", " ".join(para)))
    if items:
        blocks.append(("checks", items))
    return blocks


def number_canvas(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 16 * mm, A4[0] - 20 * mm, 16 * mm)
    canvas.setFont(SANS, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 11 * mm, "Doctoral Toolbox  ·  free checklist")
    canvas.drawRightString(A4[0] - 20 * mm, 11 * mm, f"{doc.page}")
    canvas.restoreState()


def build():
    md = SRC.read_text(encoding="utf-8")
    blocks = parse(md)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=22 * mm,
        title="APA 7 Submission Checklist",
        author="Doctoral Toolbox",
        subject="A 60+ point pre-submission checklist for dissertations and journal manuscripts",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=number_canvas)])

    story = []
    story.append(Paragraph("The APA 7 Submission Checklist", S["title"]))
    story.append(Paragraph("67 checks for doctoral dissertations, theses and journal manuscripts", S["subtitle"]))
    story.append(Paragraph("Free to use and share  ·  Doctoral Toolbox  ·  v1.0, November 2026", S["subtitle"]))
    story.append(Spacer(1, 5 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
    num_checks = sum(len(v) for k, v in blocks if k == "checks")
    story.append(Paragraph(
        f"{num_checks} checks. Work through them in order: <b>[7d]</b> while the draft is "
        "still open, <b>[24h]</b> once the text is locked, <b>[1h]</b> immediately before upload.",
        S["note"]))
    story.append(Spacer(1, 3 * mm))

    for kind, value in blocks:
        if kind == "h2":
            story.append(Paragraph(inline(value), S["h2"]))
            story.append(HRFlowable(width="100%", thickness=0.4, color=LINE,
                                    spaceBefore=1, spaceAfter=6))
        elif kind == "p":
            story.append(Paragraph(inline(value), S["body"]))
        elif kind == "note":
            cell = Paragraph(inline(value), S["box"])
            box = Table([[cell]], colWidths=[doc.width])
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("LINEBEFORE", (0, 0), (0, -1), 2, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]))
            story.append(box)
            story.append(Spacer(1, 4 * mm))
        elif kind == "checks":
            flow = ListFlowable(
                [ListItem(Paragraph(f'<font color="#1f5f52">[ ]</font>&nbsp;&nbsp; {inline(v)}', S["check"]),
                          leftIndent=14, value=None) for v in value],
                bulletType="bullet", start="", leftIndent=6, bulletFontSize=8,
            )
            story.append(flow)
            story.append(Spacer(1, 3 * mm))
        elif kind == "num":
            story.append(Paragraph(inline(value), S["body"]))

    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LINE, spaceAfter=6))
    story.append(Paragraph(
        "Formatting aid, not style authority. Always verify against the current APA 7 "
        "manual and your institution's dissertation template.", S["note"]))

    doc.build(story)
    size = OUT.stat().st_size
    print(f"Built: {OUT.relative_to(ROOT)}  ({num_checks} checks, {size:,} bytes)")


if __name__ == "__main__":
    build()
