import { createClient, getUser } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/ui/task-card";
import { Leaderboard } from "@/components/ui/leaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Copy, Trophy, MessageSquare } from "lucide-react";
import { canCheckIn } from "@/lib/scoring";
import { LeagueChat } from "./chat";

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

            {/* Tabs for Leaderboard and Chat */}
            <Tabs defaultValue="leaderboard">
                <TabsList>
                    <TabsTrigger value="leaderboard" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        Leaderboard
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

                <TabsContent value="chat" className="mt-4">
                    <LeagueChat leagueId={id} userId={user!.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
