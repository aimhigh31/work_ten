/**
 * SessionStorage 기반 캐싱 유틸리티
 *
 * 사용 목적:
 * - API 호출 최소화로 페이지 로딩 속도 개선
 * - 재방문 시 즉시 데이터 표시 (깜빡임 방지)
 * - 일정 시간 후 자동 갱신으로 최신 데이터 유지
 */

// 기본 캐시 만료 시간: 30분
export const DEFAULT_CACHE_EXPIRY_MS = 30 * 60 * 1000;

// 최대 캐시 크기: 2MB (sessionStorage 제한 고려)
const MAX_CACHE_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * 🔢 캐시 버전 관리
 *
 * 스키마 변경, 데이터 구조 변경 시 이 버전을 1 증가시키면
 * 모든 기존 캐시가 자동으로 무효화됩니다.
 *
 * 변경 이력:
 * - v1: 초기 버전
 * - v2: assigned_roles → assignedRole 필드 변경 (2025-10-21)
 */
const CACHE_VERSION = 2;

/**
 * 캐시 키 생성 (접두사 + 버전 추가로 충돌 방지 및 자동 무효화)
 */
export function createCacheKey(hookName: string, suffix: string = 'data'): string {
  return `nexwork_cache_v${CACHE_VERSION}_${hookName}_${suffix}`;
}

/**
 * 캐시에서 데이터 로드
 *
 * @param cacheKey - 캐시 저장 키
 * @param expiryMs - 캐시 만료 시간 (밀리초)
 * @returns 캐시된 데이터 또는 null
 */
export function loadFromCache<T>(cacheKey: string, expiryMs: number = DEFAULT_CACHE_EXPIRY_MS): T | null {
  try {
    const timestampKey = `${cacheKey}_timestamp`;
    const cachedData = sessionStorage.getItem(cacheKey);
    const cachedTimestamp = sessionStorage.getItem(timestampKey);

    if (!cachedData || !cachedTimestamp) {
      return null;
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();

    // 캐시가 유효한 경우
    if (now - timestamp < expiryMs) {
      const parsedData = JSON.parse(cachedData) as T;
      console.log(`✅ [Cache] 캐시에서 데이터 로드: ${cacheKey}`, {
        dataLength: Array.isArray(parsedData) ? parsedData.length : 'N/A',
        age: Math.round((now - timestamp) / 1000) + 's'
      });
      return parsedData;
    } else {
      console.log(`⏰ [Cache] 캐시 만료됨: ${cacheKey}`);
      // 만료된 캐시 삭제
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(timestampKey);
      return null;
    }
  } catch (err) {
    console.error(`❌ [Cache] 캐시 로드 실패: ${cacheKey}`, err);
    return null;
  }
}

/**
 * 캐시에 데이터 저장
 *
 * @param cacheKey - 캐시 저장 키
 * @param data - 저장할 데이터
 */
export function saveToCache<T>(cacheKey: string, data: T): void {
  try {
    const serializedData = JSON.stringify(data);
    const dataSize = new Blob([serializedData]).size;

    // 데이터 크기 체크 (2MB 초과 시 캐싱하지 않음)
    if (dataSize > MAX_CACHE_SIZE_BYTES) {
      console.warn(`⚠️ [Cache] 데이터가 너무 커서 캐싱 건너뜀: ${cacheKey}`, {
        크기: `${(dataSize / 1024 / 1024).toFixed(2)} MB`,
        제한: `${(MAX_CACHE_SIZE_BYTES / 1024 / 1024).toFixed(2)} MB`,
        dataLength: Array.isArray(data) ? data.length : 'N/A'
      });
      return; // 캐싱하지 않고 종료
    }

    const timestampKey = `${cacheKey}_timestamp`;
    sessionStorage.setItem(cacheKey, serializedData);
    sessionStorage.setItem(timestampKey, Date.now().toString());

    console.log(`💾 [Cache] 캐시 저장: ${cacheKey}`, {
      크기: `${(dataSize / 1024).toFixed(2)} KB`,
      dataLength: Array.isArray(data) ? data.length : 'N/A'
    });
  } catch (err) {
    console.error(`❌ [Cache] 캐시 저장 실패: ${cacheKey}`, err);

    // Storage quota 초과 시 가장 오래된 캐시 삭제 시도
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('⚠️ [Cache] Storage quota 초과, 오래된 캐시 정리 중...');
      clearOldestCache();

      // 재시도
      try {
        const serializedData = JSON.stringify(data);
        const dataSize = new Blob([serializedData]).size;

        // 재시도 전에도 크기 체크
        if (dataSize > MAX_CACHE_SIZE_BYTES) {
          console.warn(`⚠️ [Cache] 재시도 건너뜀: 데이터 너무 큼 (${(dataSize / 1024 / 1024).toFixed(2)} MB)`);
          return;
        }

        sessionStorage.setItem(cacheKey, serializedData);
        sessionStorage.setItem(timestampKey, Date.now().toString());
        console.log(`✅ [Cache] 캐시 저장 성공 (재시도): ${cacheKey}`);
      } catch (retryErr) {
        console.warn(`⚠️ [Cache] 캐시 저장 재시도 실패 (무시함): ${cacheKey}`);
        // 에러를 무시하고 계속 진행 (캐싱 실패해도 앱은 정상 작동)
      }
    }
  }
}

/**
 * 특정 캐시 삭제
 *
 * @param cacheKey - 삭제할 캐시 키
 */
export function clearCache(cacheKey: string): void {
  try {
    const timestampKey = `${cacheKey}_timestamp`;
    sessionStorage.removeItem(cacheKey);
    sessionStorage.removeItem(timestampKey);
    console.log(`🗑️ [Cache] 캐시 삭제: ${cacheKey}`);
  } catch (err) {
    console.error(`❌ [Cache] 캐시 삭제 실패: ${cacheKey}`, err);
  }
}

/**
 * 모든 nexwork 캐시 삭제
 */
export function clearAllNexworkCache(): void {
  try {
    const keys = Object.keys(sessionStorage);
    const nexworkKeys = keys.filter((key) => key.startsWith('nexwork_cache_'));

    nexworkKeys.forEach((key) => {
      sessionStorage.removeItem(key);
    });

    console.log(`🗑️ [Cache] 전체 캐시 삭제: ${nexworkKeys.length}개 항목`);
  } catch (err) {
    console.error('❌ [Cache] 전체 캐시 삭제 실패', err);
  }
}

/**
 * 가장 오래된 캐시 삭제 (Storage quota 초과 시)
 */
function clearOldestCache(): void {
  try {
    const keys = Object.keys(sessionStorage);
    const nexworkKeys = keys.filter((key) => key.startsWith('nexwork_cache_') && !key.endsWith('_timestamp'));

    if (nexworkKeys.length === 0) return;

    // 타임스탬프와 크기 기준으로 정렬 (오래되고 큰 것부터 삭제)
    const cacheInfos = nexworkKeys
      .map((key) => {
        const timestampKey = `${key}_timestamp`;
        const timestamp = parseInt(sessionStorage.getItem(timestampKey) || '0', 10);
        const data = sessionStorage.getItem(key) || '';
        const size = data.length;

        return { key, timestamp, size };
      })
      .sort((a, b) => {
        // 오래된 것 우선, 같으면 큰 것 우선
        const timeDiff = a.timestamp - b.timestamp;
        return timeDiff !== 0 ? timeDiff : b.size - a.size;
      });

    // 전체 캐시의 30% 또는 최소 5개 삭제
    const deleteCount = Math.max(5, Math.ceil(cacheInfos.length * 0.3));
    const actualDeleteCount = Math.min(deleteCount, cacheInfos.length);

    for (let i = 0; i < actualDeleteCount; i++) {
      const cacheKey = cacheInfos[i].key;
      clearCache(cacheKey);
    }

    console.log(`🗑️ [Cache] 오래된 캐시 ${actualDeleteCount}개 삭제 완료 (전체 ${cacheInfos.length}개 중)`);
  } catch (err) {
    console.error('❌ [Cache] 오래된 캐시 삭제 실패', err);
  }
}

/**
 * 캐시 통계 정보 조회
 */
export function getCacheStats(): {
  totalItems: number;
  totalSize: number;
  items: Array<{ key: string; size: number; age: number }>;
} {
  try {
    const keys = Object.keys(sessionStorage);
    const nexworkKeys = keys.filter((key) => key.startsWith('nexwork_cache_') && !key.endsWith('_timestamp'));

    const items = nexworkKeys.map((key) => {
      const data = sessionStorage.getItem(key) || '';
      const timestampKey = `${key}_timestamp`;
      const timestamp = parseInt(sessionStorage.getItem(timestampKey) || '0', 10);

      return {
        key,
        size: data.length,
        age: Date.now() - timestamp
      };
    });

    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    return {
      totalItems: items.length,
      totalSize,
      items
    };
  } catch (err) {
    console.error('❌ [Cache] 통계 조회 실패', err);
    return { totalItems: 0, totalSize: 0, items: [] };
  }
}

/**
 * 캐시 통계를 콘솔에 출력
 */
export function logCacheStats(): void {
  const stats = getCacheStats();
  console.log('📊 [Cache] 캐시 통계:', {
    총_항목수: stats.totalItems,
    총_크기: `${(stats.totalSize / 1024).toFixed(2)} KB`,
    항목별_상세: stats.items.map((item) => ({
      키: item.key,
      크기: `${(item.size / 1024).toFixed(2)} KB`,
      경과시간: `${Math.round(item.age / 1000)}초`
    }))
  });
}

/**
 * 만료된 캐시 및 오래된 버전 캐시 자동 정리 (앱 시작 시 호출 권장)
 */
export function cleanupExpiredCache(): void {
  try {
    const keys = Object.keys(sessionStorage);
    const allNexworkKeys = keys.filter((key) => key.startsWith('nexwork_cache_'));

    let expiredCount = 0;
    let oldVersionCount = 0;
    const now = Date.now();

    // 1️⃣ 오래된 버전 캐시 삭제 (v1, v0 등)
    const currentVersionPrefix = `nexwork_cache_v${CACHE_VERSION}_`;
    allNexworkKeys.forEach((key) => {
      // 현재 버전이 아닌 캐시 삭제
      if (!key.startsWith(currentVersionPrefix)) {
        sessionStorage.removeItem(key);
        oldVersionCount++;
      }
    });

    // 2️⃣ 만료된 캐시 삭제 (현재 버전만)
    const timestampKeys = keys.filter((key) => key.startsWith(currentVersionPrefix) && key.endsWith('_timestamp'));

    timestampKeys.forEach((timestampKey) => {
      const cacheKey = timestampKey.replace('_timestamp', '');
      const timestamp = parseInt(sessionStorage.getItem(timestampKey) || '0', 10);

      // 30분 초과된 캐시 삭제
      if (now - timestamp > DEFAULT_CACHE_EXPIRY_MS) {
        clearCache(cacheKey);
        expiredCount++;
      }
    });

    if (oldVersionCount > 0 || expiredCount > 0) {
      console.log(`🧹 [Cache] 캐시 정리 완료`, {
        오래된_버전: `${oldVersionCount}개`,
        만료된_캐시: `${expiredCount}개`,
        현재_버전: `v${CACHE_VERSION}`
      });
    }
  } catch (err) {
    console.error('❌ [Cache] 캐시 정리 실패', err);
  }
}
