using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace OmniAgentLauncher
{
    static class Program
    {
        private static NotifyIcon trayIcon;
        private static ContextMenu trayMenu;
        private static Process serverProcess;
        private static string repoRoot;
        private static string pythonPath;

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Locate Repository Root
            repoRoot = AppDomain.CurrentDomain.BaseDirectory;
            if (!File.Exists(Path.Combine(repoRoot, "server", "app.py")))
            {
                // In case exe is in a subfolder or root
                DirectoryInfo parentDir = Directory.GetParent(repoRoot);
                if (parentDir != null)
                {
                    string parent = parentDir.FullName;
                    if (File.Exists(Path.Combine(parent, "server", "app.py")))
                    {
                        repoRoot = parent;
                    }
                }
            }

            // Find Python
            pythonPath = FindPythonExecutable();
            if (string.IsNullOrEmpty(pythonPath))
            {
                MessageBox.Show(
                    "Python n'a pas été détecté sur votre système.\nVeuillez installer Python ou l'ajouter à votre PATH.",
                    "OmniAgent OS - Erreur",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Setup Tray Menu
            trayMenu = new ContextMenu();
            trayMenu.MenuItems.Add("🌐 Ouvrir OmniAgent Studio", (s, e) => OpenUrl("http://localhost:8000"));
            trayMenu.MenuItems.Add("📚 Documentation API (/docs)", (s, e) => OpenUrl("http://localhost:8000/docs"));
            trayMenu.MenuItems.Add("🔌 Passerelle MCP (/mcp)", (s, e) => OpenUrl("http://localhost:8000/mcp"));
            trayMenu.MenuItems.Add("-");
            trayMenu.MenuItems.Add("🔄 Redémarrer OmniAgent OS", (s, e) => RestartServer());
            trayMenu.MenuItems.Add("❌ Quitter OmniAgent OS", (s, e) => ExitApplication());

            // Setup Tray Icon
            trayIcon = new NotifyIcon();
            trayIcon.Text = "OmniAgent OS v1.0.0 (Démarrage...)";
            trayIcon.ContextMenu = trayMenu;
            trayIcon.Visible = true;

            string iconPath = Path.Combine(repoRoot, "app.ico");
            if (File.Exists(iconPath))
            {
                try { trayIcon.Icon = new Icon(iconPath); }
                catch { trayIcon.Icon = SystemIcons.Application; }
            }
            else
            {
                trayIcon.Icon = SystemIcons.Application;
            }

            trayIcon.DoubleClick += (s, e) => OpenUrl("http://localhost:8000");

            // Attach Clean Exit Handlers
            AppDomain.CurrentDomain.ProcessExit += (s, e) => KillServerProcess();
            Application.ApplicationExit += (s, e) => KillServerProcess();

            // Start Server
            StartServerProcess();

            // Launch background waiter to open browser once healthy
            ThreadPool.QueueUserWorkItem(state =>
            {
                bool ready = WaitForServerReady(15000);
                if (ready)
                {
                    trayIcon.Text = "OmniAgent OS v1.0.0 (En Ligne)";
                    trayIcon.ShowBalloonTip(
                        3000,
                        "OmniAgent OS v1.0.0",
                        "Serveur FastAPI et Studio Web opérationnels sur http://localhost:8000",
                        ToolTipIcon.Info
                    );
                    OpenUrl("http://localhost:8000");
                }
                else
                {
                    trayIcon.Text = "OmniAgent OS (Vérifier logs)";
                    trayIcon.ShowBalloonTip(
                        4000,
                        "OmniAgent OS",
                        "Le serveur démarre. Cliquez pour ouvrir le Studio.",
                        ToolTipIcon.Warning
                    );
                }
            });

            Application.Run();
        }

        private static string FindPythonExecutable()
        {
            // 1. Check in same folder or virtualenv
            string localVenv = Path.Combine(repoRoot, ".venv", "Scripts", "python.exe");
            if (File.Exists(localVenv)) return localVenv;

            // 2. Check AppData local python installs
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string py314 = Path.Combine(localAppData, "Programs", "Python", "Python314", "python.exe");
            if (File.Exists(py314)) return py314;

            string py313 = Path.Combine(localAppData, "Programs", "Python", "Python313", "python.exe");
            if (File.Exists(py313)) return py313;

            string py312 = Path.Combine(localAppData, "Programs", "Python", "Python312", "python.exe");
            if (File.Exists(py312)) return py312;

            // 3. Check PATH
            var pathValues = Environment.GetEnvironmentVariable("PATH");
            if (pathValues != null)
            {
                foreach (var path in pathValues.Split(Path.PathSeparator))
                {
                    var fullPath = Path.Combine(path.Trim(), "python.exe");
                    if (File.Exists(fullPath)) return fullPath;
                }
            }

            return "python.exe";
        }

        private static void StartServerProcess()
        {
            try
            {
                KillServerProcess();

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = pythonPath,
                    Arguments = "-m uvicorn server.app:app --port 8000 --host 127.0.0.1",
                    WorkingDirectory = repoRoot,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                serverProcess = Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur lors du lancement du serveur : " + ex.Message, "OmniAgent OS", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static bool WaitForServerReady(int maxTimeoutMs)
        {
            int elapsed = 0;
            int step = 400;

            while (elapsed < maxTimeoutMs)
            {
                try
                {
                    HttpWebRequest request = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8000/api/health");
                    request.Timeout = 1000;
                    using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                    {
                        if (response.StatusCode == HttpStatusCode.OK)
                        {
                            return true;
                        }
                    }
                }
                catch
                {
                    // server still booting
                }

                Thread.Sleep(step);
                elapsed += step;
            }

            return false;
        }

        private static void RestartServer()
        {
            trayIcon.Text = "OmniAgent OS (Redémarrage...)";
            StartServerProcess();
            ThreadPool.QueueUserWorkItem(s =>
            {
                if (WaitForServerReady(10000))
                {
                    trayIcon.Text = "OmniAgent OS v1.0.0 (En Ligne)";
                    trayIcon.ShowBalloonTip(2000, "OmniAgent OS", "Serveur redémarré avec succès.", ToolTipIcon.Info);
                }
            });
        }

        private static void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch { }
        }

        private static void KillServerProcess()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                    serverProcess.WaitForExit(1000);
                    serverProcess = null;
                }
            }
            catch { }

            // Ensure port 8000 python is cleaned up
            try
            {
                ProcessStartInfo netstat = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %a",
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                Process netstatProc = Process.Start(netstat);
                if (netstatProc != null)
                {
                    netstatProc.WaitForExit(500);
                }
            }
            catch { }
        }

        private static void ExitApplication()
        {
            trayIcon.Visible = false;
            KillServerProcess();
            Application.Exit();
        }
    }
}
