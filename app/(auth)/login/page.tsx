"use client";

import Link from "next/link";
import { useActionState, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn, signInWithProvider } from "@/lib/actions/auth";

function LoginForm() {
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error");
    const [showPassword, setShowPassword] = useState(false);
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | null, formData: FormData) => {
            return await signIn(formData);
        },
        null
    );

    return (
        <Card className="border-border bg-card">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                    <Shield className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl tracking-wider">WELCOME BACK</CardTitle>
                <CardDescription>Sign in to continue your streak</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* OAuth buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <form action={async () => { await signInWithProvider("github"); }}>
                        <Button variant="outline" className="w-full" type="submit">
                            GitHub
                        </Button>
                    </form>
                    <form action={async () => { await signInWithProvider("google"); }}>
                        <Button variant="outline" className="w-full" type="submit">
                            Google
                        </Button>
                    </form>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                </div>

                {/* Email form */}
                <form action={formAction} className="space-y-4">
                    {(state?.error || urlError) && (
                        <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                            {state?.error || urlError}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                disabled={isPending}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
