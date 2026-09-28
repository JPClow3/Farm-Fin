# Mistral invoice OCR reliability

The active Farm-Fin invoice reader uses Mistral OCR followed by Mistral chat extraction. This change keeps that production flow and adds a JSON schema, OCR page confidence, and deterministic review checks. Missing dates, amounts, and installments remain unknown rather than being replaced with invented values. The API returns `review.required` and field-specific `review.issues`; the UI shows them above the extracted invoice and includes them in exported JSON.

## Live comparison, 2026-09-28

Run `npm run benchmark:ocr` with a locally supplied `MISTRAL_API_KEY` to compare the production two-call path with OCR document annotations. The benchmark uses two committed, one-page sample PDFs and checks invoice number, issue date, supplier document, recipient document, due date, and total. It does not print the source documents or the key.

| Sample | Flow       | Checked fields | Classification |  Time | Calls | OCR page confidence |
| ------ | ---------- | -------------: | -------------- | ----: | ----: | ------------------: |
| Diesel | OCR + chat |            6/6 | Present        | 4.5 s |     2 |               0.976 |
| Diesel | Annotation |            6/6 | Present        | 5.8 s |     1 |               0.976 |
| Parts  | OCR + chat |            6/6 | Present        | 4.7 s |     2 |               0.983 |
| Parts  | Annotation |            6/6 | Missing        | 7.5 s |     1 |               0.983 |

The sample PDFs intentionally use invalid placeholder CPF/CNPJ values. The reviewer flagged them in both flows. A high page confidence score therefore does not establish that invoice fields are valid. The annotation flow also missed expense classification on the parts sample, so it is not promoted to production.

At Mistral's listed prices on this date, OCR 4.1 is $4/1,000 pages and Document AI with annotations is $5/1,000 pages. The baseline's observed `mistral-medium-latest` usage was 1,624 input / 324 output tokens for Diesel and 2,604 input / 365 output tokens for Parts. With Medium 3.5 list rates of $1.50/M input and $7.50/M output, the estimated baseline cost is about $0.0089 and $0.0106 per file, versus about $0.005 per annotated page. These are list-price estimates, not billing receipts. See [OCR pricing](https://docs.mistral.ai/models/ocr-4-1) and [model pricing](https://docs.mistral.ai/inference/pricing).

These two clean, synthetic PDFs are a smoke comparison, not an accuracy benchmark for scanned, rotated, multipage, or real supplier documents. Before switching methods, add redacted real examples with verified expected values, compare field-level accuracy and review rate, and repeat across model updates. Keep human review for flagged fields. Mistral documents [confidence scores](https://docs.mistral.ai/studio/document-processing/basic_ocr) and [document annotations](https://docs.mistral.ai/studio/document-processing/annotations); neither replaces value validation.
