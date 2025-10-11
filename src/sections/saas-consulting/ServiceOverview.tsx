'use client';

// material-ui
import Grid from '@mui/material/Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// third-party
import { motion } from 'framer-motion';

// icons
import { CloudConnection, Setting4, Radar } from '@wandersonalwes/iconsax-react';

// ==============================|| SAAS CONSULTING - SERVICE OVERVIEW ||============================== //

export default function ServiceOverview() {
  return (
    <Box sx={{ py: 12, bgcolor: 'grey.50' }}>
      <Container>
        <Grid container spacing={6}>
          {/* 섹션 헤더 */}
          <Grid size={12}>
            <motion.div
              initial={{ opacity: 0, translateY: 50 }}
              whileInView={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 30 }}
              viewport={{ once: true }}
            >
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                >
                  Service Overview
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    fontSize: { xs: '2rem', md: '2.5rem' }
                  }}
                >
                  서비스 개요
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    maxWidth: '600px',
                    mx: 'auto',
                    lineHeight: 1.6
                  }}
                >
                  소규모 비즈니스를 위한 맞춤형 SaaS 솔루션과 전문적인 컨설팅 서비스를 제공합니다
                </Typography>
              </Box>
            </motion.div>
          </Grid>

          {/* SaaS Micro 관리시스템이란? */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, translateX: -50 }}
              whileInView={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-4px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 3,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}
                    >
                      <CloudConnection size={28} color="white" />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      SaaS Micro 관리시스템이란?
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.8,
                      fontSize: '1.1rem',
                      mb: 3
                    }}
                  >
                    소규모 타겟층을 위한 맞춤형 SaaS 솔루션으로, 특정 문제 해결에 최적화된 경량화된 클라우드 기반 관리시스템입니다.
                  </Typography>

                  <Box sx={{ pl: 2, borderLeft: 3, borderColor: 'primary.main', bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.dark' }}>
                      💡 복잡한 기능보다는 핵심 기능에 집중하여 빠른 도입과 높은 효율성을 제공합니다
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 컨설팅 목적 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, translateX: 50 }}
              whileInView={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-4px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 3,
                        bgcolor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}
                    >
                      <Radar size={28} color="white" />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      컨설팅 목적
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.8,
                      fontSize: '1.1rem',
                      mb: 3
                    }}
                  >
                    기업의 비즈니스 요구에 맞는 Micro SaaS 제품 선정부터 구축, 운영까지 전 과정을 체계적으로 지원하여 빠르고 안정적인 시스템
                    도입을 돕습니다.
                  </Typography>

                  <Box sx={{ pl: 2, borderLeft: 3, borderColor: 'success.main', bgcolor: 'success.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'success.dark' }}>
                      🎯 선정 → 구축 → 운영까지 원스톱 지원으로 성공적인 디지털 전환을 보장합니다
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 핵심 가치 */}
          <Grid size={12}>
            <motion.div
              initial={{ opacity: 0, translateY: 50 }}
              whileInView={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Card
                sx={{
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  mt: 4
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Grid container spacing={4} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: { xs: 'auto', md: 0 }
                        }}
                      >
                        <Setting4 size={40} color="white" />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 10 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: { xs: 'center', md: 'left' } }}>
                        우리의 핵심 가치
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 400,
                          opacity: 0.9,
                          lineHeight: 1.8,
                          textAlign: { xs: 'center', md: 'left' }
                        }}
                      >
                        복잡함 대신 단순함을, 비용 대신 효율성을, 시간 소모 대신 빠른 결과를 제공하여
                        <br />
                        고객의 비즈니스 성장에 집중할 수 있도록 돕습니다.
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
