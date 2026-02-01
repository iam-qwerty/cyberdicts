/**
 * Cyberdict Scoring System
 * 
 * Configurable scoring rules for gamification.
 * All values are easily adjustable for future tweaking.
 * 
 * Per SPEC.md Section 6:
 * - check-in = 10 pts
 * - quiz correct = 5 pts / question
 * - upvoted helpful message = 15 pts (after validation)
 * - streak bonus = +2% per consecutive day (max 30%)
 */

// Base point values - easily configurable
export const SCORING_CONFIG = {
    // Check-in points
    CHECKIN_BASE: 10,

    // Quiz points per correct answer
    QUIZ_CORRECT_ANSWER: 5,

    // Message/help points
    MESSAGE_UPVOTED: 15,
    RESOURCE_PINNED: 10,
    PEER_HELP_VALIDATED: 20,

    // Streak bonuses
    STREAK_BONUS_PERCENT_PER_DAY: 2,
    STREAK_BONUS_MAX_PERCENT: 30,

    // Time window for daily check-in (in hours)
    CHECKIN_WINDOW_HOURS: 24,

    // Anti-cheat: minimum seconds between actions
    MIN_ACTION_INTERVAL_SECONDS: 5,

    // Anti-cheat: max actions per hour
    MAX_ACTIONS_PER_HOUR: 100,
} as const;

export type ScoringEventType =
    | "checkin"
    | "quiz_attempt"
    | "message"
    | "upvote"
    | "resource_pin"
    | "peer_help_validated";

/**
 * Calculate points for a check-in event
 */
export function calculateCheckinPoints(currentStreak: number): number {
    const basePoints = SCORING_CONFIG.CHECKIN_BASE;
    const streakBonus = calculateStreakBonus(currentStreak);
    return Math.round(basePoints * (1 + streakBonus / 100));
}

/**
 * Calculate points for quiz attempt
 */
export function calculateQuizPoints(
    correctAnswers: number,
    currentStreak: number
): number {
    const basePoints = correctAnswers * SCORING_CONFIG.QUIZ_CORRECT_ANSWER;
    const streakBonus = calculateStreakBonus(currentStreak);
    return Math.round(basePoints * (1 + streakBonus / 100));
}

/**
 * Calculate streak bonus percentage
 */
export function calculateStreakBonus(streak: number): number {
    const bonusPercent = streak * SCORING_CONFIG.STREAK_BONUS_PERCENT_PER_DAY;
    return Math.min(bonusPercent, SCORING_CONFIG.STREAK_BONUS_MAX_PERCENT);
}

/**
 * Check if user can check in (hasn't checked in today)
 */
export function canCheckIn(lastCheckinAt: Date | null): boolean {
    if (!lastCheckinAt) return true;

    const now = new Date();
    const lastCheckin = new Date(lastCheckinAt);

    // Reset at midnight UTC
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    return lastCheckin < todayStart;
}

/**
 * Check if streak continues or resets
 */
export function shouldContinueStreak(lastCheckinAt: Date | null): boolean {
    if (!lastCheckinAt) return false;

    const now = new Date();
    const lastCheckin = new Date(lastCheckinAt);

    // Calculate yesterday's start
    const yesterdayStart = new Date(now);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
    yesterdayStart.setUTCHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(now);
    yesterdayEnd.setUTCHours(0, 0, 0, 0);

    // Streak continues if last check-in was yesterday or today
    return lastCheckin >= yesterdayStart;
}

/**
 * Calculate new streak value
 */
export function calculateNewStreak(
    currentStreak: number,
    lastCheckinAt: Date | null
): number {
    if (shouldContinueStreak(lastCheckinAt)) {
        return currentStreak + 1;
    }
    return 1; // Reset to 1 for today's check-in
}

/**
 * Anti-cheat: Check if action is allowed
 */
export function isActionAllowed(
    lastActionAt: Date | null,
    actionsThisHour: number
): { allowed: boolean; reason?: string } {
    if (lastActionAt) {
        const now = new Date();
        const timeSinceLastAction = (now.getTime() - new Date(lastActionAt).getTime()) / 1000;

        if (timeSinceLastAction < SCORING_CONFIG.MIN_ACTION_INTERVAL_SECONDS) {
            return {
                allowed: false,
                reason: `Please wait ${SCORING_CONFIG.MIN_ACTION_INTERVAL_SECONDS - Math.floor(timeSinceLastAction)} seconds`,
            };
        }
    }

    if (actionsThisHour >= SCORING_CONFIG.MAX_ACTIONS_PER_HOUR) {
        return {
            allowed: false,
            reason: "Rate limit reached. Please try again later.",
        };
    }

    return { allowed: true };
}

/**
 * Get points for an event type
 */
export function getPointsForEvent(
    eventType: ScoringEventType,
    payload: Record<string, unknown> = {},
    currentStreak: number = 0
): number {
    switch (eventType) {
        case "checkin":
            return calculateCheckinPoints(currentStreak);

        case "quiz_attempt":
            const correctAnswers = (payload.correctAnswers as number) || 0;
            return calculateQuizPoints(correctAnswers, currentStreak);

        case "upvote":
            return SCORING_CONFIG.MESSAGE_UPVOTED;

        case "resource_pin":
            return SCORING_CONFIG.RESOURCE_PINNED;

        case "peer_help_validated":
            return SCORING_CONFIG.PEER_HELP_VALIDATED;

        case "message":
            return 0; // Messages don't directly earn points, only upvotes do

        default:
            return 0;
    }
}
