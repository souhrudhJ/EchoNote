# Lecture Notes Generator - React Frontend

Modern React frontend for the Lecture Notes Generator application.

## Features

- 📤 Video upload with progress tracking
- 📋 Lecture list and management
- ▶️ Integrated video player
- 📚 Interactive chapter viewer with importance highlighting
- 📥 Download chapters and subtitles
- 📊 Real-time processing status updates

## Development

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm start
```
Opens at http://localhost:3000

### Build for Production
```bash
npm run build
```
Creates optimized build in `/build` directory

## Configuration

The app proxies API requests to the Flask backend. To change the backend URL, edit `package.json`:

```json
"proxy": "http://localhost:5000"
```

For production deployment, set the backend URL in your environment or update API calls in `src/App.js` to use absolute URLs.

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.js              # Main application component
│   ├── App.css             # Application styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## API Integration

The frontend communicates with the Flask backend API:

- `POST /api/upload` - Upload video
- `POST /api/transcribe` - Start transcription
- `POST /api/summarize` - Start summarization
- `GET /api/lectures` - List lectures
- `GET /api/lectures/<id>/chapters` - Get chapters
- `GET /api/status/<task_id>` - Poll task status

## Styling

The app uses vanilla CSS with a modern gradient theme. Key colors:
- Primary: `#667eea` to `#764ba2` (gradient)
- Success: `#10b981`
- Warning: `#f59e0b`
- Error: `#ef4444`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Build Production Bundle
```bash
npm run build
```

### Serve with Static Server
```bash
npx serve -s build
```

### Deploy to Netlify/Vercel
1. Connect your Git repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variable for backend URL if needed

## License

MIT License - Part of the Lecture Notes Generator project

