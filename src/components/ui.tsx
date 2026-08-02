import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export function GlassCard({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glass glass-card ${className}`.trim()} {...props} />;
}
export function GlassPanel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glass glass-panel ${className}`.trim()} {...props} />;
}
export function PrimaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button button-primary ${className}`.trim()} {...props} />;
}
export function SecondaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button button-secondary ${className}`.trim()} {...props} />;
}
export function SegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void; label: string }) {
  return <div className="segmented" role="group" aria-label={label}>{options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}
