// Shared types for SoMingle survey + waitlist data.

export type SurveyPayload = {
  // Step 1 — About You
  fullName: string;
  email: string;
  phone?: string;
  instagram?: string;
  ageRange: string;
  city: string;
  occupation: string;
  status: string;

  // Step 2 — Real Talk
  eventFrustrations: string;
  goingOutLess: string;
  worthAttending: string;
  spentAndDisappointed: string; // "Yes" | "No"
  disappointedWhy: string;

  // Step 3 — What Do You Actually Want
  experienceInterests: string[];
  motivation: string;
  missingInCity: string;

  // Step 4 — Your Vibe (choose up to 5 words)
  vibeWords: string[];

  // Step 5 — Connection Style
  hopingToGain: string[];
  meetingPreference: string;
  affordabilityImportance: number; // 1-10
  likeMindedImportance: number; // 1-10

  // Step 6 — Music (SoMingle × Yo DJ)
  musicGenres: string[];
  preferredEventMusic: string;
  musicImportance: number; // 1-10
  attendForDj: string; // "Yes" | "No"
  discoverDjs: string; // "Yes" | "No"

  // Step 7 — Event Creator
  hostsEvents: string; // "Yes" | "No"
  eventType: string;
  creatorChallenges: string[];
  howSomingleHelps: string;

  // Step 8 — The Future (ends emotionally)
  dreamEvent: string;
  wantsEarlyAccess: string; // "Yes" | "No"
  rolesInterested: string[];
  belongingFeeling: string;
};

export type SurveyRecord = SurveyPayload & {
  id: number;
  createdAt: string;
};

export type EventPayload = {
  title: string;
  description: string;
  category: string;
  city: string;
  venue: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // e.g. "9:00 PM"
  priceFrom: number; // 0 = free
  imageUrl: string;
  ticketUrl: string;
  organizer: string;
  trending: boolean;
};

export type EventRecord = EventPayload & {
  id: number;
  createdAt: string;
};

// Structural copy of VibeProfile (kept here to avoid a types<->vibe import cycle).
export type VibeSnapshot = {
  connectedAt: string;
  source: string;
  topGenres: string[];
  topArtists: string[];
  energy: number;
  danceability: number;
  valence: number;
};

export type RsvpPayload = {
  eventId: number;
  name: string;
  email: string;
  vibe?: VibeSnapshot;
};

export type RsvpRecord = RsvpPayload & {
  id: number;
  createdAt: string;
};

export type WaitlistPayload = {
  name: string;
  email: string;
};

export type WaitlistRecord = WaitlistPayload & {
  id: number;
  createdAt: string;
};
