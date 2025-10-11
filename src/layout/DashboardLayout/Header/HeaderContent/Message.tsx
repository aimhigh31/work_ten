import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// material-ui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';

// project-imports
import MessageCard from 'components/cards/statistics/MessageCard';
import IconButton from 'components/@extended/IconButton';
import MainCard from 'components/MainCard';
import SimpleBar from 'components/third-party/SimpleBar';
import { ThemeMode } from 'config';

// assets
import { Add, NotificationStatus, Profile2User, Eye, Message2, TickSquare, Heart } from '@wandersonalwes/iconsax-react';

const message1Light = '/assets/images/widget/message/message1Light.svg';
const message1Dark = '/assets/images/widget/message/message1Dark.svg';
const message2Light = '/assets/images/widget/message/message2Light.svg';
const message2Dark = '/assets/images/widget/message/message2Dark.svg';
const message3Light = '/assets/images/widget/message/message3Light.svg';
const message3Dark = '/assets/images/widget/message/message3Dark.svg';
const message4Light = '/assets/images/widget/message/message4Light.svg';
const message4Dark = '/assets/images/widget/message/message4Dark.svg';

// ==============================|| HEADER CONTENT - CUSTOMIZATION ||============================== //

// 칸반 카드 타입 정의
interface KanbanCard {
  id: string;
  page: string;
  pageUrl: string;
  menuPath: string; // 메뉴 경로 추가
  status: string;
  statusColor: string;
  statusTextColor: string;
  team: string;
  teamColor: string;
  teamTextColor: string;
  title: string;
  code: string;
  startDate: string;
  endDate: string;
  progress: string;
  progressValue: number;
  progressColor: string;
  assignee: string;
  assigneeColor: string;
  assigneeAvatar: string; // 아바타 이미지 URL
  registrationDate: string; // 등록일시
  isRead: boolean;
  views: number;
  comments: number;
}

// 업무관리 칸반 카드 컴포넌트
function TaskKanbanCard({
  card,
  onCardClick,
  onToggleRead
}: {
  card: KanbanCard;
  onCardClick: (card: KanbanCard) => void;
  onToggleRead: (cardId: string, event: React.MouseEvent) => void;
}) {
  return (
    <Box
      sx={{
        cursor: 'pointer',
        bgcolor: card.isRead ? '#f8f9fa' : 'background.paper',
        border: '1px solid #e1e4e8',
        borderRadius: '12px',
        p: 2.5,
        mb: 1.5,
        position: 'relative',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease'
        }
      }}
      onClick={() => onCardClick(card)}
    >
      {/* 체크박스 (우측 상단) */}
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton onClick={(e) => onToggleRead(card.id, e)} sx={{ p: 0.5, '&:hover': { bgcolor: 'action.hover' } }}>
          {card.isRead ? (
            <TickSquare size={16} variant="Bold" color="#1976d2" />
          ) : (
            <Box
              sx={{
                width: 16,
                height: 16,
                border: '2px solid #ccc',
                borderRadius: '3px',
                bgcolor: 'transparent',
                '&:hover': { borderColor: '#1976d2' }
              }}
            />
          )}
        </IconButton>
      </Box>

      {/* 첫 번째 줄: 경로 */}
      <Box sx={{ mb: 2, pr: 4 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          {card.menuPath}
        </Typography>
      </Box>

      {/* 제목과 상태 태그 같은 줄 */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3, color: 'text.primary', flex: 1, pr: 2 }}>
          {card.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Chip
            label={card.status}
            size="small"
            sx={{ bgcolor: card.statusColor, color: card.statusTextColor, fontSize: '12px', height: 22, borderRadius: '6px' }}
          />
          <Chip
            label={card.team}
            size="small"
            sx={{ bgcolor: card.teamColor, color: card.teamTextColor, fontSize: '12px', height: 22, borderRadius: '6px' }}
          />
        </Box>
      </Stack>

      {/* 정보 라인들 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          등록일: {card.registrationDate}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          코드: {card.code}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          시작일: {card.startDate}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          완료일: {card.endDate}
        </Typography>
      </Box>

      {/* 진행도 */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
          <Typography variant="body2" sx={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>
            진행도 {card.progress}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', color: '#4F88FF', fontWeight: 700 }}>
            {card.progressValue}%
          </Typography>
        </Stack>
        <Box sx={{ width: '100%', height: 4, bgcolor: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ width: `${card.progressValue}%`, height: '100%', bgcolor: '#4F88FF' }} />
        </Box>
      </Box>

      {/* 푸터 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={card.assigneeAvatar}
            alt={card.assignee}
            sx={{
              width: 24,
              height: 24,
              fontSize: '12px',
              bgcolor: card.assigneeColor
            }}
          >
            {card.assignee.charAt(0)}
          </Avatar>
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
            {card.assignee}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.8} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Heart size={12} color="#E0E0E0" variant="Bold" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              0
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Eye size={12} color="#E0E0E0" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              {card.views}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Message2 size={12} color="#E0E0E0" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              {card.comments}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}

// 비용관리 칸반 카드 컴포넌트 (진행도 바 없음)
function CostKanbanCard({
  card,
  onCardClick,
  onToggleRead
}: {
  card: KanbanCard;
  onCardClick: (card: KanbanCard) => void;
  onToggleRead: (cardId: string, event: React.MouseEvent) => void;
}) {
  return (
    <Box
      sx={{
        cursor: 'pointer',
        bgcolor: card.isRead ? '#f8f9fa' : 'background.paper',
        border: '1px solid #e1e4e8',
        borderRadius: '12px',
        p: 2.5,
        mb: 1.5,
        position: 'relative',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease'
        }
      }}
      onClick={() => onCardClick(card)}
    >
      {/* 체크박스 (우측 상단) */}
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton onClick={(e) => onToggleRead(card.id, e)} sx={{ p: 0.5, '&:hover': { bgcolor: 'action.hover' } }}>
          {card.isRead ? (
            <TickSquare size={16} variant="Bold" color="#1976d2" />
          ) : (
            <Box
              sx={{
                width: 16,
                height: 16,
                border: '2px solid #ccc',
                borderRadius: '3px',
                bgcolor: 'transparent',
                '&:hover': { borderColor: '#1976d2' }
              }}
            />
          )}
        </IconButton>
      </Box>

      {/* 첫 번째 줄: 경로 */}
      <Box sx={{ mb: 2, pr: 4 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          {card.menuPath}
        </Typography>
      </Box>

      {/* 제목과 상태 태그 같은 줄 */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3, color: 'text.primary', flex: 1, pr: 2 }}>
          {card.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Chip
            label={card.status}
            size="small"
            sx={{ bgcolor: card.statusColor, color: card.statusTextColor, fontSize: '12px', height: 22, borderRadius: '6px' }}
          />
          <Chip
            label="일반비용"
            size="small"
            sx={{ bgcolor: '#F3E5F5', color: '#7B1FA2', fontSize: '12px', height: 22, borderRadius: '6px' }}
          />
        </Box>
      </Stack>

      {/* 정보 라인들 (비용관리 특화) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          등록일: {card.registrationDate}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          코드: {card.code}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          금액: 10,000,000원
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          완료일: {card.endDate}
        </Typography>
      </Box>

      {/* 푸터 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={card.assigneeAvatar}
            alt={card.assignee}
            sx={{
              width: 24,
              height: 24,
              fontSize: '12px',
              bgcolor: card.assigneeColor
            }}
          >
            {card.assignee.charAt(0)}
          </Avatar>
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
            {card.assignee}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.8} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Heart size={12} color="#E0E0E0" variant="Bold" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              0
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Eye size={12} color="#E0E0E0" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              {card.views}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Message2 size={12} color="#E0E0E0" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              {card.comments}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}

// 솔루션관리 칸반 카드 컴포넌트
function SolutionKanbanCard({
  card,
  onCardClick,
  onToggleRead
}: {
  card: KanbanCard;
  onCardClick: (card: KanbanCard) => void;
  onToggleRead: (cardId: string, event: React.MouseEvent) => void;
}) {
  return (
    <Box
      sx={{
        cursor: 'pointer',
        bgcolor: card.isRead ? '#f8f9fa' : 'background.paper',
        border: '1px solid #e1e4e8',
        borderRadius: '12px',
        p: 2.5,
        mb: 1.5,
        position: 'relative',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease'
        }
      }}
      onClick={() => onCardClick(card)}
    >
      {/* 체크박스 (우측 상단) */}
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton onClick={(e) => onToggleRead(card.id, e)} sx={{ p: 0.5, '&:hover': { bgcolor: 'action.hover' } }}>
          {card.isRead ? (
            <TickSquare size={16} variant="Bold" color="#1976d2" />
          ) : (
            <Box
              sx={{
                width: 16,
                height: 16,
                border: '2px solid #ccc',
                borderRadius: '3px',
                bgcolor: 'transparent',
                '&:hover': { borderColor: '#1976d2' }
              }}
            />
          )}
        </IconButton>
      </Box>

      {/* 첫 번째 줄: 경로 */}
      <Box sx={{ mb: 2, pr: 4 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          {card.menuPath}
        </Typography>
      </Box>

      {/* 제목과 상태 태그 같은 줄 */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3, color: 'text.primary', flex: 1, pr: 2 }}>
          {card.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Chip
            label={card.status}
            size="small"
            sx={{ bgcolor: card.statusColor, color: card.statusTextColor, fontSize: '12px', height: 22, borderRadius: '6px' }}
          />
          <Chip
            label="일반솔루션"
            size="small"
            sx={{ bgcolor: '#E0F2F1', color: '#00695C', fontSize: '12px', height: 22, borderRadius: '6px' }}
          />
        </Box>
      </Stack>

      {/* 정보 라인들 (솔루션관리 특화) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          등록일: {card.registrationDate}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          코드: {card.code}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          팀: {card.team}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          개발유형: 웹개발
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          완료일: {card.endDate}
        </Typography>
      </Box>

      {/* 푸터 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={card.assigneeAvatar}
            alt={card.assignee}
            sx={{
              width: 24,
              height: 24,
              fontSize: '12px',
              bgcolor: card.assigneeColor
            }}
          >
            {card.assignee.charAt(0)}
          </Avatar>
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
            {card.assignee}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.8} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Eye size={12} color="#E0E0E0" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              {card.views}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <Message2 size={12} color="#E0E0E0" />
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#999' }}>
              {card.comments}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}

// 기본 칸반 카드 컴포넌트 (다른 페이지들용)
function DefaultKanbanCard({
  card,
  onCardClick,
  onToggleRead
}: {
  card: KanbanCard;
  onCardClick: (card: KanbanCard) => void;
  onToggleRead: (cardId: string, event: React.MouseEvent) => void;
}) {
  return (
    <Box
      sx={{
        cursor: 'pointer',
        bgcolor: card.isRead ? '#f8f9fa' : 'background.paper',
        border: '1px solid #e1e4e8',
        borderRadius: '12px',
        p: 2.5,
        mb: 1.5,
        position: 'relative',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease'
        }
      }}
      onClick={() => onCardClick(card)}
    >
      {/* 체크박스 (우측 상단) */}
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton onClick={(e) => onToggleRead(card.id, e)} sx={{ p: 0.5, '&:hover': { bgcolor: 'action.hover' } }}>
          {card.isRead ? (
            <TickSquare size={16} variant="Bold" color="#1976d2" />
          ) : (
            <Box
              sx={{
                width: 16,
                height: 16,
                border: '2px solid #ccc',
                borderRadius: '3px',
                bgcolor: 'transparent',
                '&:hover': { borderColor: '#1976d2' }
              }}
            />
          )}
        </IconButton>
      </Box>

      {/* 첫 번째 줄: 경로 */}
      <Box sx={{ mb: 2, pr: 4 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          {card.menuPath}
        </Typography>
      </Box>

      {/* 두 번째 줄: 타이틀 + 상태 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3, color: 'text.primary', flex: 1, pr: 2 }}>
          {card.title}
        </Typography>
        <Chip
          label={card.status}
          size="small"
          sx={{ bgcolor: card.statusColor, color: card.statusTextColor, fontSize: '12px', height: 22, borderRadius: '6px', minWidth: 50 }}
        />
      </Stack>

      {/* 기본 정보 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          등록일: {card.registrationDate}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500, mb: 0.5 }}>
          코드: {card.code}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          완료일: {card.endDate}
        </Typography>
      </Box>

      {/* 푸터 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={card.assigneeAvatar}
            alt={card.assignee}
            sx={{
              width: 24,
              height: 24,
              fontSize: '12px',
              bgcolor: card.assigneeColor
            }}
          >
            {card.assignee.charAt(0)}
          </Avatar>
          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
            {card.assignee}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export default function Customization() {
  const theme = useTheme();
  const router = useRouter();

  const message1 = theme.palette.mode === ThemeMode.DARK ? message1Dark : message1Light;
  const message2 = theme.palette.mode === ThemeMode.DARK ? message2Dark : message2Light;
  const message3 = theme.palette.mode === ThemeMode.DARK ? message3Dark : message3Light;
  const message4 = theme.palette.mode === ThemeMode.DARK ? message4Dark : message4Light;

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'전체' | '안읽음' | '읽음'>('전체');
  const [dateFilter, setDateFilter] = useState<'오늘' | '이번 주' | '이번 달' | '전체'>('전체');

  // 칸반 카드 데이터 (각 페이지에서 새로 생성된 카드들)
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([
    {
      id: '1',
      page: '업무관리',
      pageUrl: '/apps/task',
      menuPath: '메인메뉴 > 업무관리',
      status: '대기',
      statusColor: '#F0F0F0',
      statusTextColor: '#424242',
      team: '개발팀',
      teamColor: '#F1F8E9',
      teamTextColor: '#388E3C',
      title: 'AI 기반 추천 시스템 구축',
      code: 'TASK-25-001',
      startDate: '2025-02-01',
      endDate: '미정',
      progress: '사고 탐지',
      progressValue: 0,
      progressColor: '#F44336',
      assignee: '김민수',
      assigneeColor: '#FF5722',
      assigneeAvatar: '/assets/images/users/avatar-1.png',
      registrationDate: '2025-09-02 09:30',
      isRead: false,
      views: 15,
      comments: 3
    },
    {
      id: '2',
      page: '솔루션관리',
      pageUrl: '/it/solution',
      menuPath: 'IT메뉴 > 솔루션관리',
      status: '진행',
      statusColor: '#E3F2FD',
      statusTextColor: '#1976D2',
      team: '디자인팀',
      teamColor: '#F3E5F5',
      teamTextColor: '#7B1FA2',
      title: '클라우드 마이그레이션',
      code: 'SOL-25-002',
      startDate: '2025-01-20',
      endDate: '2025-03-15',
      progress: '개선 조치 중',
      progressValue: 45,
      progressColor: '#1976D2',
      assignee: '이영희',
      assigneeColor: '#E91E63',
      assigneeAvatar: '/assets/images/users/avatar-2.png',
      registrationDate: '2025-09-02 08:00',
      isRead: false,
      views: 28,
      comments: 7
    },
    {
      id: '3',
      page: '하드웨어관리',
      pageUrl: '/it/hardware',
      menuPath: 'IT메뉴 > 하드웨어관리',
      status: '완료',
      statusColor: '#E8F5E8',
      statusTextColor: '#388E3C',
      team: '기획팀',
      teamColor: '#E0F2F1',
      teamTextColor: '#00695C',
      title: '서버 업그레이드',
      code: 'HW-25-001',
      startDate: '2025-01-15',
      endDate: '2025-01-30',
      progress: '근본 개선',
      progressValue: 100,
      progressColor: '#4CAF50',
      assignee: '박지훈',
      assigneeColor: '#2196F3',
      assigneeAvatar: '/assets/images/users/avatar-3.png',
      registrationDate: '2025-09-01 14:20',
      isRead: true,
      views: 45,
      comments: 12
    },
    {
      id: '4',
      page: '비용관리',
      pageUrl: '/apps/cost',
      menuPath: '메인메뉴 > 비용관리',
      status: '홀딩',
      statusColor: '#FFEBEE',
      statusTextColor: '#D32F2F',
      team: '마케팅팀',
      teamColor: '#E3F2FD',
      teamTextColor: '#1565C0',
      title: 'Q1 예산 계획 수립',
      code: 'COST-25-001',
      startDate: '2025-01-10',
      endDate: '미정',
      progress: '사고 탐지',
      progressValue: 0,
      progressColor: '#F44336',
      assignee: '최수진',
      assigneeColor: '#9C27B0',
      assigneeAvatar: '/assets/images/users/avatar-4.png',
      registrationDate: '2025-08-31 11:15',
      isRead: true,
      views: 8,
      comments: 2
    }
  ]);

  const handleToggle = () => {
    setOpen(!open);
  };

  // 기간 필터링을 위한 날짜 비교 함수들
  const isToday = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    return (
      targetDate.getFullYear() === today.getFullYear() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getDate() === today.getDate()
    );
  };

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);

    // 주의 시작을 월요일로 설정
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // 주의 끝을 일요일로 설정
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return targetDate >= startOfWeek && targetDate <= endOfWeek;
  };

  const isThisMonth = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    return targetDate.getFullYear() === today.getFullYear() && targetDate.getMonth() === today.getMonth();
  };

  // 카드 클릭 핸들러 - 해당 페이지로 이동
  const handleCardClick = (card: KanbanCard) => {
    // 칸반 탭을 열고 해당 카드의 편집 팝업을 띄우기 위한 쿼리 파라미터
    router.push(`${card.pageUrl}?tab=kanban&cardId=${card.id}&action=edit&openDialog=true`);
    setOpen(false);
  };

  // 읽음/안읽음 토글 핸들러
  const toggleCardRead = (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    setKanbanCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, isRead: !card.isRead } : card)));
  };

  // 필터링된 카드 목록
  const filteredCards = kanbanCards.filter((card) => {
    // 읽음/안읽음 필터
    if (filter === '안읽음' && card.isRead) return false;
    if (filter === '읽음' && !card.isRead) return false;

    // 기간 필터 (등록일시 기준)
    if (dateFilter !== '전체') {
      const registrationDate = card.registrationDate;

      if (dateFilter === '오늘' && !isToday(registrationDate)) return false;
      if (dateFilter === '이번 주' && !isThisWeek(registrationDate)) return false;
      if (dateFilter === '이번 달' && !isThisMonth(registrationDate)) return false;
    }

    return true;
  });

  return (
    <>
      <Box sx={{ flexShrink: 0, ml: 0.75 }}>
        <IconButton
          color="secondary"
          variant="light"
          onClick={handleToggle}
          aria-label="settings toggler"
          size="large"
          sx={(theme) => ({
            p: 1,
            color: 'secondary.main',
            bgcolor: open ? 'secondary.200' : 'secondary.100',
            ...theme.applyStyles('dark', { bgcolor: open ? 'background.paper' : 'background.default' })
          })}
        >
          <NotificationStatus variant="Bulk" />
        </IconButton>
      </Box>
      <Drawer sx={{ zIndex: 2001 }} anchor="right" onClose={handleToggle} open={open} PaperProps={{ sx: { width: { xs: 308, sm: 417 } } }}>
        {open && (
          <MainCard content={false} sx={{ border: 'none', borderRadius: 0, height: '100vh' }}>
            <SimpleBar
              sx={{
                '& .simplebar-content': {
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5">새로운 카드</Typography>
                  <IconButton color="error" sx={{ p: 0 }} onClick={handleToggle}>
                    <Add size={28} style={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                </Stack>

                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 2 }}>
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

                  <Box sx={{ minWidth: 100 }}>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as '오늘' | '이번 주' | '이번 달' | '전체')}
                      style={{
                        width: '100%',
                        padding: '6px 30px 6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        fontSize: '0.813rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                        backgroundSize: '16px',
                        transition: 'all 0.2s ease',
                        fontWeight: 500,
                        color: '#333'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1976d2';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1976d2';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="전체">전체</option>
                      <option value="오늘">오늘</option>
                      <option value="이번 주">이번 주</option>
                      <option value="이번 달">이번 달</option>
                    </select>
                  </Box>
                </Stack>

                <Grid container spacing={1.5}>
                  {filteredCards.map((card) => (
                    <Grid key={card.id} size={12}>
                      {/* 페이지별 실제 칸반 카드 디자인 */}
                      {card.page === '업무관리' && (
                        <TaskKanbanCard card={card} onCardClick={handleCardClick} onToggleRead={toggleCardRead} />
                      )}
                      {card.page === '비용관리' && (
                        <CostKanbanCard card={card} onCardClick={handleCardClick} onToggleRead={toggleCardRead} />
                      )}
                      {card.page === '솔루션관리' && (
                        <SolutionKanbanCard card={card} onCardClick={handleCardClick} onToggleRead={toggleCardRead} />
                      )}
                      {!['업무관리', '비용관리', '솔루션관리'].includes(card.page) && (
                        <DefaultKanbanCard card={card} onCardClick={handleCardClick} onToggleRead={toggleCardRead} />
                      )}
                    </Grid>
                  ))}

                  {filteredCards.length === 0 && (
                    <Grid size={12}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          py: 8,
                          color: 'text.secondary'
                        }}
                      >
                        <NotificationStatus size={48} variant="Bulk" color="#ccc" />
                        <Typography variant="h6" sx={{ mt: 2 }}>
                          {(() => {
                            if (filter !== '전체' && dateFilter !== '전체') {
                              return `${dateFilter} ${filter === '안읽음' ? '안읽은' : filter === '읽음' ? '읽은' : ''} 카드가 없습니다`;
                            } else if (filter !== '전체') {
                              return filter === '안읽음' ? '새로운 카드가 없습니다' : '읽은 카드가 없습니다';
                            } else if (dateFilter !== '전체') {
                              return `${dateFilter} 카드가 없습니다`;
                            } else {
                              return '카드가 없습니다';
                            }
                          })()}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.disabled' }}>
                          {filter !== '전체' || dateFilter !== '전체'
                            ? '다른 필터 조건을 선택해보세요.'
                            : '각 페이지에서 새로운 작업이 생성되면 여기에 표시됩니다.'}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </SimpleBar>
          </MainCard>
        )}
      </Drawer>
    </>
  );
}
