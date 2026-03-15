/**
 * 示例 Button 组件：用于首页计数器等
 */

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  children?: unknown;
}

export function Button({
  variant = "primary",
  onClick,
  children,
}: ButtonProps) {
  const base = "rounded-lg px-4 py-2 text-sm font-medium transition-colors";
  const styles = {
    primary:
      "border-0 bg-teal-500 text-white hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
    ghost:
      "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  };
  return (
    <button
      type="button"
      class={`${base} ${styles[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
