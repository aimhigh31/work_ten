'use client';

import React from 'react';

// material-ui
import Grid from '@mui/material/Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';

// project-imports
import AnimateButton from 'components/@extended/AnimateButton';

// third-party
import { motion } from 'framer-motion';

// icons
import { Shield, People, Award, HeartAdd, Call, ArrowRight } from '@wandersonalwes/iconsax-react';

// ==============================|| SAAS CONSULTING - WHY CHOOSE US ||============================== //

export default function WhyChooseUs() {
  const differentiators = [
    {
      id: 1,
      icon: Award,
      title: '다년간 축적된 SaaS 구축 및 운영 노하우 보유',
      description: '수많은 프로젝트를 통해 검증된 방법론과 베스트 프랙티스를 제공합니다.',
      color: 'primary'
    },
    {
      id: 2,
      icon: People,
      title: '현업 중심의 맞춤형 분석과 전략 수립',
      description: '실제 업무 담당자의 관점에서 분석하여 실무에 최적화된 솔루션을 제공합니다.',
      color: 'success'
    },
    {
      id: 3,
      icon: Shield,
      title: '체계적인 프로젝트 관리로 리스크 최소화',
      description: '단계별 체크포인트와 품질 관리를 통해 예상치 못한 문제를 사전에 방지합니다.',
      color: 'warning'
    },
    {
      id: 4,
      icon: HeartAdd,
      title: '온보딩까지 완벽 지원하는 원스톱 서비스 제공',
      description: '구축 완료 후 사용자 교육과 정착까지 책임지는 토털 케어 서비스입니다.',
      color: 'info'
    }
  ];

  const stats = [
    { number: '50+', label: '성공 프로젝트', desc: '다양한 업종의 성공 사례' },
    { number: '98%', label: '고객 만족도', desc: '높은 품질의 서비스 제공' },
    { number: '30%', label: '평균 비용 절감', desc: '효율적인 솔루션 도입' },
    { number: '24/7', label: '지원 서비스', desc: '언제든 문의 가능한 체계' }
  ];

  return (
    <Box sx={{ py: 12, bgcolor: 'background.paper' }}>
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
              Why Choose Us
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              왜 우리 컨설팅인가?
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
              검증된 전문성과 체계적인 접근으로 고객의 성공적인 디지털 전환을 보장합니다
            </Typography>
          </Box>
        </motion.div>

        {/* 차별화 포인트 */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {differentiators.map((item, index) => {
            const IconComponent = item.icon;

            return (
              <Grid key={item.id} size={{ xs: 12, md: 6 }}>
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
                      '&:hover': {
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-4px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      {/* 아이콘 */}
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: 3,
                          bgcolor: `${item.color}.light`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3
                        }}
                      >
                        <IconComponent size={32} color="white" />
                      </Box>

                      {/* 제목 */}
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: 'text.primary',
                          lineHeight: 1.4
                        }}
                      >
                        {item.title}
                      </Typography>

                      {/* 설명 */}
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.8
                        }}
                      >
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* 통계 섹션 */}
        <motion.div
          initial={{ opacity: 0, translateY: 50 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Card
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              mb: 8
            }}
          >
            <CardContent sx={{ p: 6 }}>
              <Typography
                variant="h3"
                sx={{
                  textAlign: 'center',
                  fontWeight: 700,
                  mb: 6
                }}
              >
                신뢰할 수 있는 수치
              </Typography>

              <Grid container spacing={4}>
                {stats.map((stat, index) => (
                  <Grid key={index} size={{ xs: 6, md: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="h2"
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          fontSize: { xs: '2rem', md: '3rem' }
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          opacity: 0.9
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.8,
                          fontSize: '0.875rem'
                        }}
                      >
                        {stat.desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA 섹션 */}
        <motion.div
          initial={{ opacity: 0, translateY: 50 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: 'text.primary'
                }}
              >
                지금 시작하세요!
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                무료 컨설팅을 통해 귀하의 비즈니스에 최적화된 Micro SaaS 솔루션을 찾아보세요
              </Typography>

              <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
                <Grid>
                  <AnimateButton>
                    <Button
                      size="large"
                      variant="contained"
                      endIcon={<Call size={20} />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 3
                      }}
                    >
                      무료 컨설팅 신청
                    </Button>
                  </AnimateButton>
                </Grid>
                <Grid>
                  <AnimateButton>
                    <Button
                      size="large"
                      variant="outlined"
                      endIcon={<ArrowRight size={20} />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        borderRadius: 3
                      }}
                    >
                      포트폴리오 보기
                    </Button>
                  </AnimateButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
