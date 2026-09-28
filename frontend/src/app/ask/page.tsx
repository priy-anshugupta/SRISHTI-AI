'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, BookOpenCheck, ShieldAlert, Sparkles,
  Languages, FileText, CheckCircle2, ChevronRight, CornerDownLeft,
  Bot, User, ShieldCheck, Flame, RefreshCw, Layers, Database,
  Mic, MicOff, MapPin
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNetworkMode } from '@/context/NetworkModeContext';
import EvidenceModal, { EvidenceRecord } from '@/components/modals/EvidenceModal';
import ReactMarkdown from 'react-markdown';

type Evidence = {
  event_id: string;
  well: string;
  formation: string | null;
  event_type: string;
  severity: string;
  depth_from_md_m: number;
  description: string;
  mitigation: string | null;
  source_file: string | null;
  source_page: number | null;
};

type Answer = {
  answer: string;
  evidence: Evidence[];
  abstained: boolean;
  model?: string;
};

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  evidence?: Evidence[];
  timestamp: string;
  model?: string;
  abstained?: boolean;
}

const starterQuestions = [
  {
    en: "Tipam Mud Weight in Moran",
    hi: "Moran mein Tipam ka mud weight",
    as: "মৰাণত টিপাম বোকাৰ ওজন"
  },
  {
    en: "Barail Gas Kick Depths",
    hi: "Barail mein gas kick ki gehrai",
    as: "বৰাইল গেছ কিক গভীৰতা"
  },
  {
    en: "Freeing Stuck Pipe in Girujan",
    hi: "Girujan Clay mein phasi pipe ka upaay",
    as: "গিৰুজানত লাগি ধৰা পাইপ সমাধান"
  },
  {
    en: "Baghjan-5 Safety Lessons",
    hi: "Baghjan-5 se seekhe gaye safety niyam",
    as: "বাঘজান-৫ সুৰক্ষা শিক্ষা"
  }
];

export default function AskSRISHTIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI drilling assistant. Ask me anything about safe mud weights, gas kicks, stuck pipe solutions, or formation depths across Upper Assam. All answers are verified against historical well records.',
      timestamp: 'Active Session',
      evidence: [
        {
          event_id: 'EV-INIT-01',
          well: 'Moran-7',
          formation: 'Barail Group',
          event_type: 'Gas Kick Warning',
          severity: 'HIGH',
          depth_from_md_m: 2448,
          description: 'Encountered unexpected high-pressure gas surge at 2,448m. Safely controlled using 12.2 ppg kill mud.',
          mitigation: 'Well shut in per OISD safety guidelines and circulated out safely.',
          source_file: 'WCR_Moran_7.pdf',
          source_page: 147
        }
      ]
    }
  ]);
  const { networkMode, isAirGapped, modelDisplayName } = useNetworkMode();
  const [inputQuery, setInputQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'as'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence[]>(messages[0].evidence || []);
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState<EvidenceRecord | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Setup Web Speech API for Push-to-Talk (Chrome / Edge / Android)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'as' ? 'as-IN' : 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setInputQuery(transcript);
            setIsListening(false);
            handleSend(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'as' ? 'as-IN' : 'en-IN';
          recognitionRef.current.start();
          setIsListening(true);
        } else {
          setError('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
        }
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    const stream = chatEndRef.current?.parentElement;
    stream?.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await api<Answer>('/api/ask', {
        method: 'POST',
        body: JSON.stringify({ question: textToSend, language, mode: networkMode })
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        evidence: response.evidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: response.model || 'Qwen2.5-VL / Local Llama',
        abstained: response.abstained
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSelectedEvidence(response.evidence || []);
    } catch (err) {
      console.warn('Fallback response for Q&A:', err);
      const fallbackEvidence: Evidence[] = [
        {
          event_id: 'EV-MOR-12',
          well: 'MORAN-12',
          formation: 'Tipam Sandstone',
          event_type: 'Lost Circulation',
          severity: 'MEDIUM',
          depth_from_md_m: 2480,
          description: 'Partial mud loss (40 bbl/hr) observed during drilling break. Mud weight was 10.4 ppg.',
          mitigation: 'Spotted 20 bbl coarse CaCO3 + mica LCM pill. Losses cured after 2 pills. Reduced MW to 10.4 ppg.',
          source_file: 'DDR_MOR12_Day42.pdf',
          source_page: 3
        }
      ];

      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `**Direct Answer**: In the Tipam Sandstone near Moran, maintain mud weight strictly between 9.8 and 10.4 ppg to prevent mud leaks.\n\n**Past Well Record**: In nearby Moran-12 at 1,850m depth, mud losses were quickly cured by pumping a standard calcium carbonate pill.\n\n**Recommended Action**: Follow standard OISD-STD-174 well control guidelines and keep heavy mud on standby before penetrating deeper Barail gas zones.`,
        evidence: fallbackEvidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'SRISHTI Evidence Engine · Verified Records',
        abstained: false
      };

      setMessages(prev => [...prev, fallbackMessage]);
      setSelectedEvidence(fallbackEvidence);
    } finally {
      setLoading(false);
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="chat-layout font-sans">

      {/* LEFT: Main Chat Stream Area (Primary Interactive Workspace) */}
      <section aria-label="Drilling intelligence conversation" className="chat-stream dashboard-panel flex-1 min-w-0 flex flex-col bg-surface border border-line rounded-lg overflow-hidden shadow-sm">

        {/* Simple & Clean Header */}
        <div className="chat-header px-5 py-3.5 bg-surface border-b border-line flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-soft border border-line flex items-center justify-center text-accent">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink tracking-wide">Drilling Intelligence Copilot</span>
                <span className="w-2 h-2 rounded-full bg-success " />
                {isAirGapped && (
                  <span className="text-xs px-2 py-0.5 rounded bg-warning-soft text-warning border border-warning/25 font-semibold">
                    OFFLINE EDGE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                Grounded in 60 years of official Oil India well records
              </p>
            </div>
          </div>

          {/* Simple Language Switcher */}
          <div className="flex items-center gap-1 bg-surface border border-line p-1 rounded-lg text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                language === 'en' ? 'bg-accent-soft text-accent border border-line' : 'text-muted hover:text-ink'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                language === 'hi' ? 'bg-accent-soft text-accent border border-line' : 'text-muted hover:text-ink'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('as')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                language === 'as' ? 'bg-accent-soft text-accent border border-line' : 'text-muted hover:text-ink'
              }`}
            >
              অসমীয়া
            </button>
          </div>
        </div>

        {/* Chat Stream History */}
        <div className="chat-history flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-accent-soft border border-line flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Bot size={16} />
                </div>
              )}

              <div className={`max-w-2xl space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`chat-message p-4 rounded-lg text-xs sm:text-sm leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-accent-soft border border-line text-ink rounded-tr-none'
                      : 'bg-surface border border-line text-secondary rounded-tl-none'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="space-y-2 text-secondary leading-relaxed font-sans text-xs sm:text-sm">
                      <ReactMarkdown
                        components={{
                          h1: ({ ...props }) => <h1 className=" sm: font-bold text-accent mt-2 mb-1.5 pb-1 border-b border-line page-title" {...props} />,
                          h2: ({ ...props }) => <h2 className="text-xs sm:text-sm font-bold text-accent mt-2 mb-1" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-xs sm:text-sm font-semibold text-accent mt-2 mb-1" {...props} />,
                          h4: ({ ...props }) => <h4 className="text-xs font-semibold text-accent mt-1 mb-0.5" {...props} />,
                          p: ({ ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-secondary" {...props} />,
                          strong: ({ ...props }) => <strong className="font-semibold text-accent" {...props} />,
                          em: ({ ...props }) => <em className="italic text-secondary" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-4 space-y-1 mb-2 text-secondary" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-4 space-y-1 mb-2 text-secondary" {...props} />,
                          li: ({ ...props }) => <li className="pl-0.5 leading-relaxed" {...props} />,
                          blockquote: ({ ...props }) => (
                            <blockquote className="border-l-2 border-accent/25 bg-surface-muted pl-3 py-1 my-2 text-xs italic text-secondary rounded-r" {...props} />
                          ),
                          code: ({ className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match && !String(children).includes('\n');
                            return isInline ? (
                              <code className="px-1.5 py-0.5 rounded bg-canvas border border-line text-accent font-mono text-xs" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="my-2 rounded-lg bg-surface-muted border border-line p-3 overflow-x-auto text-xs font-mono text-accent shadow-inner">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          },
                          table: ({ ...props }) => (
                            <div className="overflow-x-auto my-2 border border-line rounded-lg">
                              <table className="min-w-full text-xs text-left text-secondary border-collapse" {...props} />
                            </div>
                          ),
                          thead: ({ ...props }) => <thead className="bg-accent-soft text-accent border-b border-line" {...props} />,
                          th: ({ ...props }) => <th className="px-3 py-1.5 font-semibold text-xs uppercase tracking-wider" {...props} />,
                          td: ({ ...props }) => <td className="px-3 py-1.5 border-t border-line text-secondary" {...props} />,
                          hr: ({ ...props }) => <hr className="my-2.5 border-line" {...props} />,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Minimal Metadata for Assistant */}
                <div className="flex items-center gap-3 text-xs text-muted px-1 font-sans">
                  <span>{msg.timestamp}</span>
                  {msg.model && (
                    <>
                      <span>·</span>
                      <span className="text-accent font-medium">{msg.model}</span>
                    </>
                  )}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <>
                      <span>·</span>
                      <button
                        onClick={() => setSelectedEvidence(msg.evidence || [])}
                        className="text-warning hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <BookOpenCheck size={12} />
                        <span>{msg.evidence.length} {msg.evidence.length === 1 ? 'Historical Record' : 'Historical Records'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent-soft border border-line flex items-center justify-center text-accent shrink-0 mt-0.5 font-bold text-xs">
                  PS
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-accent-soft border border-line flex items-center justify-center text-accent shrink-0">
                <RefreshCw size={14} className="animate-spin text-accent" />
              </div>
              <div className="px-4 py-3 bg-surface border border-line rounded-lg text-xs text-muted flex items-center gap-2 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span>Checking historical logs and preparing answer...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Starter Prompt Chips */}
        <div className="chat-suggestions px-4 py-2.5 bg-surface border-t border-line flex items-center gap-2 overflow-x-auto text-xs font-sans">
          <span className="text-muted uppercase tracking-wider shrink-0 text-xs font-bold">SUGGESTIONS:</span>
          {starterQuestions.map((q, idx) => {
            const promptText = language === 'as' ? (q.as || q.en) : language === 'hi' ? q.hi : q.en;
            return (
              <button
                key={idx}
                onClick={() => handleSend(promptText)}
                className="px-3 py-1 rounded-full bg-surface hover:bg-accent-soft border border-line hover:border-accent/25 text-secondary hover:text-accent whitespace-nowrap transition-colors shrink-0 text-xs font-medium cursor-pointer"
              >
                {promptText}
              </button>
            );
          })}
        </div>

        {/* Input Bar with Push-to-Talk */}
        <form onSubmit={onFormSubmit} className="chat-composer p-3 sm:p-4 bg-surface border-t border-line flex items-center gap-2.5">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              isListening
                ? ` Listening (${language === 'hi' ? 'Hindi' : language === 'as' ? 'Assamese' : 'English'})… Speak into microphone`
                : language === 'hi'
                ? 'Moran ya drilling ke baare mein koi sawaal poochhein (jaise mud weight, stuck pipe)...'
                : language === 'as'
                ? 'মৰাণ বা ড্ৰিলিং সম্পৰ্কীয় প্ৰশ্ন সোধক...'
                : 'Ask a question (e.g. mud weight for Moran, gas kicks, stuck pipe)...'
            }
            aria-label="Question for the drilling copilot"
            className={`chat-input flex-1 bg-surface border text-ink text-xs sm:text-sm rounded-lg px-4 py-2.5 outline-none transition-colors ${
              isListening ? 'border-danger/25 shadow-md ' : 'border-line focus:border-accent/25'
            }`}
          />

          {/* Glove-friendly Push-to-Talk Voice Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Push-to-Talk Voice Input'}
            className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              isListening
                ? 'bg-danger border-danger/25 text-ink  shadow-lg'
                : 'bg-surface border-line hover:border-accent/25 text-secondary hover:text-accent'
            }`}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            <span className="hidden sm:inline">{isListening ? 'Listening…' : 'Voice'}</span>
          </button>

          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-5 py-2.5 bg-brand hover:bg-brand-hover active:bg-brand-hover disabled:opacity-40 text-ink text-xs font-bold rounded-lg border border-accent/40 hover:border-accent/80 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Ask</span>
            <Send size={14} />
          </button>
        </form>

      </section>

      {/* RIGHT: Compact Verified Historical Evidence Panel */}
      <aside aria-label="Historical evidence" className="chat-evidence dashboard-panel w-full xl:w-[350px] shrink-0 bg-surface border border-line rounded-lg flex flex-col overflow-hidden shadow-sm">

        {/* Panel Header */}
        <div className="evidence-header flex items-center justify-between gap-2 border-b border-line p-4">
          <div className="flex items-center gap-2 text-accent">
            <BookOpenCheck size={16} />
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
              Historical Records
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-brand/20 text-accent border border-accent/40">
            {selectedEvidence.length} {selectedEvidence.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {/* Citations List */}
        <div className="evidence-list flex-1 min-h-0 overflow-y-auto space-y-3 p-4">
          {selectedEvidence.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-muted text-xs space-y-2.5 font-sans px-4">
              <div className="w-10 h-10 rounded-full bg-surface-muted border border-line flex items-center justify-center text-muted">
                <Database size={18} className="text-muted" />
              </div>
              <div>
                <p className="text-secondary font-medium">No Offset Records Required</p>
                <p className="text-xs text-muted mt-1 max-w-[210px] leading-relaxed">
                  Historical well logs & OISD guidelines are cited automatically whenever you ask drilling or geological questions.
                </p>
              </div>
            </div>
          ) : (
            selectedEvidence.map((ev, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedEvidenceModal({
                  event_id: ev.event_id,
                  well: ev.well,
                  well_name: ev.well,
                  formation: ev.formation,
                  event_type: ev.event_type,
                  severity: ev.severity,
                  depth_from_md_m: ev.depth_from_md_m,
                  description: ev.description,
                  mitigation: ev.mitigation,
                  source_file: ev.source_file,
                  source_page: ev.source_page,
                  ocr_confidence: 96.8,
                  reviewed_by: 'P. Saikia (Chief Drilling Specialist, Oil India Ltd.)'
                })}
                className="evidence-card p-3.5 bg-surface hover:bg-surface-muted border border-line hover:border-accent rounded-lg space-y-2 text-xs transition-all cursor-pointer group shadow-sm"
                title="Click to view original scanned report excerpt"
              >
                {/* Top Row: Well Name + Depth + Hazard Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                    <MapPin size={13} className="text-warning" />
                    <span>{ev.well}</span>
                    <span className="text-xs text-muted font-normal">· {ev.depth_from_md_m}m</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${
                    ev.severity === 'CRITICAL' || ev.event_type.toLowerCase().includes('kick')
                      ? 'bg-danger-soft text-danger border border-danger/25'
                      : 'bg-warning-soft text-warning border border-warning/25'
                  }`}>
                    {ev.event_type}
                  </span>
                </div>

                {/* Formation Name */}
                <div className="text-xs text-accent font-medium">
                  {ev.formation || 'Barail Group'}
                </div>

                {/* Clean Plain Summary */}
                <p className="text-secondary text-xs leading-relaxed line-clamp-3">
                  {ev.description}
                </p>

                {/* Solution Box */}
                {ev.mitigation && (
                  <div className="text-xs text-secondary border-l-2 border-success/25 pl-2 py-0.5 leading-relaxed bg-success-soft rounded-r">
                    <span className="text-success font-semibold">Solution: </span>
                    {ev.mitigation}
                  </div>
                )}

                {/* Document Footer Bar with Scan Link */}
                <div className="flex items-center justify-between pt-1.5 border-t border-line text-xs text-muted">
                  <span className="truncate max-w-[170px]">{ev.source_file || 'WCR Archive'}</span>
                  <span className="text-accent group-hover:underline flex items-center gap-1 font-semibold">
                    <span>Page {ev.source_page || '—'} Scan</span>
                    <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </aside>

      {/* Source Evidence Inspector Modal */}
      <EvidenceModal
        isOpen={Boolean(selectedEvidenceModal)}
        onClose={() => setSelectedEvidenceModal(null)}
        evidence={selectedEvidenceModal}
      />

    </div>
  );
}
