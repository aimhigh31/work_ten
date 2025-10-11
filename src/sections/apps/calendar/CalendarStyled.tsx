// material-ui
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

// ==============================|| CALENDAR - STYLED ||============================== //

const ExperimentalStyled = styled(Box)(({ theme }) => ({
  width: 'calc(100% + 2px)',
  marginLeft: -1,
  marginBottom: '-50px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  overflow: 'auto',
  maxHeight: 'calc(100vh - 180px)',
  // hide license message
  '& .fc-license-message': {
    display: 'none'
  },
  '& .fc-col-header': {
    width: '100% !important',
    position: 'sticky !important',
    top: '0 !important',
    zIndex: '100 !important',
    backgroundColor: `${theme.palette.background.paper} !important`
  },
  '& .fc-col-header-cell': {
    position: 'sticky !important',
    top: '0 !important',
    zIndex: '100 !important',
    backgroundColor: `${theme.palette.secondary[100]} !important`
  },
  '& .fc-scrollgrid-section-header': {
    position: 'sticky !important',
    top: '0 !important',
    zIndex: '100 !important'
  },
  '& .fc-scrollgrid-section-header > *': {
    position: 'sticky !important',
    top: '0 !important',
    zIndex: '100 !important'
  },
  '& .fc-scrollgrid-section': {
    position: 'relative !important'
  },
  '& .fc .fc-daygrid-body ': {
    width: '100% !important'
  },
  '& .fc-scrollgrid-sync-table': {
    width: '100% !important'
  },
  '& .fc-scrollgrid': {
    borderCollapse: 'separate !important'
  },
  // basic style
  '& .fc': {
    '--fc-bg-event-opacity': 1,
    '--fc-border-color': theme.palette.divider,
    '--fc-daygrid-event-dot-width': '8px',
    '--fc-today-bg-color': 'transparent',
    '--fc-list-event-dot-width': '8px',
    '--fc-event-border-color': theme.palette.primary.dark,
    '--fc-now-indicator-color': theme.palette.error.main,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    fontFamily: theme.typography.fontFamily
  },
  // 오늘 날짜 테두리 스타일
  '& .fc-day-today': {
    backgroundColor: 'transparent !important',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      border: '2px solid #1976d2',
      pointerEvents: 'none',
      zIndex: 1
    }
  },
  // date text
  '& .fc .fc-daygrid-day-top': {
    display: 'grid',
    '& .fc-daygrid-day-number': {
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 12
    }
  },
  // weekday
  '& .fc .fc-col-header-cell': {
    backgroundColor: theme.palette.secondary[100]
  },
  '& .fc .fc-col-header-cell-cushion': {
    color: theme.palette.secondary.darker,
    padding: 16
  },

  // events
  '& .fc-direction-ltr .fc-daygrid-event.fc-event-end, .fc-direction-rtl .fc-daygrid-event.fc-event-start': {
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 6,
    borderRadius: 6,
    border: '1px solid #e0e0e0 !important',
    borderLeft: '4px solid var(--event-color) !important',
    overflow: 'hidden',
    backgroundColor: '#ffffff !important',
    position: 'relative'
  },
  '& .fc-v-event .fc-event-title': {
    overflow: 'unset'
  },

  '& .fc-h-event .fc-event-main': {
    padding: 4,
    paddingLeft: 12
  },

  // popover when multiple events
  '& .fc .fc-more-popover': {
    border: 'none',
    borderRadius: 12,
    zIndex: 1200
  },

  '& .fc .fc-more-popover .fc-popover-body': {
    backgroundColor: theme.palette.secondary[200],
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12
  },

  '& .fc .fc-popover-header': {
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: theme.palette.secondary[200],
    color: theme.palette.text.primary
  },
  // agenda view
  '& .fc-theme-standard .fc-list-day-cushion': {
    backgroundColor: theme.palette.secondary[100],
    padding: '8px'
  },
  // 일정 보기에서 오늘 날짜 텍스트 정렬 통일 (다른 날짜와 동일한 padding 적용)
  '& .fc-list-day.fc-day-today .fc-list-day-cushion': {
    padding: '8px !important'
  },
  '& .fc .fc-day': {
    cursor: 'pointer'
  },
  '& .fc .fc-timeGridDay-view .fc-timegrid-slot': {
    backgroundColor: theme.palette.background.paper
  },
  '& .fc .fc-timegrid-slot': {
    cursor: 'pointer'
  },
  '& .fc .fc-list-event:hover td': {
    cursor: 'pointer',
    backgroundColor: theme.palette.secondary[100]
  },

  '& .fc-timegrid-event-harness-inset .fc-timegrid-event, .fc-timegrid-event.fc-event-mirror, .fc-timegrid-more-link': {
    padding: 8,
    margin: 2,
    borderRadius: 12
  },

  // 주말 날짜 빨간색 스타일
  '& .fc-daygrid-day.weekend-date .fc-daygrid-day-number': {
    color: theme.palette.error.main,
    fontWeight: 'bold'
  },
  // 날짜 셀 높이 고정
  '& .fc-daygrid-day': {
    height: '260px !important',
    minHeight: '260px !important'
  },
  '& .fc-scrollgrid-sync-table': {
    height: '100% !important'
  }
}));

export default ExperimentalStyled;
