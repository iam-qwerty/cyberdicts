interface HeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-wider">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
