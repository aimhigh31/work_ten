// 성능 측정 유틸리티
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private measurements: Map<string, number[]> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 성능 측정 시작
  startMeasurement(name: string): void {
    if (!this.isEnabled) return;
    performance.mark(`${name}-start`);
  }

  // 성능 측정 종료 및 기록
  endMeasurement(name: string): number | null {
    if (!this.isEnabled) return null;

    const endMark = `${name}-end`;
    const startMark = `${name}-start`;

    performance.mark(endMark);
    performance.measure(name, startMark, endMark);

    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure?.duration || 0;

    // 측정값 저장
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    // 성능 마크 정리
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);

    return duration;
  }

  // 평균 성능 조회
  getAverageTime(name: string): number {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // 성능 통계 조회
  getStats(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
    total: number;
  } {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0, total: 0 };
    }

    const total = times.reduce((sum, time) => sum + time, 0);
    const average = total / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { average, min, max, count: times.length, total };
  }

  // 모든 성능 데이터 조회
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    for (const [name] of this.measurements) {
      result[name] = this.getStats(name);
    }
    return result;
  }

  // 성능 데이터 초기화
  clear(name?: string): void {
    if (name) {
      this.measurements.delete(name);
    } else {
      this.measurements.clear();
    }
  }

  // 성능 리포트 출력
  logReport(): void {
    if (!this.isEnabled) return;

    console.group('🚀 Performance Report');
    const allStats = this.getAllStats();

    Object.entries(allStats).forEach(([name, stats]) => {
      console.log(`📊 ${name}:`, {
        '평균 시간': `${stats.average.toFixed(2)}ms`,
        '최소 시간': `${stats.min.toFixed(2)}ms`,
        '최대 시간': `${stats.max.toFixed(2)}ms`,
        '측정 횟수': stats.count,
        '총 시간': `${stats.total.toFixed(2)}ms`
      });
    });

    console.groupEnd();
  }

  // 성능 임계값 체크
  checkThreshold(name: string, threshold: number): boolean {
    const average = this.getAverageTime(name);
    if (average > threshold) {
      console.warn(`⚠️ Performance Warning: ${name} 평균 시간 (${average.toFixed(2)}ms)이 임계값 (${threshold}ms)을 초과했습니다.`);
      return false;
    }
    return true;
  }
}

// 성능 측정 데코레이터
export function measurePerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = function (...args: any[]) {
      monitor.startMeasurement(name);
      const result = originalMethod.apply(this, args);

      if (result instanceof Promise) {
        return result.finally(() => {
          monitor.endMeasurement(name);
        });
      } else {
        monitor.endMeasurement(name);
        return result;
      }
    };

    return descriptor;
  };
}

// React 컴포넌트 성능 측정 훅
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    // 마운트 시간 기록
    mountTime.current = performance.now();
    monitor.startMeasurement(`${componentName}-mount`);

    return () => {
      // 언마운트 시간 기록
      monitor.endMeasurement(`${componentName}-mount`);
    };
  }, [componentName, monitor]);

  useEffect(() => {
    // 렌더링 횟수 추적
    renderCount.current += 1;
    monitor.startMeasurement(`${componentName}-render`);
    monitor.endMeasurement(`${componentName}-render`);
  });

  return {
    renderCount: renderCount.current,
    logStats: () => monitor.getStats(`${componentName}-render`),
    logMountStats: () => monitor.getStats(`${componentName}-mount`)
  };
}

// 메모리 사용량 모니터링
export function monitorMemoryUsage(interval: number = 5000): () => void {
  if (typeof window === 'undefined' || !('performance' in window) || !('memory' in (window.performance as any))) {
    console.warn('Memory monitoring is not supported in this environment');
    return () => {};
  }

  const startTime = Date.now();
  const initialMemory = (performance as any).memory;

  console.log('📊 Memory Monitoring Started:', {
    'Initial Heap Size': `${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    'Heap Limit': `${(initialMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
  });

  const intervalId = setInterval(() => {
    const currentMemory = (performance as any).memory;
    const elapsedTime = Date.now() - startTime;

    console.log(`🔍 Memory Usage (${Math.floor(elapsedTime / 1000)}s):`, {
      'Used Heap': `${(currentMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      'Total Heap': `${(currentMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      'Heap Limit': `${(currentMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      'Memory Growth': `${((currentMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024).toFixed(2)} MB`
    });
  }, interval);

  return () => {
    clearInterval(intervalId);
    console.log('📊 Memory Monitoring Stopped');
  };
}

// 전역 인스턴스 내보내기
export const performanceMonitor = PerformanceMonitor.getInstance();
