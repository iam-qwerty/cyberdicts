"use client";

import Link from "next/link";
import { Users, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { joinLeague } from "@/lib/actions/leagues";
import type { League } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface LeagueCardProps {
    league: League;
    isMember?: boolean;
    showJoinButton?: boolean;
}

export function LeagueCard({
    league,
    isMember = false,
    showJoinButton = true,
}: LeagueCardProps) {
    const [isJoining, setIsJoining] = useState(false);
    const [joined, setJoined] = useState(isMember);

    const isFull = league.member_count >= league.capacity;
    const spotsLeft = league.capacity - league.member_count;

    async function handleJoin() {
        setIsJoining(true);
        try {
            const result = await joinLeague(league.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                setJoined(true);
                toast.success("Successfully joined the league!");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsJoining(false);
        }
    }

    return (
        <Card className="border-border bg-card hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base font-semibold">{league.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {league.certification?.title || "General"}
                        </CardDescription>
                    </div>
                    {league.is_private && (
                        <Badge variant="secondary" className="text-xs">
                            Private
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pb-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                            {league.member_count}/{league.capacity}
                        </span>
                    </div>
                    {league.start_date && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(league.start_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {!isFull && spotsLeft <= 5 && (
                    <p className="text-xs text-primary mt-2">
                        Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left!
                    </p>
                )}
            </CardContent>

            <CardFooter className="pt-2">
                {joined ? (
                    <Link href={`/leagues/${league.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                            View League
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                ) : showJoinButton ? (
                    <Button
                        size="sm"
                        className="w-full"
                        disabled={isFull || isJoining}
                        onClick={handleJoin}
                    >
                        {isJoining ? (
                            <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Joining...
                            </>
                        ) : isFull ? (
                            "League Full"
                        ) : (
                            "Join League"
                        )}
                    </Button>
                ) : (
                    <Link href={`/leagues/${league.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                            View Details
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}
