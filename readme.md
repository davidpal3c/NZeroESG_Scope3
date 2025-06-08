
## 🌱 NZeroESG Scope3

Sustainable Sourcing Through Agentic Ai: Trace emissions, materials, and vendor compliance across supply chain.

Procurement and logistics account for a large share of Scope 3 emissions, but tracking their impact is often fragmented, non-actionable, and without real-time tools to analyze environmental impact. This project builds an agentic AI system using **LangChain’s ReAct framework** to make carbon intelligence conversational, traceable, and decision-ready.

<!-- Spreadsheet calculations and post-hoc reporting are no longer enough. -->
<!-- - AI for Carbon-Smart Supply-chain: Conversational, Context-Aware, and API-Powered -->

This AI agent aims to make carbon intelligence **interactive** and **data-backed**, helping users ask natural questions like:

- "What’s the carbon footprint of a 100kg shipment from Toronto to Vancouver by air?"
- "Is rail a better alternative?"
- "Which nearby supplier offers a lower-emission option?"

It combines real emissions APIs, ReAct-style reasoning, and structured tool invocation to provide a data-backed conversation.

---
### The LangChain’s agent is not just answering questions — it’s:

- Making decisions on what tool to use
- Parsing and formatting structured inputs
- Executing external logic (APIs, functions)
- Referring to memory to avoid repeated work and API over-fetching
- Handling fallback paths when tools fail


---
### ⚙️ Backend (AI Agent & Tool Logic)

| Stack                      | Role                                               |
|---------------------------|-----------------------------------------------------|
| **FastAPI**               | API framework for serving LLM + tool interactions   |
| **LangChain (ReAct Agent)**| Agent loop + structured tool orchestration         |
| **OpenRouter / OpenAI**   | LLM model serving (configurable)                    |
| **Carbon Interface + Climatiq API** | Real-time CO₂ emission estimates          |
| **Geopy + Nominatim**     | Distance resolution from city pairs                 |
| **Redis (planned)**       | Persistent memory, caching                          |
| **Fallback Logic**        | Uses IPCC/ECTA factors if APIs fail or exceed limit |


---
### 🖥 Frontend (Chat + Visualization Interface)

| Stack                  | Purpose                                               |
|------------------------|-------------------------------------------------------|
| **React + TypeScript** | Modern, typed UI for smooth UX                        |
| **Tailwind CSS**       | Utility-first styling with responsive design          |
| **Chart.js**           | Visualizes emissions comparisons and reporting        |
| **Framer Motion**      | UI animations, loading indicators, typing simulation  |
| **React Query**        | Efficient client-server state handling                |

**Features:**
- Resizable chat UI with drag-handle
- Real-time streaming messages with metadata (confidence, source, time)  
- Tool metadata (confidence, processing time, sources)
- Follow-up and context-aware replies
- Auto-scrolling, error-friendly UX, typing indicators
- Typing indicators, graceful error handling, follow-up logic


---
## Implemented Features (Backend)

[✓] LangChain ReAct Agent with structured tool use
[✓] Configurable LLM provider (OpenAI, OpenRouter)
[✓] EmissionsCalculator tool (real API + fallback logic)
[✓] DistanceResolver tool (via geopy + Nominatim)
[✓] OptionComparer tool (supports truck, train, ship, plane)
[✓] Input parser: extracts origin, destination, weight, transport mode
[✓] Clear fallback to reliable emission factors (IPCC, ECTA, CN Rail)
[✓] Conversation memory with LangChain `ConversationBufferMemory`
[✓] Emissions caching via hash key (avoids redundant API calls)



## What's Coming (2025)

- [ ] SupplierSelector tool with region-based filtering
- [ ] Redis session and emissions cache
- [ ] Upload CSV of purchase orders for emissions analysis
- [ ] Procurement simulation tool: cost vs. emissions vs. delivery time tradeoffs
- [ ] Vector DB integration (RAG): ESG policy / vendor PDF retrieval
- [ ] Vendor compliance checker: e.g., match vendor to sustainability policies
- [ ] **LangChain Expression Language (LCEL)** dynamically adjust agent behavior

### (Frontend)
- Real-time chat interface with:
  - Streaming message display
  - Tool metadata (confidence, source, processing time)
  - Typing indicators and error messages
  - Resizable UI and auto-scroll
- Chart.js integration for emissions comparison visualizations
- Frontend UI using React, TypeScript, TailwindCSS, Framer Motion



