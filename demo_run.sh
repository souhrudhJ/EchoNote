#!/bin/bash
# Demo workflow for Lecture Notes Generator
# This script demonstrates the full pipeline on demo_video.mp4

set -e  # Exit on error

echo "========================================="
echo "Lecture Notes Generator - Demo Workflow"
echo "========================================="
echo ""

# Check if demo video exists
if [ ! -f "demo_video.mp4" ]; then
    echo "Error: demo_video.mp4 not found"
    echo "Please ensure demo_video.mp4 exists in the current directory"
    exit 1
fi

# Step 1: Transcribe and segment
echo "Step 1: Transcribing and segmenting video..."
python worker/transcribe_and_segment.py demo_video.mp4

# Step 2: Summarize chapters
echo ""
echo "Step 2: Generating chapter summaries..."

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Warning: OPENAI_API_KEY not set. Trying Ollama..."
    python worker/summarize_chapters.py data/demo-video/chapters_raw.json --force-ollama
else
    echo "Using OpenAI for summarization..."
    python worker/summarize_chapters.py data/demo-video/chapters_raw.json
fi

# Step 3: Display results
echo ""
echo "========================================="
echo "✓ Pipeline complete!"
echo "========================================="
echo ""
echo "Generated files:"
echo "  - data/demo-video/segments.json"
echo "  - data/demo-video/lecture.srt"
echo "  - data/demo-video/chapters_raw.json"
echo "  - data/demo-video/chapters.json"
echo ""
echo "To view results in web UI, run:"
echo "  streamlit run app.py"
echo ""

