// src/components/Logo.tsx
type Props = {
  className?: string;
};

export default function Logo({ className = "" }: Props) {
  return (
    <span
      className={`text-2xl font-extrabold tracking-tight ${className}`}
    >
      <span className="text-brand-500">HSSC</span>
      <span className="text-brand-300">Guru</span>
    </span>
  );
}
