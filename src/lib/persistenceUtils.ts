import type { Level } from './types.ts';

export const VALID_LEVELS: readonly Level[] = ['elementary', 'middle', 'high'] as const;
export const MAX_DISPLAY_NAME_LENGTH = 80;

export function isValidLevel(val: unknown): val is Level {
  return val === 'elementary' || val === 'middle' || val === 'high';
}

export function sanitizeDisplayName(
  name: string | null | undefined,
  fallback = '모의투자 학생'
): string {
  const cleaned = typeof name === 'string' ? name.trim() : '';
  const resolved = cleaned.length > 0 ? cleaned : fallback;
  return resolved.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

/**
 * Firestore setDoc / transaction.set에 undefined 프로퍼티가 전달되어
 * FirebaseError(Unsupported field value: undefined)가 발생하는 것을 원천 차단합니다.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val === undefined) continue;
    result[key] = stripUndefinedDeep(val);
  }
  return result as T;
}

/**
 * 숫자 배열을 콤마 구분 문자열로 직렬화 (Firestore 배열 단일필드 인덱스 40,000 한도 방지)
 */
export function encodeNumberArrayCsv(arr: number[]): string {
  return arr.filter((n) => typeof n === 'number' && Number.isFinite(n)).join(',');
}

/**
 * 콤마 구분 문자열 또는 구버전 숫자 배열에서 유한 숫자 배열 복원
 */
export function decodeNumberArray(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const out: number[] = [];
    for (const part of raw.split(',')) {
      const n = Number(part);
      if (Number.isFinite(n)) out.push(n);
    }
    return out;
  }
  return [];
}

/**
 * 문자열 ID 목록을 파이프(|) 구분 문자열로 직렬화 (Firestore 인덱스 절감)
 */
export function encodeIdList(ids: string[]): string {
  return ids.filter((id) => typeof id === 'string' && id.length > 0).join('|');
}

/**
 * 파이프(|) 구분 문자열 또는 구버전 문자열 배열에서 ID 배열 복원
 */
export function decodeIdList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split('|').filter((id) => id.length > 0);
  }
  return [];
}

/**
 * JSON 문자열 또는 구버전 객체 배열에서 배열 복원
 */
export function decodeJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
