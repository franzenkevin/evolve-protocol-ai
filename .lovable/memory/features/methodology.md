---
name: AI Protocol Generation Methodology
description: Rules for AI-generated training/diet protocols using GPT-5-mini via Lovable AI Gateway
type: feature
---
- Protocol generation uses OpenAI GPT-5-mini via Lovable AI Gateway (generate-protocol edge function)
- System prompt contains full methodology: training splits, volume by level, exercise selection, BMR/TDEE calc, macros, carb front loading, food filtering
- Body assessment (photo analysis) results feed into protocol generation as weak point prioritization
- Fallback: if AI fails, local generateProtocol() rule-based engine is used
- Exercise bank and food DB are embedded in the system prompt to maintain consistency
- User's methodology preferences are encoded in the system prompt, not hardcoded in client code
