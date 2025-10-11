import { useState, useEffect } from 'react';

// 부서명 리스트를 위한 간단한 인터페이스
export interface DepartmentOption {
  value: string;
  label: string;
}

export function useDepartmentNames() {
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartmentNames = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/departments');
        const result = await response.json();

        if (result.success && result.data) {
          // 활성화된 부서만 필터링하고 부서명만 추출
          const activeDepartments = result.data
            .filter((dept: any) => dept.is_active)
            .map((dept: any) => ({
              value: dept.department_name,
              label: dept.department_name
            }))
            .sort((a: DepartmentOption, b: DepartmentOption) => a.label.localeCompare(b.label));

          setDepartmentOptions(activeDepartments);
        } else {
          console.error('부서 목록 조회 실패:', result.error);
          // 에러 시 기본 부서 옵션 제공
          setDepartmentOptions([
            { value: '개발팀', label: '개발팀' },
            { value: '디자인팀', label: '디자인팀' },
            { value: '기획팀', label: '기획팀' },
            { value: '마케팅팀', label: '마케팅팀' }
          ]);
        }
      } catch (err) {
        console.error('부서명 가져오기 실패:', err);
        // 에러 시 기본 부서 옵션 제공
        setDepartmentOptions([
          { value: '개발팀', label: '개발팀' },
          { value: '디자인팀', label: '디자인팀' },
          { value: '기획팀', label: '기획팀' },
          { value: '마케팅팀', label: '마케팅팀' }
        ]);
        setError('부서명을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentNames();
  }, []);

  return {
    departmentOptions,
    loading,
    error
  };
}