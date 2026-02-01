import { Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
    title?: string;
    maxHeight?: string;
}

export function Leaderboard({
    entries,
    currentUserId,
    title = "Leaderboard",
    maxHeight = "400px",
}: LeaderboardProps) {
    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return "🥇";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return `#${rank}`;
        }
    };

    return (
        <Card className="border-border bg-card">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea style={{ maxHeight }}>
                    <div className="px-4 pb-4 space-y-2">
                        {entries.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No entries yet
                            </p>
                        ) : (
                            entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded transition-colors",
                                        entry.user_id === currentUserId
                                            ? "bg-primary/10 border border-primary/30"
                                            : "hover:bg-muted/50"
                                    )}
                                >
                                    {/* Rank */}
                                    <div className="w-8 text-center text-sm font-medium">
                                        {getRankBadge(entry.rank)}
                                    </div>

                                    {/* Avatar */}
                                    <Avatar className="h-8 w-8 bg-secondary flex items-center justify-center text-xs font-medium">
                                        {entry.profile?.name?.[0]?.toUpperCase() || "?"}
                                    </Avatar>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {entry.profile?.name || "Anonymous"}
                                            {entry.user_id === currentUserId && (
                                                <span className="ml-1 text-xs text-primary">(you)</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Points */}
                                    <div className="text-sm font-bold text-primary">
                                        {entry.points.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
