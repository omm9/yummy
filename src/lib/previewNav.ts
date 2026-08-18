export function getPathname(): string {
  return window.location.pathname
}

export function navigatePreview(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
