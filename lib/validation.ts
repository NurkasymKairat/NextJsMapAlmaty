export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
export const MIN_PASSWORD_LEN = 6;
export const MAX_ASSOCIATION_LEN = 200;

export function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return 'Имя: 3–20 символов, латиница/цифры/_';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LEN) {
    return `Пароль: минимум ${MIN_PASSWORD_LEN} символов`;
  }
  return null;
}
