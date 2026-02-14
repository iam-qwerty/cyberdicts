"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCertification, deleteLeague } from "@/lib/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
    id: string;
    type: "certification" | "league";
    name: string;
}

export function DeleteButton({ id, type, name }: DeleteButtonProps) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        setIsDeleting(true);

        try {
            const res =
                type === "certification"
                    ? await deleteCertification(id)
                    : await deleteLeague(id);

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`${type === "certification" ? "Certification" : "League"} deleted`);
                router.refresh();
            }
        } catch {
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(false);
            setConfirming(false);
        }
    }

    if (confirming) {
        return (
            <div className="flex items-center gap-1">
                <span className="text-xs text-destructive mr-1">Delete {name}?</span>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-7 text-xs"
                >
                    {isDeleting ? "..." : "Yes"}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirming(false)}
                    className="h-7 text-xs"
                >
                    No
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            onClick={() => setConfirming(true)}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
