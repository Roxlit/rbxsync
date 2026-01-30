#!/usr/bin/env bash
#
# generate-tps-report.sh
#
# Converts a TPS markdown report to PDF (via pandoc) or styled HTML (fallback).
#
# Usage:
#   ./scripts/generate-tps-report.sh <input.md> [output-dir]
#
# Arguments:
#   input.md    - Path to the filled-in TPS report markdown file
#   output-dir  - Output directory (default: .claude/reports/pdf/)
#
# Examples:
#   ./scripts/generate-tps-report.sh .claude/reports/TPS-RBXSYNC-110.md
#   ./scripts/generate-tps-report.sh .claude/reports/TPS-RBXSYNC-110.md ./output/

set -euo pipefail

# --- Configuration -----------------------------------------------------------

DEFAULT_OUTPUT_DIR=".claude/reports/pdf"
REPORT_TITLE="Smokestack Games - TPS Report"

# --- Arguments ----------------------------------------------------------------

INPUT_FILE="${1:-}"
OUTPUT_DIR="${2:-$DEFAULT_OUTPUT_DIR}"

if [ -z "$INPUT_FILE" ]; then
    echo "Error: No input file specified."
    echo "Usage: $0 <input.md> [output-dir]"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Derive output filename from input
BASENAME="$(basename "$INPUT_FILE" .md)"
mkdir -p "$OUTPUT_DIR"

# --- PDF Generation (pandoc) -------------------------------------------------

generate_pdf() {
    echo "Generating PDF with pandoc..."
    pandoc "$INPUT_FILE" \
        -o "$OUTPUT_DIR/${BASENAME}.pdf" \
        --metadata title="$REPORT_TITLE" \
        -V geometry:margin=1in \
        -V fontsize=11pt \
        -V header-includes='\usepackage{fancyhdr}\pagestyle{fancy}\fancyhead[L]{Smokestack Games}\fancyhead[R]{TPS Report}\fancyfoot[C]{\thepage}' \
        --pdf-engine=xelatex 2>/dev/null \
    || pandoc "$INPUT_FILE" \
        -o "$OUTPUT_DIR/${BASENAME}.pdf" \
        --metadata title="$REPORT_TITLE" \
        -V geometry:margin=1in \
        -V fontsize=11pt

    echo "PDF generated: $OUTPUT_DIR/${BASENAME}.pdf"
}

# --- HTML Fallback ------------------------------------------------------------

generate_html() {
    echo "pandoc not found. Generating styled HTML fallback..."

    cat > "$OUTPUT_DIR/${BASENAME}.html" <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>REPORT_TITLE_PLACEHOLDER</title>
<style>
    @page {
        margin: 1in;
        @top-center { content: "Smokestack Games - TPS Report"; font-size: 9pt; color: #666; }
        @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9pt; color: #666; }
    }
    * { box-sizing: border-box; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1a1a1a;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 1in;
        background: #fff;
    }
    h1 {
        font-size: 18pt;
        border-bottom: 3px solid #1a1a1a;
        padding-bottom: 8px;
        margin-top: 32px;
        page-break-after: avoid;
    }
    h2 {
        font-size: 14pt;
        color: #2c3e50;
        border-bottom: 1px solid #bdc3c7;
        padding-bottom: 4px;
        margin-top: 24px;
        page-break-after: avoid;
    }
    h3 {
        font-size: 12pt;
        color: #34495e;
        margin-top: 16px;
        page-break-after: avoid;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        page-break-inside: avoid;
    }
    th, td {
        border: 1px solid #bdc3c7;
        padding: 8px 12px;
        text-align: left;
    }
    th {
        background-color: #ecf0f1;
        font-weight: 600;
    }
    tr:nth-child(even) { background-color: #f9f9f9; }
    code {
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        background: #f0f0f0;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 10pt;
    }
    pre {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        overflow-x: auto;
        font-size: 10pt;
        page-break-inside: avoid;
    }
    pre code { background: none; padding: 0; }
    hr {
        border: none;
        border-top: 1px solid #ddd;
        margin: 24px 0;
    }
    .cover-logo {
        font-family: monospace;
        font-size: 8pt;
        line-height: 1.2;
        white-space: pre;
        text-align: center;
        margin: 40px 0 20px 0;
        color: #2c3e50;
    }
    .footer-note {
        font-size: 9pt;
        color: #888;
        font-style: italic;
        margin-top: 32px;
        border-top: 1px solid #ddd;
        padding-top: 8px;
    }
    @media print {
        body { padding: 0; }
        h1 { page-break-before: auto; }
        .section { page-break-inside: avoid; }
    }
</style>
</head>
<body>
BODY_PLACEHOLDER
</body>
</html>
HTMLEOF

    # Replace placeholders with actual content
    sed -i.bak "s|REPORT_TITLE_PLACEHOLDER|$REPORT_TITLE|g" "$OUTPUT_DIR/${BASENAME}.html"
    rm -f "$OUTPUT_DIR/${BASENAME}.html.bak"

    # Convert markdown to HTML body
    # Try pandoc just for markdown->html (no PDF engine needed), else basic conversion
    if command -v pandoc &> /dev/null; then
        BODY_HTML="$(pandoc "$INPUT_FILE" --to html)"
    else
        # Minimal markdown-to-HTML using sed for basic formatting
        BODY_HTML="$(sed \
            -e 's/^### \(.*\)/<h3>\1<\/h3>/' \
            -e 's/^## \(.*\)/<h2>\1<\/h2>/' \
            -e 's/^# \(.*\)/<h1>\1<\/h1>/' \
            -e 's/^---$/<hr>/' \
            -e 's/\*\*\([^*]*\)\*\*/<strong>\1<\/strong>/g' \
            -e 's/`\([^`]*\)`/<code>\1<\/code>/g' \
            -e '/^|/!s/^$/<br>/' \
            "$INPUT_FILE")"
    fi

    # Use a temp file to safely replace the placeholder
    TMPFILE="$(mktemp)"
    awk -v body="$BODY_HTML" '{gsub(/BODY_PLACEHOLDER/, body); print}' \
        "$OUTPUT_DIR/${BASENAME}.html" > "$TMPFILE"
    mv "$TMPFILE" "$OUTPUT_DIR/${BASENAME}.html"

    echo "HTML generated: $OUTPUT_DIR/${BASENAME}.html"
    echo "Open in a browser and use Print > Save as PDF for best results."
}

# --- Main ---------------------------------------------------------------------

echo "=== TPS Report Generator ==="
echo "Input:  $INPUT_FILE"
echo "Output: $OUTPUT_DIR/"
echo ""

if command -v pandoc &> /dev/null; then
    generate_pdf
else
    generate_html
fi

echo ""
echo "Done. Remember to attach the proper cover sheet."
