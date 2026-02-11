
import React, { useState, useEffect } from 'react';
import JournalInput from './components/Recorder';
import Constellation from './components/Constellation';
import Onboarding from './components/Onboarding';
import ResonanceCircle from './components/ResonanceCircle';
import TheVoid from './components/TheVoid'; 
import { analyzeJournal, generateCommunitySummary } from './services/geminiService';
import { AppView, ActivityProfile, CommunityNode, ToolResponse } from './types';
import { HelpModal, HelpContext } from './components/HelpModal';

// Mock Data Generation: Activity Clusters with KM and Verification
const generateMockNodes = (count: number): CommunityNode[] => {
  const activities = [
    { name: 'Skydiving', cat: 'Outdoors', color: '#10b981' },
    { name: 'Chess', cat: 'Quiet', color: '#8b5cf6' },
    { name: 'Pottery', cat: 'Creative', color: '#f59e0b' },
    { name: 'Coding', cat: 'Tech', color: '#3b82f6' },
    { name: 'Jazz', cat: 'Creative', color: '#f59e0b' },
    { name: 'Hiking', cat: 'Outdoors', color: '#10b981' },
    { name: 'Yoga', cat: 'Sports', color: '#ef4444' },
    { name: 'Baking', cat: 'Food', color: '#f97316' },
    { name: 'Salsa', cat: 'Social', color: '#ec4899' },
    { name: 'Origami', cat: 'Creative', color: '#f59e0b' },
    { name: 'Surfing', cat: 'Sports', color: '#ef4444' },
    { name: 'Knitting', cat: 'Quiet', color: '#8b5cf6' },
    { name: 'Running', cat: 'Sports', color: '#ef4444' },
    { name: 'Meditation', cat: 'Quiet', color: '#8b5cf6' },
    { name: 'Cycling', cat: 'Sports', color: '#ef4444' },
    { name: 'Painting', cat: 'Creative', color: '#f59e0b' },
    { name: 'Writing', cat: 'Quiet', color: '#8b5cf6' },
    { name: 'Volleyball', cat: 'Sports', color: '#ef4444' },
    { name: 'Gardening', cat: 'Outdoors', color: '#10b981' },
    { name: 'Photography', cat: 'Creative', color: '#f59e0b' },
    { name: 'Astronomy', cat: 'Tech', color: '#3b82f6' },
    { name: 'Birdwatching', cat: 'Outdoors', color: '#10b981' },
    { name: 'Calligraphy', cat: 'Creative', color: '#f59e0b' },
    { name: 'Magic', cat: 'Social', color: '#ec4899' },
    { name: 'Robotics', cat: 'Tech', color: '#3b82f6' },
    { name: 'Singing', cat: 'Creative', color: '#f59e0b' },
    { name: 'Acting', cat: 'Social', color: '#ec4899' },
    { name: 'Camping', cat: 'Outdoors', color: '#10b981' },
    { name: 'Fishing', cat: 'Outdoors', color: '#10b981' },
    { name: 'Swimming', cat: 'Sports', color: '#ef4444' },
    { name: 'Climbing', cat: 'Sports', color: '#ef4444' },
    { name: 'Dancing', cat: 'Social', color: '#ec4899' },
    { name: 'Gaming', cat: 'Tech', color: '#3b82f6' },
    { name: 'Design', cat: 'Tech', color: '#3b82f6' },
    { name: 'Physics', cat: 'Tech', color: '#3b82f6' },
    { name: 'Poetry', cat: 'Quiet', color: '#8b5cf6' },
    { name: 'History', cat: 'Quiet', color: '#8b5cf6' },
    { name: 'Fashion', cat: 'Creative', color: '#f59e0b' },
    { name: 'Skating', cat: 'Sports', color: '#ef4444' },
    { name: 'Skiing', cat: 'Outdoors', color: '#10b981' },
    { name: 'Rowing', cat: 'Sports', color: '#ef4444' },
    { name: 'Boxing', cat: 'Sports', color: '#ef4444' },
    { name: 'Fencing', cat: 'Sports', color: '#ef4444' },
    { name: 'Archery', cat: 'Sports', color: '#ef4444' },
    { name: 'Bowling', cat: 'Social', color: '#ec4899' },
    { name: 'Golf', cat: 'Sports', color: '#ef4444' },
    { name: 'Tennis', cat: 'Sports', color: '#ef4444' },
    { name: 'Rugby', cat: 'Sports', color: '#ef4444' },
    { name: 'Cricket', cat: 'Sports', color: '#ef4444' },
    { name: 'Baseball', cat: 'Sports', color: '#ef4444' }
  ];

  // Randomize and pick non-repeating
  const shuffled = [...activities].sort(() => 0.5 - Math.random());
  
  return Array.from({ length: count }).map((_, i) => {
    // Wrap around if count > activities.length, but we set count=40 usually
    const act = shuffled[i % shuffled.length]; 
    return {
      id: `node-${i}`,
      x: Math.random() * 100, 
      y: Math.random() * 100,
      z: (Math.random() - 0.5) * 500,
      color: act.color,
      size: Math.random() * 6 + 2,
      activity: act.name,
      category: act.cat as any,
      distance: `${(Math.random() * 5).toFixed(1)} km`,
      timestamp: Date.now() - Math.random() * 86400000,
      verified: Math.random() > 0.6 // 40% verified
    };
  });
};

// Simple Mock function to guess category if activity not strictly found
const mockCategoryLookup = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('run') || q.includes('ball') || q.includes('gym') || q.includes('fit')) return 'Sports';
    if (q.includes('art') || q.includes('draw') || q.includes('music') || q.includes('dance')) return 'Creative';
    if (q.includes('code') || q.includes('computer') || q.includes('game')) return 'Tech';
    if (q.includes('cook') || q.includes('eat') || q.includes('drink')) return 'Food';
    if (q.includes('hike') || q.includes('walk') || q.includes('camp')) return 'Outdoors';
    return '';
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('onboarding');
  const [userName, setUserName] = useState("Neighbor");
  const [userLocation, setUserLocation] = useState("Unknown");
  const [dailyQuote, setDailyQuote] = useState("");
  
  const [nodes, setNodes] = useState<CommunityNode[]>([]);
  const [userResult, setUserResult] = useState<{analysis: ActivityProfile, tool?: ToolResponse} | null>(null);
  const [userNodeId, setUserNodeId] = useState<string | undefined>(undefined);
  const [selectedNode, setSelectedNode] = useState<CommunityNode | null>(null);
  const [communitySummary, setCommunitySummary] = useState<string>("Listening to the neighborhood...");
  const [pulseSent, setPulseSent] = useState(false); 
  
  // Search & Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHighlight, setActiveHighlight] = useState("");
  const [suggestionMode, setSuggestionMode] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  
  const [activeGroupInfo, setActiveGroupInfo] = useState<ToolResponse | null>(null);
  const [activeGroupSentiment, setActiveGroupSentiment] = useState<string>("");

  // Wave Notifications
  const [incomingWaves, setIncomingWaves] = useState<string[]>([]);
  
  // Help State
  const [showHelp, setShowHelp] = useState(false);

  // History / Visited Groups (Mocked for Demo)
  const [visitedGroups, setVisitedGroups] = useState([
      { id: 'g_jazz', name: 'Jazz Collective', activity: 'Jazz', unread: 2, time: '2m' },
      { id: 'g_yoga', name: 'Sunrise Yoga', activity: 'Yoga', unread: 0, time: '1h' },
      { id: 'g_code', name: 'React Devs', activity: 'Coding', unread: 5, time: '3h' },
      { id: 'g_hiking', name: 'Trail Blazers', activity: 'Hiking', unread: 0, time: '1d' },
      { id: 'g_book', name: 'Silent Book Club', activity: 'Reading', unread: 1, time: '2d' }
  ]);

  useEffect(() => {
    setNodes(generateMockNodes(50));
    
    const quotes = [
      "Community is not a place, but a mindset.",
      "The shortest distance between two people is a shared interest.",
      "Neighbors are the family we choose by geography.",
      "Small connections build strong foundations.",
      "In every walk with nature one receives far more than he seeks.",
      "Alone we can do so little; together we can do so much."
    ];
    setDailyQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    // Simulate incoming waves randomly
    const waveInterval = setInterval(() => {
        if (Math.random() > 0.7 && view === 'visualization') {
            const names = ["Alex", "Jordan", "Taylor", "Casey", "Riley"];
            const sender = names[Math.floor(Math.random() * names.length)];
            setIncomingWaves(prev => [...prev, `${sender} sent you a wave 👋`]);
            
            // Auto dismiss after 4 seconds
            setTimeout(() => {
                setIncomingWaves(prev => prev.slice(1));
            }, 4000);
        }
    }, 10000);

    return () => clearInterval(waveInterval);
  }, [view]);

  // Search Logic with Fallback & Maps Grounding
  useEffect(() => {
      if (!searchQuery) {
          setActiveHighlight("");
          setSuggestionMode(false);
          setNoResults(false);
          return;
      }

      // Default Activity Search
      const q = searchQuery.toLowerCase();
      const exactMatches = nodes.filter(n => n.activity.toLowerCase().includes(q));

      if (exactMatches.length > 0) {
          setActiveHighlight(q);
          setSuggestionMode(false);
          setNoResults(false);
      } else {
          // Fallback 1: Check categories of existing nodes directly
          const categoryMatches = nodes.filter(n => n.category.toLowerCase().includes(q));
          
          if (categoryMatches.length > 0) {
               setActiveHighlight(q); // It matches the category string
               setSuggestionMode(true);
               setNoResults(false);
          } else {
              // Fallback 2: Infer category from query
              const inferredCat = mockCategoryLookup(q);
              if (inferredCat) {
                  setActiveHighlight(inferredCat.toLowerCase());
                  setSuggestionMode(true);
                  setNoResults(false);
              } else {
                  setNoResults(true);
                  setActiveHighlight("");
              }
          }
      }

  }, [searchQuery, nodes]);

  const handleOnboardingComplete = (name: string, location: string, activity: string) => {
      setUserName(name);
      setUserLocation(location);
      setSearchQuery(activity); // Pre-fill search with onboarding activity
      setView('landing');
  }

  const handleJournalComplete = async (text: string) => {
    setView('processing');
    try {
      const { analysis, toolResult } = await analyzeJournal(text, userLocation);
      
      setUserResult({ analysis: analysis, tool: toolResult });
      
      // Update search if user refined it in journal
      setSearchQuery(analysis.primary_activity.split(" ")[0]); 

      const newNode: CommunityNode = {
        id: 'user-current',
        x: 50, // Center
        y: 50, // Center
        z: 0,  // Centered in 3D space
        color: '#ffffff', // User node is explicitly white
        size: 15,
        activity: analysis.primary_activity,
        category: analysis.category,
        distance: "0.0 km",
        timestamp: Date.now(),
        verified: true
      };
      
      setUserNodeId(newNode.id);
      setNodes(prev => [...prev, newNode]);

      const activities = [analysis.primary_activity, ...nodes.slice(0, 5).map(n => n.activity)];
      const summary = await generateCommunitySummary(activities);
      setCommunitySummary(summary);

      setView('visualization');
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze interests. Please try again.");
      setView('recording');
    }
  };

  const handleResonate = (node: CommunityNode) => {
    let groupInfo: ToolResponse;

    if (node.id === userNodeId && userResult?.tool) {
        groupInfo = userResult.tool;
    } else {
        groupInfo = {
            peer_support_found: true,
            nearby_count: Math.floor(Math.random() * 20) + 2,
            group_name: node.placeUri ? `${node.activity} Meetup` : `The ${node.activity} Club`,
            group_id: `group-${node.id}`
        };
    }

    setActiveGroupInfo(groupInfo);
    setActiveGroupSentiment(node.activity);
    setSelectedNode(null);
    setView('group-resonance');
    
    // Add to history if not exists
    if (!visitedGroups.find(g => g.id === groupInfo.group_id)) {
        setVisitedGroups(prev => [{
            id: groupInfo.group_id,
            name: groupInfo.group_name,
            activity: node.activity,
            unread: 0,
            time: 'Just now'
        }, ...prev]);
    }
  };

  // New handler for side-panel history items
  const handleOpenHistoryGroup = (group: { id: string, name: string, activity: string }) => {
      const info: ToolResponse = {
          peer_support_found: true,
          nearby_count: Math.floor(Math.random() * 20) + 5,
          group_name: group.name,
          group_id: group.id
      };
      setActiveGroupInfo(info);
      setActiveGroupSentiment(group.activity);
      setView('group-resonance');
  };

  const handleSendPulse = () => {
      setPulseSent(true);
      setTimeout(() => {
          setPulseSent(false);
          setSelectedNode(null);
      }, 2000);
  };
  
  const handleLocalDiscovery = () => {
      setNoResults(false);
      setSuggestionMode(false);
      setSearchQuery(""); // clear search
      alert("Expanding search radius to explore Local constellations... (Simulated)");
      // Add more random nodes
      setNodes(prev => [...prev, ...generateMockNodes(20)]);
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-900 text-white font-sans selection:bg-emerald-500/30">
      
      {/* Help Modal */}
      {showHelp && (
          <HelpModal 
              context={
                  view === 'group-resonance' ? 'chat' : // Fallback, though ResonanceCircle handles its own help
                  view === 'visualization' ? 'visualization' :
                  view === 'recording' ? 'recording' :
                  view === 'void' ? 'void' :
                  view === 'processing' ? 'processing' : 'landing'
              } 
              onClose={() => setShowHelp(false)} 
          />
      )}

      {/* Incoming Wave Toast Notification */}
      <div className="absolute top-24 left-6 z-50 flex flex-col gap-2 pointer-events-none">
          {incomingWaves.map((msg, i) => (
              <div key={i} className="animate-slide-in-right bg-emerald-600/90 text-white px-4 py-3 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-3 border border-emerald-400/30">
                  <span className="text-xl">👋</span>
                  <span className="text-sm font-bold">{msg}</span>
              </div>
          ))}
      </div>
      
      {/* Suggestion Mode Toast */}
      {suggestionMode && view === 'visualization' && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
              <div className="bg-indigo-600/90 text-white px-6 py-2 rounded-full shadow-lg backdrop-blur-md border border-indigo-400/30 flex items-center gap-2 whitespace-nowrap">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs">Exact activity not found. Highlighting similar category.</span>
              </div>
          </div>
      )}

      {/* Background Visualization (Persistent) */}
      <div className={`absolute inset-0 transition-all duration-1000 ${view === 'visualization' ? 'opacity-100 scale-100' : view === 'group-resonance' || view === 'void' ? 'opacity-0 scale-150' : 'opacity-20 scale-110 blur-sm'}`}>
        <Constellation 
          nodes={nodes} 
          onNodeClick={(node) => {
             if (view === 'visualization') setSelectedNode(node);
          }}
          userNodeId={userNodeId}
          highlightQuery={activeHighlight}
        />
      </div>

      {/* View: Onboarding */}
      {view === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* View: Landing */}
      {view === 'landing' && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center animate-fade-in pointer-events-none">
          <h1 className="text-6xl md:text-9xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-white to-teal-200 mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            Lumina
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 mb-8 max-w-xl font-light leading-relaxed">
            Welcome, <span className="text-emerald-300 font-serif">{userName}</span>.<br/>
            Discover the hidden connections in <span className="text-emerald-300 font-serif">{userLocation}</span>.
          </p>
          <div className="flex flex-col md:flex-row gap-4 pointer-events-auto">
              <button 
                onClick={() => setView('recording')}
                className="group relative px-10 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full border border-white/10 hover:border-white/30 transition-all duration-500"
              >
                <span className="relative z-10 text-lg font-medium tracking-widest uppercase">Find Your Circle</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
          </div>
        </div>
      )}

      {/* View: Input */}
      {view === 'recording' && (
        <div className="relative z-10 h-full">
          <JournalInput 
            onComplete={handleJournalComplete} 
            onCancel={() => setView('landing')} 
          />
        </div>
      )}

      {/* View: Processing */}
      {view === 'processing' && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-r-2 border-teal-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-8 text-slate-300 text-lg animate-pulse font-serif italic">Triangulating interests nearby...</p>
        </div>
      )}

      {/* View: Void (Quiet Zone) */}
      {view === 'void' && (
          <TheVoid onExit={() => setView('visualization')} />
      )}

      {/* View: Visualization */}
      {view === 'visualization' && userResult && (
        <>
          <div className="absolute top-0 left-0 w-full p-6 z-20 flex flex-col md:flex-row justify-between items-start pointer-events-none gap-4">
            
            {/* Left Column: Neighborhood Pulse + Active Signals */}
            <div className="flex flex-col gap-4 pointer-events-auto w-full md:w-auto max-w-md shrink-0">
                
                {/* Neighborhood Pulse */}
                <div className="glass-panel p-4 rounded-xl backdrop-blur-xl bg-black/20 border-white/5 transition-all duration-300">
                    <h3 className="text-[10px] font-bold text-emerald-300 uppercase tracking-[0.2em] mb-2">Neighborhood Pulse</h3>
                    <p className="text-sm text-slate-200 font-serif leading-relaxed">"{communitySummary}"</p>
                    <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-emerald-200/80 italic font-serif">Today's Wisdom: "{dailyQuote}"</p>
                    </div>
                </div>

                {/* Active Signals - SCROLLABLE FIXED HEIGHT */}
                <div className="glass-panel p-3 rounded-xl backdrop-blur-xl bg-black/10 border-white/5 flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 sticky top-0 bg-[#1e293b]/80 backdrop-blur-md p-1 -mx-1 -mt-1 rounded-t-lg z-10">Active Signals</div>
                     {visitedGroups.length > 0 ? visitedGroups.map(group => (
                        <div 
                            key={group.id}
                            onClick={() => handleOpenHistoryGroup(group)} 
                            className="p-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer group flex items-center justify-between border border-transparent hover:border-white/10 shrink-0"
                        >
                            <div>
                                <h4 className="font-bold text-slate-200 text-xs group-hover:text-white">{group.name}</h4>
                                <span className="text-[10px] text-slate-500">{group.activity} • {group.time} ago</span>
                            </div>
                            {group.unread > 0 && (
                                <div className="flex items-center justify-center w-4 h-4 bg-emerald-500 text-black text-[9px] font-bold rounded-full shadow-lg">
                                    {group.unread}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="p-4 text-center text-xs text-slate-500 italic">No signals yet. Connect to a constellation!</div>
                    )}
                </div>
            </div>

            {/* Right Side: Search & Actions */}
            <div className="flex flex-col gap-2 pointer-events-auto w-full md:w-96 items-end">
                {/* Search Bar - REVERTED TO STANDARD */}
                <div className="relative group flex items-center w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search activities..."
                        className="block w-full pl-10 pr-4 py-3 border rounded-full leading-5 bg-black/40 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-black/60 transition-all shadow-lg backdrop-blur-sm text-sm border-slate-700 focus:border-emerald-500"
                    />
                </div>
                
                {/* No Results Fallback */}
                {noResults && (
                     <div className="animate-fade-in p-2 bg-slate-800/80 rounded-lg border border-amber-500/30 text-center w-full">
                         <p className="text-xs text-amber-200 mb-2">No local clusters found.</p>
                         <button 
                            onClick={handleLocalDiscovery}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded text-xs font-bold uppercase tracking-wider text-white transition-colors"
                         >
                             Discover Local
                         </button>
                     </div>
                )}

                <div className="flex gap-2 shrink-0 w-full justify-end">
                    <button 
                        onClick={() => setView('void')}
                        className="px-6 py-2 rounded-full bg-black/40 hover:bg-black/60 text-xs uppercase tracking-widest transition-colors border border-slate-700 text-slate-400"
                    >
                        Quiet Zone
                    </button>
                    <button onClick={() => setView('landing')} className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs uppercase tracking-widest transition-colors border border-white/5">
                        Rescan
                    </button>
                </div>

                {/* HELP BUTTON */}
                <button 
                    onClick={() => setShowHelp(true)}
                    className="w-8 h-8 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors absolute top-0 -right-10 md:static md:w-full md:py-3 md:rounded-full md:border md:border-slate-700/50 md:bg-black/20 md:text-xs md:uppercase md:tracking-widest md:h-auto"
                >
                    <span className="md:hidden font-serif italic">?</span>
                    <span className="hidden md:inline">Help Guide</span>
                </button>

                {/* CLUB BUTTON */}
                <button 
                  onClick={() => setShowPremium(true)}
                  className="w-full py-3 rounded-full border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 backdrop-blur-md bg-black/40 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Club
                </button>
            </div>
            
          </div>
          

          <div className="absolute bottom-6 left-6 z-20 w-full max-w-sm pointer-events-auto animate-slide-up">
            <div className="glass-panel rounded-2xl p-6 shadow-2xl border-t border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10" style={{ color: userResult.analysis.color }}>
                  {userResult.analysis.category}
                </span>
                <span className="text-xs text-slate-500 font-mono">0.0 km away</span>
              </div>
              
              <h2 className="text-2xl font-serif text-white mb-4 leading-tight">
                {userResult.analysis.social_spark}
              </h2>
              
              <div className="space-y-4">
                 <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5">
                   <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Recommended Hotspot</h4>
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-emerald-500/20 rounded-full">
                        <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     </div>
                     <p className="text-sm text-slate-300 italic">{userResult.analysis.nearby_hotspot}</p>
                   </div>
                 </div>

                {userResult.tool && userResult.tool.peer_support_found && (
                  <div 
                    onClick={() => handleResonate({ id: 'user-current', activity: userResult.analysis.primary_activity } as any)}
                    className="group cursor-pointer bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 p-4 rounded-lg mt-4 hover:border-emerald-400/60 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-emerald-500 p-2 rounded-full shadow-lg shadow-emerald-500/20">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-200 text-sm group-hover:text-white transition-colors">Join Local Group</h4>
                          <p className="text-[10px] text-emerald-300/70 mt-0.5">
                            {userResult.tool.group_name} • {userResult.tool.nearby_count} online
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-emerald-400 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto w-full px-4 flex justify-center">
              <div className="glass-panel p-8 rounded-2xl w-full max-w-sm text-center animate-scale-in bg-[#0f172a]/95 border border-white/10 backdrop-blur-2xl relative overflow-hidden">
                {pulseSent ? (
                    <div className="flex flex-col items-center justify-center h-48 animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full animate-ping mb-4"></div>
                        <p className="text-emerald-300 font-serif italic">Wave Sent 👋</p>
                    </div>
                ) : (
                    <>
                        <div 
                        className="w-20 h-20 rounded-full mx-auto mb-6 animate-float opacity-80 blur-sm flex items-center justify-center relative"
                        style={{ backgroundColor: selectedNode.color, boxShadow: `0 0 40px ${selectedNode.color}` }}
                        >
                            {selectedNode.verified && (
                                <div className="absolute -top-2 -right-2 bg-sky-500 text-white rounded-full p-1 shadow-lg" title="Verified Profile">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                        <h3 className="text-2xl font-serif mb-2 text-white">{selectedNode.activity}</h3>
                        <p className="text-xs text-slate-400 mb-8 uppercase tracking-widest">
                            {selectedNode.distance} away {selectedNode.verified ? '• Verified' : ''}
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => handleResonate(selectedNode)}
                                className="w-full px-6 py-3 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-200 text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"
                            >
                                Plan Activity
                            </button>

                            <button 
                                onClick={handleSendPulse}
                                className="w-full px-6 py-3 rounded-full border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group"
                            >
                                <span className="group-hover:animate-pulse">●</span> Wave (No Chat)
                            </button>

                            {selectedNode.placeUri && (
                                <a 
                                    href={selectedNode.placeUri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    View on Maps
                                </a>
                            )}

                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="mt-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* View: Group Resonance */}
      {view === 'group-resonance' && activeGroupInfo && (
        <ResonanceCircle 
          groupInfo={activeGroupInfo} 
          userSentiment={activeGroupSentiment} 
          userName={userName}
          onBack={() => setView('visualization')} 
        />
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

export default App;
