"use client";

import { useActionState, useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateProfile } from "@/lib/actions/auth";
import { createClient } from "@/utils/supabase/client";
import type { Certification, Profile } from "@/lib/types";
import { Loader2, User, Mail, Target, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [stats, setStats] = useState({
        totalPoints: 0,
        totalStreak: 0,
        leaguesJoined: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileData) setProfile(profileData);

            // Get certifications
            const { data: certsData } = await supabase
                .from("certifications")
                .select("*");
            if (certsData) setCertifications(certsData);

            // Get stats
            const { data: aggregates } = await supabase
                .from("leaderboard_aggregates")
                .select("points")
                .eq("user_id", user.id);

            const { data: streaks } = await supabase
                .from("streaks")
                .select("current_streak")
                .eq("user_id", user.id);

            const { count: leagueCount } = await supabase
                .from("league_memberships")
                .select("id", { count: "exact" })
                .eq("user_id", user.id);

            setStats({
                totalPoints: aggregates?.reduce((sum, a) => sum + a.points, 0) || 0,
                totalStreak: streaks?.reduce((sum, s) => sum + s.current_streak, 0) || 0,
                leaguesJoined: leagueCount || 0,
            });

            setIsLoading(false);
        }

        loadData();
    }, []);

    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string; success?: boolean } | null, formData: FormData) => {
            const result = await updateProfile(formData);
            if (result.error) {
                toast.error(result.error);
                return { error: result.error };
            }
            toast.success("Profile updated successfully!");
            return { success: true };
        },
        null
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div>
            <Header
                title="Profile"
                description="Manage your account and view your stats"
            />

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        YOUR STATS
                    </h2>

                    <Card className="border-border bg-card">
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Points</p>
                                    <p className="text-xl font-bold text-primary">
                                        {stats.totalPoints.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-orange-500/10 flex items-center justify-center">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Streak Days</p>
                                    <p className="text-xl font-bold">{stats.totalStreak}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center">
                                    <Trophy className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Leagues Joined</p>
                                    <p className="text-xl font-bold">{stats.leaguesJoined}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account info */}
                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Account</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{profile?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="outline">{profile?.role}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit form */}
                <div className="lg:col-span-2">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-4">
                        EDIT PROFILE
                    </h2>

                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Profile Details</CardTitle>
                            <CardDescription>
                                Update your display name and bio
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form action={formAction} className="space-y-4">
                                {state?.error && (
                                    <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                        {state.error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={profile?.name || ""}
                                        placeholder="Your display name"
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        defaultValue={profile?.bio || ""}
                                        placeholder="Tell others about yourself..."
                                        rows={3}
                                        className="w-full px-3 py-2 rounded border border-input bg-background text-sm resize-none"
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="primaryCertId">Primary Certification</Label>
                                    <select
                                        id="primaryCertId"
                                        name="primaryCertId"
                                        defaultValue={profile?.primary_cert_id || ""}
                                        className="w-full h-10 px-3 rounded border border-input bg-background text-sm"
                                        disabled={isPending}
                                    >
                                        <option value="">Select a certification...</option>
                                        {certifications.map((cert) => (
                                            <option key={cert.id} value={cert.id}>
                                                {cert.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button type="submit" disabled={isPending}>
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
