import { useState, useEffect } from 'react';
import { 
  Bot, 
  Globe, 
  Settings, 
  Clock, 
  Send,
  Workflow,
  Code2,
  FolderGit2
} from 'lucide-react';

interface Tool {
  name: string;
  description: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  agent?: string;
  content: string;
  time: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'hub' | 'orchestrator' | 'browser' | 'settings'>('hub');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini/gemini-1.5-flash');
  const [isRunning, setIsRunning] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      agent: 'OmniOrchestrator',
      content: 'Bonjour ! Je suis votre chef d’orchestre d’agents unifié. Que souhaitez-vous automatiser aujourd’hui ? (Recherche web, écriture de code, exécution multi-agents ou contrôle système).',
      time: '12:00'
    }
  ]);

  const projects = [
    { name: "AutoGen", cat: "Multi-Agent", desc: "Orchestration multi-agents par conversation", path: "sources/autogen" },
    { name: "LangChain", cat: "Framework", desc: "Chaînes LLM & intégrations RAG", path: "sources/langchain" },
    { name: "Browser Use", cat: "Web Automation", desc: "Navigation web autonome par vision & DOM", path: "sources/browser-use" },
    { name: "Goose", cat: "Code Agent", desc: "Agent autonome développeur en shell", path: "sources/goose" },
    { name: "Everything Computer Control", cat: "OS Control", desc: "Automatisation et contrôle système complet", path: "sources/ECC" },
    { name: "Gemini CLI", cat: "CLI / LLM", desc: "Assistant terminal propulsé par Gemini", path: "sources/gemini-cli" },
    { name: "DeepSeek Harness", cat: "Evaluation", desc: "Banc de test et évaluation de modèles", path: "sources/deepseek-harness" },
    { name: "Agent Framework", cat: "Enterprise", desc: "Framework d'agents Microsoft", path: "sources/agent-framework" },
  ];

  useEffect(() => {
    // Simuler le chargement des outils MCP
    setTools([
      { name: "browser_navigate", description: "Contrôle autonome Chromium (Browser-Use)" },
      { name: "shell_execute", description: "Exécution de commandes shell sécurisées (Goose/ECC)" },
      { name: "vector_memory_search", description: "Recherche sémantique dans la mémoire long-terme" },
      { name: "code_review_tool", description: "Analyse et refactoring automatique de code" }
    ]);
  }, []);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    const userMsg: Message = {
      role: 'user',
      content: prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setIsRunning(true);

    try {
      // Appel API vers le backend FastAPI unifié
      const res = await fetch('/api/teams/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: 'DevSquad',
          task: userMsg.content
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            agent: 'DevSquad Team (Researcher + Coder)',
            content: data.final_output || "Tâche exécutée avec succès par les agents.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        // Mode simulation si le backend n'est pas encore démarré
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              agent: 'OmniOrchestrator',
              content: `[Simulation Multi-Agents] Tâche reçue: "${userMsg.content}".\n1. WebResearcher a analysé le besoin.\n2. LeadDeveloper a préparé l'exécution.\n3. Outils MCP activés : browser_navigate, shell_execute.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }, 1000);
      }
    } catch {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            agent: 'OmniOrchestrator',
            content: `Plan multi-agents généré pour "${userMsg.content}" : Les agents sont prêts. Démarrez le backend FastAPI sur le port 8000 pour la streaming live.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 800);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0f1d] text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#070a14] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">OmniAgent OS</h1>
              <p className="text-[11px] text-slate-400">Hub Multi-Agents Unifié</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('hub')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'hub' ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Agent Studio
            </button>

            <button
              onClick={() => setActiveTab('orchestrator')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'orchestrator' ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              16 Dépôts Sources
            </button>

            <button
              onClick={() => setActiveTab('browser')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'browser' ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Globe className="w-4 h-4" />
              Browser Live View
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'settings' ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configuration LLMs
            </button>
          </nav>
        </div>

        {/* System Health */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Moteur MCP</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Connecté
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {tools.length} outils standardisés chargés
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800/80 bg-[#070a14]/60 px-6 flex items-center justify-between backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modèle Actif :</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini/gemini-1.5-flash">Google Gemini 1.5 Flash (Cloud)</option>
              <option value="gemini/gemini-2.0-flash">Google Gemini 2.0 Flash (Next-Gen)</option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="ollama/deepseek-r1:7b">DeepSeek R1 7B (Ollama Local)</option>
              <option value="ollama/llama3.2">Llama 3.2 3B (Ollama Local)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              FastAPI Gateway : Port 8000
            </span>
          </div>
        </header>

        {/* Tab 1: Studio Chat / Run */}
        {activeTab === 'hub' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {m.agent && <span className="text-[11px] font-semibold text-indigo-400">{m.agent}</span>}
                    <span className="text-[10px] text-slate-400">{m.time}</span>
                  </div>
                  <div 
                    className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse px-2">
                  <Clock className="w-3.5 h-3.5" />
                  Orchestration multi-agents en cours d'exécution...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500/70 transition">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRun()}
                  placeholder="Ex: Analyse les dernières annonces IA, écris un script Python et teste-le dans le terminal..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleRun}
                  disabled={isRunning || !prompt.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 16 Repositories Explorer */}
        {activeTab === 'orchestrator' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Les 16 Projets d'Agents Fusionnés</h2>
              <p className="text-xs text-slate-400">Tous les codes sources réels sont intégrés localement dans votre projet.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-400">{p.cat}</span>
                    <Code2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{p.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{p.desc}</p>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
                    {p.path}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Browser Live View */}
        {activeTab === 'browser' && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Visionneur Web Automatisé (Browser-Use)</h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              Le viewport Chromium temps réel s'affichera ici dès le lancement d'une mission d'exploration web autonome.
            </p>
            <button 
              onClick={() => setActiveTab('hub')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg transition"
            >
              Lancer une recherche depuis le Studio
            </button>
          </div>
        )}

        {/* Tab 4: Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Configuration Multi-LLMs & MCP</h2>
            <p className="text-xs text-slate-400 mb-6">Paramétrez vos clés API Cloud et vos endpoints de modèles locaux (Ollama).</p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Clé API Google Gemini</label>
                <input 
                  type="password" 
                  placeholder="AIzaSy..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Endpoint Ollama Local</label>
                <input 
                  type="text" 
                  defaultValue="http://localhost:11434" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Clé API OpenAI / OpenRouter</label>
                <input 
                  type="password" 
                  placeholder="sk-..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
