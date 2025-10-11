'use client';

// material-ui
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// project-imports
import AnimateButton from 'components/@extended/AnimateButton';

// third-party
import { motion } from 'framer-motion';

// icons
import { ArrowRight, Building4, CloudConnection } from '@wandersonalwes/iconsax-react';

// ==============================|| SAAS CONSULTING - HERO ||============================== //

export default function ConsultingHero() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        pb: 12.5,
        pt: 10,
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.05"%3E%3Cpath d="m0 40 40-40h40v40z"/%3E%3C/g%3E%3C/svg%3E")',
          zIndex: 1
        }
      }}
    >
      <Container sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Grid container spacing={3} sx={{ textAlign: 'center' }}>
              {/* 배지 */}
              <Grid size={12}>
                <motion.div
                  initial={{ opacity: 0, translateY: 30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 30 }}
                >
                  <Chip
                    icon={<CloudConnection size={18} color="white" />}
                    label="전문 SaaS 컨설팅 서비스"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      py: 1,
                      px: 2,
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  />
                </motion.div>
              </Grid>

              {/* 메인 타이틀 */}
              <Grid size={12}>
                <motion.div
                  initial={{ opacity: 0, translateY: 50 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.2 }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: 'white',
                      mb: 2
                    }}
                  >
                    SaaS Micro 관리시스템
                    <br />
                    <Typography
                      variant="h1"
                      component="span"
                      sx={{
                        fontSize: 'inherit',
                        background: 'linear-gradient(90deg, #ffd89b 0%, #19547b 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        fontWeight: 'inherit'
                      }}
                    >
                      구축 컨설팅
                    </Typography>
                  </Typography>
                </motion.div>
              </Grid>

              {/* 서브 타이틀 */}
              <Grid size={12}>
                <motion.div
                  initial={{ opacity: 0, translateY: 50 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.4 }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: { xs: '1.125rem', md: '1.5rem' },
                      fontWeight: 400,
                      lineHeight: 1.6,
                      color: 'rgba(255, 255, 255, 0.9)',
                      maxWidth: '800px',
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    소규모 타겟층을 위한 맞춤형 SaaS 솔루션으로,
                    <br />
                    특정 문제 해결에 최적화된 경량화된 클라우드 기반 관리시스템
                  </Typography>
                </motion.div>
              </Grid>

              {/* 설명 */}
              <Grid size={12}>
                <motion.div
                  initial={{ opacity: 0, translateY: 50 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.6 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: 'rgba(255, 255, 255, 0.8)',
                      maxWidth: '600px',
                      mx: 'auto',
                      lineHeight: 1.8
                    }}
                  >
                    기업의 비즈니스 요구에 맞는 Micro SaaS 제품 선정부터 구축, 운영까지 전 과정을 체계적으로 지원하여 빠르고 안정적인 시스템
                    도입을 돕습니다.
                  </Typography>
                </motion.div>
              </Grid>

              {/* CTA 버튼 */}
              <Grid size={12}>
                <motion.div
                  initial={{ opacity: 0, translateY: 50 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.8 }}
                >
                  <Grid container spacing={3} sx={{ justifyContent: 'center', mt: 2 }}>
                    <Grid>
                      <AnimateButton>
                        <Button
                          size="large"
                          variant="contained"
                          endIcon={<ArrowRight size={20} />}
                          sx={{
                            bgcolor: 'white',
                            color: 'primary.main',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            borderRadius: 3,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            '&:hover': {
                              bgcolor: 'grey.100',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.16)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          무료 컨설팅 상담
                        </Button>
                      </AnimateButton>
                    </Grid>
                    <Grid>
                      <AnimateButton>
                        <Button
                          size="large"
                          variant="outlined"
                          startIcon={<Building4 size={20} />}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            color: 'white',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            borderRadius: 3,
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              borderColor: 'white',
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          포트폴리오 보기
                        </Button>
                      </AnimateButton>
                    </Grid>
                  </Grid>
                </motion.div>
              </Grid>

              {/* 통계 */}
              <Grid size={12}>
                <motion.div
                  initial={{ opacity: 0, translateY: 50 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 1.0 }}
                >
                  <Grid container spacing={4} sx={{ justifyContent: 'center', mt: 4 }}>
                    <Grid>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                          50+
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          성공 프로젝트
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                          98%
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          고객 만족도
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                          30%
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          비용 절감
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </motion.div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
