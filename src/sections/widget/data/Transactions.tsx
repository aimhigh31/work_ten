'use client';

import { useState, MouseEvent, ReactNode, SyntheticEvent, useMemo } from 'react';

// material-ui
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// project-imports
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import { useSupabaseTaskManagement } from 'hooks/useSupabaseTaskManagement';
import { TaskStatus } from 'types/task';

// assets
import { ArrowDown, ArrowSwapHorizontal, ArrowUp } from '@wandersonalwes/iconsax-react';

// ==============================|| TAB PANEL ||============================== //

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

// ==============================|| DATA WIDGET - TRANSACTIONS ||============================== //

export default function Transactions() {
  const [value, setValue] = useState(0);
  const user = useUser();
  const { tasks } = useSupabaseTaskManagement();

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 상태 색상
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case '대기':
        return { backgroundColor: '#F5F5F5', color: '#757575' };
      case '진행':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case '완료':
        return { backgroundColor: '#E8F5E9', color: '#388E3C' };
      case '홀딩':
        return { backgroundColor: '#FFEBEE', color: '#D32F2F' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  // 사용자 필터링된 업무 데이터
  const userTasks = useMemo(() => {
    const userName = user?.korName || user?.name || '';
    return tasks.filter((task) => task.assignee_name === userName);
  }, [tasks, user]);

  // 탭별 필터링
  const getFilteredTasks = (status?: string) => {
    if (!status || status === '전체') {
      return userTasks;
    }
    return userTasks.filter((task) => task.status === status);
  };

  const allTasks = getFilteredTasks();
  const waitingTasks = getFilteredTasks('대기');
  const progressTasks = getFilteredTasks('진행');
  const completedTasks = getFilteredTasks('완료');
  const holdingTasks = getFilteredTasks('홀딩');

  return (
    <MainCard content={false}>
      <Box sx={{ p: 3, pb: 1 }}>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">업무관리</Typography>
          <IconButton
            color="secondary"
            id="wallet-button"
            aria-controls={open ? 'wallet-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
          >
            <MoreIcon />
          </IconButton>
          <Menu
            id="wallet-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{ 'aria-labelledby': 'wallet-button', sx: { p: 1.25, minWidth: 150 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <ListItemButton onClick={handleClose}>Today</ListItemButton>
            <ListItemButton onClick={handleClose}>Weekly</ListItemButton>
            <ListItemButton onClick={handleClose}>Monthly</ListItemButton>
          </Menu>
        </Stack>
      </Box>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" sx={{ px: 3 }}>
            <Tab label="전체" {...a11yProps(0)} />
            <Tab label="대기" {...a11yProps(1)} />
            <Tab label="진행" {...a11yProps(2)} />
            <Tab label="완료" {...a11yProps(3)} />
            <Tab label="홀딩" {...a11yProps(4)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 3, py: 1.5 }, minHeight: 300 }}>
            {allTasks.length > 0 ? (
              allTasks.slice(0, 5).map((task) => (
                <ListItem
                  key={task.id}
                  divider
                  secondaryAction={
                    <Stack sx={{ gap: 0.5, alignItems: 'flex-end' }}>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          ...getStatusColor(task.status as TaskStatus),
                          fontWeight: 500,
                          fontSize: '12px',
                          height: '24px'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.start_date || '시작일 미정'}
                      </Typography>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      type="outlined"
                      color="secondary"
                      sx={{ color: 'secondary.darker', borderColor: 'secondary.light', fontWeight: 600 }}
                    >
                      {task.team?.charAt(0) || 'T'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle1">{task.work_content || '업무 제목 없음'}</Typography>}
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.code}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      업무가 없습니다
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 3, py: 1.5 }, minHeight: 300 }}>
            {waitingTasks.length > 0 ? (
              waitingTasks.slice(0, 5).map((task) => (
                <ListItem
                  key={task.id}
                  divider
                  secondaryAction={
                    <Stack sx={{ gap: 0.5, alignItems: 'flex-end' }}>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          ...getStatusColor(task.status as TaskStatus),
                          fontWeight: 500,
                          fontSize: '12px',
                          height: '24px'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.start_date || '시작일 미정'}
                      </Typography>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      type="outlined"
                      color="secondary"
                      sx={{ color: 'secondary.darker', borderColor: 'secondary.light', fontWeight: 600 }}
                    >
                      {task.team?.charAt(0) || 'T'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle1">{task.work_content || '업무 제목 없음'}</Typography>}
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.code}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      대기 중인 업무가 없습니다
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 3, py: 1.5 }, minHeight: 300 }}>
            {progressTasks.length > 0 ? (
              progressTasks.slice(0, 5).map((task) => (
                <ListItem
                  key={task.id}
                  divider
                  secondaryAction={
                    <Stack sx={{ gap: 0.5, alignItems: 'flex-end' }}>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          ...getStatusColor(task.status as TaskStatus),
                          fontWeight: 500,
                          fontSize: '12px',
                          height: '24px'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.start_date || '시작일 미정'}
                      </Typography>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      type="outlined"
                      color="secondary"
                      sx={{ color: 'secondary.darker', borderColor: 'secondary.light', fontWeight: 600 }}
                    >
                      {task.team?.charAt(0) || 'T'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle1">{task.work_content || '업무 제목 없음'}</Typography>}
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.code}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      진행 중인 업무가 없습니다
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </TabPanel>
        <TabPanel value={value} index={3}>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 3, py: 1.5 }, minHeight: 300 }}>
            {completedTasks.length > 0 ? (
              completedTasks.slice(0, 5).map((task) => (
                <ListItem
                  key={task.id}
                  divider
                  secondaryAction={
                    <Stack sx={{ gap: 0.5, alignItems: 'flex-end' }}>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          ...getStatusColor(task.status as TaskStatus),
                          fontWeight: 500,
                          fontSize: '12px',
                          height: '24px'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.completed_date || '완료일 미정'}
                      </Typography>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      type="outlined"
                      color="secondary"
                      sx={{ color: 'secondary.darker', borderColor: 'secondary.light', fontWeight: 600 }}
                    >
                      {task.team?.charAt(0) || 'T'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle1">{task.work_content || '업무 제목 없음'}</Typography>}
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.code}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      완료된 업무가 없습니다
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </TabPanel>
        <TabPanel value={value} index={4}>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 3, py: 1.5 }, minHeight: 300 }}>
            {holdingTasks.length > 0 ? (
              holdingTasks.slice(0, 5).map((task) => (
                <ListItem
                  key={task.id}
                  divider
                  secondaryAction={
                    <Stack sx={{ gap: 0.5, alignItems: 'flex-end' }}>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          ...getStatusColor(task.status as TaskStatus),
                          fontWeight: 500,
                          fontSize: '12px',
                          height: '24px'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.start_date || '시작일 미정'}
                      </Typography>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      type="outlined"
                      color="secondary"
                      sx={{ color: 'secondary.darker', borderColor: 'secondary.light', fontWeight: 600 }}
                    >
                      {task.team?.charAt(0) || 'T'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle1">{task.work_content || '업무 제목 없음'}</Typography>}
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {task.code}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      홀딩 중인 업무가 없습니다
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </TabPanel>

        <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center', p: 3 }}>
          <Button variant="outlined" fullWidth color="secondary">
            업무 이력
          </Button>
          <Button variant="contained" fullWidth>
            새 업무 생성
          </Button>
        </Stack>
      </Box>
    </MainCard>
  );
}
