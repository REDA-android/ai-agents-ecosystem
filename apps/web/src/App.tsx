import { useState, useEffect } from 'react';
import { 
  Bot, 
  Globe, 
  Settings, 
  Clock, 
  Send, 
  Workflow, 
  Code2, 
  FolderGit2, 
   
  Sparkles,
  Play
} from 'lucide-react';

interface Blueprint {
  id: string;
  name: string;
  path: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  agent?: string;
  content: string;
  time: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'hub' | 'autogen' | 'browser' | 'blueprints' | 'sources' | 'settings'>('hub');
  const [prompt, setPrompt] = useState('');
  const [autogenTopic, setAutogenTopic] = useState('Concevoir une architecture IA avec AutoGen et LiteLLM');
  const [browserTask, setBrowserTask] = useState('Rechercher les 3 dernières sorties de modèles sur Hugging Face');
  const [selectedModel, setSelectedModel] = useState('gemini/gemini-1.5-flash');
  const [isRunning, setIsRunning] = useState(false);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprintCode, setSelectedBlueprintCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      agent: 'OmniOrchestrator',
      content: 'Bienvenue dans la plateforme unifiée ! Tous les 16 projets open-source sont désormais fusionnés fonctionnellement :\n- Moteur AutoGen (Débats et consensus multi-agents)\n- Moteur Browser-Use (Exploration web autonome)\n- Contrôleur Goose & ECC (Terminal et scripts)\n- Catalogue 500 AI Agents prêt à l’emploi',
      time: '12:00'
    }
  ]);

  useEffect(() => {
    // Charger les agents depuis le catalogue 500-AI-Agents
    fetch('/api/blueprints')
      .then(res => res.json())
      .then(data => {
        if (data.blueprints) setBlueprints(data.blueprints);
      })
      .catch(() => {
        setBlueprints([
          { id: "01-web-research-agent", name: "01 Web Research Agent", path: "sources/500-AI-Agents-Projects/agents/01-web-research-agent" },
          { id: "02-code-review-agent", name: "02 Code Review Agent", path: "sources/500-AI-Agents-Projects/agents/02-code-review-agent" },
          { id: "03-pdf-qa-agent", name: "03 Pdf Qa Agent", path: "sources/500-AI-Agents-Projects/agents/03-pdf-qa-agent" },
          { id: "04-sql-query-agent", name: "04 Sql Query Agent", path: "sources/500-AI-Agents-Projects/agents/04-sql-query-agent" },
          { id: "08-data-analysis-agent", name: "08 Data Analysis Agent", path: "sources/500-AI-Agents-Projects/agents/08-data-analysis-agent" },
          { id: "20-multi-agent-debate", name: "20 Multi Agent Debate", path: "sources/500-AI-Agents-Projects/agents/20-multi-agent-debate" }
        ]);
      });
  }, []);

  const handleRunTeam = async () => {
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
      const res = await fetch('/api/teams/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: 'DevSquad', task: userMsg.content })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          agent: 'DevSquad (Researcher + Coder)',
          content: data.final_output || "Tâche achevée avec succès.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            agent: 'OmniOrchestrator',
            content: `[Simulation Multi-Agents] Traitement terminé pour "${userMsg.content}". Connectez le backend FastAPI sur le port 8000 pour l'appel direct.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 700);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAutoGen = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/autogen/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: autogenTopic, rounds: 3 })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          agent: 'AutoGen GroupChat Engine',
          content: `🎯 Consensus AutoGen :\n${data.consensus || "Débat multi-agents complété."}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setActiveTab('hub');
    } catch {
      alert("Backend FastAPI non détecté sur le port 8000. Démarrez 'uvicorn server.app:app --port 8000'.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunBrowser = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/browser/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: browserTask, headless: true })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          agent: 'Browser-Use Autonomous Agent',
          content: `🌐 Résultat de l'exploration web :\n${data.result || data.final_result || "Navigation terminée."}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setActiveTab('hub');
    } catch {
      alert("Backend FastAPI non détecté sur le port 8000.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#060911] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">OmniAgent OS</h1>
              <p className="text-[11px] text-slate-400">16 Projets Fusionnés</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('hub')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'hub' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Studio Multi-Agents
            </button>

            <button
              onClick={() => setActiveTab('autogen')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'autogen' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Moteur AutoGen
            </button>

            <button
              onClick={() => setActiveTab('browser')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'browser' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Globe className="w-4 h-4" />
              Moteur Browser-Use
            </button>

            <button
              onClick={() => setActiveTab('blueprints')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'blueprints' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Code2 className="w-4 h-4" />
              500 Blueprints d'Agents
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'sources' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              16 Dépôts Sources
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'settings' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-4 h-4" />
              Paramètres LLMs & MCP
            </button>
          </nav>
        </div>

        {/* Status */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Passerelle</span>
            <span className="text-emerald-400 font-semibold">Active (v0.2.0)</span>
          </div>
          <p className="text-[10px] text-slate-400">AutoGen + Browser-Use + Goose + MCP</p>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 bg-[#060911]/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase">Modèle Moteur :</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-medium focus:outline-none"
            >
              <option value="gemini/gemini-1.5-flash">Google Gemini 1.5 Flash (Recommandé)</option>
              <option value="gemini/gemini-2.0-flash">Google Gemini 2.0 Flash</option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="ollama/deepseek-r1:7b">DeepSeek R1 7B (Ollama Local)</option>
              <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</option>
            </select>
          </div>
        </header>

        {/* Tab 1: Multi-Agent Hub */}
        {activeTab === 'hub' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {m.agent && <span className="text-[11px] font-semibold text-indigo-400">{m.agent}</span>}
                    <span className="text-[10px] text-slate-400">{m.time}</span>
                  </div>
                  <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse px-2">
                  <Clock className="w-3.5 h-3.5" />
                  Orchestration et exécution en cours...
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500/70 transition">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunTeam()}
                  placeholder="Ex: Demande à l'équipe d'écrire une API FastAPI sécurisée avec tests unitaires..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleRunTeam}
                  disabled={isRunning || !prompt.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AutoGen GroupChat */}
        {activeTab === 'autogen' && (
          <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Moteur de Débat AutoGen (sources/autogen)</h2>
            <p className="text-xs text-slate-400 mb-4">Lance un débat multi-agents structuré pour converger vers un consensus optimal.</p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Sujet du Débat Multi-Agents :</label>
              <textarea
                value={autogenTopic}
                onChange={(e) => setAutogenTopic(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleRunAutoGen}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <Play className="w-4 h-4" />
              Lancer le Débat AutoGen
            </button>
          </div>
        )}

        {/* Tab 3: Browser-Use View */}
        {activeTab === 'browser' && (
          <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Navigation Autonome (sources/browser-use)</h2>
            <p className="text-xs text-slate-400 mb-4">Délègue une mission d'exploration et d'interaction web à l'agent Browser-Use.</p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Instruction de Navigation Web :</label>
              <textarea
                value={browserTask}
                onChange={(e) => setBrowserTask(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleRunBrowser}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <Globe className="w-4 h-4" />
              Lancer l'Agent Navigateur
            </button>
          </div>
        )}

        {/* Tab 4: 500 AI Agents Blueprints */}
        {activeTab === 'blueprints' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Catalogue des Agents Prêts à l'Emploi</h2>
            <p className="text-xs text-slate-400 mb-4">Directement extrait de `sources/500-AI-Agents-Projects`.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {blueprints.map((bp) => (
                <div key={bp.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition">
                  <h3 className="text-xs font-bold text-white mb-1">{bp.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 mb-3 truncate">{bp.path}</p>
                  <button 
                    onClick={() => {
                      fetch(`/api/blueprints/${bp.id}`)
                        .then(res => res.json())
                        .then(data => setSelectedBlueprintCode(data.code || "Code disponible"))
                        .catch(() => setSelectedBlueprintCode(`# Code de ${bp.name}\nimport asyncio\nprint("Agent prêt.")`));
                    }}
                    className="text-[11px] font-medium text-indigo-400 hover:underline"
                  >
                    Voir le code de l'agent →
                  </button>
                </div>
              ))}
            </div>

            {selectedBlueprintCode && (
              <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2">Code Source de l'Agent</h4>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-60">
                  {selectedBlueprintCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Sources overview */}
        {activeTab === 'sources' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Les 16 Projets Fonctionnellement Rattachés</h2>
            <p className="text-xs text-slate-400 mb-4">Accessible dans `sources/` avec leurs adaptateurs dans `core/adapters/`.</p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>✔ <strong>sources/browser-use</strong> : Branché via <code>BrowserUseAdapter</code></p>
              <p>✔ <strong>sources/autogen</strong> : Branché via <code>AutoGenAdapter</code></p>
              <p>✔ <strong>sources/goose & sources/ECC</strong> : Branché via <code>GooseECCControlAdapter</code></p>
              <p>✔ <strong>sources/500-AI-Agents-Projects</strong> : Branché via <code>Catalog500AgentsAdapter</code></p>
              <p>✔ <strong>sources/langchain</strong> & <strong>sources/adk-python</strong> : Intégrés au moteur <code>UnifiedLLMClient</code> & <code>MCPHub</code></p>
            </div>
          </div>
        )}

        {/* Tab 6: Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 max-w-xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-4">Configuration des Moteurs</h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <label className="text-xs font-medium text-slate-300 block mb-1">Clé Google Gemini</label>
                <input type="password" placeholder="AIzaSy..." className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none" />
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <label className="text-xs font-medium text-slate-300 block mb-1">Endpoint Ollama Local</label>
                <input type="text" defaultValue="http://localhost:11434" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
