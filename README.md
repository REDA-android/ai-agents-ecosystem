# AI Agents Ecosystem & Antigravity Cloud Runner

Ce dépôt permet d'exécuter des agents et des tâches **Antigravity** directement dans le cloud via **GitHub Actions**, y compris lorsque votre ordinateur local est éteint.

## Comment déclencher une tâche quand le PC est éteint ?

1. Rendez-vous dans l'onglet **Actions** de ce dépôt (ou sur l'application mobile GitHub).
2. Sélectionnez le workflow **Antigravity Runner (PC Éteint)**.
3. Cliquez sur **Run workflow**, inscrivez la tâche ou l'instruction à exécuter, puis validez.
4. Les résultats seront automatiquement enregistrés dans le dossier `output/` de ce dépôt.

## Configuration requise

- Le secret `GEMINI_API_KEY` doit être configuré dans **Settings > Secrets and variables > Actions**.
