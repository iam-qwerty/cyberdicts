"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Trophy,
    Users,
    User,
    LogOut,
    Flame,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { useState } from "react";

interface SidebarProps {
    userName?: string;
    userStreak?: number;
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leagues", label: "Leagues", icon: Users },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar({ userName, userStreak = 0 }: SidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-primary font-bold text-lg tracking-widest">CYBERDICT</span>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </header>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
                    "lg:translate-x-0",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="text-primary font-bold text-lg tracking-widest">CYBERDICT</span>
                    </Link>
                </div>

                {/* User info */}
                <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-sidebar-accent flex items-center justify-center text-primary font-bold">
                            {userName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-sidebar-foreground">
                                {userName || "User"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-primary">
                                <Flame className="h-3 w-3" />
                                <span>{userStreak} day streak</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sign out */}
                <div className="p-2 border-t border-sidebar-border">
                    <form action={signOut}>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Sign out</span>
                        </Button>
                    </form>
                </div>
            </aside>
        </>
    );
}
