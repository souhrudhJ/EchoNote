#!/usr/bin/env python3
"""
Summarize lecture chapters using LLM (Gemini or local Ollama).

Takes chapters_raw.json and produces chapters.json with:
- title: Short chapter title
- summary: 2-3 sentence summary
- importance: Float 0.0-1.0
- key_points: List of key bullet points
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional

from tqdm import tqdm

# LLM Configuration
GEMINI_MODEL = "gemini-2.5-flash"  # Fast and cost-effective; use gemini-2.5-pro for better quality
OLLAMA_MODEL = "llama3.2"  # Local model via Ollama
BATCH_SIZE = 3  # How many small chapters to batch per API call (for cost efficiency)

# Exact prompt as specified
LLM_PROMPT_TEMPLATE = """You are an assistant that converts a lecture transcript segment into a short title, a concise summary, a numeric importance score, and short key points.
Input: a transcript excerpt and the start/end times (seconds).
Output: a JSON object with fields: title, summary, importance, key_points.
Requirements:
 - title: 3-7 words (no punctuation at the end).
 - summary: 2 sentences maximum, clear and actionable.
 - importance: float between 0.0 and 1.0 (0.0 = not important, 1.0 = essential for exam revision).
 - key_points: array of up to 5 short bullet sentences (max 12 words each).
Return only valid JSON.
Example:
{{"title":"Gradient Descent Intuition","summary":"Explains the intuition behind gradient descent and role of learning rate. Shows a simple example and pitfalls of overshooting.","importance":0.93,"key_points":["Definition of gradient descent","Effect of learning rate","Example with quadratic loss"]}}
Transcript: \"\"\"{}\"\"\"
Start: {}, End: {}"""


def check_gemini_available() -> bool:
    """Check if Gemini API key is available."""
    return bool(os.getenv("GEMINI_API_KEY"))


def check_ollama_available() -> bool:
    """Check if Ollama is installed and running."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def summarize_with_gemini(chapter: Dict, model: str = GEMINI_MODEL) -> Dict:
    """Summarize a chapter using Google Gemini API."""
    try:
        import google.generativeai as genai
    except ImportError:
        print("Error: google-generativeai package not installed. Run: pip install google-generativeai")
        sys.exit(1)
    
    # Configure Gemini API
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not set in environment")
        sys.exit(1)
    
    genai.configure(api_key=api_key)
    
    prompt = LLM_PROMPT_TEMPLATE.format(
        chapter['text'],
        chapter['start'],
        chapter['end']
    )
    
    try:
        # Initialize the model
        model_instance = genai.GenerativeModel(
            model_name=model,
            generation_config={
                "temperature": 0.3
            }
        )
        
        # Generate content
        response = model_instance.generate_content(prompt)
        
        # Extract JSON from response (handle markdown code blocks if present)
        response_text = response.text.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON response
        result = json.loads(response_text)
        return result
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        # Return fallback
        return {
            "title": f"Chapter {chapter.get('chapter_id', 0) + 1}",
            "summary": "Summary unavailable due to API error.",
            "importance": 0.5,
            "key_points": ["Content transcribed but not summarized"]
        }


def summarize_with_ollama(chapter: Dict, model: str = OLLAMA_MODEL) -> Dict:
    """Summarize a chapter using local Ollama."""
    prompt = LLM_PROMPT_TEMPLATE.format(
        chapter['text'][:2000],  # Limit text for local models
        chapter['start'],
        chapter['end']
    )
    
    try:
        # Call ollama via subprocess
        result = subprocess.run(
            ["ollama", "run", model, prompt],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            raise Exception(f"Ollama failed: {result.stderr}")
        
        # Try to parse JSON from output
        output = result.stdout.strip()
        
        # Ollama might wrap JSON in markdown code blocks
        if "```json" in output:
            output = output.split("```json")[1].split("```")[0].strip()
        elif "```" in output:
            output = output.split("```")[1].split("```")[0].strip()
        
        return json.loads(output)
        
    except subprocess.TimeoutExpired:
        print(f"Warning: Ollama timeout for chapter {chapter.get('chapter_id', 0)}")
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse Ollama JSON output: {e}")
    except Exception as e:
        print(f"Warning: Ollama error: {e}")
    
    # Fallback
    return {
        "title": f"Chapter {chapter.get('chapter_id', 0) + 1}",
        "summary": "Summary unavailable due to processing error.",
        "importance": 0.5,
        "key_points": ["Content transcribed but not summarized"]
    }


def summarize_chapters(
    chapters: List[Dict],
    use_gemini: bool = True,
    gemini_model: str = GEMINI_MODEL,
    ollama_model: str = OLLAMA_MODEL,
    show_progress: bool = True
) -> List[Dict]:
    """
    Summarize all chapters using LLM.
    
    Returns list of enriched chapters with title, summary, importance, key_points.
    """
    enriched_chapters = []
    
    iterator = tqdm(chapters, desc="Summarizing chapters") if show_progress else chapters
    
    for chapter in iterator:
        # Keep original fields
        enriched = {
            'chapter_id': chapter['chapter_id'],
            'start': chapter['start'],
            'end': chapter['end'],
            'text': chapter['text']
        }
        
        # Get summary from LLM
        if use_gemini:
            summary = summarize_with_gemini(chapter, model=gemini_model)
        else:
            summary = summarize_with_ollama(chapter, model=ollama_model)
        
        # Add summary fields
        enriched.update({
            'title': summary.get('title', f"Chapter {chapter['chapter_id'] + 1}"),
            'summary': summary.get('summary', ''),
            'importance': float(summary.get('importance', 0.5)),
            'key_points': summary.get('key_points', [])
        })
        
        enriched_chapters.append(enriched)
    
    return enriched_chapters


def main():
    parser = argparse.ArgumentParser(
        description="Summarize lecture chapters using LLM"
    )
    parser.add_argument(
        "chapters_file",
        help="Path to chapters_raw.json file"
    )
    parser.add_argument(
        "--output",
        help="Output path for chapters.json (default: same directory as input)"
    )
    parser.add_argument(
        "--force-ollama",
        action="store_true",
        help="Force use of local Ollama instead of Gemini"
    )
    parser.add_argument(
        "--gemini-model",
        default=GEMINI_MODEL,
        help=f"Gemini model to use (default: {GEMINI_MODEL})"
    )
    parser.add_argument(
        "--ollama-model",
        default=OLLAMA_MODEL,
        help=f"Ollama model to use (default: {OLLAMA_MODEL})"
    )
    
    args = parser.parse_args()
    
    # Load chapters
    chapters_path = Path(args.chapters_file)
    if not chapters_path.exists():
        print(f"Error: Chapters file not found: {chapters_path}")
        sys.exit(1)
    
    with open(chapters_path, 'r', encoding='utf-8') as f:
        chapters = json.load(f)
    
    print(f"Loaded {len(chapters)} chapters from {chapters_path}")
    
    # Determine which LLM to use
    use_gemini = False
    
    if args.force_ollama:
        print("Forcing Ollama (local LLM)...")
        if not check_ollama_available():
            print("Warning: Ollama not available. Install from https://ollama.ai/")
            print(f"After installing, run: ollama pull {args.ollama_model}")
            sys.exit(1)
    else:
        # Try Gemini first
        if check_gemini_available():
            print(f"Using Gemini ({args.gemini_model})...")
            use_gemini = True
        elif check_ollama_available():
            print(f"Gemini API key not found. Using Ollama ({args.ollama_model})...")
        else:
            print("Error: No LLM available!")
            print("Either:")
            print("  1. Set GEMINI_API_KEY environment variable, or")
            print("  2. Install Ollama from https://ollama.ai/")
            sys.exit(1)
    
    # Update models if specified (pass to functions)
    gemini_model = args.gemini_model if use_gemini else GEMINI_MODEL
    ollama_model = args.ollama_model if not use_gemini else OLLAMA_MODEL
    
    # Summarize chapters
    print(f"\n{'='*60}")
    print(f"Summarizing {len(chapters)} chapters...")
    print(f"{'='*60}\n")
    
    enriched_chapters = summarize_chapters(
        chapters,
        use_gemini=use_gemini,
        gemini_model=gemini_model,
        ollama_model=ollama_model
    )
    
    # Determine output path
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = chapters_path.parent / "chapters.json"
    
    # Save enriched chapters
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(enriched_chapters, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"[OK] Summarized chapters saved to {output_path}")
    print(f"{'='*60}\n")
    
    # Print summary statistics
    high_importance = [c for c in enriched_chapters if c['importance'] > 0.8]
    print(f"Statistics:")
    print(f"  Total chapters: {len(enriched_chapters)}")
    print(f"  High importance (>0.8): {len(high_importance)}")
    print(f"  Average importance: {sum(c['importance'] for c in enriched_chapters) / len(enriched_chapters):.2f}")


if __name__ == "__main__":
    main()

