"""Citation linter for the playgrounds portfolio.

Parses docs/CITATIONS.bib for the (custom) chapter_index field on each entry,
walks every playgrounds/*/spec.md looking for citations of the form
  "Strogatz Section 10.4"
  "Newman Exercise 8.15"
  "Carroll Section 5.4"
  "Hartle Section 9.3"
and asserts that the subsection number appears in the matching bib entry's
chapter_index.

Exit code 0 if every cited subsection is verified.
Exit code 1 if any unsupported citation is found.

Writes citation-lint.json at the project root, keyed by playground.

Usage:
  uv run python scripts/py/lint_citations.py
  uv run python scripts/py/lint_citations.py --json out.json
  uv run python scripts/py/lint_citations.py --quiet
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import bibtexparser


ROOT = Path(__file__).resolve().parents[2]
BIB_PATH = ROOT / "docs" / "CITATIONS.bib"
PLAYGROUNDS_DIR = ROOT / "playgrounds"

AUTHOR_TO_KEY: dict[str, str] = {
    "strogatz":          "strogatz2015",
    "newman-barkema":    "newmanbarkema1999",
    "newman barkema":    "newmanbarkema1999",
    "newman":            "newman2013",
    "krauth":            "krauth2006",
    "carroll":           "carroll2019",
    "hartle":            "hartle2003",
    "mackay":            "mackay2003",
    "bishop":            "bishopbishop2024",
    "murphy vol 1":      "murphypml1",
    "murphy vol 2":      "murphypml2",
    "murphy pml 1":      "murphypml1",
    "murphy pml 2":      "murphypml2",
    "robert-casella":    "robertcasella2004",
    "robert and casella":"robertcasella2004",
    "gelman":            "gelman2013",
    "leveque":           "leveque2007",
    "trefethen":         "trefethen2000",
    "taflove":           "taflove2005",
    "boyd-vandenberghe": "boydvandenberghe2004",
    "boyd and vandenberghe": "boydvandenberghe2004",
    "hastie":            "hastietibshirani2009",
    "htf":               "hastietibshirani2009",
    "binney-tremaine":   "binneytremaine2008",
    "binney and tremaine":"binneytremaine2008",
}


@dataclass
class CitationClaim:
    author_or_title: str
    section: str
    bib_key: str | None
    line: int
    raw: str


@dataclass
class Finding:
    playground: str
    claim: CitationClaim
    verdict: str            # "OK" | "MISCITED-SUBSECTION" | "UNKNOWN-BIB-KEY"
    note: str = ""


def parse_chapter_index(field_value: str) -> set[str]:
    """Extract subsection numbers from a chapter_index field body."""
    out: set[str] = set()
    for line in field_value.splitlines():
        line = line.strip().rstrip(";")
        if not line:
            continue
        if ":" not in line:
            continue
        head = line.split(":", 1)[0].strip()
        head = head.lstrip(", ")
        if re.match(r"^[0-9]+(\.[0-9A-Za-z]+)*$", head):
            out.add(head)
    return out


def load_bib() -> tuple[dict[str, dict], dict[str, set[str]]]:
    """Parse the bib file and return (entries by key, chapter_index by key)."""
    with BIB_PATH.open("r", encoding="utf-8") as f:
        raw = f.read()
    parser = bibtexparser.bparser.BibTexParser(common_strings=False)
    db = bibtexparser.loads(raw, parser=parser)
    entries: dict[str, dict] = {e["ID"]: e for e in db.entries}

    chapter_index: dict[str, set[str]] = {}
    entry_re = re.compile(r"@\w+\{([^,\s]+)\s*,", re.MULTILINE)
    starts = [(m.group(1), m.start()) for m in entry_re.finditer(raw)]
    starts.append(("__END__", len(raw)))
    for i in range(len(starts) - 1):
        key, s = starts[i]
        e = starts[i + 1][1]
        body = raw[s:e]
        match = re.search(r"chapter_index\s*=\s*\{(.*?)\}", body, re.DOTALL)
        if match:
            chapter_index[key] = parse_chapter_index(match.group(1))
        else:
            chapter_index[key] = set()
    return entries, chapter_index


CITE_RE = re.compile(
    r"([A-Za-z][A-Za-z\- ]+?)\s+(?:Section|Sections|Sec\.|Ch\.|Chapter|Exercise|Ex\.|Eq\.)\s+([0-9]+(?:\.[0-9A-Za-z]+)?)",
    re.IGNORECASE,
)


def resolve_bib_key(author_or_title: str) -> str | None:
    text = author_or_title.strip().lower()
    for needle in sorted(AUTHOR_TO_KEY.keys(), key=len, reverse=True):
        if needle in text:
            return AUTHOR_TO_KEY[needle]
    return None


def scan_spec(path: Path) -> list[CitationClaim]:
    claims: list[CitationClaim] = []
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            for m in CITE_RE.finditer(line):
                author = m.group(1).strip()
                section = m.group(2).strip()
                bib_key = resolve_bib_key(author)
                claims.append(CitationClaim(
                    author_or_title=author,
                    section=section,
                    bib_key=bib_key,
                    line=i,
                    raw=m.group(0),
                ))
    return claims


def evaluate(claims: list[CitationClaim], chapter_index: dict[str, set[str]]) -> list[Finding]:
    out: list[Finding] = []
    for c in claims:
        if c.bib_key is None:
            out.append(Finding(playground="", claim=c, verdict="UNKNOWN-BIB-KEY",
                              note=f"could not resolve '{c.author_or_title}' to a bib key"))
            continue
        index = chapter_index.get(c.bib_key, set())
        if c.section in index:
            out.append(Finding(playground="", claim=c, verdict="OK"))
        elif not index:
            out.append(Finding(playground="", claim=c, verdict="MISCITED-SUBSECTION",
                              note=f"{c.bib_key} has no chapter_index; cannot verify {c.section}"))
        else:
            out.append(Finding(playground="", claim=c, verdict="MISCITED-SUBSECTION",
                              note=f"{c.bib_key} chapter_index missing {c.section}"))
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--json", default="citation-lint.json", help="Output JSON path")
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args(argv)

    _entries, chapter_index = load_bib()

    out_by_pg: dict[str, list[dict]] = {}
    fail = False
    for spec in sorted(PLAYGROUNDS_DIR.glob("*/spec.md")):
        playground = spec.parent.name
        if playground == "_template":
            continue
        claims = scan_spec(spec)
        findings = evaluate(claims, chapter_index)
        for f in findings:
            f.playground = playground
        out_by_pg[playground] = [
            {
                "line": f.claim.line,
                "raw":  f.claim.raw,
                "author_or_title": f.claim.author_or_title,
                "section": f.claim.section,
                "bib_key": f.claim.bib_key,
                "verdict": f.verdict,
                "note":    f.note,
            }
            for f in findings
        ]
        if not args.quiet:
            print(f"== {playground}")
            for f in findings:
                marker = "OK " if f.verdict == "OK" else "ERR"
                line = f"  {marker} L{f.claim.line:4d}  {f.claim.author_or_title!r} sec {f.claim.section}"
                if f.verdict != "OK":
                    line += f"  [{f.verdict}: {f.note}]"
                    fail = True
                print(line)

    out_path = ROOT / args.json
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(out_by_pg, f, indent=2)

    if not args.quiet:
        print(f"wrote {out_path}")
        print("PASS" if not fail else "FAIL")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
