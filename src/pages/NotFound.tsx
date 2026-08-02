import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-bright-snow font-sans antialiased flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-racing-red/10 border border-racing-red/30 rounded-2xl mb-6">
          <Disc className="w-10 h-10 text-racing-red" />
        </div>
        <h1 className="font-display font-black text-6xl text-bright-snow mb-2">404</h1>
        <h2 className="font-display font-bold text-xl text-bright-snow/80 mb-3">Page Not Found</h2>
        <p className="text-sm text-bright-snow/60 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-racing-red/30 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
