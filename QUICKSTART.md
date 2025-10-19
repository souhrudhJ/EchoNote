# Quick Start Guide

## Installation (5 minutes)

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Verify ffmpeg
```bash
ffmpeg -version
```

If ffmpeg is not installed:
- **Windows**: `choco install ffmpeg` or `scoop install ffmpeg`
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

### 3. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Set it as environment variable:
```bash
export GEMINI_API_KEY="your-api-key-here"  # Linux/Mac
set GEMINI_API_KEY=your-api-key-here       # Windows CMD
$env:GEMINI_API_KEY="your-api-key-here"    # Windows PowerShell
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

## Running the App (2 terminals)

### Terminal 1: Start Backend
```bash
python server.py
```
✅ API running on http://localhost:5000

### Terminal 2: Start Frontend
```bash
cd frontend
npm start
```
✅ React app opens at http://localhost:3000

## Using the Web Interface

1. **Upload**: Click "Upload Video" and select your lecture video
2. **Transcribe**: Select the lecture → Click "Transcribe" (wait 2-5 min)
3. **Summarize**: Click "Generate Summaries" (wait 1-3 min)
4. **Browse**: View chapters, timestamps, summaries, and key points
5. **Download**: Download JSON or SRT files

## Command Line Alternative

```bash
# Process a video
python worker/transcribe_and_segment.py my-lecture.mp4
python worker/summarize_chapters.py data/my-lecture/chapters_raw.json

# Use local Ollama instead of Gemini (requires Ollama installed)
python worker/summarize_chapters.py data/my-lecture/chapters_raw.json --force-ollama
```

## Output Files

After processing, find files in `data/your-lecture/`:
- `segments.json` - All transcript segments with timestamps
- `lecture.srt` - Subtitles for video players
- `chapters.json` - Final chapters with AI summaries ⭐

## GPU Acceleration (Optional)

If you have NVIDIA GPU with CUDA:

Edit `worker/transcribe_and_segment.py`:
```python
DEVICE = "cuda"          # Instead of "cpu"
COMPUTE_TYPE = "float16" # Instead of "int8"
```

**Speed improvement: 10-50x faster** ⚡

## Configuration Tips

### More/Fewer Chapters

Edit `worker/transcribe_and_segment.py`:

**More chapters (detailed):**
```python
SIMILARITY_THRESHOLD = 0.65  # More boundaries
WINDOW_SIZE_SECONDS = 45     # Smaller windows
```

**Fewer chapters (broad):**
```python
SIMILARITY_THRESHOLD = 0.80  # Fewer boundaries
WINDOW_SIZE_SECONDS = 90     # Larger windows
```

### Better Summaries

Edit `worker/summarize_chapters.py`:
```python
GEMINI_MODEL = "gemini-1.5-pro"  # Better quality, higher cost
```

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is available
netstat -an | grep 5000  # Linux/Mac
netstat -an | findstr 5000  # Windows

# Kill process using port 5000 if needed
```

### Frontend can't connect
Make sure:
1. Backend is running on port 5000
2. Frontend proxy is set correctly in `frontend/package.json`

### Transcription fails
- Verify ffmpeg is installed: `ffmpeg -version`
- Check video file format (MP4, AVI, MOV, MKV, WebM)
- Look at backend terminal for error messages

### Summarization fails
- Verify Gemini API key is set: `echo $GEMINI_API_KEY`
- Check API quota at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Try local Ollama: `--force-ollama` flag

## API Endpoints

Quick reference for developers:

```bash
# Health check
curl http://localhost:5000/api/health

# List lectures
curl http://localhost:5000/api/lectures

# Get chapters
curl http://localhost:5000/api/lectures/my-lecture/chapters
```

## Next Steps

- 📖 Read the full [README.md](README.md) for detailed documentation
- 🎨 Customize the LLM prompt in `worker/summarize_chapters.py`
- 🔧 Adjust configuration constants in worker scripts
- 📦 Build production frontend: `cd frontend && npm run build`

## Cost Estimates

**Gemini API (Cloud):**
- gemini-1.5-flash: ~$0.05-0.15 per 1-hour lecture
- gemini-1.5-pro: ~$0.20-0.50 per 1-hour lecture

**Ollama (Local):**
- FREE, but slower and requires good CPU/RAM

## Example Workflow

```bash
# 1. Start services
python server.py  # Terminal 1
cd frontend && npm start  # Terminal 2

# 2. Open http://localhost:3000

# 3. Upload demo_video.mp4

# 4. Click "Transcribe" → wait

# 5. Click "Generate Summaries" → wait

# 6. Browse chapters and download results
```

Enjoy! 🎓
