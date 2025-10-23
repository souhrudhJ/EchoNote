import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GraduationCap, Download, Sparkles, Moon, Sun, Search } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { LandingPage } from './components/LandingPage';
import { LectureCard } from './components/LectureCard';
import { ChapterCard } from './components/ChapterCard';
import { VideoPlayer } from './components/VideoPlayer';
import { EmptyState } from './components/EmptyState';
import { LectureCardSkeleton, ChapterCardSkeleton } from './components/LoadingSkeleton';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';

function App() {
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState({ transcribe: false, summarize: false });
  const [taskStatus, setTaskStatus] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importanceFilter, setImportanceFilter] = useState<'all' | 'high' | 'medium' | 'normal'>('all');
  const [loading, setLoading] = useState(false);

  // Load lectures on mount
  useEffect(() => {
    loadLectures();
    
    // Check for dark mode preference
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const loadLectures = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/lectures');
      setLectures(response.data.lectures);
    } catch (error) {
      console.error('Error loading lectures:', error);
      toast.error('Failed to load lectures');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      setUploadProgress(0);
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(progress);
        }
      });

      toast.success(`Video uploaded successfully! Lecture ID: ${response.data.lecture_id}`);
      loadLectures();
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error.response?.data?.error || error.message));
      setUploadProgress(0);
    }
  };

  const selectLecture = async (lectureId: string) => {
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
      toast.error('Failed to load lecture details');
    }
  };

  const startTranscription = async () => {
    if (!selectedLecture) return;

    try {
      setProcessing({ ...processing, transcribe: true });
      const response = await axios.post('/api/transcribe', {
        lecture_id: (selectedLecture as any).lecture_id
      });

      const taskId = response.data.task_id;
      toast.info('Transcription started...');
      pollTaskStatus(taskId, 'transcribe');
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error('Transcription failed: ' + (error.response?.data?.error || error.message));
      setProcessing({ ...processing, transcribe: false });
    }
  };

  const startSummarization = async () => {
    if (!selectedLecture) return;

    try {
      setProcessing({ ...processing, summarize: true });
      const response = await axios.post('/api/summarize', {
        lecture_id: (selectedLecture as any).lecture_id
      });

      const taskId = response.data.task_id;
      toast.info('Summarization started...');
      pollTaskStatus(taskId, 'summarize');
    } catch (error: any) {
      console.error('Summarization error:', error);
      toast.error('Summarization failed: ' + (error.response?.data?.error || error.message));
      setProcessing({ ...processing, summarize: false });
    }
  };

  const pollTaskStatus = async (taskId: string, type: 'transcribe' | 'summarize') => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/status/${taskId}`);
        setTaskStatus({ ...taskStatus, [taskId]: response.data });

        if (response.data.status === 'completed') {
          clearInterval(interval);
          setProcessing({ ...processing, [type]: false });
          toast.success(`${type === 'transcribe' ? 'Transcription' : 'Summarization'} completed!`);
          
          // Reload lecture data
          if (selectedLecture) {
            selectLecture((selectedLecture as any).lecture_id);
          }
          loadLectures();
        } else if (response.data.status === 'failed') {
          clearInterval(interval);
          setProcessing({ ...processing, [type]: false });
          toast.error(`${type === 'transcribe' ? 'Transcription' : 'Summarization'} failed: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Status poll error:', error);
        clearInterval(interval);
        setProcessing({ ...processing, [type]: false });
      }
    }, 2000);
  };

  const formatTimestamp = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLectureStatus = (lecture: any): 'uploaded' | 'transcribed' | 'complete' => {
    if (lecture.has_chapters) return 'complete';
    if (lecture.has_chapters_raw) return 'transcribed';
    return 'uploaded';
  };

  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  // Filter chapters based on search and importance
  const filteredChapters = chapters.filter((chapter: any) => {
    const matchesSearch = searchQuery === '' || 
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesImportance = importanceFilter === 'all' ||
      (importanceFilter === 'high' && chapter.importance > 0.8) ||
      (importanceFilter === 'medium' && chapter.importance > 0.6 && chapter.importance <= 0.8) ||
      (importanceFilter === 'normal' && chapter.importance <= 0.6);

    return matchesSearch && matchesImportance;
  });

  return (
    <div className="min-h-screen gradient-bg transition-all duration-500">
      <Toaster richColors position="bottom-right" />
      
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 shadow-lg transition-all duration-500">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary via-purple-500 to-primary/70 bg-clip-text text-transparent">
                  EchoNote
                </h1>
                <p className="text-sm text-primary/70 font-medium">AI-powered lecture transcription</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Show landing page when no lectures */}
        {lectures.length === 0 && !loading ? (
          <LandingPage 
            onFileSelect={handleFileUpload}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
          />
        ) : (
          <>
            {/* Upload Section */}
            <section className="mb-8">
              <UploadZone 
                onFileSelect={handleFileUpload}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lectures Sidebar */}
          <aside className="lg:col-span-3">
            <Card className="p-5 sticky top-24 shadow-xl bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-900 border-2 border-primary/20 dark:border-primary/40 transition-all duration-500">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-primary/10">
                <h2 className="font-bold text-xl text-primary">Your Lectures</h2>
                <Badge className="gradient-primary text-white">{lectures.length}</Badge>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <LectureCardSkeleton />
                  <LectureCardSkeleton />
                  <LectureCardSkeleton />
                </div>
              ) : lectures.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No lectures yet. Upload a video to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {lectures.map((lecture: any) => (
                    <LectureCard
                      key={lecture.lecture_id}
                      title={lecture.lecture_id}
                      status={getLectureStatus(lecture)}
                      isActive={selectedLecture?.lecture_id === lecture.lecture_id}
                      onClick={() => selectLecture(lecture.lecture_id)}
                    />
                  ))}
                </div>
              )}
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {!selectedLecture ? (
              <EmptyState 
                title="Select a lecture to view details"
                description="Choose a lecture from the sidebar to see its video, chapters, and summaries"
                showIllustration={lectures.length === 0}
                showSteps={lectures.length === 0}
              />
            ) : (
              <div className="space-y-6">
                {/* Lecture Header */}
                <Card className="p-6 shadow-xl bg-gradient-to-br from-white via-white to-primary/5 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border-2 border-primary/20 dark:border-primary/40 transition-all duration-500">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{(selectedLecture as any).lecture_id}</h2>
                      <p className="text-sm text-muted-foreground">
                        {(selectedLecture as any).has_chapters && '✅ Fully processed'}
                        {!(selectedLecture as any).has_chapters && (selectedLecture as any).has_chapters_raw && '📝 Transcribed - ready for summarization'}
                        {!(selectedLecture as any).has_chapters_raw && '🎬 Ready for transcription'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!(selectedLecture as any).has_segments && (
                        <Button
                          onClick={startTranscription}
                          disabled={processing.transcribe}
                          className="gap-2 gradient-primary hover:opacity-90"
                        >
                          {processing.transcribe ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Transcribing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Transcribe
                            </>
                          )}
                        </Button>
                      )}
                      {(selectedLecture as any).has_chapters_raw && !(selectedLecture as any).has_chapters && (
                        <Button
                          onClick={startSummarization}
                          disabled={processing.summarize}
                          className="gap-2 gradient-primary hover:opacity-90"
                        >
                          {processing.summarize ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Summarizing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate Summaries
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Video Player */}
                {(selectedLecture as any).video_filename && (
                  <VideoPlayer videoUrl={`/api/videos/${(selectedLecture as any).lecture_id}`} />
                )}

                {/* Chapters */}
                {chapters.length > 0 && (
                  <div className="space-y-4">
                    <Card className="p-5 shadow-xl bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-900 border-2 border-primary/20 dark:border-primary/40 transition-all duration-500">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b-2 border-primary/10">
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold text-primary">📚 Lecture Chapters</h3>
                          <Badge className="gradient-primary text-white">{filteredChapters.length} of {chapters.length}</Badge>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search chapters..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 w-full sm:w-[200px]"
                            />
                          </div>
                          
                          <Tabs value={importanceFilter} onValueChange={(v) => setImportanceFilter(v as any)}>
                            <TabsList>
                              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                              <TabsTrigger value="high" className="text-xs">High</TabsTrigger>
                              <TabsTrigger value="medium" className="text-xs">Medium</TabsTrigger>
                              <TabsTrigger value="normal" className="text-xs">Normal</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      </div>
                    </Card>

                    <div className="space-y-4">
                      {filteredChapters.length === 0 ? (
                        <Card className="p-12 text-center">
                          <p className="text-muted-foreground">No chapters match your filters</p>
                        </Card>
                      ) : (
                        filteredChapters.map((chapter: any) => (
                          <ChapterCard
                            key={chapter.chapter_id}
                            title={chapter.title}
                            startTime={formatTimestamp(chapter.start)}
                            endTime={formatTimestamp(chapter.end)}
                            importance={chapter.importance}
                            summary={chapter.summary}
                            keyPoints={chapter.key_points || []}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Downloads */}
                {(selectedLecture as any).has_chapters && (
                  <Card className="p-6 shadow-xl bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-900 border-2 border-primary/20 dark:border-primary/40 transition-all duration-500">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                      <Download className="w-5 h-5" />
                      Downloads
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        asChild
                      >
                        <a
                          href={`/api/lectures/${(selectedLecture as any).lecture_id}/download/chapters`}
                          download
                        >
                          Download Chapters JSON
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                      >
                        <a
                          href={`/api/lectures/${(selectedLecture as any).lecture_id}/download/srt`}
                          download
                        >
                          Download Subtitles (SRT)
                        </a>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

