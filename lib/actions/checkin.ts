"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
    calculateCheckinPoints,
    calculateNewStreak,
    canCheckIn,
    calculateQuizPoints,
} from "@/lib/scoring";

export interface CheckinActionResult {
    error?: string;
    success?: boolean;
    points?: number;
    streak?: number;
}

export async function performCheckin(leagueId: string): Promise<CheckinActionResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Verify membership
    const { data: membership } = await supabase
        .from("league_memberships")
        .select("id")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

    if (!membership) {
        return { error: "Not a member of this league" };
    }

    // Get current streak
    const { data: streak } = await supabase
        .from("streaks")
        .select("*")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

    const lastCheckinAt = streak?.last_checkin_at
        ? new Date(streak.last_checkin_at)
        : null;

    // Check if user can check in today
    if (!canCheckIn(lastCheckinAt)) {
        return { error: "Already checked in today" };
    }

    // Calculate new streak and points
    const currentStreak = streak?.current_streak || 0;
    const newStreak = calculateNewStreak(currentStreak, lastCheckinAt);
    const points = calculateCheckinPoints(newStreak);

    // Create check-in event
    const { error: eventError } = await supabase.from("events").insert({
        user_id: user.id,
        league_id: leagueId,
        type: "checkin",
        points,
        payload: { streak: newStreak },
    });

    if (eventError) {
        return { error: eventError.message };
    }

    // Update streak
    const maxStreak = Math.max(streak?.max_streak || 0, newStreak);
    await supabase.from("streaks").upsert({
        user_id: user.id,
        league_id: leagueId,
        current_streak: newStreak,
        max_streak: maxStreak,
        last_checkin_at: new Date().toISOString(),
    });

    // Update leaderboard
    await updateLeaderboard(leagueId, user.id, points);

    revalidatePath("/dashboard");
    revalidatePath(`/leagues/${leagueId}`);

    return { success: true, points, streak: newStreak };
}

export async function submitQuizAttempt(
    quizId: string,
    answers: number[]
): Promise<CheckinActionResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Get quiz with questions
    const { data: quiz } = await supabase
        .from("quizzes")
        .select(
            `
      *,
      questions:quiz_questions(*)
    `
        )
        .eq("id", quizId)
        .single();

    if (!quiz) {
        return { error: "Quiz not found" };
    }

    // Calculate score
    let correctAnswers = 0;
    const questions = quiz.questions || [];

    questions.forEach((q: { correct_index: number }, i: number) => {
        if (answers[i] === q.correct_index) {
            correctAnswers++;
        }
    });

    // Get current streak for bonus calculation
    const { data: streak } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("league_id", quiz.league_id)
        .eq("user_id", user.id)
        .single();

    const currentStreak = streak?.current_streak || 0;
    const points = calculateQuizPoints(correctAnswers, currentStreak);

    // Save attempt
    const { error: attemptError } = await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        quiz_id: quizId,
        answers,
        score: correctAnswers,
        total_questions: questions.length,
    });

    if (attemptError) {
        return { error: attemptError.message };
    }

    // Create event
    await supabase.from("events").insert({
        user_id: user.id,
        league_id: quiz.league_id,
        type: "quiz_attempt",
        points,
        payload: {
            quiz_id: quizId,
            correct_answers: correctAnswers,
            total_questions: questions.length,
        },
    });

    // Update leaderboard
    await updateLeaderboard(quiz.league_id, user.id, points);

    revalidatePath("/dashboard");
    revalidatePath(`/leagues/${quiz.league_id}`);

    return {
        success: true,
        points,
        streak: currentStreak,
    };
}

async function updateLeaderboard(
    leagueId: string,
    userId: string,
    pointsToAdd: number
) {
    const supabase = await createClient();

    // Get current entry
    const { data: current } = await supabase
        .from("leaderboard_aggregates")
        .select("points")
        .eq("league_id", leagueId)
        .eq("user_id", userId)
        .single();

    const newPoints = (current?.points || 0) + pointsToAdd;

    // Upsert leaderboard entry
    await supabase.from("leaderboard_aggregates").upsert({
        league_id: leagueId,
        user_id: userId,
        points: newPoints,
        updated_at: new Date().toISOString(),
    });

    // Recalculate ranks for this league
    const { data: entries } = await supabase
        .from("leaderboard_aggregates")
        .select("id, points")
        .eq("league_id", leagueId)
        .order("points", { ascending: false });

    if (entries) {
        for (let i = 0; i < entries.length; i++) {
            await supabase
                .from("leaderboard_aggregates")
                .update({ rank: i + 1 })
                .eq("id", entries[i].id);
        }
    }
}

export async function getTodayTask(leagueId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Get streak info
    const { data: streak } = await supabase
        .from("streaks")
        .select("*")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

    const lastCheckinAt = streak?.last_checkin_at
        ? new Date(streak.last_checkin_at)
        : null;

    const hasCheckedIn = !canCheckIn(lastCheckinAt);

    // Get available quiz
    const { data: quiz } = await supabase
        .from("quizzes")
        .select("*")
        .eq("league_id", leagueId)
        .limit(1)
        .single();

    return {
        hasCheckedIn,
        lastCheckinAt: streak?.last_checkin_at || null,
        currentStreak: streak?.current_streak || 0,
        availableQuiz: quiz || null,
    };
}
