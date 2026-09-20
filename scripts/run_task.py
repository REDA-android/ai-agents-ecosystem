import os
import sys
from datetime import datetime
from google import genai

def run_antigravity_task():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Erreur: La variable GEMINI_API_KEY n'est pas définie dans les secrets GitHub.")
        sys.exit(1)

    prompt = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("TASK_PROMPT", "Tâche Antigravity par défaut")
    
    print(f"=== Antigravity Cloud Task Execution ===")
    print(f"Date: {datetime.utcnow().isoformat()} UTC")
    print(f"Prompt reçu: {prompt}\n")

    client = genai.Client(api_key=api_key)
    
    # Exécution via Gemini 2.5 Flash / Flash Lite
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    output_filename = os.path.join(output_dir, f"result_{timestamp}.md")

    content_to_save = f"""# Rapport de tâche Antigravity (Exécuté dans le Cloud)

- **Date d'exécution** : {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")}
- **Prompt** : {prompt}

---

## Résultat / Réponse :

{response.text}

---
*Généré automatiquement par Antigravity Cloud Runner (GitHub Actions).*
"""

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(content_to_save)

    # Mise à jour du journal principal (latest_log.md)
    latest_log = os.path.join(output_dir, "LATEST_LOG.md")
    with open(latest_log, "w", encoding="utf-8") as f:
        f.write(content_to_save)

    print(f"Succès ! Le résultat a été sauvegardé dans : {output_filename}")

if __name__ == "__main__":
    run_antigravity_task()
