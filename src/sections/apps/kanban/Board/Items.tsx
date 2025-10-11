import { useState, CSSProperties, MouseEvent } from 'react';

// material-ui
import { Theme, alpha } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import { Draggable, DraggingStyle, NotDraggingStyle } from '@hello-pangea/dnd';

// project-imports
import AlertItemDelete from './AlertItemDelete';
import EditStory from '../Backlogs/EditStory';

import { openSnackbar } from 'api/snackbar';
import { deleteItem, handlerKanbanDialog, useGetBacklogs } from 'api/kanban';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';

// assets
import { Hierarchy, Calendar, Message, Clock, User } from '@wandersonalwes/iconsax-react';

// types
import { KanbanItem, KanbanUserStory, KanbanProfile } from 'types/kanban';
import { SnackbarProps } from 'types/snackbar';

const backImage = '/assets/images/profile';

interface Props {
  item: KanbanItem;
  index: number;
}

// item drag wrapper
function getDragWrapper(
  isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle | undefined,
  theme: Theme,
  radius: string
): CSSProperties | undefined {
  return {
    userSelect: 'none',
    margin: `0 0 ${8}px 0`,
    padding: 16,
    border: '1px solid',
    borderColor: isDragging ? theme.palette.primary.main : theme.palette.divider,
    backgroundColor: isDragging ? alpha(theme.palette.primary.lighter, 0.1) : theme.palette.background.paper,
    borderRadius: radius,
    boxShadow: isDragging ? theme.shadows[8] : theme.shadows[1],
    transition: 'all 0.2s ease-in-out',
    ...draggableStyle
  };
}

// 우선순위 색상 가져오기
const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'success' => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'success';
  }
};

// 우선순위 라벨 가져오기
const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'high':
      return '높음';
    case 'medium':
      return '보통';
    case 'low':
      return '낮음';
    default:
      return '없음';
  }
};

// 날짜 포맷팅
const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '내일';
  if (diffDays === -1) return '어제';
  if (diffDays > 0) return `${diffDays}일 후`;
  return `${Math.abs(diffDays)}일 지남`;
};

// 마감일이 지났는지 확인
const isOverdue = (date: Date): boolean => {
  return new Date() > date;
};

// ==============================|| KANBAN BOARD - ITEMS ||============================== //

export default function Items({ item, index }: Props) {
  const { backlogs } = useGetBacklogs();

  const backProfile = item.image && `${backImage}/${item.image}`;

  // itemStory 계산을 더 안전하게 수정
  const itemStory = backlogs?.userStory.find((story: KanbanUserStory) => story?.itemIds?.includes(item.id));

  // 담당자 정보 가져오기
  const assignedProfile = backlogs?.profiles.find((profile: KanbanProfile) => profile.id === item.assign);

  // 댓글 수 계산
  const commentCount = item.commentIds?.length || 0;

  const handlerDetails = (id: string) => {
    handlerKanbanDialog(id);
  };

  const [anchorEl, setAnchorEl] = useState<Element | (() => Element) | null | undefined>(null);
  const handleClick = (event: MouseEvent<HTMLButtonElement> | undefined) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [open, setOpen] = useState(false);
  const handleModalClose = (status: boolean) => {
    setOpen(false);
    if (status) {
      deleteItem(item.id);
      openSnackbar({
        open: true,
        message: '태스크가 성공적으로 삭제되었습니다',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        variant: 'alert',
        alert: {
          color: 'success'
        }
      } as SnackbarProps);
    }
  };

  const [openStoryDrawer, setOpenStoryDrawer] = useState<boolean>(false);
  const handleStoryDrawerOpen = () => {
    setOpenStoryDrawer((prevState) => !prevState);
  };

  const editStory = () => {
    setOpenStoryDrawer((prevState) => !prevState);
  };

  return (
    <Draggable key={item.id} draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={(theme) => ({ ...getDragWrapper(snapshot.isDragging, provided.draggableProps.style, theme, `12px`) })}
        >
          {/* 헤더: 제목과 메뉴 */}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography
              onClick={() => handlerDetails(item.id)}
              variant="subtitle1"
              sx={{
                display: 'block',
                width: 'calc(100% - 34px)',
                cursor: 'pointer',
                fontWeight: 600,
                lineHeight: 1.4,
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main'
                }
              }}
            >
              {item.title}
            </Typography>

            <IconButton size="small" color="secondary" onClick={handleClick} aria-controls="menu-comment" aria-haspopup="true">
              <MoreIcon />
            </IconButton>
            <Menu
              id="menu-comment"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
              variant="selectedMenu"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
            >
              <MenuItem
                onClick={() => {
                  handleClose();
                  handlerDetails(item.id);
                }}
              >
                편집
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  setOpen(true);
                }}
              >
                삭제
              </MenuItem>
            </Menu>
            <AlertItemDelete title={item.title} open={open} handleClose={handleModalClose} />
          </Stack>

          {/* 설명 */}
          {item.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}
            >
              {item.description}
            </Typography>
          )}

          {/* 우선순위 */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label={getPriorityLabel(item.priority)} color={getPriorityColor(item.priority)} size="small" variant="outlined" />
          </Stack>

          {/* 사용자 스토리 */}
          {itemStory && (
            <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center', color: 'primary.dark', mb: 2 }}>
              <Tooltip title="사용자 스토리">
                <Hierarchy size={16} />
              </Tooltip>
              <Tooltip title={itemStory.title}>
                <Link variant="caption" underline="hover" onClick={editStory} sx={{ cursor: 'pointer' }}>
                  스토리 #{itemStory.id.replace('story-', '')}
                </Link>
              </Tooltip>
            </Stack>
          )}

          {/* 이미지 */}
          {backProfile && (
            <CardMedia
              component="img"
              image={backProfile}
              sx={{
                width: '100%',
                borderRadius: 1,
                mb: 2,
                maxHeight: 120,
                objectFit: 'cover'
              }}
              title="태스크 이미지"
            />
          )}

          {/* 하단 정보: 담당자, 마감일, 댓글 */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {/* 담당자 */}
            <Stack direction="row" spacing={1} alignItems="center">
              {assignedProfile ? (
                <Tooltip title={assignedProfile.name}>
                  <Avatar src={assignedProfile.avatar} sx={{ width: 28, height: 28 }} alt={assignedProfile.name}>
                    {assignedProfile.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ) : (
                <Tooltip title="담당자 없음">
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'grey.300' }}>
                    <User size={16} />
                  </Avatar>
                </Tooltip>
              )}
            </Stack>

            {/* 우측 정보: 마감일, 댓글 */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* 댓글 수 */}
              {commentCount > 0 && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Message size={14} color="#757575" />
                  <Typography variant="caption" color="text.secondary">
                    {commentCount}
                  </Typography>
                </Stack>
              )}

              {/* 마감일 */}
              {item.dueDate && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Calendar size={14} color={isOverdue(item.dueDate) ? '#f44336' : '#757575'} />
                  <Typography
                    variant="caption"
                    color={isOverdue(item.dueDate) ? 'error.main' : 'text.secondary'}
                    fontWeight={isOverdue(item.dueDate) ? 600 : 400}
                  >
                    {formatDate(item.dueDate)}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>

          <EditStory story={itemStory} open={openStoryDrawer} handleDrawerOpen={handleStoryDrawerOpen} />
        </Box>
      )}
    </Draggable>
  );
}
