import { createClient } from "@/utils/supabase/server";
import { Header } from "@/components/layout/header";
import { QuizCreator } from "@/components/ui/quiz-creator";
import { notFound, redirect } from "next/navigation";

export default async function CreateQuizPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get league and verify membership
    const { data: league } = await supabase
        .from("leagues")
        .select("id, name")
        .eq("id", leagueId)
        .single();

    if (!league) {
        notFound();
    }

    const { data: membership } = await supabase
        .from("league_memberships")
        .select("role")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

    if (!membership) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Header
                title="Create Quiz"
                description={`Add a quiz for ${league.name}`}
            />

            <QuizCreator leagueId={league.id} leagueName={league.name} />
        </div>
    );
}
