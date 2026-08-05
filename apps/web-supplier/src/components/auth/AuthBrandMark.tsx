type AuthBrandMarkProps = {
  className?: string;
};

export default function AuthBrandMark({
  className = ""
}: AuthBrandMarkProps) {
  return (
    <svg
      className={`lux-auth-brand-mark ${className}`.trim()}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="m24 10 11.5 6.8v14.4L24 38 12.5 31.2V16.8L24 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity=".65"
      />

      <path
        d="m17.5 29 6.5-13 6.5 13M20 24.5h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}