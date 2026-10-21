# NexusFlow AI

**An AI-powered workspace for document management, intelligent chat, and automated workflows.**

NexusFlow AI is a full-stack web application designed to organize project workspaces, manage documents, interact with document content through AI-assisted chat, and execute workflows through a multi-agent pipeline.

##  Features

- **Dashboard:** View workspace, document, and workflow run statistics.
- **Workspace Management:** Create, edit, and delete workspaces to organize project activities.
- **Document Management:** Upload and process documents for retrieval and AI-assisted analysis.
- **AI Chat:** Interact with workspace content through a conversational interface.
- **Chat Controls:** Start new chats and clear chat conversations using dedicated UI controls.
- **Workflow Execution:** Run workflows through specialized agents for planning, retrieval, task processing, writing, and evaluation.
- **Document Retrieval:** Split document content into chunks and retrieve relevant information for answering questions.
- **Run Tracking:** View workflow run details, execution traces, results, and evaluations.
- **Authentication:** User registration, login, and JWT-based authentication.
- **Local AI Integration:** Use Ollama for local text generation and embedding generation, with fallback processing when the service is unavailable.
- **Responsive Interface:** A modern React interface with workspace navigation, status indicators, and interactive components.

##  Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, JavaScript |
| Styling | Tailwind CSS, PostCSS |
| Routing | React Router |
| API Communication | Axios |
| Data Fetching | TanStack Query |
| State Management | Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| AI Integration | Ollama |
| Document Processing | PDF parsing, DOCX extraction, CSV parsing, OCR utilities |
| Workflow Architecture | Planner, Retriever, Task, Writer, and Evaluator agents |
| Development Tools | Git, GitHub, Nodemon |

##  Project Structure

```text
neuroflow_ai/
├── client/
│   ├── src/
│   │   ├── api/             # API requests
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── store/           # Client-side state
│   │   ├── utils/           # Helper functions
│   │   ├── main.jsx
│   │   └── router.jsx
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── agents/          # AI workflow agents
│   │   ├── config/          # Environment and database config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic and AI services
│   │   └── server.js
│   ├── scripts/             # Utility scripts
│   ├── .env.example
│   └── package.json
│
└── README.md
```

##  Prerequisites

Install the following before running the application:

- [Node.js](https://nodejs.org/) and npm
- [Git](https://git-scm.com/)
- [MongoDB](https://www.mongodb.com/) — optional for local testing, recommended for persistent data
- [Ollama](https://ollama.com/) — optional, for local AI model integration

##  Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/neuroflow_ai.git
cd neuroflow_ai
```

Replace `YOUR_USERNAME` with your GitHub username and use your actual repository name if it differs.

### 2. Configure the backend

Open a terminal in the project root and run:

```bash
cd server
npm install
```

Create a `.env` file by copying the example file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Configure the values in `server/.env`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/neuroflow_ai

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=llama3.1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text

UPSTASH_REDIS_URL=
SEED_SAMPLE_DATA=true
```

**Important:** Ensure MongoDB is running before using a MongoDB connection string. If `MONGODB_URI` is left empty, the application uses in-memory storage, and data will not persist after a server restart.

### 3. Configure the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

The `client/.env` file should contain:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. Start the backend

In the backend terminal:

```bash
cd server
npm run dev
```

The backend API should be available at:

```text
http://localhost:3001
```

Check the health endpoint in your browser:

```text
http://localhost:3001/api/health
```

A successful response includes the API status and the active storage mode.

### 5. Start the frontend

In the frontend terminal:

```bash
cd client
npm run dev
```

Open the local URL displayed by Vite, normally:

**http://localhost:5173**

Keep both terminals running while using the application.

##  Setting Up Local AI with Ollama

To use local language models, install and start Ollama, then download the models configured in your backend environment.

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

Ensure Ollama is accessible at `http://127.0.0.1:11434` and that the model names match your `.env` configuration.

The application includes fallback logic for text generation and embeddings when Ollama is unavailable. AI-assisted output may therefore differ depending on whether the configured models are running.

##  API Overview

The backend organizes its API endpoints under `/api`.

| Endpoint | Purpose |
|---|---|
| `/api/health` | Check API health and storage mode |
| `/api/auth` | Authentication operations |
| `/api/workspaces` | Workspace management |
| `/api/documents` | Document operations |
| `/api/runs` | Workflow execution and run details |
| `/api/dashboard` | Dashboard statistics |

Specific HTTP methods and request formats depend on the individual route implementations.

##  Build the Frontend

To create a production frontend build:

```bash
cd client
npm run build
```

To preview the generated build locally:

```bash
npm run preview
```

The preview command serves the frontend build; the backend must still be running separately for API functionality.

## Security Notes

- Never commit `.env` files or expose API keys, database credentials, or JWT secrets.
- Keep `.env.example` files limited to placeholder values.
- Use a strong, randomly generated JWT secret outside development.
- Configure database access and deployment settings appropriately before exposing the application publicly.

##  Future Improvements

- Expand multi-agent workflow capabilities.
- Improve document retrieval accuracy and response citations.
- Add workflow scheduling and execution monitoring.
- Improve persistent chat history and workspace-level access controls.
- Add automated tests and production deployment configuration.

##  Development

Contributions and improvements are welcome. For local development, create a feature branch, make your changes, and submit a pull request.

---

**NexusFlow AI** — Bringing workspaces, documents, AI-assisted conversations, and automated workflows together in one application.



## Copyright and Usage

Copyright © 2026 Keerthi Chandana. All rights reserved.

NexusFlow AI is a personal project. Unless otherwise stated, the source code and original project materials are protected by copyright.

You are welcome to explore the repository, report issues, suggest improvements, and propose contributions through pull requests.

However, copying, redistributing, republishing, or using this project's source code or substantial portions of it in another project requires prior written permission from the copyright holder, except where permitted by applicable law.

Please do not present this project or its original work as your own.

For collaboration or permission to reuse the code, please contact the repository owner.
