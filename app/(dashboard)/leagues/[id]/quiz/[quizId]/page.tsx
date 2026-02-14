import { createClient } from "@/utils/supabase/server";
import { Header } from "@/components/layout/header";
import { QuizPlayer } from "@/components/ui/quiz-player";
import { notFound, redirect } from "next/navigation";

export default async function QuizPage({
    params,
}: {
    params: Promise<{ id: string; quizId: string }>;
}) {
    const { id: leagueId, quizId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get quiz with questions (without correct_index for fair play)
    const { data: quiz } = await supabase
        .from("quizzes")
        .select(
            `
      id,
      title,
      description,
      league_id,
      questions:quiz_questions(id, text, options)
    `
        )
        .eq("id", quizId)
        .single();

    if (!quiz || quiz.league_id !== leagueId) {
        notFound();
    }

    // Get league name for breadcrumb
    const { data: league } = await supabase
        .from("leagues")
        .select("name")
        .eq("id", leagueId)
        .single();

    return (
        <div className="max-w-2xl mx-auto">
            <Header
                title={league?.name || "Quiz"}
                description="Answer each question and submit to earn points"
            />

            <QuizPlayer
                quizId={quiz.id}
                title={quiz.title}
                description={quiz.description}
                questions={quiz.questions || []}
                leagueId={leagueId}
            />
        </div>
    );
}
