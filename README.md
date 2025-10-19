# 🎓 EchoNote

AI-powered lecture transcription and summarization tool. Upload lecture videos, get automatic transcripts with intelligent chapter segmentation and AI-generated summaries using Google Gemini.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-18.2+-blue.svg)

## ✨ Features

- **🎙️ Automatic Transcription**: Whisper AI converts speech to text with timestamps
- **📚 Smart Segmentation**: AI detects topic boundaries using semantic embeddings
- **🤖 AI Summaries**: Google Gemini generates titles, summaries, and key points for each chapter
- **⭐ Importance Scoring**: Each chapter rated 0.0-1.0 for study prioritization
- **📹 Modern Web UI**: React frontend with video playback and chapter navigation
- **💾 Local-First**: All data stored locally in `./data/` directory

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 14+**
- **ffmpeg** ([Download](https://ffmpeg.org/download.html))
- **Google Gemini API Key** ([Get one free](https://makersuite.google.com/app/apikey))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/souhrudhJ/EchoNote.git
cd EchoNote

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Set your Gemini API key
# Windows PowerShell:
$env:GEMINI_API_KEY="your-api-key-here"
# Linux/Mac:
export GEMINI_API_KEY="your-api-key-here"
```

### Running the App

**Terminal 1 - Backend:**
```bash
python server.py
```
Server starts at http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
App opens at http://localhost:3000

## 📖 Usage

1. **Upload Video**: Click "Upload Video" and select your lecture file (MP4, AVI, MOV, MKV, WebM)
2. **Transcribe**: Click "Transcribe" - takes 2-5 min for a 1-hour lecture
3. **Generate Summaries**: Click "Generate Summaries" - takes 1-3 min
4. **Browse Results**: View chapters with timestamps, summaries, and download JSON/SRT files

## 📂 Output Files

Each processed lecture generates:

```
data/
└── your-lecture-name/
    ├── video-file.mp4          # Original video
    ├── audio.wav               # Extracted audio
    ├── segments.json           # Timestamped transcript
    ├── lecture.srt             # Subtitle file
    ├── chapters_raw.json       # Chapters before summarization
    └── chapters.json           # Final chapters with AI summaries ⭐
```

### chapters.json Format

```json
{
  "chapter_id": 0,
  "start": 0.0,
  "end": 125.5,
  "title": "Introduction to Machine Learning",
  "summary": "Introduces ML basics and applications. Covers supervised vs unsupervised learning.",
  "importance": 0.85,
  "key_points": [
    "ML enables learning from data",
    "Supervised learning uses labeled data"
  ],
  "text": "Full transcript..."
}
```

## ⚙️ Configuration

### Transcription Settings

Edit `worker/transcribe_and_segment.py`:

```python
WINDOW_SIZE_SECONDS = 60        # Sliding window size
WINDOW_OVERLAP_SECONDS = 30     # Window overlap
SIMILARITY_THRESHOLD = 0.72     # Topic boundary threshold
WHISPER_MODEL_SIZE = "base"     # tiny, base, small, medium, large-v3
DEVICE = "cpu"                  # Use "cuda" for GPU acceleration
```

**GPU Support**: Set `DEVICE = "cuda"` for 10-50x faster transcription with NVIDIA GPU.

### Summarization Settings

Edit `worker/summarize_chapters.py`:

```python
GEMINI_MODEL = "gemini-2.5-flash"  # Fast; use gemini-2.5-pro for quality
```

### Importance Threshold

In `frontend/src/App.js`, adjust which chapters are highlighted:

```javascript
// Chapters with importance > 0.8 are marked as "important"
const IMPORTANT_THRESHOLD = 0.8;
```

## 🔧 API Endpoints

Backend API (http://localhost:5000):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload video file |
| `/api/transcribe` | POST | Start transcription |
| `/api/summarize` | POST | Generate AI summaries |
| `/api/lectures` | GET | List all lectures |
| `/api/lectures/:id` | GET | Get lecture details |
| `/api/lectures/:id/chapters` | GET | Get chapters JSON |
| `/api/videos/:id` | GET | Stream video file |
| `/api/status/:task_id` | GET | Check processing status |

## 🛠️ Command Line Usage

You can also use the workers directly:

```bash
# Transcribe and segment
python worker/transcribe_and_segment.py video.mp4

# Generate summaries
python worker/summarize_chapters.py data/video/chapters_raw.json

# Use local Ollama instead of Gemini
python worker/summarize_chapters.py data/video/chapters_raw.json --force-ollama
```

## 💡 Architecture

```
┌─────────────────┐
│  React Frontend │  ← User Interface (Port 3000)
│   (Vite + Axios)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Flask Backend  │  ← REST API (Port 5000)
│  (server.py)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐     ┌──────────────────┐
│    Workers      │ ──→ │  Gemini API      │
│  - transcribe   │     │  (Summarization) │
│  - summarize    │     └──────────────────┘
└─────────────────┘
         │
         ↓
┌─────────────────┐
│   Local Data    │
│   ./data/       │
└─────────────────┘
```

## 📊 How It Works

1. **Audio Extraction**: ffmpeg extracts audio as 16kHz mono WAV
2. **Transcription**: faster-whisper generates timestamped segments
3. **Segmentation**: 
   - Creates sliding windows (60s with 30s overlap)
   - Computes semantic embeddings
   - Detects topic boundaries via cosine similarity
4. **Summarization**: Gemini AI generates structured chapter summaries

## 🔒 Security

- ✅ API keys stored as environment variables only
- ✅ `.gitignore` excludes data directory and env files
- ✅ No API keys committed to repository
- ✅ All data processed locally

## 🐛 Troubleshooting

### Transcription Fails

**Issue**: ffmpeg not found
```bash
# Windows: choco install ffmpeg
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

### Summarization Fails

**Issue**: GEMINI_API_KEY not set

Ensure you set the API key **before** starting the server:
```bash
# PowerShell
$env:GEMINI_API_KEY="your-key"; python server.py

# Linux/Mac
export GEMINI_API_KEY="your-key" && python server.py
```

### Frontend Can't Connect

**Issue**: Backend not running

Make sure Flask server is running on port 5000. Check `frontend/package.json` has:
```json
"proxy": "http://localhost:5000"
```

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Whisper](https://github.com/openai/whisper) by OpenAI
- [faster-whisper](https://github.com/guillaumekln/faster-whisper) by Guillaume Klein
- [sentence-transformers](https://www.sbert.net/) by UKP Lab
- [Google Gemini](https://ai.google.dev/) by Google DeepMind

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📞 Support

- 🐛 Report bugs: [GitHub Issues](https://github.com/yourusername/EchoNote/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/EchoNote/discussions)

---

**Made with ❤️ for students and lifelong learners**
