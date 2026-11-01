import unittest

from app.reviewer import _extract_json, _normalise_review


class ReviewParsingTests(unittest.TestCase):
    def test_extracts_json_fenced_in_markdown(self):
        parsed = _extract_json('```json\n{"risk_level":"low","findings":[]}\n```')
        self.assertEqual(parsed["risk_level"], "low")

    def test_normalises_severity_and_clamps_line_numbers(self):
        summary, findings = _normalise_review(
            {
                "overall": "A review.",
                "risk_level": "high",
                "findings": [
                    {
                        "severity": "URGENT",
                        "category": "security",
                        "title": "Unsafe query",
                        "line": 999,
                        "end_line": 2,
                        "description": "Dynamic SQL.",
                        "recommendation": "Use parameters.",
                    }
                ],
            },
            "a\nb\nc",
        )
        self.assertEqual(summary["risk_level"], "high")
        self.assertEqual(findings[0]["severity"], "info")
        self.assertEqual(findings[0]["line"], 3)
        self.assertEqual(findings[0]["end_line"], 3)

    def test_empty_findings_are_valid(self):
        summary, findings = _normalise_review({"findings": []}, "print('ok')")
        self.assertEqual(findings, [])
        self.assertEqual(summary["risk_level"], "low")


if __name__ == "__main__":
    unittest.main()
