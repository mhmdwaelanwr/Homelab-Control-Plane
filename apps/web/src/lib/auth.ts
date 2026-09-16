const tokenKey = 'dash:token';

export function readToken() {
  return window.localStorage.getItem(tokenKey);
}

export function writeToken(token: string) {
  window.localStorage.setItem(tokenKey, token);
}

export function clearToken() {
  window.localStorage.removeItem(tokenKey);
}

export { tokenKey };
