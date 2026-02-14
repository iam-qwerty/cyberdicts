"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface QuizActionResult {
    error?: string;
    success?: boolean;
    data?: Record<string, unknown>;
}

/**
 * Create a quiz for a league (league admins/creators only)
 */
export async function createQuiz(
    formData: FormData
): Promise<QuizActionResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const leagueId = formData.get("leagueId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const questionsJson = formData.get("questions") as string;

    if (!leagueId || !title || !questionsJson) {
        return { error: "Missing required fields" };
    }

    // Verify user is league member
    const { data: membership } = await supabase
        .from("league_memberships")
        .select("role")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

    if (!membership) {
        return { error: "Not a member of this league" };
    }

    let questions: {
        text: string;
        options: string[];
        correct_index: number;
    }[];

    try {
        questions = JSON.parse(questionsJson);
    } catch {
        return { error: "Invalid questions format" };
    }

    if (questions.length < 1 || questions.length > 5) {
        return { error: "Quiz must have 1-5 questions" };
    }

    // Create quiz
    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
            league_id: leagueId,
            title,
            description: description || null,
            question_count: questions.length,
        })
        .select("id")
        .single();

    if (quizError || !quiz) {
        return { error: quizError?.message || "Failed to create quiz" };
    }

    // Create questions
    const questionRows = questions.map((q) => ({
        quiz_id: quiz.id,
        text: q.text,
        options: q.options,
        correct_index: q.correct_index,
    }));

    const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionRows);

    if (questionsError) {
        // Rollback quiz
        await supabase.from("quizzes").delete().eq("id", quiz.id);
        return { error: questionsError.message };
    }

    revalidatePath(`/leagues/${leagueId}`);

    return { success: true, data: { quizId: quiz.id } };
}

/**
 * Get quizzes for a league
 */
export async function getLeagueQuizzes(leagueId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: quizzes } = await supabase
        .from("quizzes")
        .select(
            `
      *,
      questions:quiz_questions(*)
    `
        )
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false });

    return quizzes || [];
}

/**
 * Get a single quiz with questions for taking
 */
export async function getQuizForAttempt(quizId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: quiz } = await supabase
        .from("quizzes")
        .select(
            `
      *,
      questions:quiz_questions(id, text, options)
    `
        )
        .eq("id", quizId)
        .single();

    // Don't return correct_index to the client
    return quiz;
}

/**
 * Get user's past attempts for a quiz
 */
export async function getUserQuizAttempts(quizId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return attempts || [];
}
