import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (name: string, location: string, activity: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [activity, setActivity] = useState("");
  const [fading, setFading] = useState(false);

  const nextStep = () => {
    if (step === 1 && name.trim() === "") return; 
    if (step === 2 && location.trim() === "") return;
    if (step === 3 && activity.trim() === "") return;

    setFading(true);
    setTimeout(() => {
      // 0:Welcome, 1:Name, 2:Location, 3:Activity, 4:Scanning
      if (step < 4) { 
        setStep(prev => prev + 1);
        setFading(false);
      } else {
        onComplete(name || "Neighbor", location || "Unknown", activity || "Exploring");
      }
    }, 500);
  };

  const content = [
    {
      title: "Lumina Cohesion",
      text: "Discover the hidden network of activities and interests in your neighborhood.",
      action: "Connect Locally"
    },
    {
      title: "Your Identity",
      text: "What should your neighbors call you?",
      input: true,
      inputType: 'name',
      placeholder: "e.g. Jane from Apt 4B",
      action: "Next"
    },
    {
      title: "Your Base",
      text: "To find clusters near you, we need your general location.",
      input: true,
      inputType: 'location',
      placeholder: "e.g. 123 Main St, Brooklyn",
      action: "Next"
    },
    {
      title: "Your Passion",
      text: "What is the #1 activity you want to do with others?",
      input: true,
      inputType: 'activity',
      placeholder: "e.g. Hiking, Chess, Salsa",
      action: "Scan Neighborhood"
    },
    {
      title: "Triangulating...",
      text: "Identifying activity clusters and social sparks nearby.",
      action: "Enter Network",
      scanning: true
    }
  ];

  return (
    <div className="absolute inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      {/* Progress */}
      <div className="absolute top-10 flex space-x-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`} />
        ))}
      </div>

      <div className={`transition-opacity duration-500 transform ${fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} max-w-lg w-full`}>
        <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mb-8 mx-auto rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-6 leading-tight">
          {content[step].title}
        </h1>
        
        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
          {content[step].text}
        </p>

        {/* Inputs */}
        {content[step].input && (
             <input 
                type="text" 
                value={
                    content[step].inputType === 'name' ? name : 
                    content[step].inputType === 'location' ? location : activity
                }
                onChange={(e) => {
                    const val = e.target.value;
                    if (content[step].inputType === 'name') setName(val);
                    else if (content[step].inputType === 'location') setLocation(val);
                    else setActivity(val);
                }}
                placeholder={content[step].placeholder}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-6 py-4 text-white text-center text-xl focus:border-emerald-500 outline-none mb-8 transition-colors shadow-inner placeholder-slate-600"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
             />
        )}

        {/* Scanning Visual */}
        {content[step].scanning && (
            <div className="relative w-64 h-64 mx-auto mb-12 flex items-center justify-center">
                 {/* Radar rings */}
                 <div className="absolute inset-0 border border-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                 <div className="absolute inset-12 border border-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
                 <div className="absolute inset-24 border border-emerald-500/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                 
                 {/* Dots appearing */}
                 <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                 <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                 <div className="absolute top-1/2 right-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"></div>
            </div>
        )}

        {content[step].action && (
          <button 
            onClick={nextStep}
            disabled={
                (step === 1 && name.length === 0) ||
                (step === 2 && location.length === 0) ||
                (step === 3 && activity.length === 0)
            }
            className={`group relative px-8 py-3 bg-white text-slate-900 rounded-full font-semibold tracking-wide overflow-hidden transition-all ${((step === 1 && name.length === 0) || (step === 2 && location.length === 0) || (step === 3 && activity.length === 0)) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]'}`}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-200 to-teal-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">{content[step].action}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;