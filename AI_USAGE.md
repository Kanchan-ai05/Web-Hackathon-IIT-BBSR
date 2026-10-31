# AI Usage & Governance Declaration: CIT Nexus

This document strictly complies with Section 6 of the IIT Bhubaneswar Web-Hackathon guidelines and institutional compliance standards for **CIT Nexus – Smart Campus Intelligence Platform**.

---

## 1. AI Tools Used During Development
- **Coding Assistant**: Google Gemini / Antigravity Agent
  - **Purpose**: Assisted in codebase scaffolding, FastAPI endpoint structuring, Next.js UI component design, and writing unit tests.
  - **Scope Limitation**: All domain algorithms, CP-SAT scheduling constraints, data loaders, priority tiers, disruption graph resolvers, and validation logic were authored strictly as pure deterministic Python algorithms without generative AI validation.

---

## 2. In-Product AI APIs & Runtime Usage
- **Supported Models**:
  - Google Gemini (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`)
  - OpenAI (`gpt-4o-mini`, `gpt-4o`)
  - Groq / Local LLM (`llama-3.3-70b-versatile`, `mistral-large`)
- **Key Configuration**:
  - Environment variables: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`
  - In-browser UI Settings modal: Key passed via secure request headers (`X-Gemini-Key`, `X-OpenAI-Key`, `X-Groq-Key`)
- **Runtime Features & Use Cases**:
  1. **AI Campus Copilot & Natural Language Parser**:
     - Accepts conversational queries in English and Hinglish (e.g. *"Dramatics needs SH-1 Thursday 6 to 9 pm for our stage play, 130 audience"* or *"Batao kal CS-301 ki class kis room me hai?"*).
     - Extracts structured booking and search drafts (`day`, `periods`, `room_types`, `features`, `expected_attendance`).
  2. **Intelligent Venue & Booking Assistant**:
     - Provides natural language reasoning and venue options for campus clubs and faculty based on event scale, required audiovisual gear, and wheelchair accessibility.
  3. **Decision & Rejection Explainer**:
     - Translates solver output, conflict flags, and rejection reasons into clear, empathetic, human-readable explanations.
  4. **Ask Timetable AI Assistant**:
     - Answers student and faculty queries regarding schedule slots, lecture times, lunch breaks, and midsem exam rules using verified schedule facts.
  5. **Explainable Scheduling Narrative Synthesis**:
     - Converts the 5-pillar mathematical and institutional proof data into conversational summaries with an explicit disclaimer:
     > *"All hard and soft scheduling decisions are computed deterministically by the pure-Python CIT solver and validator. AI does not validate correctness."*

---

## 3. Strict Zero-Hallucination Governance & Safety Boundary

```
+-----------------------------------------------------------------------------------+
|                            CIT NEXUS AI SAFETY BOUNDARY                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   User Prompt (EN / Hinglish)                                                     |
|              |                                                                    |
|              v                                                                    |
|   [LLM / Intent Parser] (Gemini 1.5/2.0 / GPT-4o-mini / Regex Fallback)           |
|              |                                                                    |
|              v Extracts intent parameters: (day, periods, room_type, count)       |
|   [Pydantic Schema Validator] (Enforces data types & boundary ranges)             |
|              |                                                                    |
|              v                                                                    |
|   ===================== CRITICAL DETERMINISTIC BOUNDARY =====================     |
|   |                                                                         |     |
|   |   [CIT Pure-Python Solver & Validator]                                  |     |
|   |   - Verifies all 12 Hard Constraints                                    |     |
|   |   - Checks Room Capacity, Overlaps, Maintenance Locks                   |     |
|   |   - Applies Priority Hierarchy:                                         |     |
|   |     Exams > Classes > Institute > Guest > Dept > Club                   |     |
|   |   - Deterministic 0 / 1 Validation Output                               |     |
|   |                                                                         |     |
|   ===========================================================================     |
|              |                                                                    |
|              v                                                                    |
|   [Human-in-the-Loop Confirmation] (Admin / Faculty / Coordinator Approval)       |
|              |                                                                    |
|              v                                                                    |
|   [Database Commit] (SQLite + MongoDB Write)                                      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### Absolute Rules:
1. **0% LLM Decision Authority on Correctness**: An LLM is **strictly prohibited** from determining whether a schedule, room assignment, booking, or exam slot is valid or invalid.
2. **Zero Direct DB Mutations**: No LLM output may write directly to the database. All proposed slots MUST pass `backend/validator.py` and require explicit user/admin confirmation before database write.
3. **Deterministic Offline Fallback**: The manual booking forms, schedule views, conflict monitor, and disruption engine function 100% reliably with zero LLM API keys configured. If LLM provider calls time out or fail, the platform falls back to deterministic regex extractors and CP-SAT solvers with zero downtime.

---

## 4. Prompt Engineering & Execution Logs
- System prompts, few-shot examples, and schema definitions are version-controlled in `/prompts`:
  - `prompts/copilot_system.txt`: Natural language to schedule query prompt.
  - `prompts/booking_parser_prompt.txt`: Structured slot extraction from conversational text.
  - `prompts/explainer_prompt.txt`: Explanation synthesis prompt enforcing the 5-pillar constraint report.
- Every runtime prompt, completion token count, model identifier, and response payload is appended to `prompts/llm_execution_log.jsonl` with ISO 8601 timestamps for transparent auditability.
