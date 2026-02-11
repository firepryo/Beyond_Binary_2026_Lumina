import React, { useState } from 'react';

interface TheVoidProps {
    onExit: () => void;
}

const TheVoid: React.FC<TheVoidProps> = ({ onExit }) => {
    const [text, setText] = useState("");
    const [isReleasing, setIsReleasing] = useState(false);
    const [released, setReleased] = useState(false);

    const handleRelease = () => {
        if (!text.trim()) return;
        setIsReleasing(true);
        setTimeout(() => {
            setReleased(true);
            setText("");
        }, 2000);
    };

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 animate-fade-in overflow-hidden">
            
            {/* Ambient Background Particles */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                 {[...Array(20)].map((_, i) => (
                     <div key={i} className="absolute rounded-full bg-slate-500 animate-float"
                          style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              width: `${Math.random() * 4}px`,
                              height: `${Math.random() * 4}px`,
                              animationDuration: `${Math.random() * 10 + 10}s`,
                              animationDelay: `${Math.random() * 5}s`
                          }}
                     />
                 ))}
            </div>

            <button 
                onClick={onExit}
                className="absolute top-8 left-8 text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest text-xs"
            >
                ← Return to Light
            </button>

            <div className="max-w-xl w-full text-center relative z-10">
                {!released ? (
                    <>
                        <div className={`transition-all duration-1000 ${isReleasing ? 'opacity-0 scale-150 filter blur-xl' : 'opacity-100'}`}>
                            <h2 className="text-3xl font-serif text-slate-300 mb-2">The Void</h2>
                            <p className="text-slate-500 text-sm mb-12 tracking-wide">
                                Speak into the silence. No one will hear. No one will judge.<br/>
                                Release your burden, and let it dissolve.
                            </p>

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What weighs on your soul?"
                                className="w-full h-32 bg-transparent border-b border-slate-800 text-center text-xl text-slate-200 focus:outline-none focus:border-slate-600 transition-colors resize-none placeholder-slate-700"
                                autoFocus
                            />

                            <button 
                                onClick={handleRelease}
                                disabled={!text.trim() || isReleasing}
                                className={`mt-12 px-10 py-3 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-900 transition-all duration-500 uppercase tracking-[0.2em] text-xs ${!text.trim() ? 'opacity-0' : 'opacity-100'}`}
                            >
                                Release
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="animate-fade-in text-center">
                        <div className="w-24 h-24 mx-auto mb-8 relative">
                             <div className="absolute inset-0 rounded-full border border-slate-800 animate-ping" style={{animationDuration: '3s'}}></div>
                             <div className="absolute inset-4 rounded-full border border-slate-700 animate-ping" style={{animationDuration: '2s', animationDelay: '0.5s'}}></div>
                        </div>
                        <p className="text-slate-400 font-serif italic text-lg mb-8">It is gone.</p>
                        <button 
                            onClick={() => { setReleased(false); setIsReleasing(false); }}
                            className="text-slate-600 hover:text-slate-300 transition-colors text-xs uppercase tracking-widest"
                        >
                            Speak Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TheVoid;