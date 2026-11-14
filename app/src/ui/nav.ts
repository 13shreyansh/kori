/** Go to the landing page (optionally an anchor on it), dropping ?c= or ?compare from the address. */
export function goHome(anchor = 'top') {
  history.pushState(null, '', location.pathname + '#' + anchor);
  window.dispatchEvent(new Event('popstate'));
}
