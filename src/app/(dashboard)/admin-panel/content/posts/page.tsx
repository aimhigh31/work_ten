'use client';

// react
import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';

// project-imports
import { GRID_COMMON_SPACING } from 'config';

// assets
import { Add, Edit, Trash, DocumentText, Eye, SearchNormal1 } from '@wandersonalwes/iconsax-react';

// 게시물 타입 정의
interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  status: 'published' | 'draft' | 'private';
  category: string;
  author: string;
  views: number;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

// 임시 게시물 데이터
const initialPosts: Post[] = [
  {
    id: 1,
    title: 'Next.js 15의 새로운 기능들',
    slug: 'nextjs-15-new-features',
    excerpt: 'Next.js 15에서 새롭게 추가된 기능들을 살펴보겠습니다.',
    status: 'published',
    category: '기술',
    author: '김철수',
    views: 1524,
    thumbnail: '/assets/images/landing/img-hero-1.png',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-16'
  },
  {
    id: 2,
    title: 'React 상태 관리 패턴',
    slug: 'react-state-management-patterns',
    excerpt: 'React에서 효과적인 상태 관리를 위한 다양한 패턴들을 소개합니다.',
    status: 'draft',
    category: '기술',
    author: '이영희',
    views: 856,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22'
  },
  {
    id: 3,
    title: 'TypeScript 최신 업데이트',
    slug: 'typescript-latest-updates',
    excerpt: 'TypeScript의 최신 기능과 개선사항들을 알아봅시다.',
    status: 'published',
    category: '뉴스',
    author: '박민수',
    views: 2341,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01'
  },
  {
    id: 4,
    title: 'Material-UI 컴포넌트 가이드',
    slug: 'material-ui-component-guide',
    excerpt: 'Material-UI 컴포넌트 사용법과 커스터마이징 방법입니다.',
    status: 'private',
    category: '튜토리얼',
    author: '정수진',
    views: 423,
    createdAt: '2024-02-05',
    updatedAt: '2024-02-07'
  }
];

const categories = ['전체', '기술', '뉴스', '리뷰', '튜토리얼'];

// ==============================|| 게시물 관리 페이지 ||============================== //

export default function PostManagement() {
  const theme = useTheme();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');

  // 필터링된 게시물
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || post.category === selectedCategory;
    const matchesStatus = selectedStatus === '전체' || post.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = (id: number) => {
    if (window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      setPosts((prev) => prev.filter((post) => post.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'private':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return '발행됨';
      case 'draft':
        return '초안';
      case 'private':
        return '비공개';
      default:
        return status;
    }
  };

  const handleStatusChange = (postId: number, newStatus: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, status: newStatus as 'published' | 'draft' | 'private', updatedAt: new Date().toISOString().split('T')[0] }
          : post
      )
    );
  };

  return (
    <Grid container spacing={GRID_COMMON_SPACING}>
      {/* 페이지 헤더 */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DocumentText size={32} />
                  게시물 관리
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  블로그 게시물을 작성하고 관리할 수 있습니다.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button variant="contained" startIcon={<Add />} sx={{ mb: { xs: 1, md: 0 } }}>
                  새 게시물 작성
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 통계 카드 */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              전체 게시물
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {posts.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              발행된 게시물
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {posts.filter((post) => post.status === 'published').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              초안
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {posts.filter((post) => post.status === 'draft').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="info.main">
              총 조회수
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {posts.reduce((total, post) => total + post.views, 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 필터 및 검색 */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  placeholder="게시물 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <SearchNormal1 size={20} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>카테고리</InputLabel>
                  <Select value={selectedCategory} label="카테고리" onChange={(e) => setSelectedCategory(e.target.value)}>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>상태</InputLabel>
                  <Select value={selectedStatus} label="상태" onChange={(e) => setSelectedStatus(e.target.value)}>
                    <MenuItem value="전체">전체</MenuItem>
                    <MenuItem value="published">발행됨</MenuItem>
                    <MenuItem value="draft">초안</MenuItem>
                    <MenuItem value="private">비공개</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredPosts.length}개 게시물
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 게시물 테이블 */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="40%">제목</TableCell>
                    <TableCell>카테고리</TableCell>
                    <TableCell>작성자</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>조회수</TableCell>
                    <TableCell>수정일</TableCell>
                    <TableCell align="center">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {post.thumbnail && <Avatar src={post.thumbnail} variant="rounded" sx={{ width: 40, height: 40 }} />}
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {post.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {post.excerpt}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={post.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{post.author}</Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select value={post.status} onChange={(e) => handleStatusChange(post.id, e.target.value)} variant="outlined">
                            <MenuItem value="published">발행됨</MenuItem>
                            <MenuItem value="draft">초안</MenuItem>
                            <MenuItem value="private">비공개</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{post.views.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {post.updatedAt}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="미리보기">
                            <IconButton size="small" color="info">
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="편집">
                            <IconButton size="small" color="primary">
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="삭제">
                            <IconButton size="small" color="error" onClick={() => handleDelete(post.id)}>
                              <Trash size={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
