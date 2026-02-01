"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Send, Pin, Loader2 } from "lucide-react";
import type { Message, Profile } from "@/lib/types";

interface LeagueChatProps {
    leagueId: string;
    userId: string;
}

interface ChatMessage extends Message {
    profile: Profile;
}

export function LeagueChat({ leagueId, userId }: LeagueChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Load initial messages
    useEffect(() => {
        async function loadMessages() {
            const { data } = await supabase
                .from("messages")
                .select(`
          *,
          profile:profiles(*)
        `)
                .eq("league_id", leagueId)
                .is("parent_id", null)
                .order("created_at", { ascending: false })
                .limit(50);

            if (data) {
                setMessages(data.reverse() as ChatMessage[]);
            }
            setIsLoading(false);
        }

        loadMessages();
    }, [leagueId, supabase]);

    // Subscribe to realtime messages
    useEffect(() => {
        const channel = supabase
            .channel(`league:${leagueId}:chat`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `league_id=eq.${leagueId}`,
                },
                async (payload) => {
                    // Fetch the full message with profile
                    const { data } = await supabase
                        .from("messages")
                        .select(`
              *,
              profile:profiles(*)
            `)
                        .eq("id", payload.new.id)
                        .single();

                    if (data) {
                        setMessages((prev) => [...prev, data as ChatMessage]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [leagueId, supabase]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const body = newMessage.trim();
        setNewMessage("");

        const { error } = await supabase.from("messages").insert({
            league_id: leagueId,
            user_id: userId,
            body,
        });

        if (error) {
            console.error("Failed to send message:", error);
            setNewMessage(body); // Restore message on error
        }

        setIsSending(false);
    }

    return (
        <Card className="border-border bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">League Chat</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-80 px-4" ref={scrollRef}>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.user_id === userId ? "flex-row-reverse" : ""
                                        }`}
                                >
                                    <Avatar className="h-8 w-8 shrink-0 bg-secondary flex items-center justify-center text-xs font-medium">
                                        {msg.profile?.name?.[0]?.toUpperCase() || "?"}
                                    </Avatar>
                                    <div
                                        className={`max-w-[70%] ${msg.user_id === userId ? "text-right" : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium">
                                                {msg.profile?.name || "Anonymous"}
                                            </span>
                                            {msg.pinned && (
                                                <Pin className="h-3 w-3 text-primary" />
                                            )}
                                        </div>
                                        <div
                                            className={`text-sm p-2 rounded ${msg.user_id === userId
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                }`}
                                        >
                                            {msg.body}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                <form
                    onSubmit={handleSend}
                    className="flex gap-2 p-4 border-t border-border"
                >
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
