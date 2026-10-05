import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Code, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Mic, 
  X, 
  Brain, 
  Coins, 
  Terminal, 
  MessageSquare,
  Users,
  Play,
  FileText,
  Zap,
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
  // Top-level Unified Mode: Chat | Cowork | Code
  const [workspaceMode, setWorkspaceMode] = useState<'chat' | 'cowork' | 'code'>('chat');

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('omni_claude_conversations');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [
      {
        id: 'conv-default',
        title: 'Discussion principale',
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

  // Cowork Workspace State
  const [coworkDoc, setCoworkDoc] = useState<string>(
    "# 📋 Document Collaboratif\n\nCe document est co-rédigé en temps réel avec l'IA.\nDemandez des modifications dans le chat à gauche pour enrichir ou restructurer ce plan."
  );
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Code Workspace State
  const [codeEditorContent, setCodeEditorContent] = useState<string>(
    "def saluer(nom: str) -> str:\n    return f'Bonjour {nom} ! Bienvenue sur OmniAgent OS.'\n\nif __name__ == '__main__':\n    print(saluer('Monde'))"
  );
  const [terminalOutput, setTerminalOutput] = useState<string>("Prêt pour exécution. Cliquez sur ▶️ Exécuter le Code.");
  const [isExecutingCode, setIsExecutingCode] = useState(false);
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState(false);

  // Artifacts Panel State (for pure Chat mode)
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [copiedArtifact, setCopiedArtifact] = useState(false);

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

  // Run Code via Python Backend
  const handleExecuteCode = async () => {
    setIsExecutingCode(true);
    setTerminalOutput("Exécution du code Python en cours...");
    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeEditorContent, language: 'python' })
      });
      const data = await res.json();
      if (data.output) {
        setTerminalOutput(data.output);
      } else {
        setTerminalOutput("Code exécuté sans sortie standard.");
      }
    } catch {
      setTerminalOutput("Erreur lors de la communication avec le moteur d'exécution.");
    } finally {
      setIsExecutingCode(false);
    }
  };

  // Auto-Repair Code
  const handleAutoRepairCode = async () => {
    setIsExecutingCode(true);
    try {
      const res = await fetch('/api/self-healing/heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_code: codeEditorContent,
          error_message: terminalOutput,
          goal: "Corriger le code pour éliminer toute erreur d'exécution"
        })
      });
      const data = await res.json();
      if (data.final_code) {
        setCodeEditorContent(data.final_code);
        setTerminalOutput("Code corrigé par l'IA. Prêt pour ré-exécution.");
      }
    } catch {
      setTerminalOutput("Impossible d'auto-réparer le code en mode hors-ligne.");
    } finally {
      setIsExecutingCode(false);
    }
  };

  const handleCopyCodeSnippet = () => {
    navigator.clipboard.writeText(codeEditorContent);
    setCopiedCodeSnippet(true);
    setTimeout(() => setCopiedCodeSnippet(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([codeEditorContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(coworkDoc);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const handleDownloadDoc = () => {
    const blob = new Blob([coworkDoc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_cowork_${Date.now()}.md`;
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

      // In Code mode, automatically inject code into code editor
      if (assistantMsg.artifact && assistantMsg.artifact.type === 'code') {
        setCodeEditorContent(assistantMsg.artifact.content);
        if (workspaceMode !== 'code') {
          setActiveArtifact(assistantMsg.artifact);
          setIsArtifactOpen(true);
        }
      }

      // In Cowork mode, update the shared document
      if (workspaceMode === 'cowork') {
        setCoworkDoc(prev => prev + `\n\n## 📝 Mise à Jour (${new Date().toLocaleTimeString()})\n\n` + assistantMsg.content);
      }

      // Update tokens
      if (data.tokens) {
        setTokensData(prev => ({
          total_tokens: (prev?.total_tokens || 1050) + (data.tokens.total || 100),
          total_cost_usd: (prev?.total_cost_usd || 0.0003) + (data.tokens.cost_usd || 0.00002)
        }));
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: `J'ai bien pris en compte votre consigne : "${content}".\n\nQue vous souhaitiez discuter, co-rédiger un document ou coder, je suis là pour collaborer avec vous sans friction.`,
        thinking: "Traitement direct de la demande de l'utilisateur.\nCoordination du mode de travail actif.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: [...c.messages, fallbackMsg] } : c));
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
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#0e0e10] border-r border-[#27272a] flex flex-col justify-between shrink-0">
        <div className="flex flex-col h-full overflow-hidden p-3">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center shadow-lg shadow-amber-950/40 text-white font-bold text-sm">
                C
              </div>
              <div>
                <h1 className="font-semibold text-sm text-white tracking-wide">Claude AI</h1>
                <span className="text-[10px] text-amber-400 font-medium">Assistant Tout-en-Un</span>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] text-xs font-semibold text-white transition-all shadow-sm mb-4"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Nouvelle discussion</span>
            </div>
            <kbd className="text-[10px] font-mono text-neutral-400 bg-[#141416] px-1.5 py-0.5 rounded border border-[#27272a]">
              Ctrl+N
            </kbd>
          </button>

          {/* Recent Conversations */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 block mb-2">
              Historique
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
                  title="Supprimer"
                  aria-label="Supprimer la discussion"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Sidebar Switcher */}
          <div className="pt-3 border-t border-[#27272a] space-y-2 mt-auto">
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

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full bg-[#18181b] overflow-hidden relative">
        {/* Top Header with the 3 Native Modes: Chat | Cowork | Code */}
        <header className="h-14 border-b border-[#27272a] bg-[#141416]/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          {/* Workspace Mode Switcher: Chat, Cowork, Code */}
          <div className="flex items-center bg-[#202024] p-1 rounded-xl border border-[#2f2f35]">
            <button
              onClick={() => setWorkspaceMode('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                workspaceMode === 'chat'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setWorkspaceMode('cowork')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                workspaceMode === 'cowork'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cowork</span>
            </button>

            <button
              onClick={() => setWorkspaceMode('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                workspaceMode === 'code'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#202024] hover:bg-[#27272a] border border-[#2f2f35] rounded-xl px-3 py-1.5 text-xs text-amber-300 font-medium focus:outline-none cursor-pointer transition"
            >
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="gemini/gemini-2.0-flash">Google Gemini 2.0</option>
              <option value="ollama/deepseek-r1:7b">DeepSeek R1 (Local)</option>
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
              title="Active le raisonnement approfondi"
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span>Pensée</span>
            </button>

            {/* Token Counter */}
            <div className="flex items-center gap-1.5 bg-[#202024] border border-[#2f2f35] px-2.5 py-1 rounded-xl text-xs text-neutral-400">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-neutral-300 text-[11px]">
                {tokensData?.total_tokens.toLocaleString() || '1,050'}
              </span>
            </div>

            {/* Voice Mic */}
            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-2 rounded-xl border transition ${
                isVoiceActive
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-[#202024] border-[#2f2f35] text-neutral-400 hover:text-white'
              }`}
              title="Assistant Vocal"
              aria-label="Activer l'assistant vocal"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body: Dynamic Based on Mode */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Stream (Visible in all 3 modes, occupying either full width or left half) */}
          <div className={`flex flex-col h-full overflow-hidden transition-all ${
            workspaceMode === 'chat' && !isArtifactOpen ? 'w-full' : 'w-1/2 border-r border-[#27272a]'
          }`}>
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
              {activeConv.messages.length === 0 ? (
                /* Welcome Screen */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-5 pt-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center shadow-lg text-white">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Que souhaitez-vous faire ?</h2>
                    <p className="text-xs text-neutral-400 mt-1">
                      {workspaceMode === 'chat' && "Posez vos questions et brainstormez librement."}
                      {workspaceMode === 'cowork' && "Rédigeons et structurons un document ou un projet ensemble."}
                      {workspaceMode === 'code' && "Écrivez, testez et exécutez du code Python en direct."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-lg mt-2 text-left">
                    <button
                      onClick={() => handleSendPrompt("Rédige un plan stratégique détaillé pour lancer un nouveau projet")}
                      className="p-3 rounded-xl bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] transition"
                    >
                      <h4 className="text-xs font-semibold text-white">🤝 Co-rédiger un plan de projet</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Structure, étapes et livrables.</p>
                    </button>
                    <button
                      onClick={() => handleSendPrompt("Écris une fonction de tri fusion en Python avec des tests")}
                      className="p-3 rounded-xl bg-[#1f1f23] hover:bg-[#27272a] border border-[#2e2e33] transition"
                    >
                      <h4 className="text-xs font-semibold text-white">💻 Développer & exécuter du code</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Code Python testable immédiatement.</p>
                    </button>
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="space-y-5 pb-24">
                  {activeConv.messages.map((msg) => (
                    <div key={msg.id} className="space-y-2.5">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] bg-[#27272a] text-white px-4 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed border border-[#3f3f46]">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#d97706] to-[#b45309] flex items-center justify-center shrink-0 text-white font-bold text-xs">
                            C
                          </div>
                          <div className="flex-1 space-y-2.5 min-w-0">
                            {/* Reasoning Block */}
                            {msg.thinking && (
                              <div className="rounded-xl bg-[#1a1a1d] border border-[#27272a] overflow-hidden text-xs">
                                <button
                                  onClick={() => toggleThought(msg.id)}
                                  className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-400 hover:text-neutral-200 transition"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Brain className="w-3 h-3 text-amber-400" />
                                    <span className="text-[11px] font-medium">Réflexion développée</span>
                                  </div>
                                  {expandedThoughts[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                                {expandedThoughts[msg.id] && (
                                  <div className="p-3 pt-0 text-[11px] font-mono text-neutral-400 whitespace-pre-wrap leading-relaxed border-t border-[#27272a]/60 bg-[#161618]">
                                    {msg.thinking}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Content */}
                            <div className="text-xs md:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="flex items-center gap-2 text-neutral-400 text-xs py-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="animate-pulse">Génération en cours...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#141416] border-t border-[#27272a]">
              <div className="rounded-2xl bg-[#1f1f23] border border-[#2e2e33] p-2.5 focus-within:border-amber-500/60 transition">
                <textarea
                  ref={textareaRef}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder={
                    workspaceMode === 'chat'
                      ? "Discutez ou posez une question..."
                      : workspaceMode === 'cowork'
                      ? "Demandez à l'IA d'ajouter une section ou d'ajuster le document..."
                      : "Demandez une modification ou un nouveau script..."
                  }
                  className="w-full bg-transparent text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1.5 border-t border-[#27272a]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeepThinking(!deepThinking)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition ${
                        deepThinking ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Brain className="w-3 h-3" />
                      <span>{deepThinking ? 'Pensée ON' : 'Pensée OFF'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!promptInput.trim() || isGenerating}
                      onClick={() => handleSendPrompt()}
                      className={`p-1.5 rounded-xl transition ${
                        promptInput.trim() && !isGenerating
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                          : 'bg-[#27272a] text-neutral-500 cursor-not-allowed'
                      }`}
                      aria-label="Envoyer le message"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Workspace Pane: Cowork Canvas OR Code Editor OR Artifact */}
          {workspaceMode === 'cowork' && (
            <div className="w-1/2 flex flex-col h-full bg-[#121214]">
              {/* Cowork Toolbar */}
              <div className="h-12 border-b border-[#27272a] px-4 flex items-center justify-between bg-[#0e0e10]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Espace de Travail Collaboratif</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDoc}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1f1f23] hover:bg-[#27272a] text-neutral-300 text-[11px] rounded-lg border border-[#2e2e33] transition"
                  >
                    {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copier</span>
                  </button>
                  <button
                    onClick={handleDownloadDoc}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter .md</span>
                  </button>
                </div>
              </div>

              {/* Editable Markdown Canvas */}
              <div className="flex-1 p-4 overflow-auto">
                <textarea
                  value={coworkDoc}
                  onChange={(e) => setCoworkDoc(e.target.value)}
                  className="w-full h-full bg-transparent text-xs font-mono text-neutral-200 leading-relaxed focus:outline-none resize-none"
                  placeholder="Écrivez ou collaborez ici..."
                />
              </div>
            </div>
          )}

          {workspaceMode === 'code' && (
            <div className="w-1/2 flex flex-col h-full bg-[#121214]">
              {/* Code Editor Toolbar */}
              <div className="h-12 border-b border-[#27272a] px-4 flex items-center justify-between bg-[#0e0e10]">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Éditeur Python Intégré</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecuteCode}
                    disabled={isExecutingCode}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-md disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isExecutingCode ? 'Exécution...' : 'Exécuter'}</span>
                  </button>

                  <button
                    onClick={handleAutoRepairCode}
                    disabled={isExecutingCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-lg transition"
                    title="Répare automatiquement les bugs via l'IA"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Réparer</span>
                  </button>

                  <button
                    onClick={handleCopyCodeSnippet}
                    className="p-1.5 rounded-lg bg-[#1f1f23] text-neutral-300 hover:text-white border border-[#2e2e33]"
                    title="Copier le code"
                    aria-label="Copier le code"
                  >
                    {copiedCodeSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleDownloadCode}
                    className="p-1.5 rounded-lg bg-[#1f1f23] text-neutral-300 hover:text-white border border-[#2e2e33]"
                    title="Télécharger"
                    aria-label="Télécharger le code"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code Editor Area */}
              <div className="flex-1 p-3 overflow-auto bg-[#0a0a0c]">
                <textarea
                  value={codeEditorContent}
                  onChange={(e) => setCodeEditorContent(e.target.value)}
                  className="w-full h-full bg-transparent text-xs font-mono text-emerald-300 leading-relaxed focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Interactive Live Terminal Output */}
              <div className="h-44 border-t border-[#27272a] bg-[#070709] flex flex-col">
                <div className="px-3 py-1.5 border-b border-[#27272a] flex items-center justify-between text-[11px] text-neutral-400 bg-[#0e0e10]">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-neutral-300">Terminal d'Exécution</span>
                  </div>
                  <button
                    onClick={() => setTerminalOutput("Terminal nettoyé.")}
                    className="hover:text-white"
                  >
                    Effacer
                  </button>
                </div>
                <pre className="flex-1 p-3 text-xs font-mono text-neutral-300 overflow-auto whitespace-pre-wrap leading-relaxed">
                  {terminalOutput}
                </pre>
              </div>
            </div>
          )}

          {/* Artifacts Panel (Only when in pure Chat mode and an artifact is open) */}
          {workspaceMode === 'chat' && isArtifactOpen && activeArtifact && (
            <div className="w-1/2 flex flex-col h-full bg-[#121214] border-l border-[#27272a]">
              <div className="h-12 border-b border-[#27272a] px-4 flex items-center justify-between bg-[#0e0e10]">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {activeArtifact.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeArtifact.content);
                      setCopiedArtifact(true);
                      setTimeout(() => setCopiedArtifact(false), 2000);
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                    aria-label="Copier l'artefact"
                  >
                    {copiedArtifact ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsArtifactOpen(false)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                    aria-label="Fermer l'artefact"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-auto bg-[#0a0a0c]">
                <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                  <code>{activeArtifact.content}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
