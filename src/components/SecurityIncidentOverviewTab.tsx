import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Avatar, Typography, InputAdornment } from '@mui/material';
import { TaskTableData, TaskStatus } from '../types/task';
import { useOptimizedInput } from '../hooks/useDebounce';
import { useSupabaseMasterCode3 } from '../hooks/useSupabaseMasterCode3';
import { useSupabaseDepartments } from '../hooks/useSupabaseDepartments';
import { useCommonData } from '../contexts/CommonDataContext'; // ✅ 공용 창고
import { createClient } from '@supabase/supabase-js';

// 보안사고 전용 개요 탭 컴포넌트
const SecurityIncidentOverviewTab = memo(
  ({
    taskState,
    onFieldChange,
    assignees,
    assigneeAvatars,
    statusOptions,
    statusColors
  }: {
    taskState: any;
    onFieldChange: (field: string, value: string) => void;
    assignees: string[];
    assigneeAvatars: Record<string, string>;
    statusOptions: TaskStatus[];
    statusColors: Record<TaskStatus, any>;
  }) => {
    console.log('🔍 SecurityIncidentOverviewTab 렌더링:', {
      taskState,
      workContent: taskState?.workContent,
      props: { assignees, assigneeAvatars, statusOptions, statusColors }
    });

    // Supabase 클라이언트 생성
    const supabase = React.useMemo(() => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }, []);

    // 마스터코드 훅 사용
    const { getSubCodesByGroup } = useSupabaseMasterCode3();

    // 부서 훅 사용
    const { departments } = useSupabaseDepartments();

    // ✅ 공용 창고에서 사용자 데이터 가져오기
    const { users } = useCommonData();

    console.log('🔍 [SecurityIncidentOverviewTab] users 개수:', users?.length);
    console.log('🔍 [SecurityIncidentOverviewTab] taskState.assignee:', taskState?.assignee);

    // DB에서 직접 가져온 사고유형 목록 state
    const [incidentTypesFromDB, setIncidentTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);
    // DB에서 직접 가져온 상태 목록 state
    const [statusTypesFromDB, setStatusTypesFromDB] = useState<Array<{ subcode: string; subcode_name: string }>>([]);

    // Dialog가 열릴 때 DB에서 직접 조회
    useEffect(() => {
      const fetchMasterCodeData = async () => {
        // GROUP009 사고유형 조회
        const { data: group009Data } = await supabase
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP009')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        setIncidentTypesFromDB(group009Data || []);

        // GROUP002 상태 조회
        const { data: group002Data } = await supabase
          .from('admin_mastercode_data')
          .select('subcode, subcode_name, subcode_order')
          .eq('codetype', 'subcode')
          .eq('group_code', 'GROUP002')
          .eq('is_active', true)
          .order('subcode_order', { ascending: true });

        setStatusTypesFromDB(group002Data || []);
      };

      fetchMasterCodeData();
    }, [supabase]);

    // GROUP009의 서브코드들 가져오기 (사고유형) - 폴백용
    const incidentTypeOptions = useMemo(() => {
      const group009SubCodes = getSubCodesByGroup('GROUP009');
      console.log('🔍 GROUP009 서브코드:', group009SubCodes);
      return group009SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup]);

    // GROUP002의 서브코드들 가져오기 (상태)
    const statusOptionsFromMasterCode = useMemo(() => {
      const group002SubCodes = getSubCodesByGroup('GROUP002');
      console.log('🔍 GROUP002 서브코드:', group002SubCodes);
      return group002SubCodes.filter((subCode) => subCode.subcode_status === 'active');
    }, [getSubCodesByGroup]);

    // 활성화된 부서 목록 (팀)
    const teamOptions = useMemo(() => {
      console.log('🏢 부서 목록:', departments);
      return departments.filter((dept) => dept.is_active);
    }, [departments]);

    // 상태 초기값을 "대기" subcode로 설정
    React.useEffect(() => {
      if (statusTypesFromDB.length > 0 && !taskState.status) {
        const defaultStatus = statusTypesFromDB.find(item => item.subcode_name === '대기');
        if (defaultStatus) {
          onFieldChange('status', defaultStatus.subcode);
        }
      }
    }, [statusTypesFromDB, taskState.status, onFieldChange]);

    // 담당자 정보 찾기
    const assigneeInfo = useMemo(() => {
      if (!taskState?.assignee || !users || users.length === 0) {
        console.log('⚠️ [SecurityIncidentOverviewTab] 담당자 정보 없음:', {
          assignee: taskState?.assignee,
          usersLength: users?.length
        });
        return null;
      }

      const found = users.find((u) => u.user_name === taskState.assignee);
      console.log('🔍 [SecurityIncidentOverviewTab] 담당자 찾기:', {
        찾는담당자: taskState.assignee,
        찾은결과: found ? {
          user_name: found.user_name,
          profile_image_url: found.profile_image_url,
          avatar_url: found.avatar_url
        } : '없음'
      });

      return found;
    }, [taskState?.assignee, users]);

    // TextField 직접 참조를 위한 ref
    const mainContentRef = useRef<HTMLInputElement>(null);
    const responseActionRef = useRef<HTMLTextAreaElement>(null);

    // 텍스트 필드용 최적화된 입력 관리
    const mainContentInput = useOptimizedInput(taskState.workContent || '', 150);
    const responseActionInput = useOptimizedInput(taskState.responseAction || '', 200);

    // 무한 루프 방지를 위한 ref
    const isUpdatingRef = useRef(false);

    // debounced 값이 변경될 때마다 상위 컴포넌트에 알림
    useEffect(() => {
      if (!isUpdatingRef.current && mainContentInput.debouncedValue !== taskState.workContent) {
        onFieldChange('workContent', mainContentInput.debouncedValue);
      }
    }, [mainContentInput.debouncedValue, taskState.workContent, onFieldChange]);

    useEffect(() => {
      if (!isUpdatingRef.current && responseActionInput.debouncedValue !== taskState.responseAction) {
        onFieldChange('responseAction', responseActionInput.debouncedValue);
      }
    }, [responseActionInput.debouncedValue, taskState.responseAction, onFieldChange]);

    // 외부에서 상태가 변경될 때 입력 값 동기화
    useEffect(() => {
      console.log('🔍 SecurityIncidentOverviewTab - taskState 전체:', taskState);
      console.log('🔍 SecurityIncidentOverviewTab - taskState.workContent 변경:', {
        workContent: taskState.workContent,
        inputValue: mainContentInput.inputValue,
        debouncedValue: mainContentInput.debouncedValue,
        isEqual: taskState.workContent === mainContentInput.inputValue,
        shouldReset: taskState.workContent !== mainContentInput.inputValue && taskState.workContent !== mainContentInput.debouncedValue
      });
      if (taskState.workContent !== mainContentInput.inputValue && taskState.workContent !== mainContentInput.debouncedValue) {
        console.log('🔍 SecurityIncidentOverviewTab - 입력값 동기화 실행:', taskState.workContent);
        isUpdatingRef.current = true;
        mainContentInput.reset(taskState.workContent);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.workContent, mainContentInput.inputValue, mainContentInput.debouncedValue]);

    useEffect(() => {
      if (taskState.responseAction !== responseActionInput.inputValue && taskState.responseAction !== responseActionInput.debouncedValue) {
        isUpdatingRef.current = true;
        responseActionInput.reset(taskState.responseAction);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [taskState.responseAction, responseActionInput.inputValue, responseActionInput.debouncedValue]);

    const handleFieldChange = useCallback(
      (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
        onFieldChange(field, e.target.value);
      },
      [onFieldChange]
    );

    // 현재 입력 값들을 반환하는 함수
    const getCurrentValues = useCallback(() => {
      const values = {
        workContent: mainContentRef.current?.value || mainContentInput.inputValue,
        responseAction: responseActionRef.current?.value || responseActionInput.inputValue,
        description: '' // description은 별도 필드가 없으므로 빈 문자열 반환
      };
      console.log('🎯 getCurrentValues 호출됨:', values);
      return values;
    }, [mainContentInput.inputValue, responseActionInput.inputValue]);

    // 컴포넌트가 마운트될 때 getCurrentValues 함수를 전역에서 접근 가능하도록 설정
    useEffect(() => {
      (window as any).getSecurityOverviewTabCurrentValues = getCurrentValues;
      return () => {
        delete (window as any).getSecurityOverviewTabCurrentValues;
      };
    }, [getCurrentValues]);

    return (
      <Box sx={{ height: '650px', overflowY: 'auto', pr: 1, px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* 사고내용 - 전체 너비 */}
          <TextField
            fullWidth
            label={
              <span>
                사고내용 <span style={{ color: 'red' }}>*</span>
              </span>
            }
            multiline
            rows={4}
            value={mainContentInput.inputValue}
            onChange={(e) => mainContentInput.handleChange(e.target.value)}
            variant="outlined"
            inputRef={mainContentRef}
            InputLabelProps={{ shrink: true }}
            placeholder="발생한 보안사고의 상세 내용을 입력하세요..."
          />

          {/* 대응조치 - 전체 너비 */}
          <TextField
            fullWidth
            label="대응조치"
            multiline
            rows={3}
            value={responseActionInput.inputValue}
            onChange={(e) => responseActionInput.handleChange(e.target.value)}
            variant="outlined"
            inputRef={responseActionRef}
            InputLabelProps={{ shrink: true }}
            placeholder="취한 대응조치나 계획된 조치를 입력하세요..."
          />

          {/* 사고유형 - 상태 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel shrink>
                <span>
                  사고유형 <span style={{ color: 'red' }}>*</span>
                </span>
              </InputLabel>
              <Select value={taskState.incidentType} label="사고유형 *" onChange={handleFieldChange('incidentType')} displayEmpty>
                <MenuItem value="">선택</MenuItem>
                {incidentTypesFromDB.map((type) => (
                  <MenuItem key={type.subcode} value={type.subcode}>
                    {type.subcode_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>상태</InputLabel>
              <Select
                value={taskState.status}
                label="상태"
                onChange={handleFieldChange('status')}
                renderValue={(selected) => {
                  // subcode로부터 subcode_name 찾기
                  const statusItem = statusTypesFromDB.find(item => item.subcode === selected);
                  const statusName = statusItem ? statusItem.subcode_name : selected;

                  const getStatusStyle = (status: string) => {
                    switch (status) {
                      case '대기':
                        return { color: '#757575', backgroundColor: '#F5F5F5' }; // 회색
                      case '진행':
                        return { color: '#1976D2', backgroundColor: '#E3F2FD' }; // 파란색
                      case '완료':
                        return { color: '#388E3C', backgroundColor: '#E8F5E9' }; // 녹색
                      case '홀딩':
                        return { color: '#D32F2F', backgroundColor: '#FFEBEE' }; // 빨간색
                      default:
                        return { color: '#757575', backgroundColor: '#F5F5F5' };
                    }
                  };
                  const style = getStatusStyle(statusName);
                  return (
                    <span
                      style={{
                        color: style.color,
                        backgroundColor: style.backgroundColor,
                        fontWeight: 400,
                        fontSize: '13px',
                        padding: '2px 10px',
                        borderRadius: '16px',
                        display: 'inline-block'
                      }}
                    >
                      {statusName}
                    </span>
                  );
                }}
              >
                {statusTypesFromDB.map((option) => {
                  const getStatusStyle = (status: string) => {
                    switch (status) {
                      case '대기':
                        return { color: '#757575', backgroundColor: '#F5F5F5' };
                      case '진행':
                        return { color: '#1976D2', backgroundColor: '#E3F2FD' };
                      case '완료':
                        return { color: '#388E3C', backgroundColor: '#E8F5E9' };
                      case '홀딩':
                        return { color: '#D32F2F', backgroundColor: '#FFEBEE' };
                      default:
                        return { color: '#757575', backgroundColor: '#F5F5F5' };
                    }
                  };
                  const style = getStatusStyle(option.subcode_name);
                  return (
                    <MenuItem key={option.subcode} value={option.subcode}>
                      <span
                        style={{
                          color: style.color,
                          backgroundColor: style.backgroundColor,
                          fontWeight: 400,
                          fontSize: '13px',
                          padding: '2px 10px',
                          borderRadius: '16px',
                          display: 'inline-block'
                        }}
                      >
                        {option.subcode_name}
                      </span>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>

          {/* 시작일과 완료일 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="시작일"
              type="date"
              value={taskState.startDate || taskState.registrationDate}
              onChange={handleFieldChange('startDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="완료일"
              type="date"
              value={taskState.completedDate}
              onChange={handleFieldChange('completedDate')}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Stack>

          {/* 팀과 담당자 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="팀"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true,
                startAdornment: taskState.team ? (
                  <Typography variant="body1" sx={{ ml: -0.5 }}>
                    {taskState.team}
                  </Typography>
                ) : (
                  <Typography variant="body1" sx={{ color: 'text.disabled', ml: -0.5 }}>
                    팀 미지정
                  </Typography>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#F5F5F5',
                  paddingTop: '12px',
                  paddingBottom: '12px'
                },
                '& .MuiInputBase-input': { display: 'none' }
              }}
            />

            <TextField
              fullWidth
              label={
                <span>
                  담당자 <span style={{ color: 'red' }}>*</span>
                </span>
              }
              value={taskState.assignee || ''}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              InputProps={{
                readOnly: true,
                startAdornment: taskState.assignee ? (
                  <InputAdornment position="start" sx={{ mr: -0.5 }}>
                    <Avatar
                      src={
                        assigneeInfo?.profile_image_url ||
                        assigneeInfo?.avatar_url ||
                        '/assets/images/users/avatar-1.png'
                      }
                      alt={taskState.assignee}
                      sx={{ width: 24, height: 24 }}
                    >
                      {taskState.assignee?.charAt(0)}
                    </Avatar>
                  </InputAdornment>
                ) : null
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed'
                }
              }}
            />
          </Stack>

          {/* 등록일과 코드 - 좌우 배치 */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="등록일"
              type="date"
              value={taskState.registrationDate}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              InputProps={{
                readOnly: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#e0e0e0'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#666666'
                }
              }}
            />

            <TextField
              fullWidth
              label="코드"
              value={taskState.code}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              InputProps={{
                readOnly: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#e0e0e0'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#666666'
                }
              }}
            />
          </Stack>
        </Stack>
      </Box>
    );
  }
);

SecurityIncidentOverviewTab.displayName = 'SecurityIncidentOverviewTab';

export default SecurityIncidentOverviewTab;
