/**
 * @signbridge/shared-types
 *
 * Types shared between the web app, the API, and (via codegen later) the ML
 * service. Keep this package free of runtime dependencies so it can be imported
 * from any environment.
 */

/** Supported interface and translation languages for the MVP. */
export type LanguageCode = 'en' | 'hi' | 'gu' | 'mr' | 'bn' | 'ta' | 'te';

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['en', 'hi', 'gu', 'mr', 'bn', 'ta', 'te'] as const;

/** The communication media SignBridge bridges between. */
export type Modality = 'sign' | 'speech' | 'text' | 'avatar';

/** Standard envelope returned by every API endpoint. */
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError };

export interface ApiError {
  /** Machine-readable code, e.g. "VALIDATION_ERROR". */
  code: string;
  /** Human-readable message safe to surface to end users. */
  message: string;
  /** Optional field-level details for form validation. */
  details?: Record<string, string[]>;
}

/**
 * User roles. Kept in sync with the Prisma `Role` enum (same members).
 * Only the first three are self-selectable at registration; `ADMIN` is
 * assigned out-of-band and never via the public API.
 */
export type UserRole = 'DEAF_USER' | 'HEARING_USER' | 'LEARNER' | 'ADMIN';

export const SELECTABLE_ROLES: readonly UserRole[] = [
  'DEAF_USER',
  'HEARING_USER',
  'LEARNER',
] as const;

/** A user as exposed to clients — never includes secrets like passwordHash. */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

/** Payload returned by register/login: the user plus a short-lived access token. */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

/** Relative size of interface text, applied app-wide via a CSS scale. */
export type TextScale = 'NORMAL' | 'LARGE' | 'LARGER';

/** The authenticated user's profile, as returned by the users API. */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

/** Per-user interface preferences, applied app-wide. */
export interface UserSettings {
  interfaceLanguage: LanguageCode;
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: boolean;
  captionsEnabled: boolean;
}

/** How a conversation is conducted. SPEECH is this phase; others land later. */
export type ConversationMode = 'SPEECH' | 'LIVE' | 'VIDEO';

/** The medium a single message was produced in. */
export type MessageModality = 'SPEECH' | 'TEXT' | 'SIGN' | 'AVATAR';

/** Who produced a message: the signed-in user or their conversation partner. */
export type MessageSender = 'USER' | 'PARTNER';

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  modality: MessageModality;
  language: LanguageCode;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  mode: ConversationMode;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

/** List item for the conversation history view: a conversation plus a preview. */
export interface ConversationSummary extends Conversation {
  messageCount: number;
  lastMessagePreview: string | null;
}

/**
 * Initial ISL recognition vocabulary (MVP, static signs).
 *
 * IMPORTANT: each label MUST be verified against the ISLRTC Indian Sign Language
 * dictionary — and ideally reviewed with a Deaf consultant — before real use.
 * This is a starting candidate set, not validated ISL.
 */
export const ISL_VOCABULARY = [
  'hello',
  'yes',
  'no',
  'thank_you',
  'please',
  'help',
  'stop',
  'i',
  'you',
  'good',
  'eat',
  'drink',
  'water',
  'name',
  'more',
  'emergency',
  'sorry',
  'love',
  'family',
  'friend',
  'time',
  'day',
  'night',
  'work',
  'school',
  'home',
  'doctor',
  'hospital',
  'police',
  'wait',
  'ready',
  'who',
  'what',
  'where',
  'when',
  'why',
  'how',
  'he',
  'she',
  'they',
  'we',
  'it',
  'my',
  'your',
  'his',
  'her',
  'go',
  'come',
  'do',
  'make',
  'know',
  'think',
  'feel',
  'see',
  'want',
  'like',
  'give',
  'take',
  'need',
  'man',
  'woman',
  'child',
  'book',
  'car',
  'house',
  'money',
  'food',
  'job',
  'phone',
  'people',
  'city',
  'big',
  'small',
  'hot',
  'cold',
  'happy',
  'sad',
  'angry',
  'fast',
  'slow',
  'very',
  'now',
  'today',
  'tomorrow',
  'yesterday',
  'bye',
  'fine',
  'okay',
] as const;

export type IslLabel = (typeof ISL_VOCABULARY)[number];

/**
 * Length of the normalized landmark feature vector: two hand slots, each a
 * presence flag plus 21 (x, y) pairs → 2 × (1 + 42) = 86. Shared by collection,
 * inference, and the trainer so they can never drift apart.
 */
export const SIGN_FEATURE_LENGTH = 86;

export interface SignSampleInput {
  label: IslLabel;
  features: number[]; // fixed-length normalized vector (SIGN_FEATURE_LENGTH)
  handCount: 1 | 2;
}

export interface SignSampleStats {
  label: IslLabel;
  count: number;
}

export interface SignPrediction {
  label: IslLabel;
  confidence: number;
}

/** A single token of an ISL gloss produced from text (Phase 6 live mode). */
export interface IslGlossToken {
  text: string; // the word/label shown
  label: string | null; // matched ISL_VOCABULARY label, or null if unmatched
  known: boolean; // true if a known sign exists for it
}

/** The two seats in a co-located live conversation. */
export type LiveSeat = 'speech' | 'sign';

/** Request body for the translation endpoint. */
export interface TranslateRequest {
  text: string;
  from: LanguageCode; // 'en' | 'hi' | 'gu'
  to: LanguageCode;
}

/** Result of a translation. `translated` is false when passthrough/fallback ran. */
export interface TranslateResult {
  text: string; // translated text (or original if not translated)
  from: LanguageCode;
  to: LanguageCode;
  translated: boolean;
  provider: string;
}

/** A single ICE server entry for RTCPeerConnection configuration. */
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/** Returned when a video call is created. */
export interface CreateCallResult {
  roomId: string;
  conversationId: string;
  iceServers: IceServerConfig[];
}

/** Messages exchanged over the WebRTC data channel during a call. */
export type CallDataMessage =
  | { kind: 'caption'; text: string; language: LanguageCode; final: boolean }
  | { kind: 'sign'; text: string; final: boolean };

/**
 * ICE candidate payload. Structurally compatible with the browser's
 * RTCIceCandidateInit (defined locally so this package needs no DOM lib).
 */
export interface RtcIceCandidate {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

/** WebRTC signaling messages relayed via Socket.IO. */
export type SignalMessage =
  | { type: 'offer'; sdp: string; fromId?: string; toId?: string }
  | { type: 'answer'; sdp: string; fromId?: string; toId?: string }
  | { type: 'ice-candidate'; candidate: RtcIceCandidate; fromId?: string; toId?: string };

// ─── Emergency module (Phase 10) ────────────────────────────────────────────

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string | null;
  isPrimary: boolean;
}

export interface QuickPhrase {
  id: string;
  text: string;
  language: LanguageCode;
  sortOrder: number;
}

export interface EmergencyEvent {
  id: string;
  text: string;
  language: LanguageCode;
  channel: 'spoken' | 'displayed' | 'contact';
  createdAt: string;
}

/** A built-in emergency phrase with bundled translations (works offline). */
export interface BuiltInPhrase {
  id: string;
  icon?: string;
  text: Record<LanguageCode, string>;
}

/**
 * Built-in emergency phrases. Bundled inline (with translations) so they work
 * instantly with no network.
 *
 * IMPORTANT: the Hindi (hi) and Gujarati (gu) translations below are best-effort
 * and MUST be verified by a native speaker before real-world / safety use — treat
 * this with the same caution as the ISLRTC vocabulary verification note.
 */
export const EMERGENCY_PHRASES: BuiltInPhrase[] = [
  {
    id: 'need-help',
    icon: 'CircleHelp',
    text: { en: 'I need help', hi: 'मुझे मदद चाहिए', gu: 'મને મદદ જોઈએ છે', mr: 'मला मदत हवी आहे', bn: 'আমার সাহায্য দরকার', ta: 'எனக்கு உதவி வேண்டும்', te: 'నాకు సహాయం కావాలి' },
  },
  {
    id: 'call-ambulance',
    icon: 'Ambulance',
    text: {
      en: 'Please call an ambulance',
      hi: 'कृपया एम्बुलेंस बुलाएँ',
      gu: 'કૃપા કરીને એમ્બ્યુલન્સ બોલાવો',
      mr: 'कृपया रुग्णवाहिका बोलवा',
      bn: 'দয়া করে অ্যাম্বুলেন্স ডাকুন',
      ta: 'ஆம்புலன்ஸை அழைக்கவும்',
      te: 'దయచేసి అంబులెన్స్‌ని పిలవండి',
    },
  },
  {
    id: 'deaf',
    icon: 'EarOff',
    text: {
      en: 'I am Deaf / hard of hearing',
      hi: 'मैं बहरा हूँ / मुझे सुनने में कठिनाई है',
      gu: 'હું બહેરો છું / મને સાંભળવામાં તકલીફ છે',
      mr: 'मी बहिरा आहे / मला ऐकण्यास त्रास होतो',
      bn: 'আমি বধির / আমার শুনতে অসুবিধা হয়',
      ta: 'நான் காது கேளாதவன் / எனக்கு காது சரியாக கேட்காது',
      te: 'నేను చెవిటివాడిని / నాకు వినపడదు',
    },
  },
  {
    id: 'need-doctor',
    icon: 'Stethoscope',
    text: { en: 'I need a doctor', hi: 'मुझे डॉक्टर चाहिए', gu: 'મને ડૉક્ટરની જરૂર છે', mr: 'मला डॉक्टरांची गरज आहे', bn: 'আমার একজন ডাক্তার দরকার', ta: 'எனக்கு ஒரு மருத்துவர் வேண்டும்', te: 'నాకు డాక్టర్ కావాలి' },
  },
  {
    id: 'call-police',
    icon: 'Shield',
    text: {
      en: 'Please call the police',
      hi: 'कृपया पुलिस को बुलाएँ',
      gu: 'કૃપા કરીને પોલીસને બોલાવો',
      mr: 'कृपया पोलिसांना बोलवा',
      bn: 'দয়া করে পুলিশ ডাকুন',
      ta: 'போலீசை அழைக்கவும்',
      te: 'దయచేసి పోలీసులను పిలవండి',
    },
  },
  {
    id: 'fire',
    icon: 'Flame',
    text: { en: 'There is a fire', hi: 'आग लगी है', gu: 'આગ લાગી છે', mr: 'तिथे आग लागली आहे', bn: 'এখানে আগুন লেগেছে', ta: 'இங்கே தீ விபத்து ஏற்பட்டுள்ளது', te: 'అక్కడ మంటలు ఉన్నాయి' },
  },
  {
    id: 'lost',
    icon: 'MapPin',
    text: { en: 'I am lost', hi: 'मैं रास्ता भटक गया हूँ', gu: 'હું રસ્તો ભૂલી ગયો છું', mr: 'मी हरवलो आहे', bn: 'আমি হারিয়ে গেছি', ta: 'நான் வழி தவறிவிட்டேன்', te: 'నేను దారి తప్పాను' },
  },
  {
    id: 'cannot-breathe',
    icon: 'Wind',
    text: { en: 'I cannot breathe', hi: 'मुझे साँस नहीं आ रही', gu: 'મને શ્વાસ લેવામાં તકલીફ છે', mr: 'मला श्वास घेता येत नाहीये', bn: 'আমি শ্বাস নিতে পারছি না', ta: 'என்னால் சுவாசிக்க முடியவில்லை', te: 'నాకు ఊపిరి ఆడటం లేదు' },
  },
  {
    id: 'injured',
    icon: 'Bandage',
    text: { en: 'I am injured', hi: 'मैं घायल हूँ', gu: 'હું ઘાયલ છું', mr: 'मी जखमी झालो आहे', bn: 'আমি আহত হয়েছি', ta: 'நான் காயமடைந்துள்ளேன்', te: 'నేను గాయపడ్డాను' },
  },
  {
    id: 'write-it-down',
    icon: 'PenLine',
    text: { en: 'Please write it down', hi: 'कृपया इसे लिख दें', gu: 'કૃપા કરીને તે લખી આપો', mr: 'कृपया हे लिहून द्या', bn: 'দয়া করে এটি লিখে দিন', ta: 'இதை எழுதித் தரவும்', te: 'దయచేసి దీన్ని రాసి ఇవ్వండి' },
  },
  {
    id: 'need-medication',
    icon: 'Pill',
    text: { en: 'I need my medication', hi: 'मुझे मेरी दवा चाहिए', gu: 'મને મારી દવા જોઈએ છે', mr: 'मला माझी औषधे हवी आहेत', bn: 'আমার ঔষধ দরকার', ta: 'எனக்கு என் மருந்துகள் வேண்டும்', te: 'నాకు మందులు కావాలి' },
  },
  {
    id: 'help-communicate',
    icon: 'MessagesSquare',
    text: {
      en: 'Help me communicate',
      hi: 'मुझे बात करने में मदद करें',
      gu: 'મને વાતચીત કરવામાં મદદ કરો',
      mr: 'मला संवाद साधण्यास मदत करा',
      bn: 'আমাকে যোগাযোগ করতে সাহায্য করুন',
      ta: 'பேச உதவுங்கள்',
      te: 'మాట్లాడటానికి సహాయం చేయండి',
    },
  },
];

// ─── Learning center (Phase 11) ─────────────────────────────────────────────

export type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  labels: string[];
}

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  score: number | null;
}

export interface SignMastery {
  label: string;
  attemptCount: number;
  correctCount: number;
}

/**
 * Data-driven lessons over the alphabet/number labels the recognizer and pose
 * library already support. Labels match the dataset folder names (A–Z, 0–9).
 */
export const LESSONS: Lesson[] = [
  {
    id: 'letters-a-g',
    title: 'Letters A–G',
    description: 'Your first seven letters of the ISL alphabet.',
    labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  },
  {
    id: 'letters-h-n',
    title: 'Letters H–N',
    description: 'The next seven letters.',
    labels: ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  },
  {
    id: 'letters-o-u',
    title: 'Letters O–U',
    description: 'Seven more letters to build fluency.',
    labels: ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  },
  {
    id: 'letters-v-z',
    title: 'Letters V–Z',
    description: 'Finish the alphabet.',
    labels: ['V', 'W', 'X', 'Y', 'Z'],
  },
  {
    id: 'numbers-0-9',
    title: 'Numbers 0–9',
    description: 'Count from zero to nine in ISL.',
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  },
];

/** Service health payload returned by GET /api/health. */
export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  dependencies: {
    database: 'connected' | 'disconnected';
  };
}

// ─── Admin Analytics (Phase 11) ─────────────────────────────────────────────

export interface AdminAnalyticsStats {
  totalSignsTranslated: number;
  activeVideoCalls: number;
  newUsers: number;
  usageData: { name: string; signs: number; calls: number; users: number }[];
}

export interface AdminSignSample {
  id: string;
  label: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}
