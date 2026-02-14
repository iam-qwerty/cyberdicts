"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ArrowLeft } from "lucide-react";
import { createQuiz } from "@/lib/actions/quiz";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
    text: string;
    options: string[];
    correct_index: number;
}

interface QuizCreatorProps {
    leagueId: string;
    leagueName: string;
}

export function QuizCreator({ leagueId, leagueName }: QuizCreatorProps) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<Question[]>([
        { text: "", options: ["", "", "", ""], correct_index: 0 },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function addQuestion() {
        if (questions.length >= 5) {
            toast.error("Maximum 5 questions per quiz");
            return;
        }
        setQuestions([
            ...questions,
            { text: "", options: ["", "", "", ""], correct_index: 0 },
        ]);
    }

    function removeQuestion(index: number) {
        if (questions.length <= 1) {
            toast.error("Quiz must have at least 1 question");
            return;
        }
        setQuestions(questions.filter((_, i) => i !== index));
    }

    function updateQuestion(index: number, field: keyof Question, value: string | number | string[]) {
        const updated = [...questions];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updated[index] as any)[field] = value;
        setQuestions(updated);
    }

    function updateOption(qIndex: number, oIndex: number, value: string) {
        const updated = [...questions];
        updated[qIndex].options[oIndex] = value;
        setQuestions(updated);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validate
        if (!title.trim()) {
            toast.error("Quiz title is required");
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) {
                toast.error(`Question ${i + 1} text is required`);
                return;
            }
            const validOptions = q.options.filter((o) => o.trim() !== "");
            if (validOptions.length < 2) {
                toast.error(`Question ${i + 1} needs at least 2 options`);
                return;
            }
        }

        setIsSubmitting(true);

        // Clean options (remove empty ones)
        const cleanedQuestions = questions.map((q) => ({
            ...q,
            options: q.options.filter((o) => o.trim() !== ""),
        }));

        const formData = new FormData();
        formData.set("leagueId", leagueId);
        formData.set("title", title);
        formData.set("description", description);
        formData.set("questions", JSON.stringify(cleanedQuestions));

        try {
            const res = await createQuiz(formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Quiz created!");
                router.push(`/leagues/${leagueId}`);
            }
        } catch {
            toast.error("Failed to create quiz");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Link href={`/leagues/${leagueId}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        {leagueName}
                    </Button>
                </Link>
            </div>

            {/* Quiz Details */}
            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-sm tracking-wider">QUIZ DETAILS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Security+ Domain 1 Review"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the quiz"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Questions */}
            {questions.map((q, qIndex) => (
                <Card key={qIndex} className="border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-sm">
                                    Question {qIndex + 1}
                                </CardTitle>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(qIndex)}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                disabled={questions.length <= 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Question text</Label>
                            <Input
                                value={q.text}
                                onChange={(e) =>
                                    updateQuestion(qIndex, "text", e.target.value)
                                }
                                placeholder="Enter your question..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Answer options</Label>
                            {q.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateQuestion(qIndex, "correct_index", oIndex)
                                        }
                                        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${q.correct_index === oIndex
                                                ? "border-green-500 bg-green-500/20 text-green-400"
                                                : "border-muted-foreground/30 text-muted-foreground hover:border-green-500/50"
                                            }`}
                                        title={
                                            q.correct_index === oIndex
                                                ? "Correct answer"
                                                : "Mark as correct"
                                        }
                                    >
                                        {String.fromCharCode(65 + oIndex)}
                                    </button>
                                    <Input
                                        value={option}
                                        onChange={(e) =>
                                            updateOption(qIndex, oIndex, e.target.value)
                                        }
                                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                        className="flex-1"
                                    />
                                </div>
                            ))}
                            <p className="text-xs text-muted-foreground mt-1">
                                Click a letter to mark the correct answer. Leave options blank to
                                use fewer choices.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    disabled={questions.length >= 5}
                    className="gap-1"
                >
                    <Plus className="h-4 w-4" />
                    Add Question ({questions.length}/5)
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Quiz"}
                </Button>
            </div>
        </form>
    );
}
