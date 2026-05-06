# InteractAI - AI-Powered Interview Preparation Platform

🚀 **A comprehensive interview preparation platform featuring AI voice interviews, live code challenges, and AI-moderated group discussions.**

![InteractAI](https://img.shields.io/badge/InteractAI-AI%20Interview%20Platform-primary?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)

---

## 🎯 Project Overview

InteractAI is a full-stack interview preparation platform designed to help candidates ace technical interviews through:

- **🎤 AI Voice Interviews** - Real-time mock interviews with instant feedback
- **💻 Interactive Code Editor** - Multi-language coding challenges with execution
- **👥 Group Discussion Rooms** - AI-moderated soft skills development
- **🎯 Job Matching** - AI-powered job compatibility scoring
- **📊 Performance Analytics** - Detailed progress tracking and insights
- **🏆 Global Leaderboard** - Compete with candidates worldwide

---

## 🏗️ Project Structure

```
hackathon/
├── client/                 # Next.js Frontend Application
│   ├── app/              # App Router Pages
│   ├── components/        # React Components
│   ├── lib/             # Utility Functions
│   └── public/          # Static Assets
├── server/               # Node.js Backend API
│   ├── src/             # Source Code
│   │   ├── routes/       # API Routes
│   │   ├── services/     # External Services
│   │   └── types/       # TypeScript Types
│   └── package.json     # Dependencies
├── piston/               # Self-hosted Code Execution Engine
│   ├── docker-compose.yml
│   └── setup_piston.sh
├── docker-compose.yml     # Main Docker Configuration
├── deploy.sh            # Deployment Script
├── start-dev.sh         # Development Startup Script
└── README.md           # This File
```

---

## 🚀 Quick Start (For Teammates)

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js** (v18+)
- **npm** (v9+)
- **Docker & Docker Compose**
- **Git**

### 2. Clone the Repository

```bash
git clone https://github.com/piyush-pine/Interactai.git
cd Interactai
```

### 3. One-Click Development Setup

🎯 **Easiest Method** - Use our automated setup script:

```bash
chmod +x start-dev.sh
./start-dev.sh
```

This script will:
- ✅ Install dependencies for client and server
- ✅ Set up environment variables
- ✅ Start all services automatically
- ✅ Provide live status updates

---

## 🛠️ Manual Setup (Advanced)

### Step 1: Setup Code Execution Engine (Piston)

```bash
# Navigate to piston folder
cd piston

# Start Piston service and install language runtimes
sudo ./setup_piston.sh

# Verify it's running
curl http://localhost:2000/api/v2/runtimes
```

**Supported Languages:**
- Python (3.8, 3.9, 3.10, 3.11)
- JavaScript (Node.js 16, 18, 20)
- Java (8, 11, 17)
- C++ (GCC 9, 11)
- C (GCC 9, 11)
- Go (1.19, 1.20)
- Rust (1.65, 1.68)
- Ruby (3.0, 3.1)
- PHP (8.0, 8.1)

### Step 2: Setup Backend Server

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
PISTON_API_URL=http://localhost:2000/api/v2
VAPI_API_KEY=your_vapi_api_key
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
```

```bash
# Start server in development mode
npm run dev
```

### Step 3: Setup Frontend Client

```bash
# Navigate to client folder
cd client

# Install dependencies
npm install

# Configure environment
cp env.template .env.local

# Edit .env.local with your configuration
nano .env.local
```

**Required Environment Variables:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
```

```bash
# Start client in development mode
npm run dev
```

---

## 🌐 Access Points

Once all services are running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Piston Code Execution**: http://localhost:2000
- **API Documentation**: http://localhost:5000/api-docs

---

## 🧪 Testing & Integration

### Test Code Execution

```bash
curl -X POST http://localhost:5000/api/codeExecution \
-H "Content-Type: application/json" \
-d '{
  "language": "python",
  "code": "print(\"Hello InteractAI!\")"
}'
```

### Test API Health

```bash
# Check server health
curl http://localhost:5000/health

# Check Piston status
curl http://localhost:2000/api/v2/runtimes
```

---

## 🚀 Deployment

### Production Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

**Deployment Features:**
- 🐳 Docker containerization
- 🔄 Zero-downtime deployment
- 📊 Health checks and monitoring
- 🗂️ Environment-specific configurations

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🎨 Features & Capabilities

### Core Features

- **🎤 AI Voice Interviews**
  - GPT-4 powered interview questions
  - Real-time voice analysis
  - Instant feedback and scoring
  - Role-specific preparation (SDE, Product, Data)

- **💻 Interactive Code Editor**
  - 12+ programming languages
  - Real-time code execution
  - Syntax highlighting and autocomplete
  - DSA problem library

- **👥 Group Discussion Rooms**
  - AI-moderated discussions
  - Soft skills assessment
  - Peer learning environment
  - Leadership presence analysis

- **🎯 AI Job Matcher**
  - Resume analysis
  - Skills gap identification
  - Company compatibility scoring
  - Personalized recommendations

### Advanced Features

- **📊 Performance Analytics**
  - Readiness score calculation
  - Progress tracking
  - Weakness identification
  - Improvement suggestions

- **🏆 Gamification**
  - XP system
  - Global leaderboard
  - Achievement badges
  - Weekly challenges

- **🔒 Enterprise Features**
  - Team management
  - Custom interview templates
  - Advanced analytics
  - Priority support

---

## 🔧 Development Commands

### Client Side (Next.js)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Server Side (Node.js)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Build TypeScript
npm run build
```

### Piston (Code Execution)

```bash
# Setup Piston with Docker
sudo ./setup_piston.sh

# Start Piston service
docker-compose up -d

# View available runtimes
curl http://localhost:2000/api/v2/runtimes

# Stop Piston
docker-compose down
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port
lsof -i :3000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**2. Docker Permission Issues**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Restart Docker service
sudo systemctl restart docker
```

**3. Node.js Version Issues**
```bash
# Check Node.js version
node --version

# Use correct version (nvm)
nvm use 18
nvm install 18
```

**4. Environment Variable Issues**
```bash
# Verify environment files
cat .env
cat .env.local

# Check for missing variables
npm run env-check
```

### Health Checks

```bash
# Check all services status
./start-dev.sh --check

# View logs
./start-dev.sh --logs

# Restart specific service
./start-dev.sh --restart client
./start-dev.sh --restart server
./start-dev.sh --restart piston
```

---

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/logout` - User logout

### Interview Endpoints

- `GET /api/interview` - Get interview sessions
- `POST /api/interview/start` - Start new interview
- `POST /api/interview/feedback` - Submit feedback

### Code Execution Endpoints

- `POST /api/codeExecution` - Execute code
- `GET /api/codeExecution/runtimes` - Get available languages

### Zoom Integration

- `POST /api/zoom/create-meeting` - Create Zoom meeting
- `GET /api/zoom/signature` - Get meeting signature

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](client/LICENSE) file for details.

---

## 👥 Team

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, TypeScript, Firebase
- **Infrastructure**: Docker, Docker Compose, Nginx
- **AI/ML**: OpenAI GPT-4, VAPI, Custom Models

---

## 📞 Support

For support and questions:

- 📧 Email: support@interactai.com
- 💬 Discord: [Join our community](https://discord.gg/interactai)
- 📖 Documentation: [docs.interactai.com](https://docs.interactai.com)
- 🐛 Issues: [GitHub Issues](https://github.com/piyush-pine/Interactai/issues)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=piyush-pine/Interactai&type=Date)](https://star-history.com/#piyush-pine/Interactai&Date)

---

**⭐ If you find this project helpful, please give it a star!**

---

*Built with ❤️ by Team Invincibles*
# interactaiupdated
