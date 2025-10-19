#!/usr/bin/env python3
"""
Lecture Notes Generator - Streamlit Web UI

Upload a lecture video, transcribe it, segment into chapters, and generate summaries.
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional

import streamlit as st
from slugify import slugify

# === CONFIGURATION ===
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# Importance threshold for highlighting
IMPORTANT_THRESHOLD = 0.8


def format_timestamp(seconds: float) -> str:
    """Format seconds to MM:SS or HH:MM:SS."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def run_transcription(video_path: Path, lecture_dir: Path) -> bool:
    """Run the transcription and segmentation pipeline."""
    cmd = [
        sys.executable,
        "worker/transcribe_and_segment.py",
        str(video_path),
        "--output-dir", str(DATA_DIR)
    ]
    
    try:
        with st.spinner("🎙️ Transcribing and segmenting video... (this may take a few minutes)"):
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            st.success("✅ Transcription complete!")
            with st.expander("View transcription log"):
                st.code(result.stdout)
            return True
    except subprocess.CalledProcessError as e:
        st.error(f"❌ Transcription failed: {e.stderr}")
        return False


def run_summarization(lecture_dir: Path, force_ollama: bool = False) -> bool:
    """Run the chapter summarization pipeline."""
    chapters_raw = lecture_dir / "chapters_raw.json"
    
    if not chapters_raw.exists():
        st.error("chapters_raw.json not found. Run transcription first.")
        return False
    
    cmd = [
        sys.executable,
        "worker/summarize_chapters.py",
        str(chapters_raw)
    ]
    
    if force_ollama:
        cmd.append("--force-ollama")
    
    try:
        with st.spinner("🤖 Generating chapter summaries with LLM... (this may take a few minutes)"):
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            st.success("✅ Summarization complete!")
            with st.expander("View summarization log"):
                st.code(result.stdout)
            return True
    except subprocess.CalledProcessError as e:
        st.error(f"❌ Summarization failed: {e.stderr}")
        return False


def load_chapters(lecture_dir: Path) -> Optional[List[Dict]]:
    """Load chapters.json if it exists."""
    chapters_file = lecture_dir / "chapters.json"
    
    if not chapters_file.exists():
        return None
    
    with open(chapters_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_segments(lecture_dir: Path) -> Optional[List[Dict]]:
    """Load segments.json if it exists."""
    segments_file = lecture_dir / "segments.json"
    
    if not segments_file.exists():
        return None
    
    with open(segments_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def display_video_player(video_path: Path, lecture_name: str):
    """Display video player."""
    st.subheader("📹 Lecture Video")
    
    # Streamlit supports local video files
    with open(video_path, 'rb') as video_file:
        video_bytes = video_file.read()
        st.video(video_bytes)


def display_chapters(chapters: List[Dict], video_path: Path):
    """Display chapter summaries with clickable timestamps."""
    st.subheader("📚 Lecture Chapters")
    
    # Summary statistics
    total_chapters = len(chapters)
    important_chapters = [c for c in chapters if c.get('importance', 0) > IMPORTANT_THRESHOLD]
    avg_importance = sum(c.get('importance', 0) for c in chapters) / len(chapters) if chapters else 0
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Chapters", total_chapters)
    col2.metric("Important Chapters", len(important_chapters))
    col3.metric("Avg Importance", f"{avg_importance:.2f}")
    
    st.markdown("---")
    
    # Display each chapter
    for chapter in chapters:
        chapter_id = chapter.get('chapter_id', 0)
        title = chapter.get('title', f"Chapter {chapter_id + 1}")
        summary = chapter.get('summary', 'No summary available')
        importance = chapter.get('importance', 0.5)
        key_points = chapter.get('key_points', [])
        start = chapter.get('start', 0)
        end = chapter.get('end', 0)
        
        # Highlight important chapters
        is_important = importance > IMPORTANT_THRESHOLD
        
        # Chapter container
        with st.container():
            # Header with timestamp and importance badge
            col1, col2, col3 = st.columns([3, 1, 1])
            
            with col1:
                if is_important:
                    st.markdown(f"### ⭐ {title}")
                else:
                    st.markdown(f"### {title}")
            
            with col2:
                timestamp_str = f"{format_timestamp(start)} - {format_timestamp(end)}"
                st.caption(f"🕐 {timestamp_str}")
            
            with col3:
                # Importance indicator with color
                if importance > 0.8:
                    importance_color = "🔴"
                elif importance > 0.6:
                    importance_color = "🟡"
                else:
                    importance_color = "🟢"
                st.caption(f"{importance_color} {importance:.2f}")
            
            # Summary
            st.markdown(f"**Summary:** {summary}")
            
            # Key points
            if key_points:
                st.markdown("**Key Points:**")
                for point in key_points:
                    st.markdown(f"- {point}")
            
            # Video link (note: Streamlit's st.video doesn't support seeking to timestamp)
            # But we can show the timestamp for manual seeking
            st.caption(f"📍 Start at {format_timestamp(start)}")
            
            st.markdown("---")


def display_transcript(segments: List[Dict]):
    """Display full transcript."""
    st.subheader("📝 Full Transcript")
    
    transcript_text = ""
    for seg in segments:
        timestamp = format_timestamp(seg['start'])
        text = seg['text']
        transcript_text += f"[{timestamp}] {text}\n\n"
    
    st.text_area(
        "Transcript",
        transcript_text,
        height=400,
        help="Full timestamped transcript"
    )
    
    # Download button
    st.download_button(
        label="📥 Download Transcript",
        data=transcript_text,
        file_name="transcript.txt",
        mime="text/plain"
    )


def main():
    st.set_page_config(
        page_title="Lecture Notes Generator",
        page_icon="🎓",
        layout="wide"
    )
    
    st.title("🎓 Lecture Notes Generator")
    st.markdown("""
    Upload a lecture video to automatically:
    - 🎙️ Transcribe speech to text
    - 📚 Segment into topical chapters
    - 🤖 Generate summaries and key points
    - ⭐ Highlight important sections
    """)
    
    # Sidebar configuration
    st.sidebar.title("⚙️ Configuration")
    
    # LLM selection
    use_ollama = st.sidebar.checkbox(
        "Use local Ollama instead of OpenAI",
        help="Check if you don't have OpenAI API key and have Ollama installed locally"
    )
    
    if not use_ollama:
        if not os.getenv("OPENAI_API_KEY"):
            st.sidebar.warning("⚠️ OPENAI_API_KEY not found in environment")
            st.sidebar.info("Set your API key or use Ollama instead")
    
    st.sidebar.markdown("---")
    
    # File upload or selection
    st.subheader("1️⃣ Select Video")
    
    # Option 1: Upload new video
    uploaded_file = st.file_uploader(
        "Upload a lecture video",
        type=['mp4', 'avi', 'mov', 'mkv'],
        help="Upload a video file from your computer"
    )
    
    # Option 2: Use existing video from data/ folder
    existing_lectures = [d.name for d in DATA_DIR.iterdir() if d.is_dir()]
    
    if existing_lectures:
        st.markdown("**Or select an existing lecture:**")
        selected_lecture = st.selectbox(
            "Previously processed lectures",
            [""] + existing_lectures
        )
    else:
        selected_lecture = ""
    
    # Determine which video to use
    video_path = None
    lecture_name = None
    lecture_dir = None
    
    if uploaded_file:
        # Save uploaded file
        lecture_name = slugify(Path(uploaded_file.name).stem)
        lecture_dir = DATA_DIR / lecture_name
        lecture_dir.mkdir(exist_ok=True)
        
        video_path = lecture_dir / uploaded_file.name
        
        if not video_path.exists():
            with st.spinner("Saving uploaded video..."):
                with open(video_path, 'wb') as f:
                    f.write(uploaded_file.read())
                st.success(f"✅ Video saved: {video_path}")
        
    elif selected_lecture:
        lecture_name = selected_lecture
        lecture_dir = DATA_DIR / lecture_name
        
        # Find video file in lecture directory
        video_files = list(lecture_dir.glob("*.mp4")) + list(lecture_dir.glob("*.avi")) + \
                     list(lecture_dir.glob("*.mov")) + list(lecture_dir.glob("*.mkv"))
        
        if video_files:
            video_path = video_files[0]
    
    # Process video if selected
    if video_path and lecture_dir:
        st.success(f"📁 Working with: **{lecture_name}**")
        
        # Check what files already exist
        has_segments = (lecture_dir / "segments.json").exists()
        has_chapters_raw = (lecture_dir / "chapters_raw.json").exists()
        has_chapters = (lecture_dir / "chapters.json").exists()
        
        # Pipeline controls
        st.subheader("2️⃣ Process Video")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("▶️ Run Transcription", disabled=has_segments and has_chapters_raw):
                run_transcription(video_path, lecture_dir)
                st.rerun()
            
            if has_segments and has_chapters_raw:
                st.success("✅ Transcription already complete")
        
        with col2:
            if st.button("▶️ Generate Summaries", disabled=not has_chapters_raw or has_chapters):
                run_summarization(lecture_dir, force_ollama=use_ollama)
                st.rerun()
            
            if has_chapters:
                st.success("✅ Summaries already generated")
        
        # Display results
        if has_chapters:
            st.subheader("3️⃣ Results")
            
            # Load data
            chapters = load_chapters(lecture_dir)
            segments = load_segments(lecture_dir)
            
            # Tabs for different views
            tab1, tab2, tab3 = st.tabs(["📚 Chapters", "📝 Transcript", "📹 Video"])
            
            with tab1:
                if chapters:
                    display_chapters(chapters, video_path)
            
            with tab2:
                if segments:
                    display_transcript(segments)
            
            with tab3:
                display_video_player(video_path, lecture_name)
            
            # Download section
            st.sidebar.markdown("---")
            st.sidebar.subheader("📥 Downloads")
            
            # Download chapters JSON
            if chapters:
                chapters_json = json.dumps(chapters, indent=2, ensure_ascii=False)
                st.sidebar.download_button(
                    label="Download chapters.json",
                    data=chapters_json,
                    file_name=f"{lecture_name}_chapters.json",
                    mime="application/json"
                )
            
            # Download SRT
            srt_file = lecture_dir / "lecture.srt"
            if srt_file.exists():
                with open(srt_file, 'r', encoding='utf-8') as f:
                    srt_content = f.read()
                st.sidebar.download_button(
                    label="Download lecture.srt",
                    data=srt_content,
                    file_name=f"{lecture_name}.srt",
                    mime="text/plain"
                )
        
        elif has_segments:
            st.info("📝 Transcription complete. Click 'Generate Summaries' to continue.")
        
        else:
            st.info("👆 Click 'Run Transcription' to start processing the video.")
    
    else:
        st.info("👆 Upload a video or select an existing lecture to get started.")
    
    # Footer
    st.sidebar.markdown("---")
    st.sidebar.markdown("""
    ### 💡 How it works
    1. **Transcribe**: Extract audio and convert speech to text using Whisper
    2. **Segment**: Detect topic changes using semantic embeddings
    3. **Summarize**: Generate chapter summaries using LLM
    4. **Review**: Browse chapters, timestamps, and key points
    
    ### ⚙️ Configuration Notes
    - **Important chapters** have importance > 0.8
    - Adjust threshold in code if needed
    - GPU recommended for faster processing
    """)


if __name__ == "__main__":
    main()
