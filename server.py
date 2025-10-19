#!/usr/bin/env python3
"""
Flask Backend API for Lecture Notes Generator

Endpoints:
- POST /api/upload - Upload video file
- POST /api/transcribe - Start transcription
- POST /api/summarize - Start summarization
- GET /api/lectures - List all processed lectures
- GET /api/lectures/<lecture_id> - Get lecture details
- GET /api/lectures/<lecture_id>/chapters - Get chapters
- GET /api/lectures/<lecture_id>/segments - Get segments
- GET /api/status/<task_id> - Get task status
- GET /api/videos/<lecture_id> - Serve video file
"""

import json
import os
import subprocess
import sys
import threading
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from slugify import slugify
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

UPLOAD_FOLDER = DATA_DIR / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

# Task tracking
tasks = {}
task_counter = 0


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def run_async_task(task_id: str, func, *args, **kwargs):
    """Run a task asynchronously and update status."""
    try:
        tasks[task_id]['status'] = 'running'
        result = func(*args, **kwargs)
        tasks[task_id]['status'] = 'completed'
        tasks[task_id]['result'] = result
        tasks[task_id]['completed_at'] = datetime.now().isoformat()
    except Exception as e:
        tasks[task_id]['status'] = 'failed'
        tasks[task_id]['error'] = str(e)
        tasks[task_id]['completed_at'] = datetime.now().isoformat()
        print(f"Task {task_id} failed: {str(e)}")  # Log to console


def transcribe_video(video_path: Path, lecture_dir: Path) -> Dict:
    """Run transcription and segmentation."""
    cmd = [
        sys.executable,
        "worker/transcribe_and_segment.py",
        str(video_path),
        "--output-dir", str(DATA_DIR)
    ]
    
    print(f"Running transcription: {' '.join(cmd)}")
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=False,  # Don't raise immediately, check manually
        env=os.environ.copy()  # Pass environment variables to subprocess
    )
    
    if result.returncode != 0:
        error_msg = f"Transcription failed (exit code {result.returncode}):\n"
        error_msg += f"STDOUT: {result.stdout}\n"
        error_msg += f"STDERR: {result.stderr}"
        print(error_msg)
        raise Exception(error_msg)
    
    return {
        "message": "Transcription completed",
        "segments": str(lecture_dir / "segments.json"),
        "srt": str(lecture_dir / "lecture.srt"),
        "chapters_raw": str(lecture_dir / "chapters_raw.json")
    }


def summarize_chapters_task(lecture_dir: Path) -> Dict:
    """Run chapter summarization."""
    chapters_raw = lecture_dir / "chapters_raw.json"
    
    cmd = [
        sys.executable,
        "worker/summarize_chapters.py",
        str(chapters_raw)
    ]
    
    print(f"Running summarization: {' '.join(cmd)}")
    
    # Prepare environment with API key
    env = os.environ.copy()
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        env["GEMINI_API_KEY"] = gemini_key
        print(f"GEMINI_API_KEY is set (length: {len(gemini_key)})")
    else:
        print("WARNING: GEMINI_API_KEY not found in environment!")
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=False,  # Don't raise immediately, check manually
        env=env  # Pass environment variables to subprocess
    )
    
    if result.returncode != 0:
        error_msg = f"Summarization failed (exit code {result.returncode}):\n"
        error_msg += f"STDOUT: {result.stdout}\n"
        error_msg += f"STDERR: {result.stderr}"
        print(error_msg)
        raise Exception(error_msg)
    
    return {
        "message": "Summarization completed",
        "chapters": str(lecture_dir / "chapters.json")
    }


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Lecture Notes Generator API"})


@app.route('/api/upload', methods=['POST'])
def upload_video():
    """Upload a video file."""
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
    
    # Generate lecture ID from filename
    original_filename = secure_filename(file.filename)
    lecture_id = slugify(Path(original_filename).stem)
    lecture_dir = DATA_DIR / lecture_id
    lecture_dir.mkdir(exist_ok=True)
    
    # Save video file
    video_path = lecture_dir / original_filename
    file.save(video_path)
    
    return jsonify({
        "lecture_id": lecture_id,
        "filename": original_filename,
        "path": str(video_path),
        "message": "Video uploaded successfully"
    })


@app.route('/api/transcribe', methods=['POST'])
def start_transcription():
    """Start transcription for a lecture."""
    global task_counter
    
    data = request.json
    lecture_id = data.get('lecture_id')
    
    if not lecture_id:
        return jsonify({"error": "lecture_id required"}), 400
    
    lecture_dir = DATA_DIR / lecture_id
    
    if not lecture_dir.exists():
        return jsonify({"error": "Lecture not found"}), 404
    
    # Find video file
    video_files = list(lecture_dir.glob("*.mp4")) + list(lecture_dir.glob("*.avi")) + \
                 list(lecture_dir.glob("*.mov")) + list(lecture_dir.glob("*.mkv")) + \
                 list(lecture_dir.glob("*.webm"))
    
    if not video_files:
        return jsonify({"error": "No video file found"}), 404
    
    video_path = video_files[0]
    
    # Create task
    task_counter += 1
    task_id = f"transcribe_{task_counter}"
    tasks[task_id] = {
        "task_id": task_id,
        "type": "transcription",
        "lecture_id": lecture_id,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    
    # Run async
    thread = threading.Thread(
        target=run_async_task,
        args=(task_id, transcribe_video, video_path, lecture_dir)
    )
    thread.start()
    
    return jsonify({
        "task_id": task_id,
        "message": "Transcription started"
    })


@app.route('/api/summarize', methods=['POST'])
def start_summarization():
    """Start summarization for a lecture."""
    global task_counter
    
    data = request.json
    lecture_id = data.get('lecture_id')
    
    if not lecture_id:
        return jsonify({"error": "lecture_id required"}), 400
    
    lecture_dir = DATA_DIR / lecture_id
    chapters_raw = lecture_dir / "chapters_raw.json"
    
    if not chapters_raw.exists():
        return jsonify({"error": "chapters_raw.json not found. Run transcription first."}), 404
    
    # Create task
    task_counter += 1
    task_id = f"summarize_{task_counter}"
    tasks[task_id] = {
        "task_id": task_id,
        "type": "summarization",
        "lecture_id": lecture_id,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    
    # Run async
    thread = threading.Thread(
        target=run_async_task,
        args=(task_id, summarize_chapters_task, lecture_dir)
    )
    thread.start()
    
    return jsonify({
        "task_id": task_id,
        "message": "Summarization started"
    })


@app.route('/api/status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get status of a task."""
    if task_id not in tasks:
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify(tasks[task_id])


@app.route('/api/lectures', methods=['GET'])
def list_lectures():
    """List all processed lectures."""
    lectures = []
    
    for lecture_dir in DATA_DIR.iterdir():
        if not lecture_dir.is_dir() or lecture_dir.name == 'uploads':
            continue
        
        lecture_info = {
            "lecture_id": lecture_dir.name,
            "has_video": len(list(lecture_dir.glob("*.mp4"))) + \
                        len(list(lecture_dir.glob("*.avi"))) + \
                        len(list(lecture_dir.glob("*.mov"))) + \
                        len(list(lecture_dir.glob("*.mkv"))) + \
                        len(list(lecture_dir.glob("*.webm"))) > 0,
            "has_segments": (lecture_dir / "segments.json").exists(),
            "has_chapters_raw": (lecture_dir / "chapters_raw.json").exists(),
            "has_chapters": (lecture_dir / "chapters.json").exists()
        }
        
        lectures.append(lecture_info)
    
    return jsonify({"lectures": lectures})


@app.route('/api/lectures/<lecture_id>', methods=['GET'])
def get_lecture(lecture_id):
    """Get lecture details."""
    lecture_dir = DATA_DIR / lecture_id
    
    if not lecture_dir.exists():
        return jsonify({"error": "Lecture not found"}), 404
    
    # Find video file
    video_files = list(lecture_dir.glob("*.mp4")) + list(lecture_dir.glob("*.avi")) + \
                 list(lecture_dir.glob("*.mov")) + list(lecture_dir.glob("*.mkv")) + \
                 list(lecture_dir.glob("*.webm"))
    
    lecture_info = {
        "lecture_id": lecture_id,
        "video_filename": video_files[0].name if video_files else None,
        "has_segments": (lecture_dir / "segments.json").exists(),
        "has_chapters_raw": (lecture_dir / "chapters_raw.json").exists(),
        "has_chapters": (lecture_dir / "chapters.json").exists()
    }
    
    return jsonify(lecture_info)


@app.route('/api/lectures/<lecture_id>/chapters', methods=['GET'])
def get_chapters(lecture_id):
    """Get chapters for a lecture."""
    lecture_dir = DATA_DIR / lecture_id
    chapters_file = lecture_dir / "chapters.json"
    
    if not chapters_file.exists():
        return jsonify({"error": "Chapters not found"}), 404
    
    with open(chapters_file, 'r', encoding='utf-8') as f:
        chapters = json.load(f)
    
    return jsonify({"chapters": chapters})


@app.route('/api/lectures/<lecture_id>/segments', methods=['GET'])
def get_segments(lecture_id):
    """Get transcript segments for a lecture."""
    lecture_dir = DATA_DIR / lecture_id
    segments_file = lecture_dir / "segments.json"
    
    if not segments_file.exists():
        return jsonify({"error": "Segments not found"}), 404
    
    with open(segments_file, 'r', encoding='utf-8') as f:
        segments = json.load(f)
    
    return jsonify({"segments": segments})


@app.route('/api/videos/<lecture_id>', methods=['GET'])
def serve_video(lecture_id):
    """Serve video file."""
    lecture_dir = DATA_DIR / lecture_id
    
    # Find video file
    video_files = list(lecture_dir.glob("*.mp4")) + list(lecture_dir.glob("*.avi")) + \
                 list(lecture_dir.glob("*.mov")) + list(lecture_dir.glob("*.mkv")) + \
                 list(lecture_dir.glob("*.webm"))
    
    if not video_files:
        return jsonify({"error": "Video not found"}), 404
    
    return send_file(video_files[0], mimetype='video/mp4')


@app.route('/api/lectures/<lecture_id>/download/<file_type>', methods=['GET'])
def download_file(lecture_id, file_type):
    """Download lecture files (srt, json, etc.)."""
    lecture_dir = DATA_DIR / lecture_id
    
    file_map = {
        'srt': 'lecture.srt',
        'segments': 'segments.json',
        'chapters': 'chapters.json',
        'chapters_raw': 'chapters_raw.json'
    }
    
    if file_type not in file_map:
        return jsonify({"error": "Invalid file type"}), 400
    
    file_path = lecture_dir / file_map[file_type]
    
    if not file_path.exists():
        return jsonify({"error": "File not found"}), 404
    
    return send_file(file_path, as_attachment=True)


if __name__ == '__main__':
    print("\n" + "="*60)
    print("Lecture Notes Generator API Server")
    print("="*60)
    print(f"API: http://localhost:5000")
    print(f"Data directory: {DATA_DIR.absolute()}")
    print("="*60 + "\n")

    # Make debug opt-in via FLASK_DEBUG env var and disable the auto-reloader by default
    # This prevents reloading on changes inside large directories like frontend/node_modules
    debug_env = os.getenv('FLASK_DEBUG', '0').lower()
    debug_mode = debug_env in ('1', 'true', 'yes', 'on')

    app.run(
        debug=debug_mode,
        host='0.0.0.0',
        port=5000,
        use_reloader=False
    )

