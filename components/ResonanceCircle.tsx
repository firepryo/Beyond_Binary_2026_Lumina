
import React, { useEffect, useState, useRef } from 'react';
import { generateGroupRitual, generateSimulatedChat, generateMeetupSuggestions, generateGroupMembers } from '../services/geminiService';
import { GroupRitual, ToolResponse, ChatMessage, MeetupEvent, VideoParticipant, GroupMember } from '../types';
import { HelpModal, HelpContext } from './HelpModal';

interface ResonanceCircleProps {
  groupInfo: ToolResponse;
  userSentiment: string; // This is now Activity
  userName: string;
  onBack: () => void;
}

const DecryptedText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 30 }) => {
    const [displayedText, setDisplayedText] = useState("");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";

    useEffect(() => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplayedText(prev => 
                text.split("").map((letter, index) => {
                    if (index < iterations) return text[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("")
            );

            if (iterations >= text.length) clearInterval(interval);
            iterations += 1/2; 
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return <span>{displayedText}</span>;
};

const ResonanceCircle: React.FC<ResonanceCircleProps> = ({ groupInfo, userSentiment, userName, onBack }) => {
  // Default activeTab is 'chat' per latest request
  const [activeTab, setActiveTab] = useState<'chat' | 'video' | 'events' | 'members'>('chat');
  
  // Data State
  const [ritual, setRitual] = useState<GroupRitual | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meetups, setMeetups] = useState<MeetupEvent[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set());
  const [checkedInEvents, setCheckedInEvents] = useState<Set<string>>(new Set());
  const [verifyingEventId, setVerifyingEventId] = useState<string | null>(null);
  
  // UI State - Event Details
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Create Event State
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', description: '', location: '' });

  // Payment State
  const [showPayment, setShowPayment] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);

  // Safety Notifications State
  const [safetyToasts, setSafetyToasts] = useState<string[]>([]);
  
  // UI State
  const [inputValue, setInputValue] = useState("");
  const [showPremium, setShowPremium] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false); // Mobile Drawer
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null); // Profile Modal
  const [isTyping, setIsTyping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const ritualRes = await generateGroupRitual(groupInfo.group_name!, userSentiment);
      setRitual(ritualRes);
      
      const memberRes = await generateGroupMembers(userSentiment);
      setMembers(memberRes);
      
      // Initialize chat with a welcome message
      setMessages([
          { id: '1', sender: 'System', text: `You joined ${groupInfo.group_name}. Verified phone required.`, isUser: false, timestamp: Date.now() },
          { id: '2', sender: memberRes[0].name, senderId: memberRes[0].id, text: `Hey everyone, anyone up for ${userSentiment} this weekend?`, isUser: false, timestamp: Date.now() + 1000 }
      ]);

      const eventsRes = await generateMeetupSuggestions(userSentiment);
      // Mock safety data addition
      const eventsWithSafety = eventsRes.map(e => ({
          ...e,
          accessibility: Math.random() > 0.5 ? ['Wheelchair Accessible', 'Audio Description'] : ['Wheelchair Accessible']
      }));
      setMeetups(eventsWithSafety);
    };
    fetchData();
  }, [groupInfo, userSentiment]);

  // Video Handling
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (activeTab === 'video') {
      const startCamera = async () => {
        try {
          setCameraError(false);
          // Try to get camera. On some localhost setups this might fail if not https, or if blocked.
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsVideoActive(true);
          }
        } catch (e) {
          console.warn("Camera access denied or unavailable:", e);
          setCameraError(true);
          setIsVideoActive(false);
        }
      };
      startCamera();
    } else {
        // Cleanup if leaving tab
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setIsVideoActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!inputValue.trim()) return;

    const newUserMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: userName,
        text: inputValue,
        isUser: true,
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    const currentInput = inputValue;
    setInputValue("");
    
    // Simulate thinking delay
    setTimeout(() => {
        setIsTyping(true);
        setTimeout(async () => {
            const reply = await generateSimulatedChat(userSentiment, currentInput);
            // Link reply to a random member for profile clicking
            const replier = members.find(m => m.name === reply.sender) || members[Math.floor(Math.random() * members.length)];
            reply.senderId = replier?.id;
            
            setMessages(prev => [...prev, reply]);
            setIsTyping(false);
        }, 1500);
    }, 500);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEvent.title || !newEvent.time) return;

      const created: MeetupEvent = {
          id: `custom-${Date.now()}`,
          title: newEvent.title,
          time: newEvent.time,
          location: newEvent.location || 'TBD',
          description: newEvent.description || 'Community organized event.',
          attendees: 1,
          type: 'physical',
          accessibility: ['Community Host']
      };

      setMeetups(prev => [created, ...prev]);
      setJoinedEvents(prev => new Set(prev).add(created.id));
      setShowCreateEvent(false);
      setNewEvent({ title: '', time: '', description: '', location: '' });
      
      alert("Event Created! Neighbors have been notified.");
  };

  const initJoinProcess = (id: string) => {
      if (joinedEvents.has(id)) {
          // Unjoin
          setJoinedEvents(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
          });
      } else {
          // Open Payment Flow
          setPendingEventId(id);
          setShowPayment(true);
      }
  };

  const confirmPaymentAndJoin = () => {
      if (!pendingEventId) return;
      
      setJoinedEvents(prev => new Set(prev).add(pendingEventId));
      setShowPayment(false);
      setPendingEventId(null);
      
      // Safety Simulation Flow
      setSafetyToasts(prev => [...prev, "💳 Bond Paid. Held in Smart Contract."]);
      
      setTimeout(() => {
          setSafetyToasts(prev => [...prev, "🔔 Safety Check: Event Started. Please confirm you are safe."]);
      }, 5000);
  };
  
  const handleGPSCheckIn = (eventId: string) => {
      setVerifyingEventId(eventId);
      
      // Simulate GPS Check
      setTimeout(() => {
          setVerifyingEventId(null);
          setCheckedInEvents(prev => new Set(prev).add(eventId));
          setSafetyToasts(prev => [
            ...prev,
            "📡 Acquiring GPS Signal...",
            "📍 Location Verified: Central Park",
            "💸 $2.00 Bond Refunded to Wallet"
          ]);
      }, 2000);
  };
  
  const toggleEventExpand = (id: string) => {
      setExpandedEvents(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const openMemberProfile = (memberId?: string) => {
      if (!memberId) return;
      const member = members.find(m => m.id === memberId);
      if (member) setSelectedMember(member);
  };

  const renderSidebarContent = () => (
      <>
          <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Common Interest</h3>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/10">
                    <p className="text-emerald-200 text-sm font-serif italic">"{userSentiment}"</p>
                </div>
            </div>

            {ritual && (
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Group Activity</h3>
                    <div className="p-5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                        <h4 className="text-white font-serif text-lg mb-2">{ritual.title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed mb-4">{ritual.description}</p>
                        <div className="bg-black/40 p-3 rounded text-center">
                            <span className="text-emerald-300 text-xs font-mono">"{ritual.mantra}"</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-800/50 p-4 rounded-xl mb-8">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Inclusivity Tools</h3>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Translate Chat</span>
                    <button 
                        onClick={() => setShowTranslate(!showTranslate)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${showTranslate ? 'bg-emerald-500' : 'bg-slate-600'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showTranslate ? 'left-4.5' : 'left-0.5'}`} style={{left: showTranslate ? '18px' : '2px'}}></div>
                    </button>
                </div>
            </div>
      </>
  );

  return (
    <div className="fixed inset-0 z-40 bg-[#0f172a] flex flex-col animate-fade-in overflow-hidden">
      
      {/* Help Modal */}
      {showHelp && <HelpModal context={activeTab} onClose={() => setShowHelp(false)} />}

      {/* Simulated Push Notifications */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm px-4">
          {safetyToasts.map((toast, i) => (
              <div key={i} className="bg-sky-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-slide-up border border-sky-400">
                  <span className="text-sm font-bold">{toast}</span>
                  <button onClick={() => setSafetyToasts(prev => prev.filter((_, idx) => idx !== i))} className="text-sky-200 hover:text-white">✕</button>
              </div>
          ))}
      </div>

      {/* Header Bar */}
      <div className="h-16 border-b border-white/5 bg-[#0b1221] flex items-center justify-between px-4 md:px-6 z-50 shadow-sm shrink-0">
        <div className="flex items-center space-x-3 md:space-x-4">
             <button 
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <div>
                <h2 className="text-white font-serif text-lg leading-none flex items-center gap-2">
                    <span className="truncate max-w-[120px] md:max-w-none">{groupInfo.group_name}</span>
                    <span className="bg-sky-500/20 text-sky-400 text-[10px] px-1.5 py-0.5 rounded border border-sky-500/30 hidden md:inline">✓ Safety Verified</span>
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{groupInfo.nearby_count} Neighbors Online</span>
                </div>
             </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/50 rounded-lg p-1 space-x-1 overflow-x-auto no-scrollbar max-w-[180px] md:max-w-none">
            {['chat', 'video', 'events', 'members'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 md:px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        activeTab === tab 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowHelp(true)}
                className="w-8 h-8 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors"
                title="Help Guide"
            >
                <span className="font-serif text-lg italic">?</span>
            </button>

            <button 
                onClick={() => setShowPremium(true)}
                className="hidden md:flex text-amber-400 hover:text-amber-300 text-xs font-bold uppercase tracking-widest items-center gap-2 border border-amber-500/20 px-3 py-1.5 rounded-full hover:bg-amber-500/10 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Club</span>
            </button>
            
            {/* Mobile Info Toggle */}
            <button 
                onClick={() => setShowMobileInfo(true)}
                className="md:hidden text-slate-400 hover:text-white p-2"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR - Info & Ritual (Desktop) */}
        <div className="hidden md:flex w-80 border-r border-white/5 bg-[#0f172a] flex-col p-6 overflow-y-auto">
            {renderSidebarContent()}
            <div className="mt-auto">
                <div className="text-[10px] text-slate-600 font-mono">
                    Lumina Safety Layer Active<br/>
                    Verified Locals Only
                </div>
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col bg-slate-900/50 relative overflow-hidden">
            
            {/* TAB: CHAT */}
            {activeTab === 'chat' && (
                <div className="flex flex-col h-full w-full">
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                        msg.isUser 
                                            ? 'bg-emerald-600 text-white rounded-br-none' 
                                            : 'bg-[#1e293b] text-slate-200 rounded-bl-none border border-slate-700'
                                    }`}>
                                        {msg.isUser ? msg.text : <DecryptedText text={msg.text} />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button 
                                            onClick={() => !msg.isUser && openMemberProfile(msg.senderId)}
                                            className={`text-[10px] px-1 ${!msg.isUser ? 'text-slate-400 hover:text-emerald-300 hover:underline' : 'text-slate-500'}`}
                                            disabled={msg.isUser || !msg.senderId}
                                        >
                                            {msg.isUser ? 'You' : msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </button>
                                        {showTranslate && !msg.isUser && (
                                            <span className="text-[9px] text-sky-400 bg-sky-900/20 px-1 rounded cursor-pointer">Translated</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-[#1e293b] rounded-2xl rounded-bl-none border border-slate-700 px-4 py-3 flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#0b1221] shrink-0 pb-6 md:pb-4">
                        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto w-full">
                             <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Message neighbors..."
                                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-full px-5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-all placeholder-slate-500"
                            />
                            <button 
                                type="submit"
                                className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white transition-colors shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB: VIDEO */}
            {activeTab === 'video' && (
                <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto relative">
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30 ring-1 ring-emerald-500/20 z-10">
                        {!cameraError ? (
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                <span className="text-xs">Camera Unavailable</span>
                            </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                            <span className={`w-2 h-2 rounded-full ${cameraError ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            You
                        </div>
                    </div>

                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="relative aspect-video bg-[#1e293b] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center group z-10">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-2xl font-serif text-slate-400">
                                {String.fromCharCode(65+i)}
                            </div>
                            <div className="absolute bottom-3 left-3 bg-black/40 px-2 py-1 rounded text-slate-300 text-xs font-bold backdrop-blur-sm">
                                Neighbor {i}
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1">
                                <span className="bg-sky-500/20 text-sky-400 text-[8px] px-1 rounded border border-sky-500/30">Verified</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: EVENTS */}
            {activeTab === 'events' && (
                <div className="flex-1 p-4 md:p-8 overflow-y-auto relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl md:text-2xl font-serif text-white">Local Gatherings</h2>
                        <button 
                            onClick={() => setShowCreateEvent(true)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-emerald-500/30 transition-all"
                        >
                            + Create Event
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {meetups.map((event) => {
                            const isExpanded = expandedEvents.has(event.id);
                            const isJoined = joinedEvents.has(event.id);
                            const isCheckedIn = checkedInEvents.has(event.id);
                            const isVerifying = verifyingEventId === event.id;

                            return (
                                <div key={event.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 hover:bg-slate-800/60 transition-colors group relative overflow-hidden flex flex-col">
                                    {isJoined && (
                                        <div className={`absolute top-0 right-0 text-white text-[10px] px-3 py-1 font-bold rounded-bl-xl shadow-lg z-20 ${isCheckedIn ? 'bg-emerald-500' : 'bg-sky-600'}`}>
                                            {isCheckedIn ? 'REFUNDED' : 'COMMITTED'}
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${event.type === 'virtual' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                            {event.type}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 text-xs font-mono">{event.time}</span>
                                            <button 
                                                onClick={() => toggleEventExpand(event.id)}
                                                className={`text-slate-400 hover:text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>

                                    {/* Collapsible Content */}
                                    <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                                         <p className="text-slate-400 text-sm mb-4 leading-relaxed">{event.description}</p>
                                         <p className="text-emerald-400 text-xs mb-2 font-bold uppercase">📍 {event.location}</p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {event.accessibility?.map((tag, i) => (
                                                <span key={i} className="flex items-center gap-1 text-[9px] text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors mb-4 border border-amber-500/20 px-3 py-1.5 rounded-full hover:bg-amber-500/10"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            View Location on Maps
                                        </a>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <button 
                                            onClick={() => {
                                                if (!isJoined) initJoinProcess(event.id);
                                                else if (!isCheckedIn && !isVerifying) handleGPSCheckIn(event.id);
                                            }}
                                            disabled={isVerifying || isCheckedIn}
                                            className={`px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all w-full flex items-center justify-center gap-2
                                                ${isCheckedIn 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default' 
                                                    : isJoined 
                                                        ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                                                        : 'bg-white text-slate-900 hover:bg-emerald-50'
                                                }
                                            `}
                                        >
                                            {isCheckedIn ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Bond Refunded
                                                </>
                                            ) : isVerifying ? (
                                                <>
                                                    <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                                    Verifying GPS...
                                                </>
                                            ) : isJoined ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Arrived? GPS Check-in
                                                </>
                                            ) : (
                                                'Join & Commit ($2 Bond)'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* TAB: MEMBERS */}
            {activeTab === 'members' && (
                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <h2 className="text-xl md:text-2xl font-serif text-white mb-6">Group Members</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-lg border-2 border-emerald-500">
                                You
                            </div>
                            <div>
                                <h3 className="font-bold text-white">You</h3>
                                <p className="text-xs text-slate-400">Online</p>
                            </div>
                        </div>
                        {members.map(member => (
                            <div 
                                key={member.id} 
                                onClick={() => setSelectedMember(member)}
                                className="bg-slate-800/40 border border-white/5 rounded-xl p-4 flex items-center space-x-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg relative" style={{ backgroundColor: member.avatarColor }}>
                                    {member.name.charAt(0)}
                                    {member.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        {member.name}
                                        {member.role === 'Host' && <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 rounded uppercase tracking-wider">Host</span>}
                                        {member.role === 'New' && <span className="bg-sky-500/20 text-sky-300 text-[9px] px-1.5 rounded uppercase tracking-wider">New</span>}
                                    </h3>
                                    <div className="flex gap-1 mt-1 mb-1">
                                        <span className="text-[9px] bg-slate-700 px-1 rounded text-slate-300">{member.age}yo</span>
                                        <span className="text-[9px] bg-slate-700 px-1 rounded text-slate-300">{member.gender}</span>
                                        <span className="text-[9px] bg-indigo-900/50 text-indigo-300 px-1 rounded border border-indigo-500/30">{member.mbti}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate max-w-[150px]">{member.bio}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
        </div>
      </div>
      
      {/* Mobile Info Drawer */}
      {showMobileInfo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileInfo(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto animate-slide-in-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="font-serif text-xl text-white">Group Info</h2>
                      <button onClick={() => setShowMobileInfo(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  {renderSidebarContent()}
              </div>
          </div>
      )}

      {/* Member Profile Modal */}
      {selectedMember && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setSelectedMember(null)}>
               <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-sm relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                  
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-2xl mb-4 relative" style={{ backgroundColor: selectedMember.avatarColor }}>
                       {selectedMember.name.charAt(0)}
                       <div className="absolute bottom-1 right-1 bg-slate-800 rounded-full p-1">
                            {selectedMember.isOnline ? (
                                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                            ) : (
                                <div className="w-4 h-4 bg-slate-500 rounded-full border-2 border-slate-800"></div>
                            )}
                       </div>
                  </div>
                  
                  <h3 className="text-2xl font-serif text-white mb-1 flex items-center gap-2">
                      {selectedMember.name}
                      <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">{selectedMember.role} • Joined {selectedMember.joinedAt}</p>
                  
                  <div className="flex justify-center gap-3 mb-4 w-full">
                    <div className="bg-slate-900/50 px-3 py-1 rounded border border-slate-700">
                        <span className="block text-[9px] text-slate-500 uppercase">Age</span>
                        <span className="text-sm text-white">{selectedMember.age}</span>
                    </div>
                    <div className="bg-slate-900/50 px-3 py-1 rounded border border-slate-700">
                        <span className="block text-[9px] text-slate-500 uppercase">Gender</span>
                        <span className="text-sm text-white">{selectedMember.gender}</span>
                    </div>
                    <div className="bg-slate-900/50 px-3 py-1 rounded border border-slate-700">
                        <span className="block text-[9px] text-slate-500 uppercase">MBTI</span>
                        <span className="text-sm text-indigo-300 font-bold">{selectedMember.mbti}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-6 leading-relaxed italic">"{selectedMember.bio}"</p>
                  
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                      {selectedMember.interests.map((int, i) => (
                          <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-300">{int}</span>
                      ))}
                  </div>

                  <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs">
                      Send Wave 👋
                  </button>
               </div>
          </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
          <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-md relative">
                  <button onClick={() => setShowCreateEvent(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                  <h3 className="text-2xl font-serif text-white mb-6">Host a Gathering</h3>
                  
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                      <div>
                          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Event Title</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" 
                            placeholder="e.g. Sunset Yoga" 
                            value={newEvent.title}
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Time</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" 
                                placeholder="e.g. 6:00 PM"
                                value={newEvent.time}
                                onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Location</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" 
                                placeholder="e.g. Central Park"
                                value={newEvent.location}
                                onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                            />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Description</label>
                          <textarea 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none h-24" 
                            placeholder="Briefly describe what you'll be doing..."
                            value={newEvent.description}
                            onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                          />
                      </div>
                      
                      <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors uppercase tracking-widest text-xs">
                          Publish Event
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Payment & Terms Modal */}
      {showPayment && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowPayment(false)}>
               <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-sm relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPayment(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                  
                  <h3 className="text-xl font-bold text-white mb-2">Commitment Bond</h3>
                  <div className="text-3xl font-serif text-emerald-400 mb-2">$2.00</div>
                  <div className="text-xs text-slate-400 mb-6 uppercase tracking-widest">Scan to Pay</div>
                  
                  {/* Mock QR Code */}
                  <div className="w-48 h-48 bg-white p-2 rounded-lg mb-6 flex items-center justify-center shadow-2xl">
                      <div className="w-full h-full border-4 border-slate-900 flex items-center justify-center relative overflow-hidden">
                          {/* Simple pattern to look like QR */}
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJibGFjayI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiAvPjxyZWN0IHg9IjEyIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiAvPjxyZWN0IHg9IjAiIHk9IjEyIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiAvPjwvc3ZnPg==')] opacity-80"></div>
                          <div className="z-10 bg-white p-2 rounded-full">
                              <span className="text-xl">🔒</span>
                          </div>
                      </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6 text-left w-full">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Terms & Conditions</h4>
                      <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                          <li>The $2.00 bond is held to ensure attendance.</li>
                          <li><strong className="text-white">Refunded automatically</strong> when you check-in at the event location.</li>
                          <li>Check-in requires <strong className="text-white">GPS Verification</strong> on site.</li>
                          <li>No-shows forfeit the bond to the community fund.</li>
                      </ul>
                  </div>

                  <button 
                    onClick={confirmPaymentAndJoin}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors uppercase tracking-widest text-xs"
                  >
                      Confirm Payment & Join
                  </button>
               </div>
          </div>
      )}

      {/* Tiered Pricing Modal */}
      {showPremium && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowPremium(false)}>
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto max-h-[80vh]" onClick={e => e.stopPropagation()}>
                  
                  {/* Free Tier */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center">
                      <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-2">Spark</h3>
                      <div className="text-3xl font-serif text-white mb-6">Free</div>
                      <ul className="space-y-3 text-sm text-slate-400 mb-8 w-full text-left">
                          <li className="flex gap-2"><span>✓</span> Access to Public Constellations</li>
                          <li className="flex gap-2"><span>✓</span> 10 Activity Searches / Week</li>
                          <li className="flex gap-2"><span>✓</span> Basic Chat Features</li>
                      </ul>
                      <button className="mt-auto w-full py-2 border border-slate-600 rounded-lg text-slate-300 text-xs font-bold uppercase tracking-wider">Current Plan</button>
                  </div>

                  {/* Silver Tier */}
                  <div className="bg-slate-800 border border-emerald-500/50 rounded-2xl p-6 flex flex-col items-center text-center transform scale-105 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                      <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-widest mb-2">Radiance</h3>
                      <div className="text-3xl font-serif text-white mb-6">$5<span className="text-sm text-slate-400">/mo</span></div>
                      <ul className="space-y-3 text-sm text-slate-300 mb-8 w-full text-left">
                          <li className="flex gap-2 text-white"><span>✓</span> 30 Activity Searches / Week</li>
                          <li className="flex gap-2"><span>✓</span> Verified Profile Badge</li>
                          <li className="flex gap-2"><span>✓</span> Real-time Translation</li>
                          <li className="flex gap-2"><span>✓</span> See who waved at you</li>
                      </ul>
                      <button className="mt-auto w-full py-3 bg-emerald-600 rounded-lg text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-500 transition-colors">Upgrade</button>
                  </div>

                  {/* Gold Tier */}
                  <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col items-center text-center">
                      <h3 className="text-lg font-bold text-amber-400 uppercase tracking-widest mb-2">Lumina</h3>
                      <div className="text-3xl font-serif text-white mb-6">$10<span className="text-sm text-slate-400">/mo</span></div>
                      <ul className="space-y-3 text-sm text-slate-400 mb-8 w-full text-left">
                          <li className="flex gap-2"><span>✓</span> Unlimited Searches</li>
                          <li className="flex gap-2"><span>✓</span> Priority Event Access</li>
                          <li className="flex gap-2"><span>✓</span> Create Private Clusters</li>
                          <li className="flex gap-2"><span>✓</span> Advanced Analytics</li>
                      </ul>
                      <button className="mt-auto w-full py-2 border border-amber-500/50 rounded-lg text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/10 transition-colors">Go Lumina</button>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
};

export default ResonanceCircle;
