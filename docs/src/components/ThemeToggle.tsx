/**
 * 头部主题切换按钮（图标由 CSS dark: 控制显隐）。
 * 点击由 _client.tsx 绑定到 window.$theme.toggle()（由 @dreamer/plugins/theme 注入的脚本提供）。
 */

/** 太阳图标：浅色主题时显示，点击切深色 */
const SunIcon = () => (
  <span
    data-theme-icon="sun"
    className="inline-block size-5 dark:hidden"
    aria-hidden="true"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </span>
);

/** 月亮图标：深色主题时显示，点击切浅色 */
const MoonIcon = () => (
  <span
    data-theme-icon="moon"
    className="hidden size-5 dark:inline-block"
    aria-hidden="true"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  </span>
);

export function ThemeToggle() {
  return (
    <button
      type="button"
      data-theme-toggle
      className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 hover:text-teal-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-400 transition-colors"
      title="切换主题"
      aria-label="切换主题"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}
