# EchoNote Frontend

Modern, beautiful React frontend for EchoNote built with Vite, TypeScript, and Tailwind CSS.

## 🎨 Features

- **Modern UI/UX**: Clean, professional interface with smooth animations
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Updates**: Live progress tracking for uploads and processing
- **Toast Notifications**: Beautiful, non-intrusive notifications
- **Search & Filter**: Easily find and filter chapters by importance
- **Skeleton Loading**: Smooth loading states for better UX

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Radix UI** - Headless UI primitives
- **Lucide Icons** - Beautiful icon set
- **Axios** - HTTP client
- **Sonner** - Toast notifications

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:5000`

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Frontend will be available at `http://localhost:8080`

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── ChapterCard.tsx  # Chapter display card
│   │   ├── LectureCard.tsx  # Lecture sidebar card
│   │   ├── UploadZone.tsx   # File upload component
│   │   ├── VideoPlayer.tsx  # Video player component
│   │   ├── EmptyState.tsx   # Empty state screens
│   │   └── LoadingSkeleton.tsx  # Loading states
│   ├── lib/
│   │   ├── api.ts           # API client functions
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── assets/              # Images and static files
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles & Tailwind
│   └── index.jsx            # Application entry point
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🎨 Design System

### Colors

- **Primary**: Purple gradient (`#6366f1` → `#8b5cf6`)
- **Success**: Emerald (`#10b981`)
- **Warning**: Amber (`#f59e0b`)
- **Info**: Blue (`#3b82f6`)
- **Destructive**: Red (`#ef4444`)

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold, large sizes
- **Body**: Regular, 16px minimum

### Components

All components follow the shadcn/ui design system with custom styling via Tailwind CSS.

## 🔌 API Integration

The frontend communicates with the backend via REST API:

- `GET /api/lectures` - List all lectures
- `GET /api/lectures/:id` - Get lecture details
- `GET /api/lectures/:id/chapters` - Get chapters
- `POST /api/upload` - Upload video
- `POST /api/transcribe` - Start transcription
- `POST /api/summarize` - Start summarization
- `GET /api/status/:taskId` - Get task status
- `GET /api/videos/:id` - Stream video

Proxy configuration in `vite.config.ts` forwards `/api` requests to `http://localhost:5000`.

## 🌙 Dark Mode

Dark mode is implemented using Tailwind's dark mode with class strategy. Toggle is available in the header. Preference is saved to localStorage.

## 📱 Responsive Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🎯 Key Features

### Upload Zone
- Drag & drop support
- Real-time upload progress
- File validation
- Beautiful animations

### Lecture Management
- Sidebar with all lectures
- Status badges (uploaded, transcribed, complete)
- Active state highlighting
- Smooth transitions

### Chapter Display
- Color-coded by importance
- Search functionality
- Importance filtering
- Expandable key points
- Timestamp display

### Video Player
- Native HTML5 controls
- Responsive aspect ratio
- Smooth loading states

## 🔧 Configuration

### Environment Variables

No frontend-specific environment variables needed. API proxy is configured in `vite.config.ts`.

### Customization

To customize the theme, edit:
- `tailwind.config.ts` - Tailwind theme
- `src/index.css` - CSS variables and custom styles

## 📦 Build Output

Production build creates optimized assets in `dist/` directory:

- Minified JavaScript
- Optimized CSS
- Compressed assets
- Code splitting

## 🤝 Contributing

When adding new components:

1. Use TypeScript for type safety
2. Follow shadcn/ui patterns
3. Use Tailwind for styling
4. Add proper accessibility attributes
5. Include loading states
6. Handle error cases

## 📄 License

Same as parent project (MIT)
