'use client';

// react
import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

// project-imports
import { GRID_COMMON_SPACING } from 'config';

// assets
import {
  DocumentUpload,
  Image,
  Video,
  Document,
  FolderOpen,
  Trash,
  DocumentDownload,
  Eye,
  Copy,
  SearchNormal1
} from '@wandersonalwes/iconsax-react';

// 미디어 파일 타입 정의
interface MediaFile {
  id: number;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  dimensions?: string;
  alt?: string;
}

// 임시 미디어 데이터
const initialMedia: MediaFile[] = [
  {
    id: 1,
    name: 'hero-banner.jpg',
    type: 'image',
    url: '/assets/images/landing/img-hero-1.png',
    size: 245760,
    uploadedBy: '김철수',
    uploadedAt: '2024-01-15',
    dimensions: '1920x1080',
    alt: '히어로 배너 이미지'
  },
  {
    id: 2,
    name: 'product-demo.mp4',
    type: 'video',
    url: '/media/video/demo.mp4',
    thumbnail: '/assets/images/landing/img-hero-2.png',
    size: 15728640,
    uploadedBy: '이영희',
    uploadedAt: '2024-01-20',
    dimensions: '1280x720'
  },
  {
    id: 3,
    name: 'user-guide.pdf',
    type: 'document',
    url: '/documents/guide.pdf',
    size: 1048576,
    uploadedBy: '박민수',
    uploadedAt: '2024-02-01'
  },
  {
    id: 4,
    name: 'screenshot.png',
    type: 'image',
    url: '/assets/images/widget/img-dropbox-bg.svg',
    size: 98304,
    uploadedBy: '정수진',
    uploadedAt: '2024-02-05',
    dimensions: '800x600'
  }
];

// ==============================|| 미디어 관리 페이지 ||============================== //

export default function MediaManagement() {
  const theme = useTheme();
  const [media, setMedia] = useState<MediaFile[]>(initialMedia);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);

  // 필터링된 미디어
  const filteredMedia = media.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '전체' || file.type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={40} />;
      case 'video':
        return <Video size={40} />;
      case 'document':
        return <Document size={40} />;
      default:
        return <Document size={40} />;
    }
  };

  const handleFileUpload = () => {
    setUploading(true);
    // 파일 업로드 시뮬레이션
    setTimeout(() => {
      const newFile: MediaFile = {
        id: Math.max(...media.map((f) => f.id)) + 1,
        name: 'new-upload.jpg',
        type: 'image',
        url: '/assets/images/placeholder.jpg',
        size: 204800,
        uploadedBy: '현재 사용자',
        uploadedAt: new Date().toISOString().split('T')[0],
        dimensions: '1200x800'
      };
      setMedia((prev) => [newFile, ...prev]);
      setUploading(false);
      alert('파일이 성공적으로 업로드되었습니다.');
    }, 2000);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      setMedia((prev) => prev.filter((file) => file.id !== id));
    }
  };

  const handleCopyUrl = (url: string) => {
    // Clipboard API 사용 가능 여부 확인
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert('URL이 클립보드에 복사되었습니다.');
      }).catch(() => {
        alert('URL 복사에 실패했습니다.');
      });
    } else {
      // Fallback: 임시 textarea 사용
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('URL이 클립보드에 복사되었습니다.');
      } catch (err) {
        alert('URL 복사에 실패했습니다.');
      }
      document.body.removeChild(textarea);
    }
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
                  <FolderOpen size={32} />
                  미디어 라이브러리
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  이미지, 비디오, 문서 파일을 관리할 수 있습니다.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button
                  variant="contained"
                  startIcon={<DocumentUpload />}
                  onClick={handleFileUpload}
                  disabled={uploading}
                  sx={{ mb: { xs: 1, md: 0 } }}
                >
                  {uploading ? '업로드 중...' : '파일 업로드'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 업로드 진행바 */}
      {uploading && (
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ mb: 1 }}>
                파일 업로드 중...
              </Typography>
              <LinearProgress />
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* 통계 카드 */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              전체 파일
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {media.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              이미지
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {media.filter((file) => file.type === 'image').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              비디오
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {media.filter((file) => file.type === 'video').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="info.main">
              문서
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {media.filter((file) => file.type === 'document').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 검색 및 필터 */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  placeholder="파일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <SearchNormal1 size={20} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>파일 타입</InputLabel>
                  <Select value={selectedType} label="파일 타입" onChange={(e) => setSelectedType(e.target.value)}>
                    <MenuItem value="전체">전체</MenuItem>
                    <MenuItem value="image">이미지</MenuItem>
                    <MenuItem value="video">비디오</MenuItem>
                    <MenuItem value="document">문서</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredMedia.length}개 파일
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* 미디어 그리드 */}
      <Grid size={12}>
        <Grid container spacing={2}>
          {filteredMedia.map((file) => (
            <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setSelectedFile(file)}>
                <Box sx={{ position: 'relative', height: 200 }}>
                  {file.type === 'image' ? (
                    <CardMedia component="img" height="200" image={file.url} alt={file.alt || file.name} sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.100',
                        color: 'text.secondary'
                      }}
                    >
                      {getFileIcon(file.type)}
                    </Box>
                  )}
                  <Chip label={file.type} size="small" sx={{ position: 'absolute', top: 8, right: 8 }} />
                </Box>
                <CardContent>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                  {file.dimensions && (
                    <Typography variant="caption" color="text.secondary">
                      {file.dimensions}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(file.url);
                      }}
                    >
                      <Copy size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, '_blank');
                      }}
                    >
                      <DocumentDownload size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                    >
                      <Trash size={16} />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* 파일 상세 다이얼로그 */}
      <Dialog open={!!selectedFile} onClose={() => setSelectedFile(null)} maxWidth="md" fullWidth>
        {selectedFile && (
          <>
            <DialogTitle>{selectedFile.name}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  {selectedFile.type === 'image' ? (
                    <img src={selectedFile.url} alt={selectedFile.name} style={{ width: '100%', height: 'auto', maxHeight: 300 }} />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 1,
                        borderColor: 'grey.300',
                        borderRadius: 1
                      }}
                    >
                      {getFileIcon(selectedFile.type)}
                    </Box>
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">파일 정보</Typography>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        파일명
                      </Typography>
                      <Typography variant="body1">{selectedFile.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        파일 크기
                      </Typography>
                      <Typography variant="body1">{formatFileSize(selectedFile.size)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        업로드한 사용자
                      </Typography>
                      <Typography variant="body1">{selectedFile.uploadedBy}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        업로드 날짜
                      </Typography>
                      <Typography variant="body1">{selectedFile.uploadedAt}</Typography>
                    </Box>
                    {selectedFile.dimensions && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          해상도
                        </Typography>
                        <Typography variant="body1">{selectedFile.dimensions}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleCopyUrl(selectedFile.url)}>URL 복사</Button>
              <Button onClick={() => window.open(selectedFile.url, '_blank')}>다운로드</Button>
              <Button onClick={() => setSelectedFile(null)}>닫기</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Grid>
  );
}
