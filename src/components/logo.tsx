
export function Logo() {
  return (
    <div className="flex items-center gap-2 group">
      <div className="w-7 h-7 flex flex-col items-center justify-center rounded-md bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-orange-500/50 animate-pulse-slow">
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
          className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]"
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
      <span className="text-lg font-bold tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-red-500 to-orange-400 bg-[length:200%_auto] animate-shine">
        Suggestion Box
      </span>
    </div>
  );
}
