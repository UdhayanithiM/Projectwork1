# FortiTwin: AI-Powered Interview & Assessment Platform

![FortiTwin Banner](https://via.placeholder.com/1200x400?text=FortiTwin+AI+Platform) ## 🚀 Overview

**FortiTwin** is a modern, full-stack AI interview platform designed to revolutionize the recruitment process. It acts as a "digital twin" of a professional interviewer, conducting technical and behavioral assessments with real-time feedback.

Unlike traditional forms, FortiTwin utilizes **RAG (Retrieval Augmented Generation)** to analyze candidate resumes and generate context-aware questions. It also features an **Emotion Engine** to analyze vocal sentiment (confidence, nervousness) during the interview.

## 🌟 Key Features

* **🧠 AI Neural Core:** Powered by Gemini/OpenAI to conduct dynamic, human-like conversations.
* **📄 Smart Resume Analysis:** Asynchronously parses resumes to tailor interview questions to the candidate's specific skills.
* **🗣️ Voice & Emotion Analysis:** Integrated with **Hume AI** to detect vocal cues like confidence and nervousness in real-time.
* **💻 Technical Sandbox:** Live coding environment for assessing programming skills (supports Python/JS).
* **📊 Comprehensive Reports:** Generates detailed scorecards covering technical accuracy, communication skills, and behavioral traits.
* **⚡ Async Architecture:** Uses **Redis** and **ARQ** to handle heavy workloads (PDF parsing, vector embedding) without blocking the UI.

## 🏗️ System Architecture

The project follows a monorepo structure:

| Service | Path | Tech Stack | Description |
| :--- | :--- | :--- | :--- |
| **Web App** | `/apps/web` | Next.js 14, TypeScript, Prisma, Tailwind | The user-facing frontend for Candidates and HR. |
| **AI Engine** | `/apps/ai-engine` | FastAPI, Python, LangChain, Qdrant | The brain handling LLMs, RAG, and Voice processing. |
| **Database** | - | MongoDB | Primary data store for users and assessments. |
| **Queue** | - | Redis + ARQ | Background job processing for resume ingestion. |

## 🛠️ Prerequisites

Ensure you have the following installed:
* **Node.js** (v18+)
* **Python** (3.10+)
* **Docker** (optional, for running Redis/Mongo easily)
* **MongoDB** (or a cloud Atlas URI)
* **Redis** (required for the AI Engine queue)

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/fortitwin.git](https://github.com/yourusername/fortitwin.git)
cd fortitwin