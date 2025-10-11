'use client';

import React from 'react';

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
import { EyeSlash, Flash, Routing, Global } from '@wandersonalwes/iconsax-react';

// ==============================|| SAAS CONSULTING - MICRO SAAS FEATURES ||============================== //

export default function MicroSaasFeatures() {
  const features = [
    {
      id: 1,
      icon: EyeSlash,
      title: '특정 문제 해결에 집중',
      description: '좁은 시장과 산업을 타겟팅하여 필요한 핵심 기능만을 제공, 불필요한 복잡성을 줄임.',
      highlights: ['타겟 시장 집중', '핵심 기능 중심', '복잡성 최소화', '높은 전문성'],
      color: '#FF6B6B'
    },
    {
      id: 2,
      icon: Flash,
      title: '빠른 도입과 비용 효율성',
      description: '소규모 인원 대상, 최소화된 기능으로 초기 투자와 운영 비용 절감.',
      highlights: ['낮은 초기 투자', '빠른 구축 속도', '운영비용 절감', '즉시 사용 가능'],
      color: '#4ECDC4'
    },
    {
      id: 3,
      icon: Routing,
      title: '유연한 확장성',
      description: '필요에 따라 기능 추가 및 확장이 가능하여 비즈니스 변화에 신속 대응.',
      highlights: ['모듈형 구조', '점진적 확장', '변화 대응력', '성장 지원'],
      color: '#45B7D1'
    },
    {
      id: 4,
      icon: Global,
      title: '클라우드 기반 접근성',
      description: '언제 어디서나 인터넷 접속만으로 시스템 이용 가능.',
      highlights: ['24/7 접근성', '원격 업무 지원', '자동 백업', '보안 강화'],
      color: '#96CEB4'
    }
  ];

  return (
    <Box sx={{ py: 12, bgcolor: 'grey.50' }}>
      <Container>
        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, translateY: 50 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 30 }}
          viewport={{ once: true }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
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
              Micro SaaS Features
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              Micro SaaS 특징 및 장점
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              복잡한 기업용 솔루션이 아닌, 정확히 필요한 기능만 제공하는 스마트한 비즈니스 도구입니다
            </Typography>
          </Box>
        </motion.div>

        {/* 특징 카드들 */}
        <Grid container spacing={4}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;

            return (
              <Grid key={feature.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                <motion.div
                  initial={{ opacity: 0, translateY: 50 }}
                  whileInView={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 30,
                    delay: index * 0.1
                  }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      border: '1px solid',
                      borderColor: 'divider',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-8px)',
                        '& .feature-icon': {
                          transform: 'scale(1.1)',
                          bgcolor: feature.color
                        }
                      },
                      transition: 'all 0.3s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        bgcolor: feature.color
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      {/* 아이콘 */}
                      <Box
                        className="feature-icon"
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <IconComponent size={36} color="#666" />
                      </Box>

                      {/* 제목 */}
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: 'text.primary',
                          fontSize: { xs: '1.125rem', md: '1.25rem' }
                        }}
                      >
                        {feature.title}
                      </Typography>

                      {/* 설명 */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.7,
                          mb: 3
                        }}
                      >
                        {feature.description}
                      </Typography>

                      {/* 하이라이트 */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                        {feature.highlights.map((highlight, hIndex) => (
                          <Box
                            key={hIndex}
                            sx={{
                              px: 2,
                              py: 0.5,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: 'text.secondary'
                            }}
                          >
                            {highlight}
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* 비교 섹션 */}
        <motion.div
          initial={{ opacity: 0, translateY: 50 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Box sx={{ mt: 10 }}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                fontWeight: 700,
                mb: 6,
                color: 'text.primary'
              }}
            >
              기존 솔루션 vs Micro SaaS
            </Typography>

            <Grid container spacing={4}>
              {/* 기존 솔루션 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: 'error.light',
                    bgcolor: 'error.50',
                    height: '100%'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 3,
                        color: 'error.main',
                        textAlign: 'center'
                      }}
                    >
                      ❌ 기존 대형 솔루션
                    </Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0 }}>
                      {[
                        '복잡하고 사용하지 않는 기능들',
                        '높은 초기 투자 비용',
                        '긴 구축 및 도입 기간',
                        '복잡한 사용자 인터페이스',
                        '전문 인력 필요',
                        '유지보수 부담'
                      ].map((item, index) => (
                        <Typography
                          key={index}
                          component="li"
                          variant="body1"
                          sx={{
                            mb: 1.5,
                            color: 'error.dark',
                            lineHeight: 1.6
                          }}
                        >
                          {item}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Micro SaaS */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: 'success.light',
                    bgcolor: 'success.50',
                    height: '100%'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 3,
                        color: 'success.main',
                        textAlign: 'center'
                      }}
                    >
                      ✅ Micro SaaS
                    </Typography>
                    <Box component="ul" sx={{ pl: 3, m: 0 }}>
                      {[
                        '필요한 핵심 기능에만 집중',
                        '합리적인 가격과 투자',
                        '빠른 도입과 즉시 사용',
                        '직관적이고 간단한 UI',
                        '일반 사용자도 쉽게 활용',
                        '최소한의 관리 부담'
                      ].map((item, index) => (
                        <Typography
                          key={index}
                          component="li"
                          variant="body1"
                          sx={{
                            mb: 1.5,
                            color: 'success.dark',
                            lineHeight: 1.6
                          }}
                        >
                          {item}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
