---
name: AI Protocol Generation Methodology
description: Rules for AI-generated training/diet protocols using Gemini 2.5 Flash via Lovable AI Gateway
type: feature
---
- Protocol generation uses google/gemini-2.5-flash via Lovable AI Gateway (generate-protocol edge function)
- Model choice: Gemini Flash chosen over gpt-5-mini because gpt-5-mini exceeded the 150s edge timeout on this large prompt (~160s). Flash returns in ~20-40s with comparable JSON quality.
- Uses response_format: json_object to guarantee valid JSON
- AbortSignal.timeout(130000) as defensive cap before edge runtime kills the request
- System prompt contains full methodology: training splits, volume by level, exercise selection, BMR/TDEE calc, macros, carb front loading, food filtering
- Body assessment (photo analysis) results feed into protocol generation as weak point prioritization
- Fallback: if AI fails, local generateProtocol() rule-based engine is used
- Exercise bank and food DB are embedded in the system prompt to maintain consistency
