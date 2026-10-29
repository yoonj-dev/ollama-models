# Local Model Studio (local-model) 🦙✨

로컬 **Ollama 모델**, 커스텀 **Modelfile**, **Ollama 연동 설정(`config.json`)**, 그리고 **Hermes Agent 설정(`config.yaml`)**을 종합적으로 관리하고 한눈에 조망할 수 있는 인터랙티브 웹 UI 대시보드 도구입니다.

---

## 🌟 핵심 기능 요약

### 1. 🌐 모델 에코시스템 토폴로지 맵 (Ecosystem Map)
- **4자 간 유기적 바인딩 시각화**:
  1. **Ollama 엔진 실물 모델** (`gemma4-agent:latest`, `gemma4-coding:latest`, `gemma4-computer:latest`, `gemma4-daily:latest`, `gemma4:26b-a4b`)
  2. **커스텀 소스 정의** (`~/.ollama/custom_modelfiles/Modelfile.*`)
  3. **Ollama 연동 프로필** (`~/.ollama/config.json`)
  4. **Hermes Agent 모델 라우팅 & 위임** (`~/.hermes/config.yaml`)
- 각 역할별 모델의 설치 여부, 소스 파일 연결성, Hermes 델리게이션 바인딩 상태를 카드로 한눈에 점검.

### 2. 📁 커스텀 Modelfiles 매니저 (`~/.ollama/custom_modelfiles/`)
- `Modelfile.agent`, `Modelfile.coding`, `Modelfile.computer`, `Modelfile.daily`, `build_models.sh` 실시간 탐색 및 에디터 열람.
- **안전 보존 규칙 (Safety-First)**:
  - 사용자가 명시적으로 저장할 때만 `~/.ollama/backup/custom_modelfiles/<name>.<timestamp>`로 원본 자동 백업 후 안전 저장.
- **원클릭 모델 빌드**:
  - `Ollama 모델 빌드` 버튼으로 실시간 스트리밍 터미널 콘솔을 통해 `ollama create` 즉시 실행.

### 3. 🦙 설치된 모델 관리 (Installed Models)
- 로컬 Ollama에 적재된 모든 모델의 이름, 크기(GB), 수정일, 포맷 및 메모리 상주(Active in RAM/VRAM) 뱃지 표시.
- **모델 상세 스펙 모달**:
  - Modelfile 원문, System 프롬프트, 파라미터(temperature, top_p, num_ctx 등), Chat Template 확인.
- 모델 복제(Copy) 및 안전 삭제(Delete) 확인 모달 지원.

### 4. ⚙️ 에이전트 설정 뷰어 (Config Viewer)
- **Hermes Agent (`~/.hermes/config.yaml`)**:
  - 기본 실행 모델 (`model.default`: `gemma4-agent:latest`), Provider 및 Context Window (64K) 요약.
  - Subagent Delegation 라우팅 매핑 테이블 (`coding`, `computer`, `daily` 대상 모델 및 역할 설명).
  - 프로바이더 등록 모델 목록 및 원문 YAML 뷰어.
- **Ollama Integrations (`~/.ollama/config.json`)**:
  - `hermes`, `hermes-desktop` 온보딩 상태 및 기본 선택(`last_selection`) 확인.
  - 원문 JSON 뷰어 및 최근 백업 히스토리 조회.

### 5. 💬 인터랙티브 플레이그라운드 (Playground)
- 수정하거나 생성한 로컬 모델을 즉시 선택하여 실시간 스트리밍 대화 테스트.
- System Prompt 오버라이드 및 Temperature 파라미터 미세 조절 지원.

---

## 🚀 실행 방법

### 간편 실행
```bash
cd /Users/yoonj/workspace/local-model
./run.sh
```
브라우저가 자동으로 열리며 `http://localhost:3400`에 접속됩니다.

### 단독 정적 HTML 대시보드 열기 (서버 불필요)
```bash
open /Users/yoonj/workspace/local-model/models_dashboard.html
```

### 수동 실행
```bash
npm install
npm run dev
```

---

## 🔒 안전 정책 (Safety Guarantee)

- 본 도구는 조회 시 원본 파일(`~/.ollama/custom_modelfiles/*`, `~/.ollama/config.json`, `~/.hermes/config.yaml`)을 전혀 변경하지 않는 **읽기 안전성(Read-Safe)**을 보장합니다.
- 사용자가 UI 상에서 명시적으로 수정을 저장할 때에도 기존 파일의 원형을 `~/.ollama/backup/` 디렉토리에 타임스탬프와 함께 자동 복사한 뒤 안전하게 저장합니다.
