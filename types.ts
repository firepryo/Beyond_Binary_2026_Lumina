
export type ActivityCategory = 'Sports' | 'Creative' | 'Tech' | 'Food' | 'Outdoors' | 'Social' | 'Quiet';

export interface ActivityProfile {
  primary_activity: string; // e.g., "Urban Gardening"
  category: ActivityCategory;
  location_context: string; // e.g., "Downtown"
  social_spark: string; // A hook to start convo
  icebreaker: string;
  nearby_hotspot: string; 
  color: string;
}

export interface CommunityNode {
  id: string;
  x: number; // Represents Longitude/East-West
  y: number; // Represents Latitude/North-South
  z: number; // Represents Interest Compatibility Depth
  color: string;
  size: number;
  activity: string; // Replaces sentiment
  category: ActivityCategory;
  distance: string; // e.g. "0.4 km away"
  timestamp: number;
  verified: boolean; // Safety layer
  placeUri?: string; // For Google Maps Grounding
}

export type AppView = 'onboarding' | 'landing' | 'recording' | 'processing' | 'visualization' | 'group-resonance' | 'void';

export interface ToolResponse {
  peer_support_found: boolean;
  nearby_count: number;
  group_name: string;
  group_id: string;
}

export interface GroupRitual {
  title: string;
  description: string;
  duration: string;
  mantra: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  senderId?: string; // To link to profile
}

export interface MeetupEvent {
  id: string;
  title: string;
  time: string;
  location: string;
  attendees: number;
  type: 'physical' | 'virtual';
  description: string;
  accessibility: string[]; // e.g. "Wheelchair Accessible", "Audio Desc"
}

export interface VideoParticipant {
  id: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  color: string; 
}

export interface GroupMember {
  id: string;
  name: string;
  role: 'Host' | 'Member' | 'New';
  bio: string;
  interests: string[];
  joinedAt: string;
  isOnline: boolean;
  avatarColor: string;
  mbti: string;
  gender: string;
  age: number;
}
