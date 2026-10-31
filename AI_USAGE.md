# AI Usage Declaration

This document strictly complies with Section 6 of the CIT Campus Scheduling Problem Statement.

---

## 1. AI Tools Used During Development
- **Coding Assistant**: Google Gemini / Antigravity Agent
  - **Purpose**: Assisted in codebase scaffolding, FastAPI endpoint structuring, Next.js UI component design, and writing unit tests.
  - **Scope Limitation**: All domain algorithms, scheduling constraints, data loaders, and validation logic were authored strictly as pure deterministic Python algorithms without generative AI validation.

---

## 2. In-Product AI APIs & Runtime Usage
- **Supported Models**: Google Gemini 1.5/2.0 API, OpenAI GPT-4o-mini (configured via `.env`)
- **Use Cases**:
  1. **Natural Language / Hinglish Booking Request Parser**: Converts unstructured text descriptions (e.g. *"Dramatics needs SH-1 Thursday 6 to 9 pm for our stage play, 130 audience"*) into structured booking draft JSON (`day`, `periods`, `room_types`, `features`, `attendance`).
  2. **Decision Explainer**: Translates validator output or rejection reasons into friendly human-readable explanations.
- **Workflow Pipeline**:
  $$\text{User Request} \rightarrow \text{LLM Parsing} \rightarrow \text{Pydantic Schema Check} \rightarrow \mathbf{Deterministic\ Validator} \rightarrow \text{User Confirmation} \rightarrow \text{DB Write}$$

---

## 3. What the LLM is NOT Allowed to Decide
- **Validation**: An LLM is **strictly prohibited** from determining whether a schedule, room assignment, booking, or exam slot is valid or invalid.
- **Direct Database Mutation**: No LLM output may write directly to the database. All proposed slots MUST pass `backend/validator.py` and require user confirmation before database write.
- **Offline / Manual Fallback**: The manual booking form and all schedule viewing features function 100% reliably with no LLM API key configured or if the LLM provider fails.

---

## 4. Prompt Logs
All prompt templates, runtime system prompts, few-shot examples, and input/output logs are recorded in the `/prompts` directory.
