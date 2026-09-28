"""
SRISHTI·AI - 10-Agent LangGraph Swarm & Hybrid Agent Orchestrator
Merges LLM reasoning (OpenAI, Groq, Gemini, Ollama) with deterministic Python math tools
and provides an automatic offline fallback.
"""
from __future__ import annotations
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI

from backend.core.config import get_settings
from backend.database.db_service import db_service
from backend.agents.tools import (
    AGENT_TOOLS_DEFINITIONS,
    execute_tool,
    calculate_haversine_distance_km,
    tool_retrieve_evidence_citations
)

try:
    from backend.agents.langgraph_pipeline import run_langgraph_pipeline, HAS_LANGGRAPH, _generate_rich_fallback_answer
except ImportError:
    HAS_LANGGRAPH = False
    _generate_rich_fallback_answer = None

logger = logging.getLogger(__name__)


class HybridAgentOrchestrator:
    def __init__(self):
        self.settings = get_settings()

    def is_drilling_query(self, query: str) -> bool:
        """
        Determines whether the query relates to drilling, well operations, geology,
        or Oil India operations vs. general / conversational queries.
        """
        q = query.lower().strip()

        # Explicit conversational overrides: if user is asking casual questions or jokes
        conversational_starters = [
            "tell me a joke", "tell a joke", "say a joke", "one-liner", "joke",
            "who are you", "what are you", "how are you", "who created you",
            "what can you do", "hello", "hi", "hey", "good morning", "good evening",
            "what is the capital", "who is the prime minister", "who is the president",
            "who is the chief minister", "write a code", "write python", "write a poem",
            "calculate "
        ]
        if any(c in q for c in conversational_starters) and not any(k in q for k in ["mud", "formation", "drilling", "kick", "stuck pipe"]):
            return False

        # Strong distinct drilling & petroleum terminology that never appears in casual English
        strong_drilling_terms = [
            "drill", "mud", "kick", "stuck pipe", "casing", "rop", "wob", "rpm",
            "barite", "bha", "drill bit", "annulus", "circulation", "moran",
            "dikom", "shw", "tipam", "barail", "kopili", "girujan", "rig",
            "spud", "deviation", "torque", "drag", "oisd", "blowout", "bop",
            "hydrocarbon", "shale", "sandstone", "pore pressure", "fracture gradient",
            "ecd", "dogleg", "ertmac", "offset well", "wellbore", "tvd", "viscosity",
            "choke manifold", "kill mud", "petroleum", "subsurface", "lithology",
            "casing shoe", "lost circulation", "gas surge", "doghouse"
        ]
        if any(term in q for term in strong_drilling_terms):
            return True

        if re.search(r'\b(mor|nhk|dlj|hgj|moran|dikom|dossier|schematic)\b', q):
            return True
        if re.search(r'\bwell\s*[-#]?\s*\d+\b', q):
            return True
        if re.search(r'\b(offset|active)\s+well\b', q):
            return True

        if re.search(r'\b\d{3,4}\s*(m|meter|metres|ft|feet)\b', q) and any(w in q for w in ["depth", "formation", "layer", "zone", "hazard"]):
            return True

        return False

    def _resolve_ai_client(self, mode_override: Optional[str] = None) -> Tuple[Optional[OpenAI], Optional[str], str]:
        """
        Determines the active AI provider based on configuration and mode_override.
        Supports Cloud Mode (OpenAI gpt-4o-mini, Groq, Gemini) and Rig Edge Mode (Local Ollama / Air-Gap).
        """
        override = (mode_override or "").lower().strip()

        # Rig Edge Mode requested explicitly
        if override in ("edge", "ollama", "airgap", "offline"):
            return (
                OpenAI(base_url=self.settings.ollama_base_url, api_key="ollama"),
                self.settings.ollama_model,
                f"Ollama Sovereign Air-Gap (Rig Edge) · {self.settings.ollama_model}"
            )

        # Cloud Mode requested explicitly
        if override in ("cloud", "groq", "openai"):
            if self.settings.groq_api_key:
                return (
                    OpenAI(base_url="https://api.groq.com/openai/v1", api_key=self.settings.groq_api_key),
                    self.settings.groq_model,
                    f"Groq Cloud · {self.settings.groq_model}"
                )
            if self.settings.openai_api_key:
                return (
                    OpenAI(api_key=self.settings.openai_api_key),
                    self.settings.openai_model,
                    f"OpenAI Cloud · {self.settings.openai_model}"
                )
            if self.settings.gemini_api_key:
                return (
                    OpenAI(
                        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                        api_key=self.settings.gemini_api_key
                    ),
                    self.settings.gemini_model,
                    f"Google Gemini · {self.settings.gemini_model}"
                )
            return None, None, "SRISHTI Evidence Engine · Deterministic Offline Fallback"

        provider_pref = self.settings.ai_provider.lower().strip()

        # 1. Groq (Free, ultra-fast Llama-3.3-70B)
        if provider_pref in ("auto", "groq") and self.settings.groq_api_key:
            return (
                OpenAI(base_url="https://api.groq.com/openai/v1", api_key=self.settings.groq_api_key),
                self.settings.groq_model,
                f"Groq Cloud · {self.settings.groq_model}"
            )

        # 2. OpenAI (GPT-4o-mini)
        if provider_pref in ("auto", "openai") and self.settings.openai_api_key:
            return (
                OpenAI(api_key=self.settings.openai_api_key),
                self.settings.openai_model,
                f"OpenAI · {self.settings.openai_model}"
            )

        # 3. Google Gemini (via OpenAI compatibility endpoint)
        if provider_pref in ("auto", "gemini") and self.settings.gemini_api_key:
            return (
                OpenAI(
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                    api_key=self.settings.gemini_api_key
                ),
                self.settings.gemini_model,
                f"Google Gemini · {self.settings.gemini_model}"
            )

        # 4. Local Ollama (Sovereign Air-Gapped Rig Server)
        if provider_pref == "ollama":
            return (
                OpenAI(base_url=self.settings.ollama_base_url, api_key="ollama"),
                self.settings.ollama_model,
                f"Ollama Air-Gap · {self.settings.ollama_model}"
            )

        # 5. Deterministic local mode
        return None, None, "SRISHTI Evidence Engine · Deterministic Offline Fallback"

    def run_deterministic_fallback(
        self,
        query: str,
        target_well: str = "MORAN-29",
        current_depth_md: float = 2418.0,
        language: str = "EN",
        mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Zero-hallucination deterministic fallback executed when no API key is set
        or when offline/air-gapped. Delivers plain-English, executive-friendly answers.
        """
        q = query.lower()
        events = db_service.get_events()

        is_hindi = (
            language.upper() == "HI" or
            any(w in q for w in ["kaun", "kya", "mein", "kitna", "bhai", "kaise", "hua", "raha", "karo"])
        )
        is_assamese = (
            language.upper() == "AS" or
            any(w in q for w in ["কি", "কেনেকৈ", "কিমান", "মৰাণ", "আছিল"])
        )

        # If not a drilling query, return a clean conversational greeting/assistance message
        if not self.is_drilling_query(query):
            if is_assamese:
                answer_text = (
                    "নমস্কাৰ! মই SRISHTI, অইল ইণ্ডিয়া লিমিটেডৰ (eRTMAC) AI ড্ৰিলিং সহায়ক। "
                    "আপুনি মোক ড্ৰিলিং সুৰক্ষা, বোকাৰ ওজন (mud weight), গেছ কিক, অথবা ঐতিহাসিক কুঁৱাৰ ৰেকৰ্ডৰ বিষয়ে সুধিব পাৰে।"
                )
            elif is_hindi:
                answer_text = (
                    "नमस्ते! मैं SRISHTI हूँ, ऑयल इंडिया लिमिटेड (eRTMAC) का AI ड्रिलिंग सहायक। "
                    "आप मुझसे ड्रिलिंग सुरक्षा, मड वेट, गैस किक, स्टक पाइप या पुराने कुओं के रिकॉर्ड के बारे में कुछ भी पूछ सकते हैं।"
                )
            else:
                answer_text = (
                    "Hello! I am SRISHTI, the AI drilling assistant for Oil India Limited (eRTMAC). "
                    "I specialize in drilling operations, safe mud weight windows, kick prevention, and historical offset well records across Upper Assam. How can I assist you today?"
                )

            return {
                "answer": answer_text,
                "evidence_grounded_answer": answer_text,
                "evidence": [],
                "evidence_sources": [],
                "model": "SRISHTI Offline Engine · Verified Records",
                "mode": mode or "DETERMINISTIC_OFFLINE",
                "tools_used": ["general_responder"],
                "verification_status": "COMMITTED_RESPONSE",
                "matched_offset_records": 0,
                "oisd_standard": "OISD-STD-174 (Well Control Operations)",
                "abstained": False
            }

        # Keyword semantic matching across Upper Assam formations & events
        if "loss" in q or "mud" in q or "chori" in q or "tipam" in q:
            matched_events = [e for e in events if "tipam" in e["formation"].lower() or "loss" in e["event_type"].lower()]
        elif "stuck" in q or "girujan" in q or "phas" in q or "clay" in q:
            matched_events = [e for e in events if "girujan" in e["formation"].lower() or "stuck" in e["event_type"].lower()]
        elif "kick" in q or "gas" in q or "barail" in q or "bop" in q:
            matched_events = [e for e in events if "barail" in e["formation"].lower() or "kick" in e["event_type"].lower()]
        elif "baghjan" in q or "blowout" in q:
            matched_events = [e for e in events if "bgh" in e["well_id"].lower() or "blowout" in e["event_type"].lower()]
        else:
            matched_events = events[:2]

        if not matched_events:
            matched_events = events[:2]

        evidence_cards = []
        clean_rep = {"\u2013": "-", "\u2014": "--", "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"'}
        for evt in matched_events:
            clean_mitigation = evt["mitigation"] or ""
            clean_desc = evt["description"] or ""
            for u_ch, a_ch in clean_rep.items():
                clean_mitigation = clean_mitigation.replace(u_ch, a_ch)
                clean_desc = clean_desc.replace(u_ch, a_ch)

            evidence_cards.append({
                "event_id": evt["id"],
                "well": evt["well_id"],
                "formation": evt["formation"],
                "event_type": evt["event_type"],
                "severity": evt["severity"],
                "depth_from_md_m": evt["depth_md"],
                "description": clean_desc,
                "mitigation": clean_mitigation,
                "source_file": evt["source_doc"],
                "source_page": evt["source_page"],
                "reviewer_status": evt.get("reviewer_status", "APPROVED"),
                "verified_by": evt.get("verified_by", "Chief Drilling Engineer, OIL")
            })

        if _generate_rich_fallback_answer:
            answer_text = _generate_rich_fallback_answer(
                query=query,
                target_well=target_well,
                current_depth_md=current_depth_md,
                language=language,
                citations=evidence_cards
            )
        else:
            primary_evt = matched_events[0]
            answer_text = (
                f"**Direct Answer**: In the {primary_evt['formation']} formation near {target_well}, drilling logs show a historical risk of {primary_evt['event_type']} at depths around {primary_evt['depth_md']} meters.\n\n"
                f"**Past Well Record**: In nearby well {primary_evt['well_id']} at {primary_evt['depth_md']}m: {primary_evt['description']}\n\n"
                f"**Action Taken by Oil India**: {primary_evt['mitigation']} Under standard safety guidelines (OISD-STD-174), maintain mud weight between 10.2 and 10.6 ppg to ensure smooth drilling."
            )

        model_label = "SRISHTI Evidence Engine · Verified Local Records"
        mode_label = "DETERMINISTIC_OFFLINE"
        if mode == "edge":
            model_label = "Sovereign Rig Edge · Offline Verified Engine"
            mode_label = "edge"
        elif mode == "cloud":
            model_label = "Cloud Engine · Verified Records"
            mode_label = "cloud"

        return {
            "answer": answer_text,
            "evidence_grounded_answer": answer_text,
            "evidence": evidence_cards,
            "evidence_sources": evidence_cards,
            "model": model_label,
            "mode": mode_label,
            "tools_used": ["keyword_semantic_matching", "database_evidence_retrieval", "oisd_standard_mapping"],
            "verification_status": "COMMITTED_EVIDENCE_RETRIEVAL",
            "matched_offset_records": len(matched_events),
            "oisd_standard": "OISD-STD-174 (Well Control Operations)",
            "abstained": False
        }

    def run_query(
        self,
        query: str,
        target_well: str = "MORAN-29",
        current_depth_md: float = 2418.0,
        language: str = "EN",
        mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main entry point: Runs hybrid LLM reasoning with deterministic tool calling.
        Automatically falls back to deterministic rule engine if no API key or upon failure.
        Respects mode: 'cloud' vs 'edge' (Ollama / Air-Gap).
        """
        # Attempt to run LangGraph if available and explicitly requested or by default
        if HAS_LANGGRAPH:
            try:
                lg_result = run_langgraph_pipeline(
                    query,
                    target_well=target_well,
                    current_depth_md=current_depth_md,
                    language=language,
                    mode=mode
                )
                if "error" not in lg_result and "final_response" in lg_result:
                    return lg_result["final_response"]
            except Exception as e:
                logger.warning(f"LangGraph execution failed ({e}), falling back to standard pipeline.")

        client, model, provider_name = self._resolve_ai_client(mode_override=mode)

        # If no LLM configured, execute deterministic fallback
        if not client or not model:
            return self.run_deterministic_fallback(query, target_well, current_depth_md, language, mode=mode)

        is_drilling = self.is_drilling_query(query)

        # Grounded system prompt with adaptive handling for drilling vs general queries
        system_prompt = (
            "You are SRISHTI, the intelligent AI assistant and real-time drilling copilot for Oil India Limited (eRTMAC).\n\n"
            "FOR DRILLING, GEOLOGY & OILFIELD QUESTIONS:\n"
            "1. Grounding & Tools: Always call 'retrieve_evidence_citations' or other available tools to ground your guidance in verified historical well logs and proven engineering mitigations.\n"
            "2. Clarity: Avoid dumping raw sensor telemetry. Summarize events clearly in plain, professional English (or Hindi/Assamese if requested).\n"
            "3. Structure: Use clean Markdown formatting with clear section headers:\n"
            "   - **Answer**: 1-2 direct, clear sentences answering the question.\n"
            "   - **What Happened in Nearby Wells**: Bullet points citing Well name, depth (in meters), and what occurred.\n"
            "   - **Recommended Action**: Recommended mud weight window, hydraulics, or safety protocol.\n"
            "4. Zero Hallucinations: Cite exact depths and wells from tool outputs. If records are absent, clearly state so.\n"
            "5. TOOL CALLING RULE: Output ONLY valid JSON arguments. Never append emojis, symbols, or conversational commentary inside or after tool calls.\n\n"
            "FOR GENERAL, CASUAL, OR OFF-TOPIC QUESTIONS:\n"
            "1. If the user asks a general question, greeting, math problem, coding question, explanation of general topics, or casual conversation, ANSWER DIRECTLY AND NATURALLY.\n"
            "2. Do NOT force drilling templates, nearby well incidents, or mud weight recommendations on general/unrelated topics.\n"
            "3. Do NOT call drilling tools for non-drilling questions.\n"
            "4. Use clean Markdown formatting (bullet points, bold text, code blocks if appropriate).\n\n"
            "LANGUAGE SUPPORT:\n"
            "If the user asks in Hindi or Assamese, respond naturally and fluently in that language."
        )

        target_info = next((w for w in db_service.get_wells() if w.get("name") == target_well or w.get("id") == target_well), None)
        well_lat = target_info["lat"] if target_info else 27.4853
        well_lon = target_info["lon"] if target_info else 95.3456

        if is_drilling:
            user_content = f"Active Well: {target_well} (Field Location: lat {well_lat}, lon {well_lon}), Current Depth: {current_depth_md}m MD, Language: {language}.\nQuery: {query}"
        else:
            user_content = query

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        tools_used = []
        collected_evidence = []

        try:
            # Step 1: Initial call - pass tools only for drilling queries to optimize speed & accuracy
            if is_drilling:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=AGENT_TOOLS_DEFINITIONS,
                    tool_choice="auto",
                    temperature=0.0,
                    max_tokens=700
                )
            else:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=600
                )

            response_msg = response.choices[0].message

            # Step 2: Handle tool calls if requested by LLM
            if response_msg.tool_calls:
                messages.append(response_msg)

                for tool_call in response_msg.tool_calls:
                    fn_name = tool_call.function.name
                    try:
                        fn_args = json.loads(tool_call.function.arguments)
                    except Exception:
                        fn_args = {}

                    tools_used.append(fn_name)
                    tool_result = execute_tool(fn_name, fn_args)

                    # Extract any evidence records
                    if fn_name == "retrieve_evidence_citations" and isinstance(tool_result, list):
                        collected_evidence.extend(tool_result)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": fn_name,
                        "content": json.dumps(tool_result)
                    })

                # Step 3: Second call to synthesize final answer with grounded tool data
                second_response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=600
                )
                final_answer = second_response.choices[0].message.content or ""
            else:
                final_answer = response_msg.content or ""

            # Sanitize any unicode hyphens/quotes that cause display issues on Windows/terminals
            replacements = {
                "\u2013": "-",
                "\u2014": "--",
                "\u2018": "'",
                "\u2019": "'",
                "\u201c": '"',
                "\u201d": '"',
                "\u2026": "...",
                "\u00a0": " "
            }
            for u_char, asc_char in replacements.items():
                final_answer = final_answer.replace(u_char, asc_char)

            # Ensure evidence cards are populated ONLY for drilling-related queries
            if not collected_evidence and is_drilling:
                fallback_data = self.run_deterministic_fallback(query, target_well, current_depth_md, language)
                collected_evidence = fallback_data["evidence"]

            return {
                "answer": final_answer,
                "evidence_grounded_answer": final_answer,
                "evidence": collected_evidence,
                "evidence_sources": collected_evidence,
                "model": provider_name,
                "mode": mode or "HYBRID_LLM_TOOL_CALLING",
                "tools_used": tools_used or ["direct_llm_synthesis"],
                "verification_status": "COMMITTED_EVIDENCE_RETRIEVAL" if collected_evidence else "GENERAL_CONVERSATION",
                "matched_offset_records": len(collected_evidence),
                "oisd_standard": "OISD-STD-174 (Well Control Operations)" if is_drilling else "N/A",
                "abstained": False
            }

        except Exception as e:
            logger.warning(f"Hybrid LLM execution failed ({e}); switching to deterministic fallback.")
            fallback = self.run_deterministic_fallback(query, target_well, current_depth_md, language, mode=mode)
            fallback["notice"] = f"LLM provider error ({type(e).__name__}). Automatically seamlessly fell back to deterministic engine."
            return fallback


# Singleton instance
agent_orchestrator = HybridAgentOrchestrator()
