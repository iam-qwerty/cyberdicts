"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface AdminActionResult {
    error?: string;
    success?: boolean;
    data?: Record<string, unknown>;
}

/**
 * Check if current user is admin
 */
async function requireAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { supabase, user: null, isAdmin: false };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    return {
        supabase,
        user,
        isAdmin: profile?.role === "admin",
    };
}

/**
 * Create a new certification (admin only)
 */
export async function createCertification(
    formData: FormData
): Promise<AdminActionResult> {
    const { supabase, isAdmin } = await requireAdmin();

    if (!isAdmin) {
        return { error: "Unauthorized — admin access required" };
    }

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;

    if (!title || !slug) {
        return { error: "Title and slug are required" };
    }

    const { error } = await supabase.from("certifications").insert({
        title,
        slug,
        description: description || null,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/leagues");

    return { success: true };
}

/**
 * Update an existing certification (admin only)
 */
export async function updateCertification(
    certId: string,
    formData: FormData
): Promise<AdminActionResult> {
    const { supabase, isAdmin } = await requireAdmin();

    if (!isAdmin) {
        return { error: "Unauthorized — admin access required" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const { error } = await supabase
        .from("certifications")
        .update({
            title,
            description: description || null,
        })
        .eq("id", certId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
}

/**
 * Delete a certification (admin only)
 */
export async function deleteCertification(
    certId: string
): Promise<AdminActionResult> {
    const { supabase, isAdmin } = await requireAdmin();

    if (!isAdmin) {
        return { error: "Unauthorized — admin access required" };
    }

    const { error } = await supabase
        .from("certifications")
        .delete()
        .eq("id", certId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
}

/**
 * Delete a league (admin only)
 */
export async function deleteLeague(
    leagueId: string
): Promise<AdminActionResult> {
    const { supabase, isAdmin } = await requireAdmin();

    if (!isAdmin) {
        return { error: "Unauthorized — admin access required" };
    }

    const { error } = await supabase
        .from("leagues")
        .delete()
        .eq("id", leagueId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/leagues");
    return { success: true };
}

/**
 * Get analytics metrics (admin only)
 */
export async function getAnalytics() {
    const { supabase, isAdmin } = await requireAdmin();

    if (!isAdmin) {
        return null;
    }

    // Total users
    const { count: totalUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

    // Total leagues
    const { count: totalLeagues } = await supabase
        .from("leagues")
        .select("id", { count: "exact", head: true });

    // Active leagues (has members)
    const { count: activeLeagues } = await supabase
        .from("leagues")
        .select("id", { count: "exact", head: true })
        .gt("member_count", 0);

    // Total check-ins today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { count: checkinsToday } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("type", "checkin")
        .gte("created_at", todayStart.toISOString());

    // Total events this week
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    const { count: eventsThisWeek } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString());

    // Total messages
    const { count: totalMessages } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true });

    // Recent signups (last 7 days)
    const { count: recentSignups } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString());

    return {
        totalUsers: totalUsers || 0,
        totalLeagues: totalLeagues || 0,
        activeLeagues: activeLeagues || 0,
        checkinsToday: checkinsToday || 0,
        eventsThisWeek: eventsThisWeek || 0,
        totalMessages: totalMessages || 0,
        recentSignups: recentSignups || 0,
    };
}
