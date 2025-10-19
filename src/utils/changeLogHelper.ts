import { CHANGE_LOG_ACTIONS, ChangeLogMetadata, getFieldNameKR } from '../types/changelog';

/**
 * 변경 내용을 자연어로 변환하는 함수
 * @param action 액션 타입
 * @param metadata 메타데이터
 * @param userName 사용자명
 * @returns 자연어 설명
 */
export const generateChangeDescription = (action: string, metadata: ChangeLogMetadata, userName: string): string => {
  const name = userName || '사용자';

  switch (action) {
    // 개요탭
    case CHANGE_LOG_ACTIONS.EDUCATION_CREATE:
      return `${name}님이 새로운 교육을 생성했습니다`;

    case CHANGE_LOG_ACTIONS.EDUCATION_DELETE:
      return `${name}님이 교육을 삭제했습니다`;

    case CHANGE_LOG_ACTIONS.EDUCATION_NAME_CHANGE:
      return `${name}님이 교육명을 변경했습니다`;

    case CHANGE_LOG_ACTIONS.STATUS_CHANGE:
      return `${name}님이 교육 상태를 변경했습니다`;

    case CHANGE_LOG_ACTIONS.ASSIGNEE_CHANGE:
      return `${name}님이 담당자를 변경했습니다`;

    case CHANGE_LOG_ACTIONS.TEAM_CHANGE:
      return `${name}님이 팀을 변경했습니다`;

    case CHANGE_LOG_ACTIONS.EDUCATION_TYPE_CHANGE:
      return `${name}님이 교육유형을 변경했습니다`;

    case CHANGE_LOG_ACTIONS.LOCATION_CHANGE:
      return `${name}님이 장소를 변경했습니다`;

    case CHANGE_LOG_ACTIONS.DESCRIPTION_CHANGE:
      return `${name}님이 설명을 변경했습니다`;

    case CHANGE_LOG_ACTIONS.DATE_CHANGE:
      return `${name}님이 실시일을 변경했습니다`;

    case CHANGE_LOG_ACTIONS.PARTICIPANT_COUNT_CHANGE:
      return `${name}님이 참석인원을 변경했습니다`;

    case CHANGE_LOG_ACTIONS.EDUCATION_UPDATE:
      if (metadata.fieldName) {
        const fieldNameKR = getFieldNameKR(metadata.fieldName);
        return `${name}님이 ${fieldNameKR}을(를) 변경했습니다`;
      }
      return `${name}님이 교육 정보를 수정했습니다`;

    // 커리큘럼탭
    case CHANGE_LOG_ACTIONS.CURRICULUM_ADD:
      return `${name}님이 커리큘럼 항목 '${metadata.targetName || '항목'}'을(를) 추가했습니다`;

    case CHANGE_LOG_ACTIONS.CURRICULUM_UPDATE:
      return `${name}님이 커리큘럼 항목 '${metadata.targetName || '항목'}'을(를) 수정했습니다`;

    case CHANGE_LOG_ACTIONS.CURRICULUM_DELETE:
      return `${name}님이 커리큘럼 항목 '${metadata.targetName || '항목'}'을(를) 삭제했습니다`;

    // 참석자탭
    case CHANGE_LOG_ACTIONS.ATTENDEE_ADD:
      return `${name}님이 참석자 '${metadata.targetName || '참석자'}'을(를) 추가했습니다`;

    case CHANGE_LOG_ACTIONS.ATTENDEE_REMOVE:
      return `${name}님이 참석자 '${metadata.targetName || '참석자'}'을(를) 삭제했습니다`;

    case CHANGE_LOG_ACTIONS.ATTENDANCE_CHECK:
      return `${name}님이 '${metadata.targetName || '참석자'}'의 출석을 확인했습니다`;

    case CHANGE_LOG_ACTIONS.ATTENDANCE_UNCHECK:
      return `${name}님이 '${metadata.targetName || '참석자'}'의 출석을 취소했습니다`;

    // 교육실적보고탭
    case CHANGE_LOG_ACTIONS.REPORT_UPDATE:
      return `${name}님이 교육실적보고를 수정했습니다`;

    case CHANGE_LOG_ACTIONS.ACHIEVEMENT_UPDATE:
      return `${name}님이 성과를 수정했습니다`;

    case CHANGE_LOG_ACTIONS.IMPROVEMENT_UPDATE:
      return `${name}님이 개선사항을 수정했습니다`;

    case CHANGE_LOG_ACTIONS.FEEDBACK_UPDATE:
      return `${name}님이 교육소감을 수정했습니다`;

    // 기록탭
    case CHANGE_LOG_ACTIONS.COMMENT_ADD:
      return `${name}님이 기록을 추가했습니다`;

    case CHANGE_LOG_ACTIONS.COMMENT_UPDATE:
      return `${name}님이 기록을 수정했습니다`;

    case CHANGE_LOG_ACTIONS.COMMENT_DELETE:
      return `${name}님이 기록을 삭제했습니다`;

    // 자료탭
    case CHANGE_LOG_ACTIONS.FILE_UPLOAD:
      return `${name}님이 자료 '${metadata.targetName || '파일'}'을(를) 업로드했습니다`;

    case CHANGE_LOG_ACTIONS.FILE_DELETE:
      return `${name}님이 자료 '${metadata.targetName || '파일'}'을(를) 삭제했습니다`;

    case CHANGE_LOG_ACTIONS.FILE_UPDATE:
      return `${name}님이 자료 '${metadata.targetName || '파일'}'을(를) 수정했습니다`;

    default:
      return `${name}님이 변경 작업을 수행했습니다`;
  }
};

/**
 * 두 객체를 비교하여 변경된 필드 목록을 반환
 * @param before 변경 전 객체
 * @param after 변경 후 객체
 * @returns 변경된 필드 배열
 */
export const detectChanges = (before: any, after: any): Array<{ field: string; before: any; after: any }> => {
  const changes = [];
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      changes.push({
        field: key,
        before: before[key],
        after: after[key]
      });
    }
  }

  return changes;
};

/**
 * 값을 JSON 문자열로 안전하게 변환
 * @param value 변환할 값
 * @returns JSON 문자열 또는 원본 문자열
 */
export const safeJsonStringify = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    console.error('JSON stringify 실패:', error);
    return String(value);
  }
};

/**
 * JSON 문자열을 안전하게 파싱
 * @param jsonString JSON 문자열
 * @returns 파싱된 객체 또는 원본 문자열
 */
export const safeJsonParse = (jsonString: string): any => {
  if (!jsonString) {
    return null;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    // JSON이 아닌 일반 문자열인 경우 그대로 반환
    return jsonString;
  }
};

/**
 * 변경 전/후 값을 비교하여 표시용 텍스트 생성
 * @param before 변경 전 값
 * @param after 변경 후 값
 * @returns 비교 텍스트
 */
export const formatValueChange = (before: any, after: any): string => {
  const beforeText = before !== null && before !== undefined ? String(before) : '(없음)';
  const afterText = after !== null && after !== undefined ? String(after) : '(없음)';

  if (beforeText === afterText) {
    return afterText;
  }

  return `${beforeText} → ${afterText}`;
};
