export type ThemeMode = 'auto' | 'light' | 'dark';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemeToDom(mode: ThemeMode) {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;
  const resolved = mode === 'auto' ? getSystemTheme() : mode;

  // Dual DOM synchronization (html + body)
  if (resolved === 'dark') {
    html.classList.remove('light');
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');

    body.classList.remove('light');
    body.classList.add('dark');
    body.setAttribute('data-theme', 'dark');
    html.style.colorScheme = 'dark';
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
    html.setAttribute('data-theme', 'light');

    body.classList.remove('dark');
    body.classList.add('light');
    body.setAttribute('data-theme', 'light');
    // Prevent mobile browsers auto dark inversion
    html.style.colorScheme = 'only light';
  }

  // Update theme-color meta tag
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', resolved === 'dark' ? '#090d16' : '#ffffff');
}
