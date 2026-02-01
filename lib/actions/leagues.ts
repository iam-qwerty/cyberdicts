"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { League } from "@/lib/types";

export interface LeagueActionResult {
    error?: string;
    success?: boolean;
    data?: League;
}

export async function createLeague(formData: FormData): Promise<LeagueActionResult> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const name = formData.get("name") as string;
    const certId = formData.get("certId") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 20;
    const isPrivate = formData.get("isPrivate") === "true";
    const startDate = formData.get("startDate") as string | null;

    if (!name || !certId) {
        return { error: "Name and certification are required" };
    }

    if (capacity < 2 || capacity > 100) {
        return { error: "Capacity must be between 2 and 100" };
    }

    // Create the league
    const { data: league, error } = await supabase
        .from("leagues")
        .insert({
            name,
            cert_id: certId,
            capacity,
            is_private: isPrivate,
            start_date: startDate,
            created_by: user.id,
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    // Auto-join creator as 'creator' role
    await supabase.from("league_memberships").insert({
        league_id: league.id,
        user_id: user.id,
        role: "creator",
    });

    // Initialize streak for creator
    await supabase.from("streaks").insert({
        league_id: league.id,
        user_id: user.id,
        current_streak: 0,
        max_streak: 0,
    });

    // Initialize leaderboard entry
    await supabase.from("leaderboard_aggregates").insert({
        league_id: league.id,
        user_id: user.id,
        points: 0,
        rank: 1,
    });

    revalidatePath("/leagues");
    revalidatePath("/dashboard");

    return { success: true, data: league };
}

export async function joinLeague(leagueId: string): Promise<LeagueActionResult> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Check if league exists and has capacity
    const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("id, capacity, member_count, is_private")
        .eq("id", leagueId)
        .single();

    if (leagueError || !league) {
        return { error: "League not found" };
    }

    if (league.member_count >= league.capacity) {
        return { error: "League is full" };
    }

    // Check if already a member
    const { data: existing } = await supabase
        .from("league_memberships")
        .select("id")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

    if (existing) {
        return { error: "Already a member of this league" };
    }

    // Join the league
    const { error } = await supabase.from("league_memberships").insert({
        league_id: leagueId,
        user_id: user.id,
        role: "member",
    });

    if (error) {
        return { error: error.message };
    }

    // Initialize streak
    await supabase.from("streaks").insert({
        league_id: leagueId,
        user_id: user.id,
        current_streak: 0,
        max_streak: 0,
    });

    // Initialize leaderboard entry
    const { data: memberCount } = await supabase
        .from("league_memberships")
        .select("id", { count: "exact" })
        .eq("league_id", leagueId);

    await supabase.from("leaderboard_aggregates").insert({
        league_id: leagueId,
        user_id: user.id,
        points: 0,
        rank: memberCount?.length || 1,
    });

    revalidatePath("/leagues");
    revalidatePath("/dashboard");
    revalidatePath(`/leagues/${leagueId}`);

    return { success: true };
}

export async function leaveLeague(leagueId: string): Promise<LeagueActionResult> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Check membership role - creators cannot leave
    const { data: membership } = await supabase
        .from("league_memberships")
        .select("role")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

    if (!membership) {
        return { error: "Not a member of this league" };
    }

    if (membership.role === "creator") {
        return { error: "League creators cannot leave. Delete the league instead." };
    }

    // Leave the league
    const { error } = await supabase
        .from("league_memberships")
        .delete()
        .eq("league_id", leagueId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    // Clean up streak and leaderboard
    await supabase.from("streaks").delete().eq("league_id", leagueId).eq("user_id", user.id);
    await supabase.from("leaderboard_aggregates").delete().eq("league_id", leagueId).eq("user_id", user.id);

    revalidatePath("/leagues");
    revalidatePath("/dashboard");

    return { success: true };
}

export async function getLeagues(certSlug?: string) {
    const supabase = await createClient();

    let query = supabase
        .from("leagues")
        .select(`
      *,
      certification:certifications(*)
    `)
        .eq("is_private", false)
        .order("created_at", { ascending: false });

    if (certSlug) {
        query = query.eq("certification.slug", certSlug);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching leagues:", error);
        return [];
    }

    return data;
}

export async function getUserLeagues() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("league_memberships")
        .select(`
      *,
      league:leagues(
        *,
        certification:certifications(*)
      )
    `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

    if (error) {
        console.error("Error fetching user leagues:", error);
        return [];
    }

    return data;
}
