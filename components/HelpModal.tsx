
import React from 'react';

export type HelpContext = 'visualization' | 'chat' | 'video' | 'events' | 'members' | 'recording' | 'void' | 'landing' | 'onboarding' | 'processing';

interface HelpModalProps {
    context: HelpContext;
    onClose: () => void;
}

const helpContent: Record<HelpContext, { title: string; sections: { icon: string; header: string; text: string }[] }> = {
    'landing': {
        title: "Welcome to Lumina",
        sections: [
            { icon: "✨", header: "Find Your Circle", text: "Click the main button to start. You'll describe your interests verbally to find local matches." },
            { icon: "🔒", header: "Privacy First", text: "Your voice is analyzed locally or securely processed to generate a one-time profile. No audio is permanently stored." }
        ]
    },
    'recording': {
        title: "Journaling Mode",
        sections: [
            { icon: "🎙️", header: "Speak Freely", text: "Describe what you love doing. Example: 'I want to find a group for weekend hiking and photography.'" },
            { icon: "🎯", header: "Be Specific", text: "Mentioning specific locations or niche hobbies helps us triangulate better matches." }
        ]
    },
    'processing': {
        title: "Analyzing",
        sections: [
            { icon: "🧠", header: "AI Analysis", text: "Lumina is extracting key themes, sentiment, and location context from your input." },
            { icon: "🌐", header: "Cluster Matching", text: "We are scanning the mock database for existing community nodes that resonate with your profile." }
        ]
    },
    'visualization': {
        title: "The Constellation",
        sections: [
            { icon: "🖱️", header: "Navigation", text: "Click and drag to rotate the view. Scroll to zoom in/out." },
            { icon: "🔵", header: "Nodes", text: "Each sphere represents a person or group. Colors indicate category (e.g., Red=Sports, Green=Outdoors)." },
            { icon: "👋", header: "Interaction", text: "Click any node to see details. You can 'Plan Activity' or send a 'Wave' (a non-verbal signal)." },
            { icon: "🔍", header: "Search", text: "Type in the search bar to highlight specific activities. The view will dim unrelated nodes." }
        ]
    },
    'void': {
        title: "The Void",
        sections: [
            { icon: "🌌", header: "Safe Space", text: "A digital black hole for negative thoughts or secrets." },
            { icon: "🗑️", header: "Ephemeral", text: "Anything typed here is visually destroyed and never sent to a server. It is a psychological tool for release." }
        ]
    },
    'chat': {
        title: "Group Chat",
        sections: [
            { icon: "🤖", header: "Simulated Neighbors", text: "Chat with AI agents representing local neighbors to get a feel for the group vibe." },
            { icon: "🌍", header: "Translation", text: "Toggle the translate button in the sidebar to read messages in your native language." },
            { icon: "👤", header: "Profiles", text: "Click on a user's name to view their quick-profile and interests." }
        ]
    },
    'video': {
        title: "Video Lounge",
        sections: [
            { icon: "📹", header: "Camera Check", text: "Your camera is processed locally. In this demo, other participants are simulated." },
            { icon: "🛡️", header: "Safety", text: "Verified badges indicate users who have passed GPS or ID verification." }
        ]
    },
    'events': {
        title: "Local Gatherings",
        sections: [
            { icon: "📅", header: "Discover", text: "Browse upcoming meetups generated based on the group's shared interest." },
            { icon: "➕", header: "Create", text: "Propose your own event. The AI will help format the invitation." },
            { icon: "💰", header: "Commitment Bond", text: "Join events by paying a small bond. This is refunded upon GPS check-in at the venue to reduce flakes." }
        ]
    },
    'members': {
        title: "Community Members",
        sections: [
            { icon: "⭐", header: "Roles", text: "Hosts manage events. New members have a 'New' badge for 7 days." },
            { icon: "👋", header: "Wave", text: "Send a wave to break the ice without needing to think of a message." }
        ]
    },
    'onboarding': {
        title: "Setup",
        sections: [
            { icon: "🚀", header: "Getting Started", text: "Follow the prompts to set up your mock identity for the session." }
        ]
    }
};

export const HelpModal: React.FC<HelpModalProps> = ({ context, onClose }) => {
    const content = helpContent[context] || helpContent['landing'];

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-serif text-white flex items-center gap-2">
                        <span className="text-emerald-400 text-2xl">?</span> 
                        {content.title}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {content.sections.map((section, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-700">
                                {section.icon}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">{section.header}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">{section.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs"
                    >
                        Got it
                    </button>
                </div>

            </div>
        </div>
    );
};
