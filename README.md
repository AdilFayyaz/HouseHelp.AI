# HouseHelp.AI 🏠🤖

An agentic AI web application that helps users diagnose and repair home issues using image analysis, voice/text descriptions, and AI-powered repair plans.

## Features

- 📷 **Image Upload**: Upload photos of broken home items
- 🗣️ **Voice/Text Input**: Describe issues with voice notes or text
- 🤖 **AI Analysis**: Phi-4 model analyzes images and generates repair plans
- 📊 **Visual Flowcharts**: Mermaid.js flowcharts for step-by-step repairs
- 🔧 **DIY vs Professional**: AI determines if repair is DIY-suitable or needs professional help
- 👨‍🔧 **Maintenance Providers**: Contact qualified professionals when needed
- 💬 **AI Chat**: Ask follow-up questions about repair steps
- 📝 **Audit Logging**: Track repair costs, time, and outcomes
- 📈 **Dashboard**: View repair history and statistics

## Architecture

### Backend (FastAPI + Python)
- **FastAPI** web framework for REST API
- **SQLAlchemy** ORM with SQLite database
- **Phi-4** Microsoft model for image analysis and repair planning
- **Mermaid** flowchart generation
- **Transformers** library for model integration

### Frontend (React + Material-UI)
- **React 18** with functional components and hooks
- **Material-UI (MUI)** for modern, responsive UI
- **React Router** for navigation
- **Axios** for API communication
- **Mermaid.js** for flowchart rendering
- **Recharts** for data visualization

### Database Schema
- **Issues**: Store uploaded images, descriptions, and repair plans
- **Maintenance Providers**: Registry of professional service providers
- **Audit Logs**: Track repair outcomes, costs, and completion status

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git
- **Ollama** (for AI model)

### Installation

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Or download from: https://ollama.ai
   ```

2. **Install Phi-4 Mini model**
   ```bash
   ollama pull phi4-mini
   ```

3. **Clone the repository**
   ```bash
   git clone https://github.com/AdilFayyaz/HouseHelp.AI.git
   cd HouseHelp.AI
   ```

4. **Set up the backend**
   ```bash
   cd backend
   chmod +x setup.sh
   ./setup.sh
   ```

5. **Set up the frontend**
   ```bash
   cd ../frontend
   chmod +x setup.sh
   ./setup.sh
   ```

### Running the Application

1. **Start Ollama (if not already running)**
   ```bash
   ollama serve
   ```

2. **Start the backend server**
   ```bash
   cd backend
   source ../venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Usage

### 1. Report an Issue
- Click "Report New Issue" on the dashboard
- Upload an image of the broken item
- Describe the problem in text or voice
- Submit the issue

### 2. AI Analysis
- Click "Analyze with AI" on the issue details page
- The Phi-4 model will:
  - Analyze the image and description
  - Generate a diagnosis
  - Create step-by-step repair instructions
  - Determine if it's DIY or requires professional help
  - Provide safety warnings and cost estimates

### 3. Follow Repair Plan
- View the visual flowchart of repair steps
- Follow step-by-step instructions
- Use the chat interface for questions
- Mark steps as completed

### 4. Professional Help (if needed)
- If AI determines professional help is needed
- Browse recommended maintenance providers
- Contact providers directly through the platform
- Track maintenance requests

### 5. Audit and Tracking
- Log repair completion status
- Record costs and time spent
- View repair history and statistics
- Track DIY vs professional repair rates

## API Endpoints

### Issues
- `POST /api/issues/` - Create new issue with image upload
- `GET /api/issues/` - List all issues
- `GET /api/issues/{id}` - Get specific issue
- `POST /api/issues/{id}/analyze` - Analyze issue with AI
- `PUT /api/issues/{id}` - Update issue status

### Maintenance Providers
- `GET /api/providers/` - List providers (optional specialty filter)
- `POST /api/providers/` - Add new provider
- `POST /api/issues/{id}/call-maintenance` - Contact provider

### Chat & Analytics
- `POST /api/chat` - Chat with AI assistant
- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/audit-logs/` - Get audit logs

## Project Structure

```
HouseHelp.AI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # Database models and setup
│   │   ├── schemas.py           # Pydantic models
│   │   ├── ai_service.py        # Phi-4 model integration
│   │   └── flowchart_service.py # Mermaid chart generation
│   ├── uploads/                 # Uploaded images
│   ├── requirements.txt         # Python dependencies
│   └── setup.sh                 # Backend setup script
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ImageUpload.js
│   │   │   ├── FlowchartDisplay.js
│   │   │   ├── ChatInterface.js
│   │   │   └── MaintenanceProviders.js
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.js
│   │   │   └── IssueDetails.js
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.js               # Main App component
│   │   └── index.js             # React entry point
│   ├── public/
│   ├── package.json             # Node.js dependencies
│   └── setup.sh                 # Frontend setup script
├── venv/                        # Python virtual environment
├── README.md
└── .gitignore
```

## Development

### Backend Development
```bash
cd backend
source ../venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm start
```

### Database Management
The SQLite database is automatically created when the backend starts. Sample maintenance providers are also added automatically.

### AI Model
The application uses Phi-4 Mini via Ollama for local AI processing. The model provides intelligent analysis of home repair issues and generates contextual responses. If the model is not available, the system falls back to rule-based responses.

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```
DATABASE_URL=sqlite:///./househelp.db
MODEL_CACHE_DIR=./models
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend Configuration
Update `src/services/api.js` for different backend URLs:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Technologies Used

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- **Ollama** (Local AI model server)
- **Phi-4 Mini** (Microsoft model via Ollama)
- Pillow (Image processing)
- Uvicorn

### Frontend
- React 18
- Material-UI (MUI)
- React Router DOM
- Axios
- Mermaid.js
- Recharts
- React Dropzone

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the API documentation at `/docs`

---

Built with ❤️ for the AI House Hackathon
An agentic home repair assistant that analyzes images and voice notes of broken items, generates fix plans or flowcharts, and connects users with maintenance pros when needed.
