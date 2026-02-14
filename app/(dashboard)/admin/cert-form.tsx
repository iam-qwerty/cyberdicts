"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { createCertification } from "@/lib/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminCertForm() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await createCertification(formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Certification created!");
                setIsOpen(false);
                router.refresh();
            }
        } catch {
            toast.error("Failed to create certification");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="gap-1"
            >
                <Plus className="h-4 w-4" />
                Add Certification
            </Button>
        );
    }

    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm tracking-wider">
                    NEW CERTIFICATION
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="title" className="text-xs">
                                Title
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g., CompTIA Network+"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="slug" className="text-xs">
                                Slug
                            </Label>
                            <Input
                                id="slug"
                                name="slug"
                                placeholder="e.g., network-plus"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="description" className="text-xs">
                            Description
                        </Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="Brief description..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
