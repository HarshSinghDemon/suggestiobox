export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 flex flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18h6v2H9z" />
          <path d="M10 16h4v2h-4z" />
          <path d="M8 11h2v5H8z" />
          <path d="M14 11h2v5h-2z" />
          <path d="M6 8h2v3H6z" />
          <path d="M16 8h2v3h-2z" />
          <path d="M8 5h2v3H8z" />
          <path d="M14 5h2v3h-2z" />
          <path d="M10 2h4v3h-4z" />
        </svg>
      </div>
      <span className="text-lg font-bold tracking-tight font-headline">
        Suggestion Box
      </span>
    </div>
  );
}
