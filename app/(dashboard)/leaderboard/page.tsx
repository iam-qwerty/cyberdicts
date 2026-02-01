import { createClient, getUser } from "@/utils/supabase/server";
import { Header } from "@/components/layout/header";
import { Leaderboard } from "@/components/ui/leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function LeaderboardPage() {
    const user = await getUser();
    const supabase = await createClient();

    // Get certifications for tabs
    const { data: certifications } = await supabase
        .from("certifications")
        .select("*")
        .order("title");

    // Get global leaderboard (all leagues combined)
    const { data: globalLeaderboard } = await supabase
        .from("leaderboard_aggregates")
        .select(`
      *,
      profile:profiles(name)
    `)
        .order("points", { ascending: false })
        .limit(50);

    // Aggregate points by user for global ranking
    const userPoints = new Map<string, { points: number; profile: { name: string | null } }>();

    globalLeaderboard?.forEach((entry) => {
        const existing = userPoints.get(entry.user_id);
        if (existing) {
            existing.points += entry.points;
        } else {
            userPoints.set(entry.user_id, {
                points: entry.points,
                profile: entry.profile,
            });
        }
    });

    // Convert to array and sort
    const aggregatedLeaderboard = Array.from(userPoints.entries())
        .map(([userId, data], index) => ({
            id: userId,
            user_id: userId,
            league_id: "global",
            points: data.points,
            rank: index + 1, // Will be recalculated below
            updated_at: new Date().toISOString(),
            profile: data.profile,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return (
        <div>
            <Header
                title="Leaderboard"
                description="See how you stack up against other learners"
            />

            <Tabs defaultValue="global">
                <TabsList className="mb-4">
                    <TabsTrigger value="global">Global</TabsTrigger>
                    {certifications?.map((cert) => (
                        <TabsTrigger key={cert.id} value={cert.slug}>
                            {cert.title}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="global">
                    <div className="max-w-2xl">
                        <Leaderboard
                            entries={aggregatedLeaderboard}
                            currentUserId={user!.id}
                            title="Global Rankings"
                            maxHeight="600px"
                        />
                    </div>
                </TabsContent>

                {certifications?.map((cert) => (
                    <TabsContent key={cert.id} value={cert.slug}>
                        <CertLeaderboard certId={cert.id} userId={user!.id} certTitle={cert.title} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

async function CertLeaderboard({
    certId,
    userId,
    certTitle
}: {
    certId: string;
    userId: string;
    certTitle: string;
}) {
    const supabase = await createClient();

    // Get leagues for this certification
    const { data: leagues } = await supabase
        .from("leagues")
        .select("id")
        .eq("cert_id", certId);

    const leagueIds = leagues?.map((l) => l.id) || [];

    if (leagueIds.length === 0) {
        return (
            <div className="max-w-2xl">
                <div className="text-center py-8 text-muted-foreground">
                    No leagues for {certTitle} yet
                </div>
            </div>
        );
    }

    // Get leaderboard entries for these leagues
    const { data: entries } = await supabase
        .from("leaderboard_aggregates")
        .select(`
      *,
      profile:profiles(name)
    `)
        .in("league_id", leagueIds)
        .order("points", { ascending: false });

    // Aggregate by user
    const userPoints = new Map<string, { points: number; profile: { name: string | null } }>();

    entries?.forEach((entry) => {
        const existing = userPoints.get(entry.user_id);
        if (existing) {
            existing.points += entry.points;
        } else {
            userPoints.set(entry.user_id, {
                points: entry.points,
                profile: entry.profile,
            });
        }
    });

    const aggregatedEntries = Array.from(userPoints.entries())
        .map(([uId, data]) => ({
            id: uId,
            user_id: uId,
            league_id: certId,
            points: data.points,
            rank: 0,
            updated_at: new Date().toISOString(),
            profile: data.profile,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return (
        <div className="max-w-2xl">
            <Leaderboard
                entries={aggregatedEntries}
                currentUserId={userId}
                title={`${certTitle} Rankings`}
                maxHeight="600px"
            />
        </div>
    );
}
