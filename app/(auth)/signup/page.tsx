"use client";

import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signUp, signInWithProvider } from "@/lib/actions/auth";
import type { Certification } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);

    useEffect(() => {
        async function loadCerts() {
            const supabase = createClient();
            const { data } = await supabase.from("certifications").select("*");
            if (data) setCertifications(data);
        }
        loadCerts();
    }, []);

    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | null, formData: FormData) => {
            return await signUp(formData);
        },
        null
    );

    return (
        <Card className="border-border bg-card">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                    <Shield className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl tracking-wider">JOIN CYBERDICT</CardTitle>
                <CardDescription>Start your certification journey</CardDescription>
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
                    {state?.error && (
                        <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your name"
                            required
                            disabled={isPending}
                        />
                    </div>

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
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            minLength={6}
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="certId">Primary Certification</Label>
                        <select
                            id="certId"
                            name="certId"
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

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
