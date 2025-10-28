#!/usr/bin/env python3
"""
Transcribe and segment a lecture video into topical chapters.

This module:
1. Extracts audio from video using ffmpeg
2. Transcribes audio using faster-whisper
3. Segments transcript into topical chapters using embeddings + change-point detection
4. Outputs: segments.json, lecture.srt, chapters_raw.json
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer
from faster_whisper import WhisperModel
from slugify import slugify
from tqdm import tqdm

# === CONFIGURATION ===
# Window configuration for topic segmentation
WINDOW_SIZE_SECONDS = 60  # Size of each sliding window
WINDOW_OVERLAP_SECONDS = 30  # Overlap between windows
SIMILARITY_THRESHOLD = 0.72  # Topic boundary threshold (lower = more boundaries)

# Whisper model configuration
WHISPER_MODEL_SIZE = "base"  # Options: tiny, base, small, medium, large-v2, large-v3
DEVICE = "cpu"  # Options: cpu, cuda (use "cuda" if you have GPU with CUDA)
COMPUTE_TYPE = "int8"  # Options: int8, float16, float32

# Embedding model
EMBEDDING_MODEL = "all-mpnet-base-v2"  # Good quality sentence embeddings


def extract_audio(video_path: str, output_audio_path: str) -> None:
    """Extract audio from video file using ffmpeg."""
    print(f"Extracting audio from {video_path}...")
    
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vn",  # No video
        "-acodec", "pcm_s16le",  # PCM 16-bit
        "-ar", "16000",  # 16kHz sample rate (Whisper standard)
        "-ac", "1",  # Mono
        "-y",  # Overwrite output
        output_audio_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"[OK] Audio extracted to {output_audio_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error extracting audio: {e.stderr.decode()}")
        sys.exit(1)
    except FileNotFoundError:
        print("Error: ffmpeg not found. Please install ffmpeg:")
        print("  Windows: choco install ffmpeg  or  scoop install ffmpeg")
        print("  macOS: brew install ffmpeg")
        print("  Linux: sudo apt install ffmpeg")
        sys.exit(1)


def transcribe_audio(audio_path: str, model_size: str = None, device: str = None, compute_type: str = None) -> List[Dict]:
    """Transcribe audio using faster-whisper and return timestamped segments.

    model_size/device/compute_type override module-level defaults when provided.
    """
    model_size = model_size or WHISPER_MODEL_SIZE
    device = device or DEVICE
    compute_type = compute_type or COMPUTE_TYPE

    print(f"Loading Whisper model ({model_size}) on {device} (compute_type={compute_type})...")
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    
    print(f"Transcribing {audio_path}...")
    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        language="en",  # Change to None for auto-detection
        word_timestamps=True
    )
    
    print(f"Detected language: {info.language} (probability: {info.language_probability:.2f})")
    
    # Convert to list of dicts
    result_segments = []
    for segment in tqdm(segments, desc="Processing segments"):
        result_segments.append({
            "id": segment.id,
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        })
    
    print(f"[OK] Transcribed {len(result_segments)} segments")
    return result_segments


def segments_to_srt(segments: List[Dict], output_path: str) -> None:
    """Convert segments to SRT subtitle format."""
    with open(output_path, 'w', encoding='utf-8') as f:
        for i, seg in enumerate(segments, 1):
            start_time = format_timestamp_srt(seg['start'])
            end_time = format_timestamp_srt(seg['end'])
            f.write(f"{i}\n")
            f.write(f"{start_time} --> {end_time}\n")
            f.write(f"{seg['text']}\n\n")
    
    print(f"[OK] SRT file written to {output_path}")


def format_timestamp_srt(seconds: float) -> str:
    """Format seconds to SRT timestamp (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def create_sliding_windows(
    segments: List[Dict],
    window_size: float,
    overlap: float
) -> List[Dict]:
    """
    Create sliding windows from segments.
    
    Returns list of windows with: {start, end, text, segment_ids}
    """
    if not segments:
        return []
    
    total_duration = segments[-1]['end']
    step = window_size - overlap
    
    windows = []
    current_start = 0
    
    while current_start < total_duration:
        window_end = min(current_start + window_size, total_duration)
        
        # Collect segments that overlap with this window
        window_segments = []
        window_text = []
        
        for seg in segments:
            # Segment overlaps with window if it starts before window ends
            # and ends after window starts
            if seg['start'] < window_end and seg['end'] > current_start:
                window_segments.append(seg['id'])
                window_text.append(seg['text'])
        
        if window_text:  # Only add non-empty windows
            windows.append({
                'start': current_start,
                'end': window_end,
                'text': ' '.join(window_text),
                'segment_ids': window_segments
            })
        
        current_start += step
    
    print(f"[OK] Created {len(windows)} sliding windows ({window_size}s window, {overlap}s overlap)")
    return windows


def compute_embeddings(texts: List[str], model_name: str = EMBEDDING_MODEL) -> np.ndarray:
    """Compute sentence embeddings for a list of texts."""
    print(f"Loading embedding model ({model_name})...")
    model = SentenceTransformer(model_name)
    
    print("Computing embeddings...")
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    return embeddings


def detect_topic_boundaries(
    embeddings: np.ndarray,
    threshold: float = SIMILARITY_THRESHOLD
) -> List[int]:
    """
    Detect topic boundaries using cosine similarity between adjacent windows.
    
    Returns list of window indices where topic boundaries occur.
    """
    if len(embeddings) < 2:
        return []
    
    # Compute cosine similarities between adjacent windows
    similarities = []
    for i in range(len(embeddings) - 1):
        # Cosine similarity
        cos_sim = np.dot(embeddings[i], embeddings[i + 1]) / (
            np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i + 1])
        )
        similarities.append(cos_sim)
    
    # Find boundaries where similarity drops below threshold
    boundaries = [0]  # Always start with first window
    for i, sim in enumerate(similarities):
        if sim < threshold:
            boundaries.append(i + 1)
    
    print(f"[OK] Detected {len(boundaries)} topic boundaries (threshold: {threshold})")
    return boundaries


def merge_windows_into_chapters(
    windows: List[Dict],
    boundaries: List[int]
) -> List[Dict]:
    """Merge windows into chapters based on detected boundaries."""
    chapters = []
    
    for i in range(len(boundaries)):
        start_idx = boundaries[i]
        end_idx = boundaries[i + 1] if i + 1 < len(boundaries) else len(windows)
        
        # Merge all windows in this chapter
        chapter_windows = windows[start_idx:end_idx]
        if not chapter_windows:
            continue
        
        # Combine text from all windows (deduplicate by using unique segment IDs)
        all_segment_ids = set()
        for w in chapter_windows:
            all_segment_ids.update(w['segment_ids'])
        
        chapter = {
            'chapter_id': i,
            'start': chapter_windows[0]['start'],
            'end': chapter_windows[-1]['end'],
            'segment_ids': sorted(list(all_segment_ids)),
            'text': ' '.join(w['text'] for w in chapter_windows)
        }
        chapters.append(chapter)
    
    print(f"[OK] Merged into {len(chapters)} chapters")
    return chapters


def reconstruct_chapter_text(chapter: Dict, segments: List[Dict]) -> str:
    """Reconstruct clean chapter text from original segments (no duplication)."""
    segment_dict = {seg['id']: seg for seg in segments}
    texts = [segment_dict[seg_id]['text'] for seg_id in chapter['segment_ids'] if seg_id in segment_dict]
    return ' '.join(texts)


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe and segment lecture video into topical chapters"
    )
    parser.add_argument(
        "video_path",
        help="Path to input video file"
    )
    parser.add_argument(
        "--output-dir",
        default="data",
        help="Output directory (default: data/)"
    )
    parser.add_argument(
        "--window-size",
        type=float,
        default=WINDOW_SIZE_SECONDS,
        help=f"Window size in seconds (default: {WINDOW_SIZE_SECONDS})"
    )
    parser.add_argument(
        "--overlap",
        type=float,
        default=WINDOW_OVERLAP_SECONDS,
        help=f"Window overlap in seconds (default: {WINDOW_OVERLAP_SECONDS})"
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=SIMILARITY_THRESHOLD,
        help=f"Similarity threshold for boundaries (default: {SIMILARITY_THRESHOLD})"
    )
    parser.add_argument(
        "--device",
        choices=["cpu", "cuda"],
        default=None,
        help="Device to run Whisper on (cpu or cuda). If not set, auto-detects CUDA if available."
    )
    parser.add_argument(
        "--compute-type",
        choices=["int8", "float16", "float32"],
        default=None,
        help="Compute type for faster-whisper (float16 recommended on CUDA)."
    )
    parser.add_argument(
        "--model-size",
        default=WHISPER_MODEL_SIZE,
        help=f"Whisper model size to use (default: {WHISPER_MODEL_SIZE})"
    )
    
    args = parser.parse_args()
    
    # Setup paths
    video_path = Path(args.video_path)
    if not video_path.exists():
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)
    
    lecture_name = slugify(video_path.stem)
    output_dir = Path(args.output_dir) / lecture_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    audio_path = output_dir / f"{lecture_name}.wav"
    segments_path = output_dir / "segments.json"
    srt_path = output_dir / "lecture.srt"
    chapters_path = output_dir / "chapters_raw.json"
    
    print(f"\n{'='*60}")
    print(f"Processing: {video_path.name}")
    print(f"Output directory: {output_dir}")
    print(f"{'='*60}\n")
    
    # Step 1: Extract audio
    if not audio_path.exists():
        extract_audio(str(video_path), str(audio_path))
    else:
        print(f"[OK] Audio already exists: {audio_path}")
    
    # Step 2: Transcribe
    if not segments_path.exists():
        # Resolve device / compute type / model size from CLI or auto-detection
        resolved_device = args.device
        resolved_compute = args.compute_type
        resolved_model = args.model_size

        # Auto-detect CUDA if device not provided
        if resolved_device is None:
            try:
                import torch
                has_cuda = torch.cuda.is_available()
            except Exception:
                has_cuda = False

            resolved_device = "cuda" if has_cuda else "cpu"

        # Default compute types: prefer float16 on CUDA, int8 on CPU
        if resolved_compute is None:
            resolved_compute = "float16" if resolved_device == "cuda" else "int8"

        print(f"Resolved ASR settings -> model={resolved_model}, device={resolved_device}, compute_type={resolved_compute}")

        segments = transcribe_audio(
            str(audio_path),
            model_size=resolved_model,
            device=resolved_device,
            compute_type=resolved_compute
        )

        # Save segments
        with open(segments_path, 'w', encoding='utf-8') as f:
            json.dump(segments, f, indent=2, ensure_ascii=False)
        print(f"[OK] Segments saved to {segments_path}")

        # Create SRT
        segments_to_srt(segments, str(srt_path))
    else:
        print(f"[OK] Segments already exist: {segments_path}")
        with open(segments_path, 'r', encoding='utf-8') as f:
            segments = json.load(f)
    
    # Step 3: Create sliding windows
    windows = create_sliding_windows(
        segments,
        window_size=args.window_size,
        overlap=args.overlap
    )
    
    # Step 4: Compute embeddings
    window_texts = [w['text'] for w in windows]
    embeddings = compute_embeddings(window_texts)
    
    # Step 5: Detect boundaries
    boundaries = detect_topic_boundaries(embeddings, threshold=args.threshold)
    
    # Step 6: Merge into chapters
    chapters = merge_windows_into_chapters(windows, boundaries)
    
    # Step 7: Reconstruct clean chapter text
    for chapter in chapters:
        chapter['text'] = reconstruct_chapter_text(chapter, segments)
    
    # Step 8: Save chapters
    with open(chapters_path, 'w', encoding='utf-8') as f:
        json.dump(chapters, f, indent=2, ensure_ascii=False)
    print(f"[OK] Chapters saved to {chapters_path}")
    
    print(f"\n{'='*60}")
    print(f"[OK] Pipeline complete!")
    print(f"  - Segments: {segments_path}")
    print(f"  - Subtitles: {srt_path}")
    print(f"  - Chapters: {chapters_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()

