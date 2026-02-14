"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Trophy, RotateCcw } from "lucide-react";
import { submitQuizAttempt } from "@/lib/actions/checkin";
import { toast } from "sonner";

interface QuizQuestion {
    id: string;
    text: string;
    options: string[];
}

interface QuizPlayerProps {
    quizId: string;
    title: string;
    description?: string | null;
    questions: QuizQuestion[];
    leagueId: string;
}

export function QuizPlayer({
    quizId,
    title,
    description,
    questions,
    leagueId,
}: QuizPlayerProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        new Array(questions.length).fill(null)
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        points: number;
        score: number;
        total: number;
    } | null>(null);

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const allAnswered = selectedAnswers.every((a) => a !== null);

    function selectAnswer(index: number) {
        if (result) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = index;
        setSelectedAnswers(newAnswers);
    }

    function nextQuestion() {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    }

    function prevQuestion() {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    }

    async function handleSubmit() {
        if (!allAnswered) {
            toast.error("Please answer all questions before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await submitQuizAttempt(quizId, selectedAnswers as number[]);
            if (res.error) {
                toast.error(res.error);
            } else {
                setResult({
                    points: res.points || 0,
                    score: res.points || 0,
                    total: questions.length,
                });
                toast.success(`+${res.points} points earned!`);
            }
        } catch {
            toast.error("Failed to submit quiz");
        } finally {
            setIsSubmitting(false);
        }
    }

    function resetQuiz() {
        setCurrentQuestion(0);
        setSelectedAnswers(new Array(questions.length).fill(null));
        setResult(null);
    }

    if (result) {
        return (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="pt-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                        <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold tracking-wider">QUIZ COMPLETE</h3>
                    <div className="text-4xl font-bold text-primary">
                        +{result.points} <span className="text-sm text-muted-foreground">pts</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Quiz submitted! Points have been added to your score.
                    </p>
                    <div className="flex gap-2 justify-center pt-2">
                        <Button variant="outline" onClick={resetQuiz} className="gap-1">
                            <RotateCcw className="h-4 w-4" />
                            Retake
                        </Button>
                        <Button asChild>
                            <a href={`/leagues/${leagueId}`}>Back to League</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h2 className="text-lg font-bold tracking-wider">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>

            {/* Progress */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                        Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <Card className="border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">{question.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {question.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => selectAnswer(i)}
                            className={`w-full text-left p-3 rounded border transition-all duration-200 flex items-start gap-3 ${selectedAnswers[currentQuestion] === i
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-muted-foreground"
                                }`}
                        >
                            <span
                                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${selectedAnswers[currentQuestion] === i
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40"
                                    }`}
                            >
                                {selectedAnswers[currentQuestion] === i ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                    String.fromCharCode(65 + i)
                                )}
                            </span>
                            <span className="text-sm">{option}</span>
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Answer indicators */}
            <div className="flex gap-1 justify-center">
                {questions.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentQuestion(i)}
                        className={`w-8 h-8 rounded text-xs font-mono flex items-center justify-center transition-all ${i === currentQuestion
                            ? "bg-primary text-primary-foreground"
                            : selectedAnswers[i] !== null
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {selectedAnswers[i] !== null ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                            i + 1
                        )}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    size="sm"
                >
                    Previous
                </Button>
                <div className="flex gap-2">
                    {currentQuestion < questions.length - 1 ? (
                        <Button onClick={nextQuestion} size="sm" className="gap-1">
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!allAnswered || isSubmitting}
                            size="sm"
                            className="gap-1"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Quiz"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Quiz card for the league page quiz list
 */
interface QuizCardProps {
    quiz: {
        id: string;
        title: string;
        description?: string | null;
        question_count: number;
        created_at: string;
    };
    leagueId: string;
    attemptCount?: number;
}

export function QuizCard({ quiz, leagueId, attemptCount = 0 }: QuizCardProps) {
    return (
        <Card className="border-border hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-bold">{quiz.title}</CardTitle>
                    {attemptCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                            {attemptCount} attempt{attemptCount !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>
                {quiz.description && (
                    <CardDescription className="text-xs">{quiz.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    {quiz.question_count} question{quiz.question_count !== 1 ? "s" : ""}
                </span>
                <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
                    <a href={`/leagues/${leagueId}/quiz/${quiz.id}`}>
                        {attemptCount > 0 ? "Retake" : "Start"}
                        <ArrowRight className="h-3 w-3" />
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
