# SRISHTI · AI — Hybrid Evidence-First Nearby Wells Intelligence System

> **Smart India Hackathon 2026 · Problem Statement SIH26121**  
> **Oil India Limited · Category: Software · Theme: Smart Automation**  
> *"सृष्टि — Every Well Drilled Teaches the Next One. We Ensure Nothing Is Ever Forgotten."*

SRISHTI·AI is a **Hybrid Decision-Support & Institutional Memory System** designed for Oil India Limited (eRTMAC). It eliminates repeated drilling hazards (stuck pipes, kicks, lost circulation) across Upper Assam oilfields by fusing **Large Language Model reasoning** with **deterministic, zero-hallucination Python math and safety tools**, backed by an **automatic offline air-gapped fallback**.

---

## ⚡ What Makes It "Hybrid"?

In mission-critical oil well drilling, pure LLMs hallucinate numbers and pure rule engines are rigid. SRISHTI·AI unites both:

```
                      [ User Query (English / Hindi) ]
                                    │
                                    ▼
                     ╔══════════════════════════════╗
                     ║    HYBRID AGENT ORCHESTRATOR ║
                     ║   (Groq / OpenAI / Gemini /  ║
                     ║    Local Ollama Air-Gap)     ║
                     ╚══════════════╦═══════════════╝
                                    ║
                 Decides to invoke verified engineering tools
                                    ║
                                    ▼
                     ╔══════════════════════════════╗
                     ║  DETERMINISTIC PYTHON TOOLS  ║
                     ║  (Zero-Hallucination Math)   ║
                     ╠══════════════════════════════╣
                     ║ 1. Haversine Spatial Math    ║  --> Exact km distance
                     ║ 2. Formation Geo Profile     ║  --> Verified lithology
                     ║ 3. Depth Hazard Corridors    ║  --> Exact ±50m horizons
                     ║ 4. OISD Standard Procedures  ║  --> OISD-STD-174 rules
                     ║ 5. WCR/DDR Audit Citations   ║  --> Exact PDF page links
                     ╚══════════════╦═══════════════╝
                                    ║
                      Verified facts returned to LLM
                                    ║
                                    ▼
                     [ Final Grounded Multilingual Answer ]
                                    │
   (If internet drops or no API key is provided, seamlessly falls back
     to the built-in Deterministic Rule Engine — ZERO errors, ZERO crashes!)
```

---

## 🚀 Supported AI Providers & Setup

You can run SRISHTI·AI in 5 different modes:

| Provider | Model | Setup | Best For |
|---|---|---|---|
| **Deterministic Local (Default)** | Built-in Rule Engine | **Zero API key needed!** | 100% offline hackathon pitches, airplane mode, zero cost |
| **Groq Cloud (Recommended Free Tier)** | `llama-3.3-70b-versatile` | `GROQ_API_KEY=gsk_...` | Lightning-fast 500 tokens/sec, multilingual, free tier |
| **OpenAI** | `gpt-4.1-mini` / `gpt-4o-mini` | `OPENAI_API_KEY=sk-...` | Enterprise reasoning & structured schema outputs |
| **Google Gemini** | `gemini-1.5-flash` | `GEMINI_API_KEY=...` | Generous free tier via OpenAI-compatible endpoint |
| **Ollama (On-Premise Air-Gap)** | `qwen2.5:7b` | `OLLAMA_BASE_URL=http://localhost:11434/v1` | 100% local rig server deployment without internet (Oil India data sovereignty) |

---

## 🛠️ The 6 Deterministic Python Math & Domain Tools

Located in [`backend/agents/tools.py`](./backend/agents/tools.py):

1. **`calculate_distance(lat1, lon1, lat2, lon2)`**: Exact spherical Haversine distance math on WGS84 coordinates.
2. **`find_nearby_wells(lat, lon, radius_km)`**: Geospatial offset well search across Moran, Naharkatiya, Baghjan, and Duliajan.
3. **`get_formation_hazard_profile(formation_name)`**: Lithological properties, average ROP, drill days, and primary hazards for Assam formations (Alluvium, Dhekiajuli, Girujan Clay, Tipam Sandstone, Barail Group, Basement).
4. **`check_active_hazard_horizon(target_well_id, current_depth_md)`**: Proactive forward lookahead checking upcoming hazard horizons in the next 50m to 250m.
5. **`get_oisd_standard_mitigation(hazard_type)`**: Step-by-step emergency procedures from OISD-STD-174 (Well Control) and OISD-GDN-182 (Stuck Pipe).
6. **`retrieve_evidence_citations(formation, event_type, well_id)`**: Auditable source document names (e.g. `WCR_Moran_7.pdf`), exact page numbers, and Chief Engineer sign-offs.

---

## 🖥️ Screen-by-Screen Dashboard Architecture

1. **Geospatial Well Map (`/map`)**: 3D spatial radius dial (1-25km) to discover offset wells and their subsurface paths.
2. **Well Intelligence Dossier (`/well/:id`)**: Complete 360° record of any historical well with exact WCR PDF page citations.
3. **Multi-Well Offset Comparison (`/compare`)**: Side-by-side stratigraphic and parameter curves across offset wells.
4. **Drilling Knowledge Graph (`/knowledge`)**: 5-tier concentric SVG knowledge graph linking Wells → Formations → Hazards → Solutions.
5. **Real-Time Proactive Alert Console (`/alerts`)**: Early warning radar triggered 50-100m before the bit enters historical problem zones.
6. **Bilingual AI Companion (`/ask`)**: English & Hindi conversational assistant grounded strictly by tool citations.
7. **Formation Analytics (`/analytics`)**: Basin-wide statistical breakdown of drill times, ROP, and hazard frequencies.
8. **Document Ingestion (`/ingest`)**: VLM and OCR intake queue with SHA-256 deduplication and engineer review workflows.
9. **AI Well Program Builder (`/report`)**: Auto-generates pre-spud offset evidence briefs and mud weight recommendations.
10. **Driller Doghouse Terminal (`/doghouse`)**: Ruggedized, high-contrast touchscreen terminal with 48px glove-friendly touch buttons.

---

## 🏃 Quickstart: Running Locally

### 1. Backend (FastAPI Python)
```powershell
cd srishti-ai
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
* API Documentation: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

### 2. Frontend (Next.js 15)
```powershell
cd srishti-ai/frontend
npm install
npm run dev
```
* Web Application: `http://localhost:3000`

---

## 🔒 Safety & Data Sovereignty

* **Advisory Boundary**: SRISHTI·AI is a decision-support advisory platform. All outputs are advisory and must be verified against approved programs by qualified drilling superintendents.
* **Sovereign Air-Gap**: Oil India drilling data never leaves the local perimeter when running in deterministic or local Ollama mode.
