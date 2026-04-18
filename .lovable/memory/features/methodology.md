---
name: AI Protocol Generation Methodology
description: Rules for AI-generated training/diet protocols using GPT-5 via Lovable AI Gateway
type: feature
---
- Protocol generation uses openai/gpt-5 via Lovable AI Gateway (generate-protocol edge function)
- Model choice: GPT-5 chosen over Gemini Flash because user explicitly prioritizes ASSERTIVENESS over speed (deeper reasoning to analyze body assessment + injuries + posture before prescribing each exercise)
- AbortSignal.timeout(180000) — up to 3 min hard cap; UI timer shows up to 4 min
- Onboarding shows real elapsed counter up to 4 min with stage labels reflecting the analysis flow (perfil → lesões/desvios → exercícios seguros → pontos fracos → macros → refinamentos)
- System prompt enforces a mandatory PRESCRIPTION CHECKLIST: read assessment → read injuries → prioritize weak points → correct posture deviations → build split → validate each exercise for THIS specific person
- INJURY ADAPTATIONS table in prompt: lombar/joelho/ombro/cotovelo/punho/cervical/quadril → exercises to remove + safe substitutes
- POSTURE DEVIATION ADAPTATIONS: hipercifose, hiperlordose, joelho valgo, pescoço anteriorizado, escápula alada → which exercises to prioritize/avoid
- response_format: json_object to guarantee valid JSON
- Body assessment (photo analysis) results feed into protocol generation as weak point prioritization AND posture-based contraindications
- Fallback: if AI fails, local generateProtocol() rule-based engine is used
- Exercise bank (138 items) and food DB (TACO ~600 items) available — prompt embeds curated list to maintain consistency
