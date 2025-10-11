'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  IconButton,
  Divider
} from '@mui/material';
import { CloseCircle, Sms, CallCalling, LocationTick, Link21 } from '@wandersonalwes/iconsax-react';

interface Employee {
  id: number;
  name: string;
  role: string;
  team: string;
  department: string;
  joinDate: string;
  position: string;
}

interface EmployeeDetailDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const EmployeeDetailDialog: React.FC<EmployeeDetailDialogProps> = ({ open, onClose, employee }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!employee) return null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 샘플 데이터 (실제로는 API에서 가져올 데이터)
  const employeeDetails = {
    status: 'Complicated',
    profileImage: employee.name.charAt(0),
    stats: {
      education: 42,
      certificates: 42,
      exhibitions: 7
    },
    contact: {
      email: 'varbanev@gmail.com',
      phone: '+1 (809) 328-4377',
      location: 'Latvia',
      portfolio: 'https://anshan.dh.url'
    },
    aboutMe:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
    skills: [
      'Adobe XD',
      'Angular',
      'Corel Draw',
      'Figma',
      'HTML',
      'Illustrator',
      'Javascript',
      'Logo Design',
      'Material UI',
      'NodeJS',
      'npm',
      'Photoshop',
      'React',
      'Reduxjs & toolkit',
      'SASS'
    ]
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '600px'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ minHeight: '600px' }}>
          {/* 왼쪽 섹션 */}
          <Grid item xs={12} md={5} sx={{ bgcolor: 'grey.50', p: 4, position: 'relative' }}>
            {/* 닫기 버튼 */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'white',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              <CloseCircle size={20} />
            </IconButton>

            {/* 상태 */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {employeeDetails.status}
              </Typography>

              {/* 프로필 아바타 */}
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: '#ff6b6b',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  mx: 'auto',
                  mb: 2
                }}
              >
                {employeeDetails.profileImage}
              </Avatar>

              {/* 이름과 직책 */}
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {employee.name} {employee.role}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {employee.team} {employee.department}
              </Typography>
            </Box>

            {/* 통계 카드들 */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={4}>
                <Card sx={{ textAlign: 'center', py: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {employeeDetails.stats.education}건
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      교육 이수
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ textAlign: 'center', py: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {employeeDetails.stats.certificates}건
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      자격 취득
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ textAlign: 'center', py: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {employeeDetails.stats.exhibitions}건
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      전시회 참여
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 연락처 정보 */}
            <Box sx={{ space: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Sms size={20} color="#666" />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Email
                </Typography>
                <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 500 }}>
                  {employeeDetails.contact.email}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CallCalling size={20} color="#666" />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Phone
                </Typography>
                <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 500 }}>
                  {employeeDetails.contact.phone}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationTick size={20} color="#666" />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Location
                </Typography>
                <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 500 }}>
                  {employeeDetails.contact.location}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Link21 size={20} color="#666" />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Portfolio
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    ml: 'auto',
                    fontWeight: 500,
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {employeeDetails.contact.portfolio}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* 오른쪽 섹션 */}
          <Grid item xs={12} md={7} sx={{ p: 4 }}>
            {/* 탭 헤더 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="About Me" />
                <Tab label="Skill" />
              </Tabs>
            </Box>

            {/* 탭 컨텐츠 */}
            <Box>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                    {employeeDetails.aboutMe}
                  </Typography>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {employeeDetails.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        variant="outlined"
                        sx={{
                          mb: 1,
                          '&:hover': {
                            bgcolor: 'primary.light',
                            color: 'white',
                            borderColor: 'primary.main'
                          }
                        }}
                      />
                    ))}
                    <Chip
                      label="Add Skills"
                      variant="outlined"
                      sx={{
                        mb: 1,
                        color: 'text.secondary',
                        borderColor: 'grey.300',
                        borderStyle: 'dashed'
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailDialog;
