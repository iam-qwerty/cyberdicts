import { createClient, getUser } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/ui/task-card";
import { Leaderboard } from "@/components/ui/leaderboard";
import { QuizCard } from "@/components/ui/quiz-player";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Copy, Trophy, MessageSquare, BookOpen, Plus } from "lucide-react";
import { canCheckIn } from "@/lib/scoring";
import { LeagueChat } from "./chat";
import Link from "next/link";

export default async function LeagueDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getUser();
    const supabase = await createClient();

    // Get league with certification
    const { data: league } = await supabase
        .from("leagues")
        .select(`
      *,
      certification:certifications(*)
    `)
        .eq("id", id)
        .single();

    if (!league) {
        notFound();
    }

    // Check membership
    const { data: membership } = await supabase
        .from("league_memberships")
        .select("*")
        .eq("league_id", id)
        .eq("user_id", user!.id)
        .single();

    if (!membership) {
        redirect("/leagues");
    }

    // Get user's streak in this league
    const { data: streak } = await supabase
        .from("streaks")
        .select("*")
        .eq("league_id", id)
        .eq("user_id", user!.id)
        .single();

    const hasCheckedIn = streak?.last_checkin_at
        ? !canCheckIn(new Date(streak.last_checkin_at))
        : false;

    // Get leaderboard
    const { data: leaderboard } = await supabase
        .from("leaderboard_aggregates")
        .select(`
      *,
      profile:profiles(name)
    `)
        .eq("league_id", id)
        .order("points", { ascending: false })
        .limit(20);

    // Get members count
    const { count: memberCount } = await supabase
        .from("league_memberships")
        .select("id", { count: "exact" })
        .eq("league_id", id);

    // Get quizzes for this league
    const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, title, description, question_count, created_at")
        .eq("league_id", id)
        .order("created_at", { ascending: false });

    // Get user's quiz attempts
    const quizIds = quizzes?.map((q) => q.id) || [];
    let attemptCounts: Record<string, number> = {};
    if (quizIds.length > 0) {
        const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("quiz_id")
            .eq("user_id", user!.id)
            .in("quiz_id", quizIds);
        if (attempts) {
            attemptCounts = attempts.reduce((acc, a) => {
                acc[a.quiz_id] = (acc[a.quiz_id] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        }
    }

    return (
        <div>
            <Header
                title={league.name}
                description={league.certification?.title || "General"}
                action={
                    <div className="flex items-center gap-2">
                        {league.is_private && (
                            <Badge variant="secondary">Private</Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {memberCount}/{league.capacity}
                        </Badge>
                    </div>
                }
            />

            {/* League stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            Members
                        </div>
                        <p className="text-lg font-bold">{memberCount}</p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            Start Date
                        </div>
                        <p className="text-sm font-medium">
                            {league.start_date
                                ? new Date(league.start_date).toLocaleDateString()
                                : "Open"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Trophy className="h-3 w-3" />
                            Your Rank
                        </div>
                        <p className="text-lg font-bold text-primary">
                            #{leaderboard?.find((e) => e.user_id === user!.id)?.rank || "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Copy className="h-3 w-3" />
                            Invite Code
                        </div>
                        <p className="text-sm font-mono truncate">{league.invite_code}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Today's task */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                    TODAY&apos;S TASK
                </h2>
                <div className="max-w-md">
                    <TaskCard
                        leagueId={id}
                        leagueName={league.name}
                        hasCheckedIn={hasCheckedIn}
                        currentStreak={streak?.current_streak || 0}
                    />
                </div>
            </div>

            {/* Tabs for Leaderboard, Quizzes, and Chat */}
            <Tabs defaultValue="leaderboard">
                <TabsList>
                    <TabsTrigger value="leaderboard" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        Leaderboard
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        Quizzes
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Chat
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="leaderboard" className="mt-4">
                    <div className="max-w-lg">
                        <Leaderboard
                            entries={leaderboard || []}
                            currentUserId={user!.id}
                            title="League Leaderboard"
                            maxHeight="500px"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="quizzes" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground">AVAILABLE QUIZZES</h3>
                            <Link href={`/leagues/${id}/quiz/create`}>
                                <Button size="sm" variant="outline" className="gap-1">
                                    <Plus className="h-3 w-3" />
                                    Create Quiz
                                </Button>
                            </Link>
                        </div>
                        {quizzes && quizzes.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {quizzes.map((quiz) => (
                                    <QuizCard
                                        key={quiz.id}
                                        quiz={quiz}
                                        leagueId={id}
                                        attemptCount={attemptCounts[quiz.id] || 0}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card className="border-dashed">
                                <CardContent className="py-8 text-center">
                                    <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground mb-3">
                                        No quizzes yet.
                                    </p>
                                    <Link href={`/leagues/${id}/quiz/create`}>
                                        <Button size="sm" className="gap-1">
                                            <Plus className="h-3 w-3" />
                                            Create the first quiz
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                    <LeagueChat leagueId={id} userId={user!.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
