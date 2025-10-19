import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState({ transcribe: false, summarize: false });
  const [taskStatus, setTaskStatus] = useState({});

  // Load lectures on mount
  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    try {
      const response = await axios.get('/api/lectures');
      setLectures(response.data.lectures);
    } catch (error) {
      console.error('Error loading lectures:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      setUploadProgress(0);
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      alert(`Video uploaded successfully! Lecture ID: ${response.data.lecture_id}`);
      loadLectures();
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const selectLecture = async (lectureId) => {
    try {
      const response = await axios.get(`/api/lectures/${lectureId}`);
      setSelectedLecture(response.data);

      // Load chapters if available
      if (response.data.has_chapters) {
        const chaptersResponse = await axios.get(`/api/lectures/${lectureId}/chapters`);
        setChapters(chaptersResponse.data.chapters);
      } else {
        setChapters([]);
      }
    } catch (error) {
      console.error('Error loading lecture:', error);
    }
  };

  const startTranscription = async () => {
    if (!selectedLecture) return;

    try {
      setProcessing({ ...processing, transcribe: true });
      const response = await axios.post('/api/transcribe', {
        lecture_id: selectedLecture.lecture_id
      });

      const taskId = response.data.task_id;
      pollTaskStatus(taskId, 'transcribe');
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Transcription failed: ' + (error.response?.data?.error || error.message));
      setProcessing({ ...processing, transcribe: false });
    }
  };

  const startSummarization = async () => {
    if (!selectedLecture) return;

    try {
      setProcessing({ ...processing, summarize: true });
      const response = await axios.post('/api/summarize', {
        lecture_id: selectedLecture.lecture_id
      });

      const taskId = response.data.task_id;
      pollTaskStatus(taskId, 'summarize');
    } catch (error) {
      console.error('Summarization error:', error);
      alert('Summarization failed: ' + (error.response?.data?.error || error.message));
      setProcessing({ ...processing, summarize: false });
    }
  };

  const pollTaskStatus = async (taskId, type) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/status/${taskId}`);
        setTaskStatus({ ...taskStatus, [taskId]: response.data });

        if (response.data.status === 'completed') {
          clearInterval(interval);
          setProcessing({ ...processing, [type]: false });
          alert(`${type === 'transcribe' ? 'Transcription' : 'Summarization'} completed!`);
          
          // Reload lecture data
          if (selectedLecture) {
            selectLecture(selectedLecture.lecture_id);
          }
          loadLectures();
        } else if (response.data.status === 'failed') {
          clearInterval(interval);
          setProcessing({ ...processing, [type]: false });
          alert(`${type === 'transcribe' ? 'Transcription' : 'Summarization'} failed: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Status poll error:', error);
        clearInterval(interval);
        setProcessing({ ...processing, [type]: false });
      }
    }, 2000);
  };

  const formatTimestamp = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getImportanceColor = (importance) => {
    if (importance > 0.8) return '#ef4444'; // Red
    if (importance > 0.6) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 EchoNote</h1>
        <p>AI-powered lecture transcription and summarization</p>
      </header>

      <div className="container">
        {/* Upload Section */}
        <section className="upload-section">
          <h2>Upload Video</h2>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="file-input"
          />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}
        </section>

        <div className="main-content">
          {/* Lectures List */}
          <aside className="lectures-sidebar">
            <h2>Your Lectures</h2>
            {lectures.length === 0 ? (
              <p className="empty-state">No lectures yet. Upload a video to get started!</p>
            ) : (
              <ul className="lectures-list">
                {lectures.map((lecture) => (
                  <li
                    key={lecture.lecture_id}
                    className={`lecture-item ${selectedLecture?.lecture_id === lecture.lecture_id ? 'active' : ''}`}
                    onClick={() => selectLecture(lecture.lecture_id)}
                  >
                    <div className="lecture-name">{lecture.lecture_id}</div>
                    <div className="lecture-status">
                      {lecture.has_chapters && <span className="status-badge complete">✓ Complete</span>}
                      {lecture.has_chapters_raw && !lecture.has_chapters && <span className="status-badge transcribed">📝 Transcribed</span>}
                      {lecture.has_video && !lecture.has_chapters_raw && <span className="status-badge uploaded">📹 Uploaded</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Lecture Details */}
          <main className="lecture-details">
            {!selectedLecture ? (
              <div className="empty-state">
                <h2>Select a lecture to view details</h2>
              </div>
            ) : (
              <>
                <div className="lecture-header">
                  <h2>{selectedLecture.lecture_id}</h2>
                  <div className="action-buttons">
                    {!selectedLecture.has_segments && (
                      <button
                        onClick={startTranscription}
                        disabled={processing.transcribe}
                        className="btn btn-primary"
                      >
                        {processing.transcribe ? '⏳ Transcribing...' : '▶️ Transcribe'}
                      </button>
                    )}
                    {selectedLecture.has_chapters_raw && !selectedLecture.has_chapters && (
                      <button
                        onClick={startSummarization}
                        disabled={processing.summarize}
                        className="btn btn-primary"
                      >
                        {processing.summarize ? '⏳ Summarizing...' : '🤖 Generate Summaries'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Player */}
                {selectedLecture.video_filename && (
                  <div className="video-section">
                    <video
                      controls
                      className="video-player"
                      src={`/api/videos/${selectedLecture.lecture_id}`}
                    />
                  </div>
                )}

                {/* Chapters */}
                {chapters.length > 0 && (
                  <div className="chapters-section">
                    <h3>📚 Lecture Chapters</h3>
                    <div className="chapters-list">
                      {chapters.map((chapter) => (
                        <div key={chapter.chapter_id} className="chapter-card">
                          <div className="chapter-header">
                            <h4>
                              {chapter.importance > 0.8 && '⭐ '}
                              {chapter.title}
                            </h4>
                            <div className="chapter-meta">
                              <span className="timestamp">
                                🕐 {formatTimestamp(chapter.start)} - {formatTimestamp(chapter.end)}
                              </span>
                              <span
                                className="importance-badge"
                                style={{ backgroundColor: getImportanceColor(chapter.importance) }}
                              >
                                {chapter.importance.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <p className="chapter-summary">{chapter.summary}</p>
                          {chapter.key_points && chapter.key_points.length > 0 && (
                            <div className="key-points">
                              <strong>Key Points:</strong>
                              <ul>
                                {chapter.key_points.map((point, idx) => (
                                  <li key={idx}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download Links */}
                {selectedLecture.has_chapters && (
                  <div className="downloads-section">
                    <h3>📥 Downloads</h3>
                    <div className="download-links">
                      <a
                        href={`/api/lectures/${selectedLecture.lecture_id}/download/chapters`}
                        className="btn btn-secondary"
                      >
                        Download Chapters JSON
                      </a>
                      <a
                        href={`/api/lectures/${selectedLecture.lecture_id}/download/srt`}
                        className="btn btn-secondary"
                      >
                        Download Subtitles (SRT)
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

