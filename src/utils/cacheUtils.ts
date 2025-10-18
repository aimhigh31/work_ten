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

/**
 * 캐시 키 생성 (접두사 추가로 충돌 방지)
 */
export function createCacheKey(hookName: string, suffix: string = 'data'): string {
  return `nexwork_cache_${hookName}_${suffix}`;
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
    const timestampKey = `${cacheKey}_timestamp`;
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    sessionStorage.setItem(timestampKey, Date.now().toString());

    console.log(`💾 [Cache] 캐시 저장: ${cacheKey}`, {
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
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(timestampKey, Date.now().toString());
        console.log(`✅ [Cache] 캐시 저장 성공 (재시도): ${cacheKey}`);
      } catch (retryErr) {
        console.error(`❌ [Cache] 캐시 저장 재시도 실패: ${cacheKey}`, retryErr);
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
    const nexworkKeys = keys.filter(key => key.startsWith('nexwork_cache_'));

    nexworkKeys.forEach(key => {
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
    const timestampKeys = keys.filter(key => key.endsWith('_timestamp'));

    if (timestampKeys.length === 0) return;

    // 타임스탬프 기준 정렬
    const sortedKeys = timestampKeys
      .map(key => ({
        key: key.replace('_timestamp', ''),
        timestamp: parseInt(sessionStorage.getItem(key) || '0', 10)
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // 가장 오래된 3개 삭제
    const deleteCount = Math.min(3, sortedKeys.length);
    for (let i = 0; i < deleteCount; i++) {
      const cacheKey = sortedKeys[i].key;
      clearCache(cacheKey);
    }

    console.log(`🗑️ [Cache] 오래된 캐시 ${deleteCount}개 삭제 완료`);
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
    const nexworkKeys = keys.filter(key => key.startsWith('nexwork_cache_') && !key.endsWith('_timestamp'));

    const items = nexworkKeys.map(key => {
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
    항목별_상세: stats.items.map(item => ({
      키: item.key,
      크기: `${(item.size / 1024).toFixed(2)} KB`,
      경과시간: `${Math.round(item.age / 1000)}초`
    }))
  });
}
