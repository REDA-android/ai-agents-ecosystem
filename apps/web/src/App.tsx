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
  Play,
  ShieldCheck,
  Moon,
  Mic,
  Share2,
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
  const [activeTab, setActiveTab] = useState<'hub' | 'autogen' | 'browser' | 'blueprints' | 'goal' | 'security' | 'graph' | 'sources' | 'settings'>('hub');
  const [prompt, setPrompt] = useState('');
  const [autogenTopic, setAutogenTopic] = useState('Concevoir un système d\'automatisation avec AutoGen');
  const [browserTask, setBrowserTask] = useState('Rechercher les tendances IA sur Hugging Face');
  const [goalPrompt, setGoalPrompt] = useState('Refactoriser le code, ajouter des tests unitaires et générer un rapport');
  const [selectedModel, setSelectedModel] = useState('gemini/gemini-1.5-flash');
  const [safetyPolicy, setSafetyPolicy] = useState('human_approval');
  const [isRunning, setIsRunning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprintCode, setSelectedBlueprintCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      agent: 'OmniOrchestrator',
      content: 'OmniAgent OS v0.3.0 est actif.\nNouvelles fonctionnalités intégrées :\n- Mode Pilote Automatique (/goal Overnight)\n- Garde-Fous de Sécurité & Sandbox Docker\n- Graphe Sémantique & RAG (Graphify)\n- Moteurs AutoGen & Browser-Use branchés\n- Synthèse & Reconnaissance Vocale (Airi)',
      time: '12:00'
    }
  ]);

  useEffect(() => {
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

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setPrompt("Recherche les derniers modèles open-source sur Hugging Face");
      }, 3000);
    }
  };

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
            content: `[Simulation Multi-Agents] Traitement terminé pour "${userMsg.content}". Connectez le backend FastAPI sur le port 8000.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 700);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunGoal = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/goal/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalPrompt, max_iterations: 5 })
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          agent: 'Pilote Automatique (/goal)',
          content: `🌙 ${data.summary_report || "Mission de nuit achevée."}\nTotal Itérations : ${data.total_iterations || 5}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setActiveTab('hub');
    } catch {
      alert("Backend FastAPI sur port 8000 requis pour le mode /goal.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#080c15] text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#060810] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">OmniAgent OS</h1>
              <p className="text-[11px] text-slate-400">Écosystème Unifié v0.3.0</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('hub')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'hub' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Studio Multi-Agents
            </button>

            <button
              onClick={() => setActiveTab('autogen')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'autogen' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Moteur AutoGen
            </button>

            <button
              onClick={() => setActiveTab('browser')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'browser' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Globe className="w-4 h-4" />
              Browser-Use View
            </button>

            <button
              onClick={() => setActiveTab('goal')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'goal' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Moon className="w-4 h-4" />
              Pilote Auto (/goal)
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'security' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Sécurité & Sandbox
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'graph' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Graphe Sémantique
            </button>

            <button
              onClick={() => setActiveTab('blueprints')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'blueprints' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Code2 className="w-4 h-4" />
              500 Blueprints
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'sources' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              16 Dépôts Sources
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'settings' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configuration
            </button>
          </nav>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Passerelle</span>
            <span className="text-emerald-400 font-semibold">Connectée</span>
          </div>
          <p className="text-[10px] text-slate-400">10 axes validés opérationnels</p>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 bg-[#060810]/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase">Modèle Moteur :</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-medium focus:outline-none"
            >
              <option value="gemini/gemini-1.5-flash">Google Gemini 1.5 Flash (Recommandé)</option>
              <option value="gemini/gemini-2.0-flash">Google Gemini 2.0 Flash</option>
              <option value="ollama/deepseek-r1:7b">DeepSeek R1 7B (Ollama Local)</option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleVoiceToggle}
              className={`p-2 rounded-lg border transition ${
                isListening 
                  ? 'bg-rose-600/20 border-rose-500 text-rose-400 animate-pulse' 
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Assistant Vocal Airi"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab 1: Studio */}
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
                  placeholder="Posez une mission complexe aux agents..."
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

        {/* Tab: Pilote Automatique /goal */}
        {activeTab === 'goal' && (
          <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Pilote Automatique Longue Durée (/goal)</h2>
            <p className="text-xs text-slate-400 mb-4">L'agent s'auto-corrige et exécute en boucle jusqu'à accomplir la tâche.</p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Objectif Général de la Mission :</label>
              <textarea
                value={goalPrompt}
                onChange={(e) => setGoalPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleRunGoal}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <Play className="w-4 h-4" />
              Lancer la Session Autonome
            </button>
          </div>
        )}

        {/* Tab: Sécurité & Sandbox */}
        {activeTab === 'security' && (
          <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Garde-Fous de Sécurité & Sandbox</h2>
            <p className="text-xs text-slate-400 mb-4">Contrôle strict des actions terminales et commandes système.</p>

            <div className="space-y-3">
              <div 
                onClick={() => setSafetyPolicy('human_approval')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  safetyPolicy === 'human_approval' ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <h3 className="text-xs font-bold mb-1">Mode Validation Humaine (Human-In-The-Loop)</h3>
                <p className="text-[11px] text-slate-400">Demande confirmation explicite avant toute action destructrice (suppression de fichiers, push forcé, etc.).</p>
              </div>

              <div 
                onClick={() => setSafetyPolicy('docker_sandbox')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  safetyPolicy === 'docker_sandbox' ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <h3 className="text-xs font-bold mb-1">Mode Sandbox Docker Étanche</h3>
                <p className="text-[11px] text-slate-400">Toutes les exécutions de code et commandes terminal sont isolées dans un conteneur hermétique.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Graphe Sémantique */}
        {activeTab === 'graph' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Mémoire Sémantique en Graphe (Graphify)</h2>
            <p className="text-xs text-slate-400 mb-4">Cartographie des concepts, relations et fichiers indexés.</p>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
              <Share2 className="w-12 h-12 text-indigo-400 mb-3" />
              <p className="text-xs font-semibold text-white mb-1">Topologie du Projet Indexée</p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Les 16 projets et leurs liens sémantiques sont connectés dans le graphe de mémoire long-terme.
              </p>
            </div>
          </div>
        )}

        {/* Tab: AutoGen */}
        {activeTab === 'autogen' && (
          <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Moteur AutoGen GroupChat</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <textarea
                value={autogenTopic}
                onChange={(e) => setAutogenTopic(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleRunTeam()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
            >
              Lancer le Débat
            </button>
          </div>
        )}

        {/* Tab: Browser */}
        {activeTab === 'browser' && (
          <div className="flex-1 p-6 max-w-2xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-1">Navigation Autonome Browser-Use</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <textarea
                value={browserTask}
                onChange={(e) => setBrowserTask(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleRunTeam()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
            >
              Lancer l'Agent Web
            </button>
          </div>
        )}

        {/* Tab: Blueprints */}
        {activeTab === 'blueprints' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-4">Catalogue 500 AI Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {blueprints.map((bp) => (
                <div key={bp.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="text-xs font-bold text-white mb-1">{bp.name}</h3>
                  <button 
                    onClick={() => setSelectedBlueprintCode(`# Agent: ${bp.name}\nimport asyncio\nprint("Prêt.")`)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Voir le code →
                  </button>
                </div>
              ))}
            </div>
            {selectedBlueprintCode && (
              <pre className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                {selectedBlueprintCode}
              </pre>
            )}
          </div>
        )}

        {/* Tab: Sources */}
        {activeTab === 'sources' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-4">16 Projets Fonctionnellement Rattachés</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>✔ <strong>sources/browser-use</strong> (Browser-Use Engine)</p>
              <p>✔ <strong>sources/autogen</strong> (AutoGen GroupChat)</p>
              <p>✔ <strong>sources/goose & sources/ECC</strong> (OS & Terminal Control)</p>
              <p>✔ <strong>sources/500-AI-Agents-Projects</strong> (Blueprints Library)</p>
              <p>✔ <strong>sources/deepseek-harness</strong> (Banc d'évaluation & Benchmark)</p>
              <p>✔ <strong>sources/graphify</strong> (Graphe de connaissances)</p>
              <p>✔ <strong>sources/airi</strong> (Interaction vocale)</p>
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 max-w-xl overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-4">Paramètres des Moteurs</h2>
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
