/**
 * 브라우저 스토리지(localStorage / sessionStorage) 안전 래퍼.
 * 사파리 프라이빗 모드, 학교 크롬북 제한 정책, iframe 차단, 용량 초과(QuotaExceededError) 시
 * 앱 크래시를 방지합니다.
 */

export interface StorageResult {
  ok: boolean;
  error?: unknown;
}

function getStorage(kind: 'local' | 'session'): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return getStorage('local')?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): StorageResult {
    try {
      const storage = getStorage('local');
      if (!storage) return { ok: false, error: new Error('localStorage unavailable') };
      storage.setItem(key, value);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  },
  removeItem(key: string): void {
    try {
      getStorage('local')?.removeItem(key);
    } catch {
      // ignore storage errors
    }
  },
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return getStorage('session')?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): StorageResult {
    try {
      const storage = getStorage('session');
      if (!storage) return { ok: false, error: new Error('sessionStorage unavailable') };
      storage.setItem(key, value);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  },
  removeItem(key: string): void {
    try {
      getStorage('session')?.removeItem(key);
    } catch {
      // ignore storage errors
    }
  },
};
