/**
 * 회원가입 입력값 검사.
 * 주민등록번호는 앞 6자리(생년월일)와 뒷자리 첫 숫자(성별·세기)만 받고,
 * 저장은 계산한 생년월일·성별만 한다 (주민번호 자체는 어디에도 남기지 않는다).
 */

/** 아이디: 영문 소문자로 시작, 영문 소문자·숫자·밑줄 4~20자. */
export function checkUsername(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return '아이디를 입력해 주세요.';
  if (!/^[a-z][a-z0-9_]{3,19}$/.test(v)) return '아이디는 영문 소문자로 시작하는 4~20자(영문 소문자·숫자·_)로 정해 주세요.';
  return null;
}

export function checkName(raw: string): string | null {
  const v = raw.trim();
  if (v.length < 2) return '이름을 2자 이상 입력해 주세요.';
  if (v.length > 30) return '이름은 30자 이내로 입력해 주세요.';
  return null;
}

export function checkEmail(raw: string): string | null {
  const v = raw.trim();
  if (!v) return '이메일을 입력해 주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return '이메일 형식이 올바르지 않아요.';
  return null;
}

/** 비밀번호: 8~64자, 영문과 숫자를 모두 포함. */
export function checkPassword(pw: string): string | null {
  if (pw.length < 8) return '비밀번호는 8자 이상이어야 해요.';
  if (pw.length > 64) return '비밀번호는 64자 이내로 정해 주세요.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return '비밀번호에 영문과 숫자를 모두 넣어 주세요.';
  return null;
}

export function checkPasswordConfirm(pw: string, confirm: string): string | null {
  if (!confirm) return '비밀번호를 한 번 더 입력해 주세요.';
  return pw === confirm ? null : '비밀번호가 서로 달라요.';
}

export interface BirthInfo {
  /** YYYY-MM-DD */
  birthDate: string;
  gender: 'male' | 'female';
  age: number;
}

/**
 * 주민번호 앞 6자리(YYMMDD) + 뒷자리 첫 숫자(1·2: 1900년대, 3·4: 2000년대 / 홀수 남·짝수 여)
 * → 생년월일·성별·만 나이. 잘못된 값이면 오류 문구.
 */
export function parseBirth(front6: string, genderDigit: string, today: Date = new Date()): BirthInfo | string {
  if (!/^\d{6}$/.test(front6)) return '생년월일 6자리를 숫자로 입력해 주세요 (예: 900101).';
  if (!/^[1-4]$/.test(genderDigit)) return '주민번호 뒷자리 첫 숫자(1~4)를 입력해 주세요.';
  const g = Number(genderDigit);
  const year = (g <= 2 ? 1900 : 2000) + Number(front6.slice(0, 2));
  const month = Number(front6.slice(2, 4));
  const day = Number(front6.slice(4, 6));
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return '존재하지 않는 날짜예요. 생년월일을 확인해 주세요.';
  }
  if (d.getTime() > today.getTime()) return '생년월일이 미래 날짜예요.';
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age--;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    birthDate: `${year}-${pad(month)}-${pad(day)}`,
    gender: g % 2 === 1 ? 'male' : 'female',
    age,
  };
}

/** 만 14세 미만은 법정대리인 동의가 필요하므로 가입을 받지 않는다. */
export const MIN_SIGNUP_AGE = 14;

/** 휴대폰 번호(010-1234-5678 등) → 국제 형식(+821012345678). 잘못된 번호면 null. */
export function toE164Korean(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null;
  return '+82' + digits.slice(1);
}

/** 화면 표시용: 01012345678 → 010-1234-5678 */
export function formatKoreanPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
}
