import { createClient, getUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users,
    Shield,
    Trophy,
    Calendar,
    MessageSquare,
    TrendingUp,
    BookOpen,
} from "lucide-react";
import { getAnalytics } from "@/lib/actions/admin";
import Link from "next/link";
import { AdminCertForm } from "./cert-form";
import { DeleteButton } from "./delete-button";

export default async function AdminPage() {
    const user = await getUser();
    const supabase = await createClient();

    if (!user) {
        redirect("/login");
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        redirect("/dashboard");
    }

    const analytics = await getAnalytics();

    // Get certifications
    const { data: certifications } = await supabase
        .from("certifications")
        .select("*")
        .order("title");

    // Get leagues with member counts
    const { data: leagues } = await supabase
        .from("leagues")
        .select(
            `
      *,
      certification:certifications(title)
    `
        )
        .order("created_at", { ascending: false })
        .limit(20);

    return (
        <div>
            <Header
                title="Admin Panel"
                description="Manage certifications, leagues, and monitor activity"
                action={
                    <Badge className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                    </Badge>
                }
            />

            {/* Analytics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            Total Users
                        </div>
                        <p className="text-2xl font-bold">{analytics?.totalUsers || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            +{analytics?.recentSignups || 0} this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Trophy className="h-3 w-3" />
                            Active Leagues
                        </div>
                        <p className="text-2xl font-bold">
                            {analytics?.activeLeagues || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            of {analytics?.totalLeagues || 0} total
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            Check-ins Today
                        </div>
                        <p className="text-2xl font-bold text-primary">
                            {analytics?.checkinsToday || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {analytics?.eventsThisWeek || 0} events this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <MessageSquare className="h-3 w-3" />
                            Messages
                        </div>
                        <p className="text-2xl font-bold">
                            {analytics?.totalMessages || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">all time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Certifications and Leagues management */}
            <Tabs defaultValue="certifications">
                <TabsList>
                    <TabsTrigger value="certifications" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        Certifications
                    </TabsTrigger>
                    <TabsTrigger value="leagues" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        Leagues
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                {/* Certifications */}
                <TabsContent value="certifications" className="mt-4 space-y-4">
                    <AdminCertForm />

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            EXISTING CERTIFICATIONS
                        </h3>
                        {certifications?.map((cert) => (
                            <Card key={cert.id} className="border-border">
                                <CardContent className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">{cert.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {cert.slug} · {cert.description?.substring(0, 60)}...
                                        </p>
                                    </div>
                                    <DeleteButton
                                        id={cert.id}
                                        type="certification"
                                        name={cert.title}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Leagues */}
                <TabsContent value="leagues" className="mt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        ALL LEAGUES ({leagues?.length || 0})
                    </h3>
                    {leagues?.map((league) => (
                        <Card key={league.id} className="border-border">
                            <CardContent className="py-3 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/leagues/${league.id}`}
                                            className="font-medium text-sm hover:text-primary transition-colors"
                                        >
                                            {league.name}
                                        </Link>
                                        {league.is_private && (
                                            <Badge variant="outline" className="text-xs">
                                                Private
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {league.certification?.title || "General"} ·{" "}
                                        {league.member_count}/{league.capacity} members
                                    </p>
                                </div>
                                <DeleteButton
                                    id={league.id}
                                    type="league"
                                    name={league.name}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Analytics Detail */}
                <TabsContent value="analytics" className="mt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="border-border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm tracking-wider">
                                    USER GROWTH
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Users</span>
                                        <span className="font-mono">
                                            {analytics?.totalUsers || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            New This Week
                                        </span>
                                        <span className="font-mono text-primary">
                                            +{analytics?.recentSignups || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm tracking-wider">
                                    ENGAGEMENT
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Check-ins Today
                                        </span>
                                        <span className="font-mono">
                                            {analytics?.checkinsToday || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Events This Week
                                        </span>
                                        <span className="font-mono">
                                            {analytics?.eventsThisWeek || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Total Messages
                                        </span>
                                        <span className="font-mono">
                                            {analytics?.totalMessages || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm tracking-wider">
                                    LEAGUES
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-mono">
                                            {analytics?.totalLeagues || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Active</span>
                                        <span className="font-mono text-primary">
                                            {analytics?.activeLeagues || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm tracking-wider">
                                    CERTIFICATIONS
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-mono">
                                            {certifications?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
