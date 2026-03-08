from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PATH = OUTPUT_DIR / "refatishere-app-summary.pdf"


def bullet_list(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=0) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=10,
        bulletFontName="Helvetica",
        bulletFontSize=8,
        bulletOffsetY=1,
    )


def build_pdf() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleSmall",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=22,
        textColor=colors.HexColor("#10223E"),
        spaceAfter=8,
    )
    section = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=12,
        textColor=colors.HexColor("#1C4E80"),
        spaceBefore=0,
        spaceAfter=4,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1F1F1F"),
        spaceAfter=2,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=0,
        firstLineIndent=0,
        spaceAfter=1,
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#5B6572"),
    )

    left_col = [
        Paragraph("App Summary", title),
        Paragraph(
            "A deployment bundle that combines a public static site, a legacy PHP/MySQL API, a richer crypto workspace, and an optional Vercel planner sidecar. "
            "The repo positions the crypto workspace as an advisory-first operator surface rather than an auto-executing trading bot.",
            body,
        ),
        Paragraph("Who It’s For", section),
        Paragraph(
            "Primary persona: a crypto market operator/trader who monitors markets, journals trades, reviews signals, and uses advisory planner guidance. "
            "Broader non-crypto public-site audience: Not found in repo.",
            body,
        ),
        Paragraph("What It Does", section),
        bullet_list(
            [
                "Serves public pages from plain HTML, CSS, and JavaScript with no build step.",
                "Provides a crypto dashboard with charting, KPI cards, live ticker tape, and signal summaries.",
                "Streams market updates directly from Binance WebSocket mini-ticker feeds.",
                "Loads chart history through a PHP crypto backend with Binance proxy, DB cache, and fallback/mock states.",
                "Supports trade logging and journal entry CRUD through legacy PHP endpoints backed by MySQL.",
                "Offers private account, orders, order preview, cancel, and status-check flows with testnet support.",
                "Generates advisory-only planner output locally or through an optional Vercel sidecar for Binance and PancakeSwap.",
            ],
            bullet,
        ),
    ]

    architecture_points = [
        "<b>Frontend:</b> root pages (`index.html`, `about.html`, etc.) plus `crypto/crypto.html`; shared styling/scripts in `style.css`, `script.js`, and crypto-specific assets in `crypto/src/*`.",
        "<b>Browser state:</b> crypto settings, watchlist, alerts, and journal cache live in `localStorage`.",
        "<b>Legacy data API:</b> `api/*.php` uses token auth from env, emits JSON envelopes, and reads/writes MySQL tables such as `trades`, `journal_entries`, `campaigns`, `simple_earn`.",
        "<b>Crypto backend:</b> `crypto/backend/api.php` validates requests, proxies Binance REST calls, caches klines in `market_kline_cache`, and returns degraded/fallback responses when needed.",
        "<b>Planner path:</b> crypto backend can call `vercel-sidecar/api/planner.js`; the sidecar returns normalized advisory responses and is explicitly configured with `ALLOW_AUTO_EXECUTION: false`.",
        "<b>Flow:</b> Browser -> PHP endpoints / Binance WS -> MySQL and optional sidecar -> JSON responses back to the UI.",
    ]

    run_points = [
        "Copy `api/.env.example` and `crypto/backend/.env.example` to `.env` files and set DB credentials plus API tokens.",
        "Create the MySQL tables from `deploy/infinityfree/schema.sql`.",
        "Serve the repo on a PHP-capable host for `/api/*` and `/crypto/backend/*`; the exact local dev server command is Not found in repo.",
        "Optional: deploy `vercel-sidecar/` on Vercel and set `PLANNER_SIDECAR_URL` / `PLANNER_SIDECAR_TOKEN` if planner sidecar mode is needed.",
        "Open `index.html` for the public site or `crypto/crypto.html` for the workspace; in the crypto page, enter `API_TOKEN_CRYPTO` in Settings before protected API actions.",
    ]

    right_col = [
        Paragraph("How It Works", section),
        bullet_list(architecture_points, bullet),
        Spacer(1, 4),
        Paragraph("How To Run", section),
        bullet_list(run_points, bullet),
        Spacer(1, 6),
        Paragraph(
            "Evidence sources used: `README.md`, root HTML/CSS/JS, `crypto/src/js/core/app.js`, `crypto/backend/api.php`, `api/*.php`, `deploy/infinityfree/schema.sql`, and canonical docs under `docs/`.",
            small,
        ),
    ]

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )

    table = Table(
        [[left_col, right_col]],
        colWidths=[88 * mm, 88 * mm],
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#C9D5E6")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FBFF")),
                ("LINEBEFORE", (1, 0), (1, 0), 0.8, colors.HexColor("#D5E0EE")),
            ]
        )
    )

    story = [table]
    doc.build(story)
    return OUTPUT_PATH


if __name__ == "__main__":
    print(build_pdf())
