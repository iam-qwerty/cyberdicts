import { createClient, getUser } from "@/utils/supabase/server";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/ui/task-card";
import { Leaderboard } from "@/components/ui/leaderboard";
import { LeagueCard } from "@/components/ui/league-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Target, Trophy, Flame } from "lucide-react";
import { canCheckIn } from "@/lib/scoring";

export default async function DashboardPage() {
    const user = await getUser();
    const supabase = await createClient();

    // Get user's leagues with streak info
    const { data: memberships } = await supabase
        .from("league_memberships")
        .select(`
      *,
      league:leagues(
        *,
        certification:certifications(*)
      )
    `)
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: false });

    // Get streaks for user's leagues
    const { data: streaks } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user!.id);

    const streakMap = new Map(
        streaks?.map((s) => [s.league_id, s]) || []
    );

    // Get user's total points
    const { data: aggregates } = await supabase
        .from("leaderboard_aggregates")
        .select("points")
        .eq("user_id", user!.id);

    const totalPoints = aggregates?.reduce((sum, a) => sum + a.points, 0) || 0;

    // Get total streak days
    const totalStreakDays = streaks?.reduce((sum, s) => sum + s.current_streak, 0) || 0;

    // Get leagues count
    const leaguesCount = memberships?.length || 0;

    // Get global leaderboard (top 5)
    const { data: globalLeaderboard } = await supabase
        .from("leaderboard_aggregates")
        .select(`
      *,
      profile:profiles(name)
    `)
        .order("points", { ascending: false })
        .limit(5);

    return (
        <div>
            <Header
                title="Dashboard"
                description="Your daily study hub"
                action={
                    <Link href="/leagues/create">
                        <Button size="sm" className="gap-1">
                            <Plus className="h-4 w-4" />
                            New League
                        </Button>
                    </Link>
                }
            />

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Total Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-primary">
                            {totalPoints.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            Streak Days
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalStreakDays}</p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Leagues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{leaguesCount}</p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                            Check-ins Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {memberships?.filter((m) => {
                                const streak = streakMap.get(m.league_id);
                                return streak && !canCheckIn(streak.last_checkin_at ? new Date(streak.last_checkin_at) : null);
                            }).length || 0}
                            /{leaguesCount}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Today's tasks */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        TODAY&apos;S MICRO-TASKS
                    </h2>

                    {memberships && memberships.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {memberships.map((membership) => {
                                const streak = streakMap.get(membership.league_id);
                                const hasCheckedIn = streak?.last_checkin_at
                                    ? !canCheckIn(new Date(streak.last_checkin_at))
                                    : false;

                                return (
                                    <TaskCard
                                        key={membership.id}
                                        leagueId={membership.league_id}
                                        leagueName={membership.league?.name || "League"}
                                        hasCheckedIn={hasCheckedIn}
                                        currentStreak={streak?.current_streak || 0}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="border-border bg-card">
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground mb-4">
                                    You haven&apos;t joined any leagues yet
                                </p>
                                <Link href="/leagues">
                                    <Button>Browse Leagues</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {/* Your Leagues */}
                    {memberships && memberships.length > 0 && (
                        <>
                            <h2 className="text-sm font-semibold text-muted-foreground mt-8">
                                YOUR LEAGUES
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {memberships.slice(0, 4).map((membership) => (
                                    <LeagueCard
                                        key={membership.id}
                                        league={membership.league!}
                                        isMember={true}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        TOP PERFORMERS
                    </h2>
                    <Leaderboard
                        entries={globalLeaderboard || []}
                        currentUserId={user!.id}
                        title="Global Leaderboard"
                        maxHeight="350px"
                    />
                </div>
            </div>
        </div>
    );
}
