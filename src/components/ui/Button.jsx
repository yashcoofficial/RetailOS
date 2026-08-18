export function Button({ children, variant = "primary", size = "md", icon: Icon, className = "", style, ...props }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-5 py-3 text-[15px]" };
  const styles = {
    primary: { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)" },
    accent: { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" },
    ghost: { background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" },
    soft: { background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--line)" },
    danger: { background: "var(--danger)", color: "#fff", border: "1px solid var(--danger)" },
  };
  return (
    <button className={`${base} ${sizes[size]} ${className}`} style={{ ...styles[variant], ...style }} {...props}>
      {Icon && <Icon size={size === "lg" ? 18 : 15} />}
      {children}
    </button>
  );
}
