"""Unit tests for scripts/py/lint_citations.py."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Make the parent dir (scripts/py) importable.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lint_citations import (  # noqa: E402
    parse_chapter_index,
    resolve_bib_key,
    scan_spec,
    evaluate,
    CITE_RE,
)


def test_parse_chapter_index_basic():
    body = """
        10.1: Fixed Points and Cobwebs;
        10.2: Logistic Map: Numerics;
        10.5: Liapunov Exponent
    """
    out = parse_chapter_index(body)
    assert out == {"10.1", "10.2", "10.5"}


def test_parse_chapter_index_handles_integer_only_keys():
    body = "5: Order and disorder in spin systems"
    out = parse_chapter_index(body)
    assert "5" in out


def test_resolve_bib_key_prefers_longest_match():
    assert resolve_bib_key("Newman Barkema") == "newmanbarkema1999"
    assert resolve_bib_key("Newman") == "newman2013"
    assert resolve_bib_key("Strogatz") == "strogatz2015"
    assert resolve_bib_key("Carroll") == "carroll2019"
    assert resolve_bib_key("MacKay") == "mackay2003"


def test_resolve_bib_key_unknown_returns_none():
    assert resolve_bib_key("XX-unknown-author") is None


def test_cite_re_matches_section_form():
    m = CITE_RE.search("Strogatz Section 10.5 Liapunov Exponent")
    assert m is not None
    assert m.group(2) == "10.5"


def test_cite_re_matches_exercise_form():
    m = CITE_RE.search("Newman Exercise 8.15")
    assert m is not None
    assert m.group(2) == "8.15"


def test_evaluate_accepts_valid_subsection(tmp_path):
    spec = tmp_path / "spec.md"
    spec.write_text("blah blah Strogatz Section 10.5 Liapunov Exponent blah\n")
    claims = scan_spec(spec)
    chapter_index = {"strogatz2015": {"10.5", "10.6"}}
    findings = evaluate(claims, chapter_index)
    assert len(findings) == 1
    assert findings[0].verdict == "OK"


def test_evaluate_rejects_missing_subsection(tmp_path):
    spec = tmp_path / "spec.md"
    spec.write_text("Strogatz Section 9.9 not in the index\n")
    claims = scan_spec(spec)
    chapter_index = {"strogatz2015": {"10.5", "10.6"}}
    findings = evaluate(claims, chapter_index)
    assert findings[0].verdict == "MISCITED-SUBSECTION"


def test_evaluate_rejects_when_chapter_index_empty(tmp_path):
    spec = tmp_path / "spec.md"
    spec.write_text("Strogatz Section 10.5\n")
    claims = scan_spec(spec)
    chapter_index = {"strogatz2015": set()}
    findings = evaluate(claims, chapter_index)
    assert findings[0].verdict == "MISCITED-SUBSECTION"
    assert "no chapter_index" in findings[0].note


def test_evaluate_rejects_unknown_bib_key(tmp_path):
    spec = tmp_path / "spec.md"
    spec.write_text("Unknown-Author Section 1.1 hello\n")
    claims = scan_spec(spec)
    findings = evaluate(claims, {})
    # The unknown author maps to None bib_key in this case.
    assert findings[0].verdict in ("UNKNOWN-BIB-KEY", "MISCITED-SUBSECTION")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
