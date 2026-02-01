import { redirect } from "next/navigation";
import { getUser } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUser();

    if (!user) {
        redirect("/login");
    }

    // Get profile info
    const supabase = await createClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

    // Get user's highest streak across leagues
    const { data: streaks } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .order("current_streak", { ascending: false })
        .limit(1);

    const maxStreak = streaks?.[0]?.current_streak || 0;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar userName={profile?.name || user.email} userStreak={maxStreak} />

            {/* Main content */}
            <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
