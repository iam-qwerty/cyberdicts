"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLeague } from "@/lib/actions/leagues";
import { createClient } from "@/utils/supabase/client";
import type { Certification } from "@/lib/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateLeaguePage() {
    const router = useRouter();
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
            const result = await createLeague(formData);
            if (result.error) {
                return { error: result.error };
            }
            toast.success("League created successfully!");
            router.push(`/leagues/${result.data?.id}`);
            return null;
        },
        null
    );

    return (
        <div>
            <Header
                title="Create League"
                description="Start a new study group"
                action={
                    <Link href="/leagues">
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                }
            />

            <Card className="max-w-lg border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-lg">League Details</CardTitle>
                    <CardDescription>
                        Create a league for up to 20 members to study together
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
                            <Label htmlFor="name">League Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Security+ Study Group"
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="certId">Certification</Label>
                            <select
                                id="certId"
                                name="certId"
                                className="w-full h-10 px-3 rounded border border-input bg-background text-sm"
                                required
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Max Members</Label>
                                <Input
                                    id="capacity"
                                    name="capacity"
                                    type="number"
                                    min={2}
                                    max={100}
                                    defaultValue={20}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date (optional)</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPrivate"
                                name="isPrivate"
                                value="true"
                                className="rounded border-input"
                                disabled={isPending}
                            />
                            <Label htmlFor="isPrivate" className="text-sm font-normal">
                                Make this league private (invite-only)
                            </Label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create League"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
