import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile = null;
    let profileError = null;

    if (user) {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        profile = data;
        profileError = error;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Debug Console</h1>
                <div className="text-xs text-muted-foreground font-mono">/app/debug/page.tsx</div>
            </div>

            {/* Auth State */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    SESSION (auth.users)
                </h3>
                {user ? (
                    <div className="space-y-2">
                        <div className="text-xs font-mono break-all bg-muted p-2 rounded">
                            ID: {user.id}<br />
                            Email: {user.email}
                        </div>
                    </div>
                ) : (
                    <div className="text-destructive text-sm font-bold">No Active Session</div>
                )}
            </div>

            {/* Profile State */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    DATABASE ROW (public.profiles)
                </h3>

                {profile ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Current Role:</span>
                            {profile.role === 'admin' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    admin ✅
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {profile.role || 'null'} ⚠️
                                </span>
                            )}
                        </div>
                        <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-48">
                            {JSON.stringify(profile, null, 2)}
                        </pre>
                    </div>
                ) : (
                    <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">
                        <strong>❌ Profile Row Missing</strong>
                        <p className="mt-1 opacity-90">
                            The query <code>SELECT * FROM profiles WHERE id = ...</code> returned null.
                            <br />
                            This explains why UPDATE didn&apos;t work. The row needs to be INSERTED first.
                        </p>
                    </div>
                )}

                {profileError && (
                    <div className="mt-4 p-3 rounded bg-destructive/10 text-destructive text-xs font-mono">
                        Error: {JSON.stringify(profileError, null, 2)}
                    </div>
                )}
            </div>
        </div>
    );
}
