#!/bin/bash
# Test script to validate the pipeline

set -e

echo "========================================="
echo "Testing Lecture Notes Generator Pipeline"
echo "========================================="
echo ""

# Check if demo video exists
if [ ! -f "demo_video.mp4" ]; then
    echo "Error: demo_video.mp4 not found"
    exit 1
fi

# Clean up previous test run
echo "Cleaning up previous test data..."
rm -rf data/demo-video
echo "✓ Clean"

# Run transcription
echo ""
echo "Testing transcription and segmentation..."
python worker/transcribe_and_segment.py demo_video.mp4
echo "✓ Transcription passed"

# Check outputs
echo ""
echo "Checking outputs..."

if [ ! -f "data/demo-video/segments.json" ]; then
    echo "✗ segments.json not created"
    exit 1
fi
echo "✓ segments.json exists"

if [ ! -f "data/demo-video/lecture.srt" ]; then
    echo "✗ lecture.srt not created"
    exit 1
fi
echo "✓ lecture.srt exists"

if [ ! -f "data/demo-video/chapters_raw.json" ]; then
    echo "✗ chapters_raw.json not created"
    exit 1
fi
echo "✓ chapters_raw.json exists"

# Validate JSON files
echo ""
echo "Validating JSON structure..."

python -c "import json; json.load(open('data/demo-video/segments.json'))"
echo "✓ segments.json is valid JSON"

python -c "import json; json.load(open('data/demo-video/chapters_raw.json'))"
echo "✓ chapters_raw.json is valid JSON"

# Count segments and chapters
SEGMENT_COUNT=$(python -c "import json; print(len(json.load(open('data/demo-video/segments.json'))))")
CHAPTER_COUNT=$(python -c "import json; print(len(json.load(open('data/demo-video/chapters_raw.json'))))")

echo ""
echo "Statistics:"
echo "  Segments: $SEGMENT_COUNT"
echo "  Chapters: $CHAPTER_COUNT"

if [ $SEGMENT_COUNT -eq 0 ]; then
    echo "✗ No segments found"
    exit 1
fi

if [ $CHAPTER_COUNT -eq 0 ]; then
    echo "✗ No chapters found"
    exit 1
fi

echo ""
echo "========================================="
echo "✓ All tests passed!"
echo "========================================="

