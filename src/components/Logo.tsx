export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0E7C66" />
      <path d="M9 11h14M9 16h10M9 21h6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23" cy="21" r="3.2" fill="#E8A23A" />
    </svg>
  );
}
