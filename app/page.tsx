import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Trophy,
  Users,
  Flame,
  Target,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Small Leagues",
    description: "Join focused groups of up to 20 members studying for the same cert",
  },
  {
    icon: Target,
    title: "Daily Micro-Tasks",
    description: "Quick 15-second check-ins to build consistent study habits",
  },
  {
    icon: Flame,
    title: "Streaks & Points",
    description: "Earn points and streak bonuses to stay motivated every day",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Compete with league members and track your progress",
  },
];

const certifications = [
  { slug: "security-plus", title: "Security+", color: "text-green-500" },
  { slug: "isc2-cc", title: "ISC2 CC", color: "text-blue-500" },
  { slug: "cysa-plus", title: "CySA+", color: "text-purple-500" },
  { slug: "ceh", title: "CEH", color: "text-red-500" },
  { slug: "cissp", title: "CISSP", color: "text-yellow-500" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur border-b border-border">
        <div className="h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-widest">CYBERDICT</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs mb-6">
            <Flame className="h-3 w-3" />
            Gamified certification prep
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Pass Your <span className="text-primary">Cybersecurity Cert</span> with Daily Micro-Habits
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Join small, focused leagues. Check in daily. Earn streaks and points.
            Collaborate with peers. Make studying a seamless, habit-forming flow.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/leagues">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Browse Leagues
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Certs strip */}
      <section className="py-8 border-y border-border bg-card/50">
        <div className="px-4">
          <p className="text-center text-xs text-muted-foreground mb-4">
            PREPARE FOR TOP CERTIFICATIONS
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {certifications.map((cert) => (
              <div
                key={cert.slug}
                className={`text-sm sm:text-base font-medium ${cert.color}`}
              >
                {cert.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-card/50 border-t border-border">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Build Your Study Streak?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join a league, check in daily, and watch your consistency compound into certification success.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Cyberdict © 2026</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
