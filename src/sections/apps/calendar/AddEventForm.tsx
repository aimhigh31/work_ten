// react
import React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';

import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ko } from 'date-fns/locale';

// third-party
import { useFormik, Form, FormikProvider, FormikValues } from 'formik';
import { merge } from 'lodash-es';
import * as Yup from 'yup';
import { useSession } from 'next-auth/react';

// project-imports
import ColorPalette from './ColorPalette';
import { useSupabaseCalendar } from 'hooks/useSupabaseCalendar';
import { useSupabaseDepartments } from 'hooks/useSupabaseDepartments';
import { useSupabaseUsers } from 'hooks/useSupabaseUsers';
import { openSnackbar } from 'api/snackbar';
import IconButton from 'components/@extended/IconButton';
import { ThemeMode } from 'config';

// assets
import { Calendar, Trash } from '@wandersonalwes/iconsax-react';

// types
import { DateRange } from 'types/calendar';
import { SnackbarProps } from 'types/snackbar';

// constant
function getInitialValues(event: FormikValues | null, range: DateRange | null, currentUserTeam?: string, currentUserName?: string) {
  const now = new Date();
  const defaultStart = new Date(now);
  const defaultEnd = new Date(now);

  // 같은 날짜로 설정하고, 종료 시간만 1시간 후로 설정
  defaultEnd.setHours(now.getHours() + 1);

  // 팀별 색상 매핑
  const teamColors = {
    개발팀: '#2563EB',
    기획팀: '#16A34A',
    디자인팀: '#7C3AED',
    마케팅팀: '#DC2626',
    영업팀: '#EA580C',
    운영팀: '#0891B2'
  };

  const newEvent = {
    title: '',
    description: '',
    team: currentUserTeam || '',
    assignee: currentUserName || '',
    attendees: '',
    color: currentUserTeam && teamColors[currentUserTeam as keyof typeof teamColors] ? teamColors[currentUserTeam as keyof typeof teamColors] : '#DC2626',
    textColor: '#000000',
    allDay: false,
    start: range ? new Date(range.start) : defaultStart,
    end: range ? new Date(range.end) : defaultEnd
  };

  if (event || range) {
    const mergedEvent = merge({}, newEvent, event);
    // 기존 이벤트에 팀이 있다면 해당 팀의 색상으로 설정
    if (mergedEvent.team && teamColors[mergedEvent.team as keyof typeof teamColors]) {
      mergedEvent.color = teamColors[mergedEvent.team as keyof typeof teamColors];
    }
    return mergedEvent;
  }

  return newEvent;
}

// ==============================|| CALENDAR - EVENT ADD / EDIT / DELETE ||============================== //

interface AddEventFormProps {
  event?: FormikValues | null;
  range: DateRange | null;
  onCancel: () => void;
  modalCallback: (openModal: boolean) => void;
  createEvent?: (eventData: any) => Promise<any>;
  updateEvent?: (event_id: string, eventData: any) => Promise<any>;
  deleteEvent?: (event_id: string) => Promise<void>;
}

export default function AddEventFrom({ event, range, onCancel, modalCallback, createEvent: createEventProp, updateEvent: updateEventProp, deleteEvent: deleteEventProp }: AddEventFormProps) {
  const theme = useTheme();
  const isCreating = !event;
  const { data: session } = useSession();
  const { createEvent: createEventHook, updateEvent: updateEventHook, deleteEvent: deleteEventHook } = useSupabaseCalendar();
  const { departments } = useSupabaseDepartments();
  const { users } = useSupabaseUsers();

  // 에러 상태
  const [validationError, setValidationError] = React.useState<string>('');

  // props로 받은 함수가 있으면 사용, 없으면 hook에서 가져온 것 사용
  const createEvent = createEventProp || createEventHook;
  const updateEvent = updateEventProp || updateEventHook;
  const deleteEvent = deleteEventProp || deleteEventHook;

  // 로그인 사용자 정보
  const currentUserEmail = session?.user?.email || '';
  const currentUser = users.find((u) => u.email === currentUserEmail);
  const currentUserTeam = currentUser?.department || '';
  const currentUserName = currentUser?.user_name || '';

  // 팀별 색상 매핑
  const teamColors: Record<string, string> = {
    개발팀: '#2563EB',
    기획팀: '#16A34A',
    디자인팀: '#7C3AED',
    마케팅팀: '#DC2626',
    영업팀: '#EA580C',
    운영팀: '#0891B2'
  };

  const backgroundColor = [
    {
      value: '#FFE5E5',
      color: '#FFE5E5',
      isLight: true
    },
    {
      value: '#E5F3FF',
      color: '#E5F3FF',
      isLight: true
    },
    {
      value: '#E5FFE5',
      color: '#E5FFE5',
      isLight: true
    },
    {
      value: '#FFF5E5',
      color: '#FFF5E5',
      isLight: true
    },
    {
      value: '#F0E5FF',
      color: '#F0E5FF',
      isLight: true
    }
  ];

  const textColor = [
    {
      value: '#000000',
      color: '#000000',
      isLight: false
    },
    {
      value: '#333333',
      color: '#333333',
      isLight: false
    },
    {
      value: '#666666',
      color: '#666666',
      isLight: false
    },
    {
      value: '#1a1a1a',
      color: '#1a1a1a',
      isLight: false
    },
    {
      value: '#2d2d2d',
      color: '#2d2d2d',
      isLight: false
    }
  ];

  const EventSchema = Yup.object().shape({
    title: Yup.string().max(255).required('제목이 필요합니다'),
    description: Yup.string().max(5000),
    team: Yup.string().max(255),
    assignee: Yup.string().max(255),
    end: Yup.date()
      .nullable()
      .when('start', (start: any, schema: any) =>
        start && start instanceof Date ? schema.min(start, '종료일은 시작일 이후여야 합니다') : schema
      ),
    start: Yup.date().nullable(),
    color: Yup.string().max(255)
  });

  const deleteHandler = async () => {
    try {
      await deleteEvent(event?.id);
      openSnackbar({
        open: true,
        message: '일정이 성공적으로 삭제되었습니다.',
        variant: 'alert',
        alert: {
          color: 'success'
        }
      } as SnackbarProps);
      setValidationError(''); // 에러 초기화
      modalCallback(false);
    } catch (error) {
      console.error('일정 삭제 오류:', error);
      setValidationError('일정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const formik = useFormik({
    initialValues: getInitialValues(event!, range, currentUserTeam, currentUserName),
    validationSchema: EventSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const eventData = {
          title: values.title,
          description: values.description,
          team: values.team,
          assignee: values.assignee,
          attendees: values.attendees,
          color: values.color,
          text_color: '#000000',
          all_day: values.allDay,
          start_date: values.start,
          end_date: values.end
        };

        if (event) {
          await updateEvent(event.id, eventData);
          openSnackbar({
            open: true,
            message: '일정이 성공적으로 수정되었습니다.',
            variant: 'alert',
            alert: {
              color: 'success'
            }
          } as SnackbarProps);
          modalCallback(false);
        } else {
          await createEvent(eventData);
          openSnackbar({
            open: true,
            message: '일정이 성공적으로 추가되었습니다.',
            variant: 'alert',
            alert: {
              color: 'success'
            }
          } as SnackbarProps);
          modalCallback(false);
        }

        setSubmitting(false);
        setValidationError(''); // 성공 시 에러 초기화
        // eslint-disable-next-line
      } catch (error) {
        console.error('일정 저장 오류:', error);
        setValidationError('일정 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        setSubmitting(false);
      }
    }
  });

  const { values, errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue } = formik;

  // 커스텀 submit 핸들러 (validation 에러를 하단 Alert로 표시)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Formik validation 체크
    if (errors.title) {
      setValidationError(errors.title as string);
      return;
    }
    if (errors.end) {
      setValidationError(errors.end as string);
      return;
    }

    // 에러 없으면 기존 submit 실행
    handleSubmit(e);
  };

  // 팀을 로그인한 사용자의 부서로 자동 설정
  React.useEffect(() => {
    if (currentUser?.department && !event) {
      setFieldValue('team', currentUser.department);
      // 팀 색상도 자동 설정
      if (teamColors[currentUser.department]) {
        setFieldValue('color', teamColors[currentUser.department]);
      }
    }
  }, [currentUser, event]);

  // 담당자를 로그인한 사용자로 자동 설정
  React.useEffect(() => {
    if (currentUser?.user_name && !event) {
      setFieldValue('assignee', currentUser.user_name);
    }
  }, [currentUser, event]);

  // 모달이 열릴 때 에러 초기화
  React.useEffect(() => {
    setValidationError('');
  }, [event, range]);

  // 입력 값 변경 시 에러 초기화
  React.useEffect(() => {
    if (validationError) {
      setValidationError('');
    }
  }, [values.title, values.end]);

  return (
    <FormikProvider value={formik}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
        <Form autoComplete="off" noValidate onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 0 }}>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.75)', fontWeight: 500 }}>
                일정관리 편집
              </Typography>
              {event && event.title && (
                <Typography variant="body2" sx={{ fontSize: '12px', color: '#666666', fontWeight: 500 }}>
                  {event.title} ({event.event_code || event.code || event.id})
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={deleteHandler}
                size="medium"
                disabled={isCreating}
                startIcon={<Trash size={16} />}
                sx={{
                  px: 2,
                  borderColor: isCreating ? 'grey.300' : 'error.main',
                  color: isCreating ? 'grey.500' : 'error.main',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: isCreating ? 'transparent' : 'error.lighter',
                    borderColor: isCreating ? 'grey.300' : 'error.main'
                  },
                  '&:disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.500',
                    cursor: 'not-allowed'
                  }
                }}
              >
                삭제
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                size="medium"
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  },
                  '&:disabled': {
                    backgroundColor: 'grey.300'
                  }
                }}
              >
                {event ? '저장' : '추가'}
              </Button>
            </Stack>
          </DialogTitle>
          <Divider sx={{ mt: 1 }} />
          <DialogContent
            sx={{
              px: 3,
              pb: 1,
              pt: 2,
              height: 'calc(840px - 80px - 60px)', // Dialog 높이 - Header - Alert 공간
              maxHeight: 'calc(840px - 80px - 60px)',
              overflow: 'auto'
            }}
          >
            <Grid container spacing={2.4}>
              {/* 제목 */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  id="cal-title"
                  label="제목"
                  placeholder="일정 제목을 입력하세요"
                  {...getFieldProps('title')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* 설명 */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  id="cal-description"
                  label="설명"
                  multiline
                  rows={3}
                  placeholder="일정 관련 상세 내용을 입력하세요"
                  {...getFieldProps('description')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* 참석자 */}
              <Grid size={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  id="cal-attendees"
                  options={[]}
                  value={values.attendees ? values.attendees.split(',').map((name: string) => name.trim()).filter((name: string) => name) : []}
                  onChange={(event, newValue) => {
                    setFieldValue('attendees', newValue.join(','));
                  }}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`참석자${values.attendees && values.attendees.split(',').filter((name: string) => name.trim()).length > 0 ? ` (${values.attendees.split(',').filter((name: string) => name.trim()).length}명)` : ''}`}
                      placeholder="참석자 입력 후 Enter"
                      size="medium"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              {/* 시작일 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label="시작일"
                  value={values.start ? new Date(values.start) : null}
                  onChange={(date) => {
                    setFieldValue('start', date);
                    // 시작일 변경 시 종료일도 같은 날짜로 업데이트
                    if (date) {
                      const newEndDate = new Date(date);
                      // 종료 시간을 시작 시간보다 1시간 후로 설정
                      newEndDate.setHours(date.getHours() + 1);
                      setFieldValue('end', newEndDate);
                    }
                  }}
                  format="yyyy년 MM월 dd일 HH:mm"
                  ampm={false}
                  slotProps={{
                    textField: {
                      id: 'cal-start',
                      fullWidth: true,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>

              {/* 종료일 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label="종료일"
                  value={values.end ? new Date(values.end) : null}
                  onChange={(date) => setFieldValue('end', date)}
                  format="yyyy년 MM월 dd일 HH:mm"
                  ampm={false}
                  slotProps={{
                    textField: {
                      id: 'cal-end',
                      fullWidth: true,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>

              {/* 종일 */}
              <Grid size={12}>
                <FormControlLabel control={<Switch checked={values.allDay} {...getFieldProps('allDay')} />} label="종일" />
              </Grid>

              {/* 팀 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="팀"
                  value={values.team || ''}
                  InputProps={{
                    readOnly: true
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                />
              </Grid>

              {/* 담당자 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="담당자"
                  value={values.assignee || ''}
                  InputProps={{
                    readOnly: true,
                    startAdornment: currentUser && (
                      <Avatar
                        src={currentUser.profile_image_url || currentUser.avatar_url}
                        alt={currentUser.user_name}
                        sx={{ width: 24, height: 24, mr: 0 }}
                      >
                        {currentUser.user_name?.charAt(0)}
                      </Avatar>
                    )
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#f5f5f5'
                    },
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                />
              </Grid>

              {/* 등록일 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="등록일"
                  value={
                    event?.created_at
                      ? new Date(event.created_at).toISOString().split('T')[0]
                      : new Date().toISOString().split('T')[0]
                  }
                  InputProps={{
                    readOnly: true
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                />
              </Grid>

              {/* 코드 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="코드"
                  value={event?.event_code || '자동 생성'}
                  InputProps={{
                    readOnly: true
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                />
              </Grid>

              {/* 배경색상 */}
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel shrink sx={{ backgroundColor: 'white', px: 0.5 }}>
                    배경색상
                  </InputLabel>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 1, px: 2, border: '1px solid #e0e0e0', borderRadius: 1, mt: 2 }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: values.color || '#FFE5E5',
                        border: '2px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {values.team ? `${values.team} 색상이 자동으로 적용됩니다.` : '팀을 선택하면 색상이 자동으로 설정됩니다.'}
                    </Typography>
                  </Stack>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          {/* 에러 메시지 표시 */}
          {validationError && (
            <Box sx={{ px: 3, pb: 2, pt: 0 }}>
              <Alert severity="error">
                {validationError}
              </Alert>
            </Box>
          )}
        </Form>
      </LocalizationProvider>
    </FormikProvider>
  );
}
