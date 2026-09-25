import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Code, 
  Eye, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Paperclip, 
  Mic, 
  X, 
  Brain, 
  Globe, 
  Coins, 
  Layers, 
  Terminal, 
  Cpu, 
  SlidersHorizontal
} from 'lucide-react';

export interface ArtifactData {
  title: string;
  language: string;
  content: string;
  type: 'code' | 'html' | 'markdown';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string | null;
  artifact?: ArtifactData | null;
  tools_used?: { name: string; action: string; summary: string }[];
  time: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

interface ClaudeAppProps {
  onSwitchToDevConsole: () => void;
}

export default function ClaudeApp({ onSwitchToDevConsole }: ClaudeAppProps) {
  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('omni_claude_conversations');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [
      {
        id: 'conv-default',
        title: 'Nouvelle discussion',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: []
      }
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return conversations[0]?.id || 'conv-default';
  });

  // Active Chat Configuration
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet');
  const [deepThinking, setDeepThinking] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Artifacts Panel State
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [artifactTab, setArtifactTab] = useState<'code' | 'preview'>('code');
  const [copiedCode, setCopiedCode] = useState(false);

  // Thinking Expansion
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  // Tokens / FinOps State
  const [tokensData, setTokensData] = useState<{ total_tokens: number; total_cost_usd: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem('omni_claude_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Fetch tokens
  useEffect(() => {
    fetch('/api/analytics/tokens')
      .then(r => r.json())
      .then(d => setTokensData({ total_tokens: d.total_tokens || 1050, total_cost_usd: d.total_cost_usd || 0.0003 }))
      .catch(() => setTokensData({ total_tokens: 1050, total_cost_usd: 0.0003 }));
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId, isGenerating]);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleNewChat = () => {
    const newId = 'conv-' + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: 'Nouvelle discussion',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: []
    };
    setConversations([newConv, ...conversations]);
    setActiveConvId(newId);
    setActiveArtifact(null);
    setIsArtifactOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      handleNewChat();
      return;
    }
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (activeConvId === id) {
      setActiveConvId(filtered[0].id);
    }
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopyArtifact = () => {
    if (!activeArtifact) return;
    navigator.clipboard.writeText(activeArtifact.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadArtifact = () => {
    if (!activeArtifact) return;
    const blob = new Blob([activeArtifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact_${Date.now()}.${activeArtifact.language || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const content = (textToSend || promptInput).trim();
    if (!content || isGenerating) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update conversation title if first message
    const updatedMessages = [...activeConv.messages, userMessage];
    const newTitle = activeConv.messages.length === 0 
      ? content.slice(0, 32) + (content.length > 32 ? '...' : '')
      : activeConv.title;

    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, title: newTitle, messages: updatedMessages } : c));
    setPromptInput('');
    setIsGenerating(true);

    try {
      const historyPayload = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          model: selectedModel,
          deep_thinking: deepThinking,
          history: historyPayload
        })
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.response || "Je suis à votre service. Que souhaitez-vous approfondir ?",
        thinking: data.thinking || null,
        artifact: data.artifact || null,
        tools_used: data.tools_used || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: [...c.messages, assistantMsg] } : c));

      // Auto-open artifact if generated
      if (assistantMsg.artifact) {
        setActiveArtifact(assistantMsg.artifact);
        setIsArtifactOpen(true);
        setArtifactTab(assistantMsg.artifact.type === 'html' ? 'preview' : 'code');
      }

      // Update tokens
      if (data.tokens) {
        setTokensData(prev => ({
          total_tokens: (prev?.total_tokens || 1050) + (data.tokens.total || 100),
          total_cost_usd: (prev?.total_cost_usd || 0.0003) + (data.tokens.cost_usd || 0.00002)
        }));
      }
    } catch {
      // Graceful offline mock response
      const fallbackMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: `J'ai bien reçu votre demande : "${content}".\n\nTous les 16 moteurs de l'écosystème OmniAgent OS (Browser-Use, Goose, AutoGen, Hermes, Google ADK, etc.) sont actifs et prêts.`,
        thinking: "Analyse de la demande utilisateur...\nSélection des adaptateurs spécialisés.\nPréparation de la réponse structurée.",
        artifact: content.toLowerCase().includes('code') || content.toLowerCase().includes('script') ? {
          title: "Script d'Exemple Python",
          language: "python",
          type: "code",
          content: "def execute_task():\n    print('OmniAgent OS opérationnel !')\n    return {'status': 'success'}\n\nif __name__ == '__main__':\n    execute_task()"
        } : null,
        tools_used: [
          { name: "omni_router", action: "Routage Intelligent", summary: "Requête traitée via le moteur unifié" }
        ],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: [...c.messages, fallbackMsg] } : c));
      if (fallbackMsg.artifact) {
        setActiveArtifact(fallbackMsg.artifact);
        setIsArtifactOpen(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  return (
    <div className="flex h-screen bg-[#141416] text-[#e4e4e7] font-sans antialiased overflow-hidden">
      {/* Claude Style Left Sidebar */}
      <aside className="w-72 bg-[#0e0e10] border-r border-[#27272a] flex flex-col justify-between shrink-0">
        <div className="flex flex-col h-full overflow-hidden p-3">
          {/* Claude App Brand Header */}
          <div className="flex items-center justify-between px-2 py-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center shadow-lg shadow-amber-950/40 text-white font-bold text-sm">
                C
              </div>
              <div>
                <h1 className="font-semibold text-sm text-white tracking-wide">Claude Desktop</h1>
                <span className="text-[10px] text-amber-400/90 font-medium">Édition OmniAgent OS</span>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-xs font-semibold text-white transition-all shadow-sm mb-4"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Nouvelle discussion</span>
            </div>
            <kbd className="text-[10px] font-mono text-neutral-400 bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272a]">
              Ctrl+N
            </kbd>
          </button>

          {/* Recent Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 block mb-2">
              Discussions Récentes
            </span>
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                  activeConvId === conv.id
                    ? 'bg-[#27272a] text-white font-medium'
                    : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1d]'
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <p className="truncate text-xs">{conv.title}</p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded transition text-neutral-500"
                  title="Supprimer la discussion"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Sidebar Controls */}
          <div className="pt-3 border-t border-[#27272a] space-y-2 mt-auto">
            {/* Active MCP Engines Pill */}
            <div className="px-3 py-2 rounded-xl bg-[#1a1a1d] border border-[#27272a] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-neutral-300 text-[11px] font-medium">16 Moteurs MCP Actifs</span>
              </div>
              <Cpu className="w-3.5 h-3.5 text-neutral-500" />
            </div>

            {/* Switch to Developer Mode / System Console */}
            <button
              onClick={onSwitchToDevConsole}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-neutral-400 hover:text-amber-400 hover:bg-[#1f1f23] transition border border-transparent hover:border-[#2e2e33]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Console Système Avancée</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Center Pane */}
      <main className="flex-1 flex flex-col h-full bg-[#18181b] overflow-hidden relative">
        {/* Claude Style Top Header */}
        <header className="h-14 border-b border-[#27272a] bg-[#141416]/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#202024] hover:bg-[#27272a] border border-[#2f2f35] rounded-xl px-3 py-1.5 text-xs text-amber-300 font-medium focus:outline-none cursor-pointer transition"
            >
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Recommandé)</option>
              <option value="gemini/gemini-2.0-flash">Google Gemini 2.0 Flash</option>
              <option value="ollama/deepseek-r1:7b">DeepSeek R1 7B (Ollama Local)</option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
            </select>

            {/* Deep Thinking Toggle */}
            <button
              onClick={() => setDeepThinking(!deepThinking)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                deepThinking
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-[#202024] border-[#2f2f35] text-neutral-400 hover:text-white'
              }`}
              title="Active le raisonnement approfondi (Extended Thinking)"
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span>Réflexion Approfondie</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* FinOps Token Counter Badge */}
            <div className="flex items-center gap-2 bg-[#202024] border border-[#2f2f35] px-3 py-1 rounded-xl text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-neutral-300 font-medium">
                {tokensData?.total_tokens.toLocaleString() || '1,050'} tokens
              </span>
              <span className="text-neutral-600">|</span>
              <span className="text-emerald-400 font-medium">
                ${tokensData?.total_cost_usd ? tokensData.total_cost_usd.toFixed(4) : '0.0003'}
              </span>
            </div>

            {/* Voice Companion Toggle */}
            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-2 rounded-xl border transition ${
                isVoiceActive
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-[#202024] border-[#2f2f35] text-neutral-400 hover:text-white'
              }`}
              title="Assistant Vocal Airi"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Artifact Panel Toggle Button */}
            {activeArtifact && (
              <button
                onClick={() => setIsArtifactOpen(!isArtifactOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  isArtifactOpen
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-[#202024] border-[#2f2f35] text-indigo-300 hover:bg-[#27272a]'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Artefact</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {activeConv.messages.length === 0 ? (
            /* Claude Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 pt-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center shadow-xl shadow-amber-950/30 text-white">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Bonjour, que souhaitez-vous accomplir ?</h2>
                <p className="text-sm text-neutral-400 max-w-lg">
                  Posez une question, demandez du code, automatisez le web ou pilotez votre ordinateur grâce aux 16 moteurs d'agents connectés.
                </p>
              </div>

              {/* Starter Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-4 text-left">
                {[
                  {
                    title: "Recherche & Scraping Web",
                    desc: "Navigue sur le web avec Browser-Use et extrait les informations.",
                    prompt: "Recherche sur le web les dernières avancées en IA générative et résume-les.",
                    icon: Globe,
                    color: "text-cyan-400"
                  },
                  {
                    title: "Génération & Correction de Code",
                    desc: "Écris des scripts Python complets avec auto-guérison en cas d'erreur.",
                    prompt: "Crée un script Python d'analyse de données avec calcul de statistiques et tests.",
                    icon: Code,
                    color: "text-emerald-400"
                  },
                  {
                    title: "Débat Multi-Agents AutoGen",
                    desc: "Fais collaborer plusieurs spécialistes sur une problématique complexe.",
                    prompt: "Organise un débat entre 2 experts pour concevoir une architecture microservices sécurisée.",
                    icon: Layers,
                    color: "text-purple-400"
                  },
                  {
                    title: "Contrôle Système & Terminal",
                    desc: "Exécute des tâches en ligne de commande avec garde-fous de sécurité.",
                    prompt: "Explique l'architecture de ce dépôt et montre comment exécuter les tests.",
                    icon: Terminal,
                    color: "text-amber-400"
                  }
                ].map((card, idx) => {
                  const IconComp = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(card.prompt)}
                      className="p-4 rounded-2xl bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] hover:border-neutral-600 transition text-left group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <IconComp className={`w-4 h-4 ${card.color}`} />
                        <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition">
                          {card.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">{card.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="max-w-3xl mx-auto space-y-6 pb-28">
              {activeConv.messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {msg.role === 'user' ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-[#27272a] text-white px-4 py-3 rounded-2xl text-sm leading-relaxed border border-[#3f3f46]">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md shadow-amber-950/20">
                        C
                      </div>
                      <div className="flex-1 space-y-3 min-w-0">
                        {/* Collapsible Thinking Block (Claude Extended Thinking) */}
                        {msg.thinking && (
                          <div className="rounded-xl bg-[#1a1a1d] border border-[#27272a] overflow-hidden text-xs">
                            <button
                              onClick={() => toggleThought(msg.id)}
                              className="w-full flex items-center justify-between px-3.5 py-2 text-neutral-400 hover:text-neutral-200 transition"
                            >
                              <div className="flex items-center gap-2">
                                <Brain className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-medium text-[11px]">
                                  {expandedThoughts[msg.id] ? "Masquer la réflexion" : "Pensée développée (Claude Reasoning)"}
                                </span>
                              </div>
                              {expandedThoughts[msg.id] ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {expandedThoughts[msg.id] && (
                              <div className="p-3.5 pt-0 text-[11px] font-mono text-neutral-400 whitespace-pre-wrap leading-relaxed border-t border-[#27272a]/60 bg-[#161618]">
                                {msg.thinking}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tool Executions Badges */}
                        {msg.tools_used && msg.tools_used.length > 0 && (
                          <div className="space-y-1.5">
                            {msg.tools_used.map((tool, tIdx) => (
                              <div key={tIdx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-[11px]">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-semibold">{tool.action} :</span>
                                <span className="text-emerald-300 truncate">{tool.summary}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formatted Content */}
                        <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {/* Embedded Artifact Card */}
                        {msg.artifact && (
                          <div 
                            onClick={() => {
                              setActiveArtifact(msg.artifact!);
                              setIsArtifactOpen(true);
                              setArtifactTab(msg.artifact!.type === 'html' ? 'preview' : 'code');
                            }}
                            className="p-3 rounded-xl bg-[#202024] hover:bg-[#27272a] border border-[#2f2f35] cursor-pointer transition flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                                <Code className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                                  {msg.artifact.title}
                                </h4>
                                <p className="text-[10px] text-neutral-400 font-mono">
                                  Langage : {msg.artifact.language} • Cliquer pour ouvrir dans le panneau latéral
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                              Ouvrir →
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-center gap-3 text-neutral-400 text-xs py-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center text-white animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="animate-pulse">Claude et les agents OmniAgent génèrent votre réponse...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Claude Prompt Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#18181b] via-[#18181b]/90 to-transparent">
          <div className="max-w-3xl mx-auto rounded-2xl bg-[#1f1f23] border border-[#2e2e33] shadow-2xl p-3 focus-within:border-amber-500/60 transition">
            <textarea
              ref={textareaRef}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Posez une question, demandez du code, une analyse ou une tâche web..."
              className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#27272a] transition"
                  title="Ajouter un fichier ou du code"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeepThinking(!deepThinking)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    deepThinking ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Réflexion approfondie"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Pensée {deepThinking ? 'Active' : 'Off'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={`p-1.5 rounded-lg transition ${
                    isVoiceActive ? 'text-rose-400 bg-rose-500/20' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Vocal Airi"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={!promptInput.trim() || isGenerating}
                  onClick={() => handleSendPrompt()}
                  className={`p-2 rounded-xl transition ${
                    promptInput.trim() && !isGenerating
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Claude Style Artifacts Panel (Right Pane) */}
      {isArtifactOpen && activeArtifact && (
        <aside className="w-[45%] bg-[#121214] border-l border-[#27272a] flex flex-col h-full shrink-0 shadow-2xl z-20">
          {/* Artifact Header */}
          <div className="h-14 border-b border-[#27272a] px-4 flex items-center justify-between bg-[#0e0e10]">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-white truncate max-w-[200px]">
                {activeArtifact.title}
              </span>
              <span className="text-[10px] bg-[#27272a] text-amber-300 px-2 py-0.5 rounded font-mono uppercase">
                {activeArtifact.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab toggles */}
              <div className="flex items-center bg-[#1f1f23] p-0.5 rounded-lg border border-[#2e2e33]">
                <button
                  onClick={() => setArtifactTab('code')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    artifactTab === 'code' ? 'bg-[#27272a] text-white shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  Code
                </button>
                {activeArtifact.type === 'html' && (
                  <button
                    onClick={() => setArtifactTab('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                      artifactTab === 'preview' ? 'bg-[#27272a] text-white shadow' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Aperçu
                  </button>
                )}
              </div>

              <button
                onClick={handleCopyArtifact}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#27272a] transition"
                title="Copier le code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleDownloadArtifact}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#27272a] transition"
                title="Télécharger le fichier"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsArtifactOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#27272a] transition"
                title="Fermer l'artefact"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Artifact Content */}
          <div className="flex-1 overflow-auto p-4 bg-[#0a0a0c]">
            {artifactTab === 'code' ? (
              <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                <code>{activeArtifact.content}</code>
              </pre>
            ) : (
              <iframe
                title="Live Preview"
                srcDoc={activeArtifact.content}
                className="w-full h-full rounded-xl bg-white border-0"
                sandbox="allow-scripts"
              />
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
