# AI Services

Symptom analysis, triage severity, specialist recommendation, and booking priority input.

## Modules

| Folder | Role |
|--------|------|
| `symptom-scanner/` | Parse symptoms + free text |
| `triage/` | Severity level for priority queue |
| `risk-prediction/` | Health risk score |
| `models/` | LLM / local model adapters |
| `prompts/` | Prompt templates |

## Run

`npm run ai:dev` — default port **4002**
