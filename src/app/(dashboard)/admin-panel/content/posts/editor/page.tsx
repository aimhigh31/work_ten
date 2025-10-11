'use client';

// react
import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

// project-imports
import { GRID_COMMON_SPACING } from 'config';

// assets
import { Save2, Eye, DocumentText, Image, Tag, Calendar, ArrowLeft, Add, Trash } from '@wandersonalwes/iconsax-react';

// 게시물 폼 데이터 타입
interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'private';
  featuredImage?: string;
  seoTitle: string;
  seoDescription: string;
  publishDate: string;
  allowComments: boolean;
  sticky: boolean;
}

const categories = ['기술', '뉴스', '리뷰', '튜토리얼'];
const availableTags = ['React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS', 'UI/UX', 'Tutorial', 'News'];

// ==============================|| 게시물 편집기 페이지 ||============================== //

export default function PostEditor() {
  const theme = useTheme();
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    publishDate: new Date().toISOString().split('T')[0],
    allowComments: true,
    sticky: false
  });

  const [newTag, setNewTag] = useState('');

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: value
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50),
      seoTitle: value.length > 60 ? value.substring(0, 60) : value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }));
  };

  const handleSave = (status: 'published' | 'draft' | 'private') => {
    const updatedData = { ...formData, status };
    console.log('저장할 데이터:', updatedData);
    alert(`게시물이 ${status === 'published' ? '발행' : status === 'draft' ? '초안으로 저장' : '비공개로 저장'}되었습니다.`);
  };

  const handleImageUpload = () => {
    // 이미지 업로드 로직 (실제로는 파일 업로드 API 호출)
    alert('이미지 업로드 기능입니다. 실제 구현시 파일 업로드 API와 연동하세요.');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={GRID_COMMON_SPACING}>
        {/* 상단 헤더 */}
        <Grid size={12}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => window.history.back()}>
                <ArrowLeft size={20} />
              </IconButton>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentText size={32} />
                게시물 작성
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<Eye />} onClick={() => alert('미리보기 기능')}>
                미리보기
              </Button>
              <Button variant="outlined" onClick={() => handleSave('draft')}>
                초안 저장
              </Button>
              <Button variant="contained" startIcon={<Save2 />} onClick={() => handleSave('published')}>
                발행하기
              </Button>
            </Stack>
          </Stack>
        </Grid>

        {/* 메인 콘텐츠 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {/* 기본 정보 */}
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <TextField
                    label="제목"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    fullWidth
                    placeholder="게시물 제목을 입력하세요"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="슬러그 (URL)"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    fullWidth
                    helperText="URL에 사용될 고유 식별자"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="요약"
                    value={formData.excerpt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="게시물의 간단한 요약을 작성하세요"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* 콘텐츠 편집기 */}
            <Card>
              <CardHeader
                title="본문 내용"
                action={
                  <Button startIcon={<Image />} onClick={handleImageUpload}>
                    이미지 추가
                  </Button>
                }
              />
              <CardContent>
                <TextField
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  fullWidth
                  multiline
                  rows={15}
                  placeholder="게시물 내용을 작성하세요..."
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  마크다운 문법을 지원합니다. 실제 운영시에는 WYSIWYG 에디터를 통합하세요.
                </Typography>
              </CardContent>
            </Card>

            {/* SEO 설정 */}
            <Card>
              <CardHeader title="SEO 설정" />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label="SEO 제목"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                    fullWidth
                    helperText={`${formData.seoTitle.length}/60 문자`}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="SEO 설명"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    helperText={`${formData.seoDescription.length}/160 문자`}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* 사이드바 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* 발행 설정 */}
            <Card>
              <CardHeader title="발행 설정" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={formData.status}
                      label="상태"
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                    >
                      <MenuItem value="draft">초안</MenuItem>
                      <MenuItem value="published">발행됨</MenuItem>
                      <MenuItem value="private">비공개</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="발행일"
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publishDate: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.allowComments}
                        onChange={(e) => setFormData((prev) => ({ ...prev, allowComments: e.target.checked }))}
                      />
                    }
                    label="댓글 허용"
                  />

                  <FormControlLabel
                    control={
                      <Switch checked={formData.sticky} onChange={(e) => setFormData((prev) => ({ ...prev, sticky: e.target.checked }))} />
                    }
                    label="상단 고정"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* 카테고리 */}
            <Card>
              <CardHeader title="카테고리" />
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel>카테고리 선택</InputLabel>
                  <Select
                    value={formData.category}
                    label="카테고리 선택"
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>

            {/* 태그 */}
            <Card>
              <CardHeader title="태그" />
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="새 태그"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      size="small"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="outlined" size="small" onClick={handleAddTag} disabled={!newTag.trim()}>
                      <Add size={16} />
                    </Button>
                  </Box>

                  <Typography variant="subtitle2">추천 태그:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant={formData.tags.includes(tag) ? 'filled' : 'outlined'}
                        onClick={() => {
                          if (formData.tags.includes(tag)) {
                            handleRemoveTag(tag);
                          } else {
                            setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
                          }
                        }}
                      />
                    ))}
                  </Box>

                  {formData.tags.length > 0 && (
                    <>
                      <Divider />
                      <Typography variant="subtitle2">선택된 태그:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.tags.map((tag) => (
                          <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} color="primary" size="small" />
                        ))}
                      </Box>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* 대표 이미지 */}
            <Card>
              <CardHeader title="대표 이미지" />
              <CardContent>
                <Stack spacing={2} alignItems="center">
                  {formData.featuredImage ? (
                    <Avatar src={formData.featuredImage} variant="rounded" sx={{ width: 120, height: 80 }} />
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{
                        width: 120,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary'
                      }}
                    >
                      <Image size={32} />
                    </Paper>
                  )}
                  <Button variant="outlined" onClick={handleImageUpload} fullWidth>
                    이미지 선택
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
