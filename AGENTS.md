# Project Instructions: Local Model Studio (local-model)

- **Project Purpose**: Web UI dashboard for inspecting, visualizing, managing, and building local Ollama models (`gemma4-*`), Modelfiles, `~/.ollama/config.json`, and `~/.hermes/config.yaml` delegation options.
- **Directory**: `/Users/yoonj/workspace/local-model` (formerly `ollama-models`)
- **Remote Repository**: `https://github.com/yoonj-dev/ollama-models.git`
- **Safety Rule**: Never overwrite or modify original files (`~/.ollama/custom_modelfiles/*`, `~/.ollama/config.json`, `~/.hermes/config.yaml`) during automated tests or without explicit user save triggers. Always maintain timestamped backups in `~/.ollama/backup/`.
- **Theme Standard**: Follow `theme-mode-standard` (Tailwind CSS v4 variant specificity, dual DOM synchronization, 3-state auto default, `color-scheme: only light`).
- **Brand UI**: Header 3-dot context menu (`data-brand-context-menu="true"`), support & ecosystem links (`🍺 Buy me a beer`, `🚀 개발자 페이지 (On Tap)`).
