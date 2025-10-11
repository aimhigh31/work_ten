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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

// project-imports
import { GRID_COMMON_SPACING } from 'config';

// assets
import { Add, Edit, Trash, Category, DocumentText } from '@wandersonalwes/iconsax-react';

// 카테고리 타입 정의
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
  postCount: number;
  parentId?: number;
  createdAt: string;
}

// 임시 카테고리 데이터
const initialCategories: Category[] = [
  { id: 1, name: '기술', slug: 'technology', description: '기술 관련 게시물', status: 'active', postCount: 15, createdAt: '2024-01-15' },
  { id: 2, name: '뉴스', slug: 'news', description: '최신 뉴스', status: 'active', postCount: 8, createdAt: '2024-01-20' },
  { id: 3, name: '리뷰', slug: 'review', description: '제품 리뷰', status: 'active', postCount: 12, createdAt: '2024-02-01' },
  { id: 4, name: '튜토리얼', slug: 'tutorial', description: '학습 가이드', status: 'inactive', postCount: 5, createdAt: '2024-02-10' }
];

// ==============================|| 카테고리 관리 페이지 ||============================== //

export default function CategoryManagement() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [open, setOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description,
        status: category.status
      });
    } else {
      setEditCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        status: 'active'
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      status: 'active'
    });
  };

  const handleSave = () => {
    if (editCategory) {
      // 편집 모드
      setCategories((prev) => prev.map((cat) => (cat.id === editCategory.id ? { ...cat, ...formData } : cat)));
    } else {
      // 새 카테고리 추가
      const newCategory: Category = {
        id: Math.max(...categories.map((c) => c.id)) + 1,
        ...formData,
        postCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCategories((prev) => [...prev, newCategory]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }));
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
                  <Category size={32} />
                  카테고리 관리
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  콘텐츠 카테고리를 생성하고 관리할 수 있습니다.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ mb: { xs: 1, md: 0 } }}>
                  새 카테고리 추가
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
              전체 카테고리
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {categories.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              활성 카테고리
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {categories.filter((cat) => cat.status === 'active').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              총 게시물
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {categories.reduce((total, cat) => total + cat.postCount, 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="error.main">
              비활성 카테고리
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {categories.filter((cat) => cat.status === 'inactive').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 카테고리 테이블 */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              카테고리 목록
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>이름</TableCell>
                    <TableCell>슬러그</TableCell>
                    <TableCell>설명</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>게시물 수</TableCell>
                    <TableCell>생성일</TableCell>
                    <TableCell align="center">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{category.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={category.status === 'active' ? '활성' : '비활성'}
                          color={getStatusColor(category.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{category.postCount}개</Typography>
                      </TableCell>
                      <TableCell>{category.createdAt}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(category)}>
                          <Edit size={16} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(category.id)}>
                          <Trash size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* 카테고리 추가/편집 다이얼로그 */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editCategory ? '카테고리 편집' : '새 카테고리 추가'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="카테고리 이름"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="슬러그"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              fullWidth
              required
              helperText="URL에 사용되는 고유 식별자입니다"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select
                value={formData.status}
                label="상태"
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              >
                <MenuItem value="active">활성</MenuItem>
                <MenuItem value="inactive">비활성</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSave} variant="contained">
            {editCategory ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
