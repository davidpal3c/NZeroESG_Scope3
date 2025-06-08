
# 🌱 Footprint Ai: Carbon Footprint Monitoring & Optimization Agent

Procurement and logistics account for a large share of Scope 3 emissions—but tracking their impact is often fragmented and non-actionable, without real-time tools to analyze environmental impact. This project builds an agentic AI system using LangChain’s ReAct framework to make carbon intelligence conversational, traceable, and decision-ready.

<!-- Spreadsheet calculations and post-hoc reporting are no longer enough. -->
<!-- - AI for Carbon-Smart Supply-chain: Conversational, Context-Aware, and API-Powered -->

This AI agent aims to make carbon intelligence **interactive** and **data-backed**, helping users ask natural questions like:

- "What’s the carbon footprint of a 100kg shipment from Toronto to Vancouver by air?"
- "Is rail a better alternative?"
- "Which nearby supplier offers a lower-emission option?"

It combines real emissions APIs, ReAct-style reasoning, and structured tool invocation to provide a data-backed conversation.

---
The LangChain’s agent is not just answering questions — it’s:

- Making decisions on what tool to use
- Parsing and formatting structured inputs
- Executing external logic (APIs, functions)
- Referring to memory to avoid repeated work and API over-fetching
- Handling fallback paths when tools fail


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
- Real-time streaming messages
- Tool metadata (confidence, processing time, sources)
- Follow-up and context-aware replies
- Auto-scrolling, error-friendly UX, typing indicators
**Frontend**  
- `React, TailwindCSS, Charts.js`
- Resizable, real-time chat UI  
- Streaming messages with metadata (confidence, source, time)  
- Typing indicators, graceful error handling, follow-up logic

---

## Implemented Features (Backend)

- 🧠 LangChain ReAct Agent with structured tool use
- 🧾 EmissionsCalculator tool (real API + fallback logic)
- 📏 DistanceResolver tool (via geopy + Nominatim)
- 🚛 OptionComparer tool (supports truck, train, ship, plane)
- 🌍 SupplierSelector tool with region-based filtering
- 🧩 Input parser: extracts origin, destination, weight, transport mode
- 🧠 Conversation memory with LangChain `ConversationBufferMemory`
- 🧠 Emissions caching via hash key (avoids redundant API calls)


## What's Comming (Frontend - June 2025)

- 💬 Real-time chat interface with:
  - Streaming message display
  - Tool metadata (confidence, source, processing time)
  - Typing indicators and error messages
  - Resizable UI and auto-scroll
- 📊 Chart.js integration for emissions comparison visualizations
- 💅 Frontend UI using React, TypeScript, TailwindCSS, Framer Motion

- 🔐 Configurable LLM provider (OpenAI, OpenRouter)
- 🌿 Clear fallback to reliable emission factors (IPCC, ECTA, CN Rail)



## 🔮 Planned Enhancements (2025)

- 📦 **Vector DB integration (RAG)** for ESG policies, vendor PDFs
- 🔁 **n8n workflow triggers** for emission reports, audit alerts
- 📈 **CSV/Excel ingestion** of shipments for bulk emissions analysis
- 🧮 **Procurement simulation tool** (cost vs. emissions vs. delivery time)
- 🗂️ **RAG-enhanced supplier intelligence** (combine structured + doc insights)
- 🧠 **LangChain Expression Language (LCEL)** to dynamically adjust agent behavior
- 🧑‍💼 **Vendor compliance checker** (e.g., match vendor to sustainability policies)
- 🔄 **Persistent Redis-based chat + cache**
- 📅 **Scheduled emissions summaries** (weekly/monthly snapshot via n8n)
- 🧾 **Live emissions benchmarking** via web data scraping (IPCC, OECD)
- 🧪 **Real-time anomaly detection** for extreme values or data inconsistencies

