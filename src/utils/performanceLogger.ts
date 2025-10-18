/**
 * 성능 측정 유틸리티
 *
 * 페이지 로딩 성능을 정밀하게 측정합니다.
 */

interface PerformanceLog {
  pageName: string;
  startTime: number;
  endTime?: number;
  events: Array<{
    name: string;
    timestamp: number;
    duration?: number;
  }>;
}

const performanceLogs = new Map<string, PerformanceLog>();

/**
 * 페이지 로딩 시작
 */
export function startPageLoad(pageName: string) {
  const startTime = performance.now();
  performanceLogs.set(pageName, {
    pageName,
    startTime,
    events: []
  });

  console.log(`🚀 ========================================`);
  console.log(`🚀 페이지 로딩 시작: ${pageName}`);
  console.log(`🚀 시작 시각: ${new Date().toISOString()}`);
  console.log(`🚀 ========================================`);
}

/**
 * 페이지 로딩 이벤트 기록
 */
export function logPageEvent(pageName: string, eventName: string) {
  const log = performanceLogs.get(pageName);
  if (!log) {
    console.warn(`⚠️ 페이지 로그 없음: ${pageName}`);
    return;
  }

  const timestamp = performance.now();
  const previousEvent = log.events[log.events.length - 1];
  const duration = previousEvent ? timestamp - previousEvent.timestamp : timestamp - log.startTime;

  log.events.push({
    name: eventName,
    timestamp,
    duration
  });

  console.log(`⏱️ [${pageName}] ${eventName}: ${duration.toFixed(2)}ms`);
}

/**
 * 페이지 로딩 완료
 */
export function endPageLoad(pageName: string) {
  const log = performanceLogs.get(pageName);
  if (!log) {
    console.warn(`⚠️ 페이지 로그 없음: ${pageName}`);
    return;
  }

  const endTime = performance.now();
  log.endTime = endTime;
  const totalTime = endTime - log.startTime;

  console.log(`🏁 ========================================`);
  console.log(`🏁 페이지 로딩 완료: ${pageName}`);
  console.log(`🏁 총 소요시간: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`🏁 단계별 시간:`);

  let cumulativeTime = 0;
  log.events.forEach((event, index) => {
    cumulativeTime += event.duration || 0;
    const percentage = ((event.duration || 0) / totalTime * 100).toFixed(1);
    console.log(`   ${index + 1}. ${event.name}: ${event.duration?.toFixed(2)}ms (${percentage}%) - 누적: ${cumulativeTime.toFixed(2)}ms`);
  });

  console.log(`🏁 ========================================`);

  // 성능 경고
  if (totalTime > 1000) {
    console.warn(`⚠️ 성능 경고: ${pageName} 로딩이 1초 이상 소요됨 (${(totalTime / 1000).toFixed(2)}s)`);

    // 가장 느린 단계 찾기
    const slowestEvent = log.events.reduce((max, event) =>
      (event.duration || 0) > (max.duration || 0) ? event : max
    , log.events[0]);

    if (slowestEvent) {
      console.warn(`   🐢 가장 느린 단계: ${slowestEvent.name} (${slowestEvent.duration?.toFixed(2)}ms)`);
    }
  }
}

/**
 * 모든 페이지 로그 출력
 */
export function printAllPageLogs() {
  console.log(`📊 ========================================`);
  console.log(`📊 전체 페이지 성능 통계`);
  console.log(`📊 ========================================`);

  const logs = Array.from(performanceLogs.values())
    .filter(log => log.endTime)
    .sort((a, b) => (b.endTime! - b.startTime) - (a.endTime! - a.startTime));

  logs.forEach(log => {
    const totalTime = log.endTime! - log.startTime;
    console.log(`   ${log.pageName}: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
  });

  console.log(`📊 ========================================`);
}

/**
 * 페이지 로그 초기화
 */
export function clearPageLog(pageName: string) {
  performanceLogs.delete(pageName);
}

/**
 * 모든 로그 초기화
 */
export function clearAllPageLogs() {
  performanceLogs.clear();
}
