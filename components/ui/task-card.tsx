"use client";

import { Flame, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { performCheckin } from "@/lib/actions/checkin";
import { useState } from "react";
import { toast } from "sonner";

interface TaskCardProps {
    leagueId: string;
    leagueName: string;
    hasCheckedIn: boolean;
    currentStreak: number;
}

export function TaskCard({
    leagueId,
    leagueName,
    hasCheckedIn,
    currentStreak,
}: TaskCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [checkedIn, setCheckedIn] = useState(hasCheckedIn);
    const [streak, setStreak] = useState(currentStreak);

    async function handleCheckin() {
        setIsLoading(true);
        try {
            const result = await performCheckin(leagueId);
            if (result.error) {
                toast.error(result.error);
            } else {
                setCheckedIn(true);
                setStreak(result.streak || streak + 1);
                toast.success(`+${result.points} points! Streak: ${result.streak} days 🔥`);
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card
            className={cn(
                "border-border bg-card transition-all",
                checkedIn && "border-primary/30 bg-primary/5"
            )}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{leagueName}</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-primary">
                        <Flame className="h-3 w-3" />
                        <span>{streak} day streak</span>
                    </div>
                </div>
                <CardDescription className="text-xs">
                    {checkedIn ? "Checked in for today!" : "Today's micro-task"}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {checkedIn ? (
                    <div className="flex items-center gap-2 text-primary">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Daily goal complete</span>
                    </div>
                ) : (
                    <Button
                        onClick={handleCheckin}
                        disabled={isLoading}
                        className="w-full"
                        size="sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking in...
                            </>
                        ) : (
                            "I Studied Today ✓"
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
