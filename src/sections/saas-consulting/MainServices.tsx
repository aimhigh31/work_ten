'use client';

import React from 'react';

// material-ui
import Grid from '@mui/material/Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// third-party
import { motion } from 'framer-motion';

// icons
import { SearchNormal1, Award, Diagram, Teacher, TickCircle, People, Setting3, Book1 } from '@wandersonalwes/iconsax-react';

// ==============================|| SAAS CONSULTING - MAIN SERVICES ||============================== //

export default function MainServices() {
  const services = [
    {
      id: 1,
      icon: SearchNormal1,
      title: 'AS-IS 분석',
      description: '현업 실무자 인터뷰와 시스템 현황 분석을 통해 현재 업무 프로세스와 문제점을 정확히 파악합니다.',
      color: 'primary',
      features: ['현업 실무자 심층 인터뷰', '기존 시스템 현황 진단', '업무 프로세스 분석', '문제점 및 개선점 도출']
    },
    {
      id: 2,
      icon: Award,
      title: '최적 SaaS 제품 선정',
      description: '고객 요구사항에 부합하는 Micro SaaS 솔루션을 비교·분석하여 최적의 제품을 추천하고, 공급사 계약까지 관리합니다.',
      color: 'success',
      features: ['SaaS 제품 시장 조사', '요구사항 대비 제품 비교', '공급사 협상 및 계약 관리', 'ROI 기반 최적 제품 추천']
    },
    {
      id: 3,
      icon: Diagram,
      title: '구축 프로젝트 관리',
      description: '단계별 구축 전략 수립과 일정, 품질, 리스크 관리를 통해 예상 문제를 최소화하며 계획대로 시스템을 완성합니다.',
      color: 'warning',
      features: ['프로젝트 계획 수립', '일정 및 마일스톤 관리', '품질 관리 및 테스팅', '리스크 예방 및 대응']
    },
    {
      id: 4,
      icon: Teacher,
      title: '온보딩 및 교육 지원',
      description: '사용자 이해도 제고와 활용 극대화를 위한 맞춤형 교육과 가이드 제공으로 빠른 현장 정착을 지원합니다.',
      color: 'info',
      features: ['사용자 맞춤형 교육', '운영 매뉴얼 제공', '초기 운영 지원', '지속적인 기술 지원']
    }
  ];

  const getColorConfig = (color: string) => {
    const configs = {
      primary: {
        main: 'primary.main',
        light: 'primary.light',
        bg: 'primary.50'
      },
      success: {
        main: 'success.main',
        light: 'success.light',
        bg: 'success.50'
      },
      warning: {
        main: 'warning.main',
        light: 'warning.light',
        bg: 'warning.50'
      },
      info: {
        main: 'info.main',
        light: 'info.light',
        bg: 'info.50'
      }
    };
    return configs[color as keyof typeof configs] || configs.primary;
  };

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
              Main Services
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              주요 제공 서비스
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
              전문적이고 체계적인 4단계 서비스로 성공적인 SaaS 시스템 도입을 보장합니다
            </Typography>
          </Box>
        </motion.div>

        {/* 서비스 카드들 */}
        <Grid container spacing={4}>
          {services.map((service, index) => {
            const colorConfig = getColorConfig(service.color);
            const IconComponent = service.icon;

            return (
              <Grid key={service.id} size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial={{ opacity: 0, translateY: 50 }}
                  whileInView={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 30,
                    delay: index * 0.2
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
                        transform: 'translateY(-8px)',
                        borderColor: colorConfig.main
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      {/* 아이콘과 제목 */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                        <Box
                          sx={{
                            width: 70,
                            height: 70,
                            borderRadius: 3,
                            bgcolor: colorConfig.light,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 3,
                            flexShrink: 0
                          }}
                        >
                          <IconComponent size={32} color="white" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 700,
                              color: colorConfig.main,
                              mb: 1,
                              fontSize: { xs: '1.25rem', md: '1.5rem' }
                            }}
                          >
                            {service.title}
                          </Typography>
                          <Box
                            sx={{
                              width: 40,
                              height: 3,
                              bgcolor: colorConfig.main,
                              borderRadius: 1.5
                            }}
                          />
                        </Box>
                      </Box>

                      {/* 설명 */}
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.8,
                          fontSize: '1rem',
                          mb: 4
                        }}
                      >
                        {service.description}
                      </Typography>

                      {/* 기능 목록 */}
                      <Box sx={{ bgcolor: colorConfig.bg, borderRadius: 2, p: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            color: colorConfig.main
                          }}
                        >
                          주요 활동
                        </Typography>
                        <List sx={{ p: 0 }}>
                          {service.features.map((feature, featureIndex) => (
                            <ListItem key={featureIndex} sx={{ p: 0, mb: 1 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <TickCircle size={20} color={colorConfig.main} />
                              </ListItemIcon>
                              <ListItemText
                                primary={feature}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: {
                                    color: 'text.primary',
                                    fontWeight: 500
                                  }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* 프로세스 플로우 */}
        <motion.div
          initial={{ opacity: 0, translateY: 50 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 30, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <Box sx={{ mt: 8, p: 4, bgcolor: 'grey.50', borderRadius: 3 }}>
            <Typography
              variant="h4"
              sx={{
                textAlign: 'center',
                fontWeight: 700,
                mb: 4,
                color: 'text.primary'
              }}
            >
              서비스 프로세스 플로우
            </Typography>

            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              {services.map((service, index) => (
                <React.Fragment key={service.id}>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: getColorConfig(service.color).main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                          {index + 1}
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'text.primary'
                        }}
                      >
                        {service.title}
                      </Typography>
                    </Box>
                  </Grid>

                  {index < services.length - 1 && (
                    <Grid size={{ xs: 12, md: 0.3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: 'primary.main' }}>
                          →
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </React.Fragment>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
