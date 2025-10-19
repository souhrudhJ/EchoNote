@echo off
REM Demo workflow for Lecture Notes Generator (Windows)
REM This script demonstrates the full pipeline on demo_video.mp4

echo =========================================
echo Lecture Notes Generator - Demo Workflow
echo =========================================
echo.

REM Check if demo video exists
if not exist "demo_video.mp4" (
    echo Error: demo_video.mp4 not found
    echo Please ensure demo_video.mp4 exists in the current directory
    exit /b 1
)

REM Step 1: Transcribe and segment
echo Step 1: Transcribing and segmenting video...
python worker\transcribe_and_segment.py demo_video.mp4
if errorlevel 1 (
    echo Error in transcription step
    exit /b 1
)

REM Step 2: Summarize chapters
echo.
echo Step 2: Generating chapter summaries...

REM Check if OpenAI API key is set
if "%OPENAI_API_KEY%"=="" (
    echo Warning: OPENAI_API_KEY not set. Trying Ollama...
    python worker\summarize_chapters.py data\demo-video\chapters_raw.json --force-ollama
) else (
    echo Using OpenAI for summarization...
    python worker\summarize_chapters.py data\demo-video\chapters_raw.json
)

if errorlevel 1 (
    echo Error in summarization step
    exit /b 1
)

REM Step 3: Display results
echo.
echo =========================================
echo Success! Pipeline complete!
echo =========================================
echo.
echo Generated files:
echo   - data\demo-video\segments.json
echo   - data\demo-video\lecture.srt
echo   - data\demo-video\chapters_raw.json
echo   - data\demo-video\chapters.json
echo.
echo To view results in web UI, run:
echo   streamlit run app.py
echo.

pause

