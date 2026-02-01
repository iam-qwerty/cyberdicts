import { createClient, getUser } from "@/utils/supabase/server";
import { Header } from "@/components/layout/header";
import { LeagueCard } from "@/components/ui/league-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default async function LeaguesPage({
    searchParams,
}: {
    searchParams: Promise<{ cert?: string; q?: string }>;
}) {
    const params = await searchParams;
    const user = await getUser();
    const supabase = await createClient();

    // Get all certifications
    const { data: certifications } = await supabase
        .from("certifications")
        .select("*")
        .order("title");

    // Get public leagues
    let leaguesQuery = supabase
        .from("leagues")
        .select(`
      *,
      certification:certifications(*)
    `)
        .eq("is_private", false)
        .order("member_count", { ascending: false });

    if (params.cert) {
        leaguesQuery = leaguesQuery.eq("certification.slug", params.cert);
    }

    const { data: leagues } = await leaguesQuery;

    // Get user's memberships
    const { data: memberships } = await supabase
        .from("league_memberships")
        .select("league_id")
        .eq("user_id", user!.id);

    const memberLeagueIds = new Set(memberships?.map((m) => m.league_id) || []);

    // Filter by search query if provided
    const filteredLeagues = params.q
        ? leagues?.filter((l) =>
            l.name.toLowerCase().includes(params.q!.toLowerCase())
        )
        : leagues;

    return (
        <div>
            <Header
                title="Leagues"
                description="Find or create a study league"
                action={
                    <Link href="/leagues/create">
                        <Button size="sm" className="gap-1">
                            <Plus className="h-4 w-4" />
                            Create League
                        </Button>
                    </Link>
                }
            />

            {/* Search */}
            <form className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        name="q"
                        placeholder="Search leagues..."
                        defaultValue={params.q}
                        className="pl-9"
                    />
                </div>
            </form>

            {/* Certification tabs */}
            <Tabs defaultValue={params.cert || "all"} className="mb-6">
                <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="all" asChild>
                        <Link href="/leagues">All</Link>
                    </TabsTrigger>
                    {certifications?.map((cert) => (
                        <TabsTrigger key={cert.id} value={cert.slug} asChild>
                            <Link href={`/leagues?cert=${cert.slug}`}>{cert.title}</Link>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Leagues grid */}
            {filteredLeagues && filteredLeagues.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLeagues.map((league) => (
                        <LeagueCard
                            key={league.id}
                            league={league}
                            isMember={memberLeagueIds.has(league.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No leagues found</p>
                    <Link href="/leagues/create">
                        <Button>Create the first one</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
