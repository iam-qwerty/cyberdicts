import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");
    const origin = requestUrl.origin;

    if (error) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (code) {
        const supabase = await createClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
        }
    }

    // Redirect to dashboard after OAuth callback
    return NextResponse.redirect(`${origin}/dashboard`);
}
