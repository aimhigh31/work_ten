'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { EventInput } from '@fullcalendar/common';
import { DateSelectArg, EventClickArg, EventDropArg, EventSourceInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';

// project-imports
import { useSupabaseCalendar } from 'hooks/useSupabaseCalendar';
import { PopupTransition } from 'components/@extended/Transitions';
import AddEventForm from 'sections/apps/calendar/AddEventForm';
import CalendarStyled from 'sections/apps/calendar/CalendarStyled';
import Toolbar from 'sections/apps/calendar/Toolbar';
import { useMenuPermission } from '../../hooks/usePermissions';
import useUser from 'hooks/useUser';

// assets
import { Add } from '@wandersonalwes/iconsax-react';

// ==============================|| CALENDAR - MAIN ||============================== //

export default function Calendar() {
  const downSM = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { canViewCategory, canReadData, canCreateData, canEditOwn, canEditOthers } = useMenuPermission('/apps/calendar');

  // 현재 사용자 정보 가져오기
  const currentUser = useUser();
  const currentUserName = currentUser ? currentUser.name : null;

  console.log('🔍 [Calendar] currentUserName:', currentUserName);

  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>();
  const [calendarView, setCalendarView] = useState<string>();
  const [date, setDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<null | { start: Date; end: Date }>(null);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [attendeesFilter, setAttendeesFilter] = useState<string[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const {
    events: supabaseEvents,
    fetchEvents,
    createEvent: supabaseCreateEvent,
    updateEvent: supabaseUpdateEvent,
    deleteEvent: supabaseDeleteEvent
  } = useSupabaseCalendar();

  // 초기 데이터 로딩
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  // Supabase 이벤트를 FullCalendar 형식으로 변환
  const events = useMemo(() => {
    return supabaseEvents.map((event) => ({
      id: event.event_id,
      title: event.title,
      description: event.description,
      team: event.team,
      assignee: event.assignee,
      attendees: event.attendees,
      allDay: event.all_day,
      start: event.start_date,
      end: event.end_date,
      color: event.color,
      textColor: event.text_color,
      backgroundColor: event.color,
      event_code: event.event_code,
      created_at: event.created_at
    }));
  }, [supabaseEvents]);

  // 모든 참석자 목록 추출
  const allAttendees = useMemo(() => {
    const attendeesSet = new Set<string>();
    events.forEach((event: any) => {
      if (event.attendees) {
        const attendeesList = event.attendees.split(',').map((name: string) => name.trim());
        attendeesList.forEach((name: string) => {
          if (name) attendeesSet.add(name);
        });
      }
    });
    return Array.from(attendeesSet).sort();
  }, [events]);

  // 필터링된 이벤트
  const filteredEvents = events.filter((event: any) => {
    const eventTeam = event.team || '';
    const eventAssignee = event.assignee || '';
    const eventAttendees = event.attendees ? event.attendees.split(',').map((name: string) => name.trim()) : [];

    const teamMatch = !teamFilter || eventTeam === teamFilter;
    const assigneeMatch = !assigneeFilter || eventAssignee === assigneeFilter;

    // 참석자 필터: 선택된 참석자 중 하나라도 포함되면 표시
    const attendeesMatch = attendeesFilter.length === 0 || attendeesFilter.some((filterName) => eventAttendees.includes(filterName));

    return teamMatch && assigneeMatch && attendeesMatch;
  });

  useEffect(() => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();
      const newView = downSM ? 'listWeek' : 'dayGridMonth';
      calendarApi.changeView(newView);
      setCalendarView(newView);
    }
  }, [downSM]);

  // calendar toolbar events
  const handleDateToday = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  };

  const handleViewChange = (newView: string) => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.changeView(newView);
      setCalendarView(newView);
    }
  };

  const handleDatePrev = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  };

  const handleDateNext = () => {
    const calendarEl = calendarRef.current;

    if (calendarEl) {
      const calendarApi = calendarEl.getApi();

      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  };

  // calendar events
  const handleRangeSelect = (arg: DateSelectArg) => {
    const calendarEl = calendarRef.current;
    if (calendarEl) {
      const calendarApi = calendarEl.getApi();
      calendarApi.unselect();
    }

    // 시작일과 종료일을 같은 날짜로 설정
    const startDate = new Date(arg.start);
    const endDate = new Date(arg.start); // 종료일도 시작일과 같은 날짜로 설정
    endDate.setHours(startDate.getHours() + 1); // 1시간 후로 설정

    setSelectedRange({ start: startDate, end: endDate });
    setModalOpen(true);
  };

  const handleEventSelect = (arg: EventClickArg) => {
    if (arg?.event?.id) {
      const event = events.find((event) => event.id === arg.event.id);
      setSelectedEvent(event);
    }

    setModalOpen(true);
  };

  const handleEventUpdate = async ({ event }: EventResizeDoneArg | EventDropArg) => {
    await supabaseUpdateEvent(event.id, {
      all_day: event.allDay,
      start_date: event.start!,
      end_date: event.end!
    });
  };

  const modalCallback = (openModal: boolean) => {
    // open/close modal based on dialog state
    if (!openModal) {
      setSelectedEvent(null);
    }
    setModalOpen(openModal);
  };

  const handleModal = () => {
    if (isModalOpen) {
      setSelectedEvent(null);
    }
    setModalOpen(!isModalOpen);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        // 스탠다드 기준 좌우 여백 추가
        px: { xs: 2, sm: 3, md: 4 }, // 반응형 패딩: 모바일 16px, 태블릿 24px, 데스크톱 32px
        maxWidth: '100%',
        height: '100vh', // 전체 화면 높이
        overflow: 'hidden' // 외부 스크롤 제거
      }}
    >
      <Toolbar
        date={date}
        view={calendarView!}
        onClickNext={handleDateNext}
        onClickPrev={handleDatePrev}
        onClickToday={handleDateToday}
        onChangeView={handleViewChange}
        onAddEvent={handleModal}
        teamFilter={teamFilter}
        assigneeFilter={assigneeFilter}
        attendeesFilter={attendeesFilter}
        onTeamFilterChange={setTeamFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onAttendeesFilterChange={setAttendeesFilter}
        allAttendees={allAttendees}
        canCreateData={canCreateData}
      />

      {/* 권한 체크: 카테고리 보기만 있는 경우 */}
      {canViewCategory && !canReadData ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            py: 8
          }}
        >
          <Typography variant="h5" color="text.secondary">
            이 페이지에 대한 데이터 조회 권한이 없습니다.
          </Typography>
          <Typography variant="body2" color="text.disabled">
            관리자에게 권한을 요청하세요.
          </Typography>
        </Box>
      ) : (
        <>
          {/* 기존 컨텐츠 시작 */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <CalendarStyled>
        <FullCalendar
          key={currentUserName}
          weekends
          editable
          droppable
          selectable
          events={filteredEvents as EventSourceInput}
          ref={calendarRef}
          rerenderDelay={10}
          initialDate={date}
          initialView={calendarView}
          dayMaxEvents={3}
          eventDisplay="block"
          headerToolbar={false}
          allDayMaintainDuration
          eventResizableFromStart
          displayEventTime={true}
          locale="ko"
          stickyHeaderDates={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayCellClassNames={(dateInfo) => {
            const dayOfWeek = dateInfo.date.getDay();
            // 일요일(0) 또는 토요일(6)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              return 'weekend-date';
            }
            return '';
          }}
          datesSet={() => {
            // 캘린더의 현재 날짜를 date 상태에 업데이트
            const calendarEl = calendarRef.current;
            if (calendarEl) {
              const calendarApi = calendarEl.getApi();
              setDate(calendarApi.getDate());
            }

            // CalendarStyled 컨테이너 내부에서만 오늘 날짜로 스크롤
            setTimeout(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = String(today.getMonth() + 1).padStart(2, '0');
              const day = String(today.getDate()).padStart(2, '0');
              const todayDateString = `${year}-${month}-${day}`;

              const todayCell = document.querySelector(`.fc-day[data-date="${todayDateString}"]`) as HTMLElement;

              if (todayCell) {
                // CalendarStyled 컨테이너 찾기 (MuiBox-root이면서 overflow: auto를 가진 요소)
                let scrollContainer: HTMLElement | null = null;
                let parent = todayCell.parentElement;

                while (parent && parent !== document.body) {
                  const style = window.getComputedStyle(parent);
                  const overflowY = style.overflowY;

                  // MuiBox-root이고 overflow가 auto인 요소 찾기
                  if (parent.classList.contains('MuiBox-root') && (overflowY === 'auto' || overflowY === 'scroll')) {
                    scrollContainer = parent;
                    break;
                  }
                  parent = parent.parentElement;
                }

                if (scrollContainer) {
                  // 오늘 날짜 셀의 위치 계산
                  const cellRect = todayCell.getBoundingClientRect();
                  const containerRect = scrollContainer.getBoundingClientRect();

                  // 컨테이너 내에서 셀이 중앙에 오도록 스크롤
                  const scrollOffset = cellRect.top - containerRect.top - (containerRect.height / 2) + (cellRect.height / 2);

                  scrollContainer.scrollTo({
                    top: scrollContainer.scrollTop + scrollOffset,
                    behavior: 'smooth'
                  });
                }
              }
            }, 300);
          }}
          eventDidMount={(info) => {
            // 이벤트 마운트 시 CSS 변수 설정 및 배경색 설정
            const assignee = info.event.extendedProps?.assignee;
            const isMyEvent = currentUserName && assignee === currentUserName;

            let color = info.event.backgroundColor || info.event.extendedProps?.color || '#1976d2';

            // 내가 만든 카드인 경우
            if (isMyEvent) {
              // 배경색을 파란색으로 설정
              info.el.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
              // 막대 색상도 파란색으로 설정
              info.el.style.setProperty('--event-color', '#2563EB');
            } else {
              // 다른 유저가 만든 카드인 경우
              // 배경색을 흰색으로 설정
              info.el.style.backgroundColor = '#ffffff';

              // 빨간색 막대를 회색으로 변경
              // hex 색상 코드를 RGB로 변환하여 빨간색 계열인지 확인
              if (color.startsWith('#') && color.length >= 7) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);

                // 빨간색 계열: R > 150 && R > G + 50 && R > B + 50
                const isRedColor = r > 150 && r > g + 50 && r > b + 50;

                if (isRedColor) {
                  // 빨간색을 회색으로 변경
                  color = '#9CA3AF'; // 회색
                }
              }

              info.el.style.setProperty('--event-color', color);
            }
          }}
          eventContent={(arg) => {
            const event = arg.event;
            const isAllDay = event.allDay;

            // FullCalendar는 모든 커스텀 속성을 extendedProps에 저장
            const assignee = event.extendedProps?.assignee;
            const team = event.extendedProps?.team;
            const attendees = event.extendedProps?.attendees;
            const title = event.title;

            // 시간 텍스트 생성
            const timeText = isAllDay ? 'AllDay' : arg.timeText;

            // 팀명 담당자명 형태로 구성
            const teamAssigneeText = team && assignee ? `${team} ${assignee}` : team ? team : assignee ? assignee : '';

            // 참석자 수 계산
            const attendeesCount = attendees ? attendees.split(',').filter((name: string) => name.trim()).length : 0;

            return (
              <div
                style={{
                  padding: '3px 6px 3px 10px',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start'
                }}
              >
                {/* 첫 번째 줄: 시간(왼쪽) - 팀 담당자(오른쪽) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: 'rgba(0,0,0,0.8)',
                    flexShrink: 0,
                    minHeight: '14px'
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: '0 1 auto'
                    }}
                  >
                    {timeText}
                  </span>
                  {teamAssigneeText && (
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginLeft: '4px',
                        flex: '0 1 auto',
                        textAlign: 'right'
                      }}
                    >
                      {teamAssigneeText}
                    </span>
                  )}
                </div>

                {/* 두 번째 줄: 제목(왼쪽) - 참석인원(오른쪽) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'rgba(0,0,0,0.9)',
                    flex: 1
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 'normal',
                      flex: '1 1 auto'
                    }}
                  >
                    {title}
                  </span>
                  {attendeesCount > 0 && (
                    <span
                      style={{
                        marginLeft: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: 'rgba(0,0,0,0.7)',
                        flexShrink: 0
                      }}
                    >
                      {attendeesCount}명
                    </span>
                  )}
                </div>
              </div>
            );
          }}
          select={handleRangeSelect}
          eventDrop={handleEventUpdate}
          eventClick={handleEventSelect}
          eventResize={handleEventUpdate}
          height="auto"
          contentHeight={650}
          plugins={[listPlugin, dayGridPlugin, timelinePlugin, timeGridPlugin, interactionPlugin]}
        />
      </CalendarStyled>
          </Box>

      {/* Dialog renders its body even if not open */}
      <Dialog
        maxWidth="lg"
        TransitionComponent={PopupTransition}
        fullWidth
        onClose={handleModal}
        open={isModalOpen}
        PaperProps={{
          sx: {
            p: 0,
            bgcolor: '#ffffff',
            height: '840px',
            maxHeight: '840px',
            overflow: 'hidden'
          }
        }}
      >
        <AddEventForm
          modalCallback={modalCallback}
          event={selectedEvent}
          range={selectedRange}
          onCancel={handleModal}
          createEvent={supabaseCreateEvent}
          updateEvent={supabaseUpdateEvent}
          deleteEvent={supabaseDeleteEvent}
          canCreateData={canCreateData}
          canEditOwn={canEditOwn}
          canEditOthers={canEditOthers}
        />
      </Dialog>
          {/* 기존 컨텐츠 끝 */}
        </>
      )}
    </Box>
  );
}
