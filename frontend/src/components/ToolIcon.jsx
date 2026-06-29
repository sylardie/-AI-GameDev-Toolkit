const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  design: (
    <>
      <path d="M4 5h16v14H4zM4 10h16M9 5v14" />
      <path d="m16.5 2 .65 1.85L19 4.5l-1.85.65L16.5 7l-.65-1.85L14 4.5l1.85-.65L16.5 2Z" />
    </>
  ),
  configs: <path d="M6 2h9l4 4v16H6zM15 2v5h5M9 11h7M9 15h7M9 19h5" />,
  code: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />,
  art: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18h1.4a2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2H18a3 3 0 0 0 3-3A8.6 8.6 0 0 0 12 3Z" />
      <path d="M7.5 10h.01M10 6.5h.01M15 7h.01M17 10.5h.01" />
    </>
  ),
  assets: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </>
  ),
  audio: <path d="M4 13h2l2-6 3 12 3-14 3 10 2-4h2" />,
  audioGenerator: (
    <>
      <path d="M4 13h2l2-6 3 12 3-14 3 10 2-4h2" />
      <path d="m18 3 .55 1.45L20 5l-1.45.55L18 7l-.55-1.45L16 5l1.45-.55L18 3Z" />
    </>
  ),
  folder: <path d="M3 6h7l2 2h9v11H3z" />,
  file: <path d="M6 2h9l4 4v16H6zM15 2v5h5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  log: <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />,
  video: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="m17 10 4-2v8l-4-2z" />
    </>
  ),
  cleanup: <path d="m4 17 9-9 3 3-9 9H4v-3ZM14 7l2-2 3 3-2 2M15 17h5M17.5 14.5v5" />,
  result: <path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5M16 16l1.5 1.5L20 14" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </>
  ),
  llm: <path d="M8 4h8a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-3l-4 3v-3H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4ZM8 10h.01M12 10h.01M16 10h.01" />,
  comfy: <path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5zM10 7.5h4M7.5 10v4M16.5 10v4M10 16.5h4" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.6h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  ),
  arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM9 12l2 2 4-5" />,
  spark: <path d="m12 2 1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4L12 2ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
};

function ToolIcon({ name, size = 20, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {iconPaths[name] || iconPaths.dashboard}
    </svg>
  );
}

export default ToolIcon;
