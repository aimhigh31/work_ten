import { useRef, useState } from 'react';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import Transitions from 'components/@extended/Transitions';
import MainCard from 'components/MainCard';
import SimpleBar from 'components/third-party/SimpleBar';

// assets
import {
  DocumentText,
  Edit,
  Notification,
  Setting2,
  ArrowDown2,
  TickCircle,
  NotificationBing,
  Record,
  TickSquare
} from '@wandersonalwes/iconsax-react';

const actionSX = {
  mt: '6px',
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};

// ==============================|| HEADER CONTENT - NOTIFICATION ||============================== //

export default function NotificationPage() {
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const anchorRef = useRef<any>(null);
  const dateFilterRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [filter, setFilter] = useState<'전체' | '안읽음' | '읽음'>('전체');
  const [notifications, setNotifications] = useState([
    { id: 1, title: '보안사고관리', content: '페이지에 새로운 변경로그가 등록되었습니다.', time: '2분 전', isRead: false },
    { id: 2, title: '하드웨어관리', content: '페이지 변경로그가 업데이트되었습니다.', time: '5시간 전', isRead: false },
    { id: 3, title: '솔루션관리', content: '페이지에 변경로그가 새로 추가되었습니다.', time: '7시간 전', isRead: true },
    { id: 4, title: '비용관리', content: '페이지 변경로그에 새로운 기록이 등록되었습니다.', time: '1일 전', isRead: true }
  ]);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleDateMenuOpen = () => {
    setDateMenuOpen(true);
  };

  const handleDateMenuClose = () => {
    setDateMenuOpen(false);
  };

  const toggleNotificationRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: !notification.isRead } : notification))
    );
  };

  const markAllAsRead = (period?: string) => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    setDateMenuOpen(false);
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === '안읽음') return !notification.isRead;
    if (filter === '읽음') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <Box sx={{ flexShrink: 0, ml: 0.5 }}>
      <IconButton
        color="secondary"
        variant="light"
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        size="large"
        sx={(theme) => ({
          p: 1,
          color: 'secondary.main',
          bgcolor: open ? 'secondary.200' : 'secondary.100',
          ...theme.applyStyles('dark', { bgcolor: open ? 'background.paper' : 'background.default' })
        })}
      >
        <Badge badgeContent={unreadCount} color="success" sx={{ '& .MuiBadge-badge': { top: 2, right: 4 } }}>
          <Notification variant="Bold" />
        </Badge>
      </IconButton>
      <Popper
        placement={downMD ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [downMD ? -5 : 0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={downMD ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper sx={(theme) => ({ boxShadow: theme.customShadows.z1, borderRadius: 1.5, width: { xs: 320, sm: 420 } })}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard border={false} content={false}>
                  <CardContent>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h5">알림</Typography>
                    </Stack>

                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          variant={filter === '전체' ? 'contained' : 'outlined'}
                          onClick={() => setFilter('전체')}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          전체
                        </Button>
                        <Button
                          variant={filter === '안읽음' ? 'contained' : 'outlined'}
                          onClick={() => setFilter('안읽음')}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          안읽음
                        </Button>
                        <Button
                          variant={filter === '읽음' ? 'contained' : 'outlined'}
                          onClick={() => setFilter('읽음')}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          읽음
                        </Button>
                      </ButtonGroup>

                      <Box>
                        <Button
                          ref={dateFilterRef}
                          variant="text"
                          color="primary"
                          endIcon={<ArrowDown2 size={16} />}
                          onClick={handleDateMenuOpen}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          기간 선택
                        </Button>
                        <Menu
                          anchorEl={dateFilterRef.current}
                          open={dateMenuOpen}
                          onClose={handleDateMenuClose}
                          PaperProps={{ sx: { minWidth: 150 } }}
                        >
                          <MenuItem onClick={() => markAllAsRead('today')}>오늘</MenuItem>
                          <MenuItem onClick={() => markAllAsRead('week')}>이번 주</MenuItem>
                          <MenuItem onClick={() => markAllAsRead('month')}>이번 달</MenuItem>
                          <MenuItem onClick={() => markAllAsRead('all')}>전체</MenuItem>
                        </Menu>
                      </Box>
                    </Stack>
                    <SimpleBar style={{ height: '400px', minHeight: '400px' }}>
                      <List
                        component="nav"
                        sx={(theme) => ({
                          '& .MuiListItemButton-root': {
                            p: 1.5,
                            my: 1.5,
                            border: `1px solid ${theme.palette.divider}`,
                            '&:hover': { bgcolor: 'primary.lighter', borderColor: 'primary.light' },
                            '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' },
                            '&:hover .MuiAvatar-root': { bgcolor: 'primary.main', color: 'background.paper' }
                          }
                        })}
                      >
                        {filteredNotifications.length > 0 ? (
                          filteredNotifications.map((notification) => {
                            return (
                              <ListItem
                                key={notification.id}
                                component={ListItemButton}
                                sx={{
                                  bgcolor: notification.isRead ? 'grey.100' : 'background.paper',
                                  '&:hover': {
                                    bgcolor: notification.isRead ? 'grey.200' : 'action.hover'
                                  }
                                }}
                                secondaryAction={
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <IconButton size="small" onClick={() => toggleNotificationRead(notification.id)} sx={{ p: 0.5 }}>
                                      <TickCircle
                                        size={16}
                                        variant={notification.isRead ? 'Bold' : 'Outline'}
                                        color={notification.isRead ? '#4caf50' : '#ccc'}
                                      />
                                    </IconButton>
                                    <Typography variant="caption" noWrap>
                                      {notification.time}
                                    </Typography>
                                  </Stack>
                                }
                              >
                                <ListItemAvatar>
                                  <IconButton
                                    onClick={() => toggleNotificationRead(notification.id)}
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      p: 0,
                                      '&:hover': {
                                        bgcolor: 'action.hover'
                                      }
                                    }}
                                  >
                                    {notification.isRead ? (
                                      <TickSquare size={24} variant="Bold" color="#1976d2" />
                                    ) : (
                                      <Box
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          border: '2px solid #ccc',
                                          borderRadius: '4px',
                                          bgcolor: 'transparent',
                                          '&:hover': {
                                            borderColor: '#1976d2'
                                          }
                                        }}
                                      />
                                    )}
                                  </IconButton>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="h6">
                                      <Typography component="span" variant="subtitle1">
                                        {notification.title}
                                      </Typography>{' '}
                                      {notification.content}
                                    </Typography>
                                  }
                                  secondary={notification.time}
                                />
                              </ListItem>
                            );
                          })
                        ) : (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              py: 8,
                              textAlign: 'center'
                            }}
                          >
                            <Notification size={48} variant="Bulk" color="#ccc" />
                            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                              {filter === '안읽음'
                                ? '읽지 않은 알림이 없습니다'
                                : filter === '읽음'
                                  ? '읽은 알림이 없습니다'
                                  : '알림이 없습니다'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.disabled' }}>
                              새로운 변경로그가 등록되면 알림을 받을 수 있습니다.
                            </Typography>
                          </Box>
                        )}
                      </List>
                    </SimpleBar>
                  </CardContent>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
