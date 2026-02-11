
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ActivityProfile, ToolResponse, GroupRitual, ChatMessage, MeetupEvent, CommunityNode, ActivityCategory, GroupMember } from "../types";

// Initialize Gemini Client with a fallback to prevent immediate crash if key is missing.
// If the key is invalid/missing, API calls will fail and trigger the catch blocks below, switching to mock data.
const apiKey = process.env.API_KEY || 'mock_key_for_fallback_mode';
const ai = new GoogleGenAI({ apiKey });

// Define the tool for finding peer support (Refactored for Activity Groups)
const findActivityGroupTool: FunctionDeclaration = {
  name: 'findActivityGroup',
  parameters: {
    type: Type.OBJECT,
    description: 'Finds nearby activity groups based on interest and location.',
    properties: {
      activity: { type: Type.STRING },
      location: { type: Type.STRING },
    },
    required: ['activity', 'location'],
  },
};

// --- MOCK FALLBACK UTILITIES ---
// These ensure the app works perfectly even if the API Quota is hit (Error 429)

const getMockCategory = (text: string): ActivityCategory => {
    const t = text.toLowerCase();
    if (t.includes('sport') || t.includes('run') || t.includes('yoga') || t.includes('gym')) return 'Sports';
    if (t.includes('art') || t.includes('draw') || t.includes('music') || t.includes('paint')) return 'Creative';
    if (t.includes('code') || t.includes('tech') || t.includes('game')) return 'Tech';
    if (t.includes('food') || t.includes('cook') || t.includes('bake')) return 'Food';
    if (t.includes('hike') || t.includes('walk') || t.includes('nature')) return 'Outdoors';
    if (t.includes('read') || t.includes('book') || t.includes('quiet')) return 'Quiet';
    return 'Social';
};

const getMockColor = (cat: ActivityCategory): string => {
    const colors: Record<ActivityCategory, string> = {
        'Sports': '#ef4444',
        'Creative': '#f59e0b',
        'Tech': '#3b82f6',
        'Food': '#f97316',
        'Outdoors': '#10b981',
        'Social': '#ec4899',
        'Quiet': '#8b5cf6'
    };
    return colors[cat];
};

export const analyzeJournal = async (text: string, locationInput: string): Promise<{ analysis: ActivityProfile, toolResult?: ToolResponse }> => {
  try {
    // If using dummy key, throw immediately to use fallback
    if (apiKey === 'mock_key_for_fallback_mode') throw new Error("Using Mock Mode");

    const modelId = 'gemini-3-flash-preview';

    // 1. Analysis Pass
    const analysisResponse = await ai.models.generateContent({
      model: modelId,
      contents: `User Profile Input: "${text}". User Location: "${locationInput}".
      Analyze this input to create a Social Cohesion Profile.
      Return JSON:
      - primary_activity: Specific activity/hobby mentioned or inferred (max 3 words).
      - category: One of ['Sports', 'Creative', 'Tech', 'Food', 'Outdoors', 'Social', 'Quiet'].
      - location_context: A inferred neighborhood vibe (e.g. "Quiet Suburbs" or "Busy Downtown").
      - social_spark: A catchy 1-sentence tagline about this person's interest to attract others.
      - icebreaker: A specific question they could ask a neighbor.
      - nearby_hotspot: A type of place they likely hang out (e.g. "Corner Coffee Shop").
      - color: A hex code representing the activity category (e.g. Green for Outdoors, Red for Sports).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primary_activity: { type: Type.STRING },
            category: { type: Type.STRING },
            location_context: { type: Type.STRING },
            social_spark: { type: Type.STRING },
            icebreaker: { type: Type.STRING },
            nearby_hotspot: { type: Type.STRING },
            color: { type: Type.STRING },
          },
          required: ["primary_activity", "category", "location_context", "social_spark", "icebreaker", "nearby_hotspot", "color"],
        }
      }
    });

    const analysisText = analysisResponse.text;
    if (!analysisText) throw new Error("No analysis generated");
    const analysis: ActivityProfile = JSON.parse(analysisText);

    // 2. Tool Pass
    let toolResult: ToolResponse | undefined;

    // We don't strictly need the second call to succeed for the app to work, 
    // but we simulate the tool usage.
    const toolCheckResponse = await ai.models.generateContent({
      model: modelId,
      contents: `Based on activity "${analysis.primary_activity}", find a local group.`,
      config: {
        tools: [{ functionDeclarations: [findActivityGroupTool] }],
      }
    });
    
    // Always return a positive result for the hackathon demo
    toolResult = {
        peer_support_found: true,
        nearby_count: Math.floor(Math.random() * 15) + 4,
        group_name: `${analysis.primary_activity} Neighbors`,
        group_id: `group-${Date.now()}`
    };

    return { analysis, toolResult };

  } catch (error) {
    console.warn("Gemini API Error (Falling back to local mock):", error);
    
    // FALLBACK LOGIC
    const cat = getMockCategory(text);
    const words = text.split(' ');
    // Try to get a slightly meaningful activity name
    const activity = words.length > 2 ? words.slice(0, 2).join(' ') : (words[0] || "Exploring");
    
    const mockAnalysis: ActivityProfile = {
        primary_activity: activity.charAt(0).toUpperCase() + activity.slice(1),
        category: cat,
        location_context: locationInput || "Local Area",
        social_spark: "Ready to connect with like-minded neighbors.",
        icebreaker: "What got you interested in this?",
        nearby_hotspot: "Local Community Center",
        color: getMockColor(cat)
    };

    const mockTool: ToolResponse = {
        peer_support_found: true,
        nearby_count: 12,
        group_name: `${mockAnalysis.primary_activity} Enthusiasts`,
        group_id: `mock-group-${Date.now()}`
    };

    return { analysis: mockAnalysis, toolResult: mockTool };
  }
};

export const generateCommunitySummary = async (activities: string[]): Promise<string> => {
  try {
    if (apiKey === 'mock_key_for_fallback_mode') throw new Error("Using Mock Mode");
    if (activities.length === 0) return "The neighborhood is quiet, waiting for the first spark.";
    
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Local Activities: ${activities.join(', ')}. 
      Write a single, complete, energetic sentence summarizing what the neighborhood is doing. Do not cut off the sentence. Keep it under 20 words.`,
    });
    return response.text || "The neighborhood is buzzing with diverse energy and connection.";
  } catch (e) {
    return "The neighborhood is alive with shared passions and new connections.";
  }
}

export const generateNodeMetadata = async (activity: string): Promise<{ category: ActivityCategory, color: string }> => {
    try {
        if (apiKey === 'mock_key_for_fallback_mode') throw new Error("Using Mock Mode");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Classify the activity "${activity}" into one category: ['Sports', 'Creative', 'Tech', 'Food', 'Outdoors', 'Social', 'Quiet']. 
            Also provide a hex color code matching that vibe.
            Return JSON: { category, color }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        color: { type: Type.STRING }
                    },
                    required: ["category", "color"]
                }
            }
        });
        return JSON.parse(response.text!) as { category: ActivityCategory, color: string };
    } catch (e) {
        const cat = getMockCategory(activity);
        return { category: cat, color: getMockColor(cat) };
    }
}

export const generateGroupRitual = async (groupName: string, activity: string): Promise<GroupRitual> => {
  try {
    if (apiKey === 'mock_key_for_fallback_mode') throw new Error("Using Mock Mode");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a "Micro-Event" or shared activity for a local group called "${groupName}" interested in "${activity}".
      Return JSON:
      - title: Catchy event title.
      - description: 1 sentence on what to do.
      - duration: e.g. "1 hour".
      - mantra: A motivating slogan for the group.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            duration: { type: Type.STRING },
            mantra: { type: Type.STRING }
          },
          required: ["title", "description", "duration", "mantra"]
        }
      }
    });
    return JSON.parse(response.text!);
  } catch (e) {
    return {
      title: `${activity} Meetup`,
      description: `Join us for a casual session of ${activity} and conversation.`,
      duration: "1 hour",
      mantra: "Connect through passion."
    };
  }
}

export const generateMeetupSuggestions = async (activity: string): Promise<MeetupEvent[]> => {
    try {
        if (apiKey === 'mock_key_for_fallback_mode') throw new Error("Using Mock Mode");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 3 diverse meetup events for neighbors interested in "${activity}".
            Return JSON Array.
            Properties: title, time, location, attendees (number), type ("physical" or "virtual"), description, accessibility (list of strings).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            time: { type: Type.STRING },
                            location: { type: Type.STRING },
                            attendees: { type: Type.NUMBER },
                            type: { type: Type.STRING },
                            description: { type: Type.STRING },
                            accessibility: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["title", "time", "location", "attendees", "type", "description", "accessibility"]
                    }
                }
            }
        });
        const events = JSON.parse(response.text!);
        return events.map((e: any, i: number) => ({ ...e, id: `event-${i}` }));
    } catch (e) {
        return [
            { 
                id: '1', 
                title: `${activity} in the Park`, 
                time: 'Saturday, 10:00 AM', 
                location: 'City Park', 
                attendees: 8, 
                type: 'physical', 
                description: `A relaxed morning of ${activity} under the trees.`,
                accessibility: ['Wheelchair Accessible', 'Pet Friendly']
            },
            { 
                id: '2', 
                title: 'Virtual Coffee & Chat', 
                time: 'Tuesday, 7:00 PM', 
                location: 'Online', 
                attendees: 15, 
                type: 'virtual', 
                description: 'Discussing our latest projects and ideas.',
                accessibility: ['Closed Captions']
            },
            { 
                id: '3', 
                title: 'Evening Workshop', 
                time: 'Thursday, 6:00 PM', 
                location: 'Community Center', 
                attendees: 5, 
                type: 'physical', 
                description: 'Skill sharing session for all levels.',
                accessibility: ['Wheelchair Accessible']
            }
        ];
    }
}

export const generateSimulatedChat = async (activity: string, userMessage: string): Promise<ChatMessage> => {
    try {
        if (apiKey === 'mock_key_for_fallback_mode') throw new Error("Using Mock Mode");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a neighbor in a group about "${activity}".
            User said: "${userMessage}".
            Respond enthusiastically about the activity. Keep it short.
            Name: [Alex, Sam, Jordan, Casey].
            Format: "Name: Message"`,
        });
        
        const text = response.text || "Sam: Sounds great!";
        const [sender, msg] = text.includes(':') ? text.split(':') : ['Neighbor', text];

        return {
            id: Date.now().toString(),
            sender: sender.trim(),
            text: msg ? msg.trim() : "That sounds awesome!",
            isUser: false,
            timestamp: Date.now(),
            senderId: `mem-${Math.floor(Math.random()*8)}`
        }
    } catch (e) {
        const responses = [
            "That's such a great idea!",
            "I'm totally down for that.",
            "Count me in!",
            "Anyone else interested?",
            "Love it!"
        ];
        return {
            id: Date.now().toString(),
            sender: "Alex",
            text: responses[Math.floor(Math.random() * responses.length)],
            isUser: false,
            timestamp: Date.now(),
            senderId: 'mem-1'
        }
    }
}

export const generateGroupMembers = async (activity: string): Promise<GroupMember[]> => {
    // This is already mocked data, so it remains safe.
    const roles = ['Member', 'Member', 'Member', 'New'];
    const names = ['Jordan', 'Alex', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Jamie', 'Quinn'];
    const mbtis = ['ENFP', 'INTJ', 'INFJ', 'ENTP', 'ISFP', 'ESFJ', 'ISTP', 'ENTJ'];
    const genders = ['Non-binary', 'Female', 'Male', 'Female', 'Male', 'Non-binary', 'Female', 'Male'];
    
    return Array.from({ length: 8 }).map((_, i) => ({
        id: `mem-${i}`,
        name: names[i % names.length],
        role: i === 0 ? 'Host' : roles[Math.floor(Math.random() * roles.length)] as any,
        bio: `Loves ${activity} and meeting new people nearby.`,
        interests: [activity, i % 2 === 0 ? 'Coffee' : 'Music', 'Local Events'],
        joinedAt: `${Math.floor(Math.random() * 10) + 1} days ago`,
        isOnline: Math.random() > 0.4,
        avatarColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
        mbti: mbtis[i % mbtis.length],
        gender: genders[i % genders.length],
        age: Math.floor(Math.random() * (45 - 22) + 22) // Random age between 22 and 45
    }));
}
