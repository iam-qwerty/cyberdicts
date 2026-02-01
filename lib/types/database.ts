// Database types for Cyberdict
// These match the Supabase schema defined in supabase/schema.sql

export type UserRole = "user" | "admin";
export type LeagueMemberRole = "member" | "admin" | "creator";
export type EventType =
    | "checkin"
    | "quiz_attempt"
    | "message"
    | "upvote"
    | "resource_pin"
    | "peer_help_validated";

export interface Profile {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    role: UserRole;
    primary_cert_id: string | null;
    created_at: string;
}

export interface Certification {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    created_at: string;
}

export interface League {
    id: string;
    cert_id: string;
    name: string;
    is_private: boolean;
    capacity: number;
    start_date: string | null;
    created_by: string;
    invite_code: string;
    member_count: number;
    created_at: string;
    // Join fields
    certification?: Certification;
}

export interface LeagueMembership {
    id: string;
    league_id: string;
    user_id: string;
    role: LeagueMemberRole;
    joined_at: string;
    // Join fields
    league?: League;
    profile?: Profile;
}

export interface Event {
    id: string;
    user_id: string;
    league_id: string;
    type: EventType;
    payload: Record<string, unknown>;
    points: number;
    created_at: string;
}

export interface Streak {
    id: string;
    user_id: string;
    league_id: string;
    current_streak: number;
    max_streak: number;
    last_checkin_at: string | null;
}

export interface Quiz {
    id: string;
    league_id: string;
    title: string;
    description: string | null;
    question_count: number;
    created_at: string;
    // Join fields
    questions?: QuizQuestion[];
}

export interface QuizQuestion {
    id: string;
    quiz_id: string;
    text: string;
    options: string[]; // Array of option strings
    correct_index: number;
}

export interface QuizAttempt {
    id: string;
    user_id: string;
    quiz_id: string;
    answers: number[]; // Array of selected indices
    score: number;
    total_questions: number;
    created_at: string;
}

export interface Message {
    id: string;
    league_id: string;
    user_id: string;
    body: string;
    parent_id: string | null;
    pinned: boolean;
    upvotes: number;
    created_at: string;
    // Join fields
    profile?: Profile;
    replies?: Message[];
}

export interface LeaderboardEntry {
    id: string;
    league_id: string;
    user_id: string;
    points: number;
    rank: number;
    updated_at: string;
    // Join fields - only name is required for display
    profile?: { name: string | null } | Profile;
}

// API Response types
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

// Dashboard types
export interface DashboardStats {
    totalPoints: number;
    currentStreak: number;
    maxStreak: number;
    rank: number;
    leaguesJoined: number;
}

export interface TodayTask {
    hasCheckedIn: boolean;
    lastCheckinAt: string | null;
    availableQuiz: Quiz | null;
}
