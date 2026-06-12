export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(value: string | undefined): { level: 1 | 2 | 3; status: PasswordStrength } {
  const password = value ?? '';
  const score = [
    password.length >= 6,
    password.length >= 10,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (score >= 5) {
    return { level: 3, status: 'strong' };
  }

  if (score >= 3) {
    return { level: 2, status: 'medium' };
  }

  return { level: 1, status: 'weak' };
}

export function PasswordStrengthIndicator({
  password,
  labels,
}: {
  password: string | undefined;
  labels: Record<PasswordStrength, string>;
}) {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className={`auth-password-strength auth-password-strength-${strength.status}`}>
      <div className="auth-password-strength-bars" aria-hidden="true">
        {[1, 2, 3].map((level) => (
          <span key={level} className={level <= strength.level ? 'auth-password-strength-bar-active' : undefined} />
        ))}
      </div>
      <span className="auth-password-strength-text">{labels[strength.status]}</span>
    </div>
  );
}
