import React, { useState } from 'react';

interface JournalInputProps {
  onComplete: (text: string) => void;
  onCancel: () => void;
}

const JournalInput: React.FC<JournalInputProps> = ({ onComplete, onCancel }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim().length > 0) {
      onComplete(text);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full animate-fade-in px-6">
      <h2 className="text-3xl font-serif mb-8 text-slate-200 text-center">
        What drives you?
      </h2>
      
      <div className="w-full max-w-2xl relative mb-8 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="E.g., I love playing chess in the park, learning to code, or finding quiet cafes to read..."
            className="w-full h-48 bg-slate-800/80 backdrop-blur-xl text-white p-6 rounded-lg border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none text-lg leading-relaxed placeholder-slate-500 shadow-xl"
            autoFocus
          />
        </div>
      </div>

      <div className="flex space-x-6 items-center">
        <button 
          onClick={onCancel} 
          className="text-slate-400 hover:text-white transition-colors text-sm uppercase tracking-widest"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={text.trim().length === 0}
          className={`px-8 py-3 rounded-full font-semibold tracking-wide transition-all duration-300 transform hover:scale-105 ${
            text.trim().length > 0 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Find My Circle
        </button>
      </div>
    </div>
  );
};

export default JournalInput;