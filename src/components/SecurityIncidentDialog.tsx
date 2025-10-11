import React, { useState, useCallback, useMemo, useReducer, memo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import { SecurityIncidentRecord } from '../types/security-incident';

// 상태 관리를 위한 reducer
interface EditSecurityIncidentState {
  mainContent: string;
  responseAction: string;
  description: string;
  incidentType: string;
  status: string;
  startDate: string;
  completedDate: string;
  team: string;
  assignee: string;
  registrationDate: string;
  code: string;
}

type EditSecurityIncidentAction =
  | { type: 'SET_FIELD'; field: keyof EditSecurityIncidentState; value: string }
  | { type: 'RESET'; payload: EditSecurityIncidentState };

const editSecurityIncidentReducer = (state: EditSecurityIncidentState, action: EditSecurityIncidentAction): EditSecurityIncidentState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return action.payload;
    default:
      return state;
  }
};

interface SecurityIncidentDialogProps {
  open: boolean;
  onClose: () => void;
  incident: SecurityIncidentRecord | null;
  onSave: (updatedIncident: SecurityIncidentRecord) => void;
  assignees: string[];
  teams: string[];
  incidentTypes: string[];
  statusOptions: string[];
}

const SecurityIncidentDialog: React.FC<SecurityIncidentDialogProps> = memo(
  ({ open, onClose, incident, onSave, assignees = [], teams = [], incidentTypes = [], statusOptions = [] }) => {
    const initialState: EditSecurityIncidentState = useMemo(
      () => ({
        mainContent: incident?.mainContent || '',
        responseAction: incident?.responseAction || '',
        description: incident?.description || '',
        incidentType: incident?.incidentType || '',
        status: incident?.status || '대기',
        startDate: incident?.startDate || new Date().toISOString().split('T')[0],
        completedDate: incident?.completedDate || '',
        team: incident?.team || '',
        assignee: incident?.assignee || '',
        registrationDate: incident?.registrationDate || new Date().toISOString().split('T')[0],
        code: incident?.code || ''
      }),
      [incident]
    );

    const [state, dispatch] = useReducer(editSecurityIncidentReducer, initialState);

    // incident가 변경될 때마다 상태 리셋
    useEffect(() => {
      dispatch({ type: 'RESET', payload: initialState });
    }, [initialState]);

    const handleFieldChange = useCallback((field: keyof EditSecurityIncidentState, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []);

    const handleSave = useCallback(() => {
      if (!incident) return;

      const updatedIncident: SecurityIncidentRecord = {
        ...incident,
        mainContent: state.mainContent,
        responseAction: state.responseAction,
        description: state.description,
        incidentType: state.incidentType as any,
        status: state.status as any,
        startDate: state.startDate,
        completedDate: state.completedDate,
        team: state.team,
        assignee: state.assignee,
        registrationDate: state.registrationDate,
        code: state.code
      };

      onSave(updatedIncident);
    }, [incident, state, onSave]);

    const isFormValid = useMemo(() => {
      return state.mainContent.trim() !== '' && state.incidentType.trim() !== '' && state.status.trim() !== '';
    }, [state.mainContent, state.incidentType, state.status]);

    if (!incident) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" component="div" fontWeight={600}>
            {incident.isNew ? '새 보안사고 등록' : '보안사고 수정'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Box component="form" noValidate>
            <Grid container spacing={3}>
              {/* 사고내용 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="사고내용"
                  multiline
                  rows={4}
                  value={state.mainContent}
                  onChange={(e) => handleFieldChange('mainContent', e.target.value)}
                  required
                  error={!state.mainContent.trim()}
                  helperText={!state.mainContent.trim() ? '사고내용을 입력해주세요.' : ''}
                  placeholder="발생한 보안사고의 상세 내용을 입력하세요..."
                />
              </Grid>

              {/* 대응조치 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="대응조치"
                  multiline
                  rows={3}
                  value={state.responseAction}
                  onChange={(e) => handleFieldChange('responseAction', e.target.value)}
                  placeholder="취한 대응조치나 계획된 조치를 입력하세요..."
                />
              </Grid>

              {/* 세부설명 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="세부설명"
                  multiline
                  rows={3}
                  value={state.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="추가적인 세부 설명이나 특이사항을 입력하세요..."
                />
              </Grid>

              {/* 사고유형 - 상태 */}
              <Grid item xs={6}>
                <FormControl fullWidth required error={!state.incidentType.trim()}>
                  <InputLabel>사고유형</InputLabel>
                  <Select value={state.incidentType} onChange={(e) => handleFieldChange('incidentType', e.target.value)} label="사고유형">
                    {incidentTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>상태</InputLabel>
                  <Select value={state.status} onChange={(e) => handleFieldChange('status', e.target.value)} label="상태">
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 시작일 - 완료일 */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="시작일"
                  type="date"
                  value={state.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="완료일"
                  type="date"
                  value={state.completedDate}
                  onChange={(e) => handleFieldChange('completedDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* 팀 - 담당자 */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>팀</InputLabel>
                  <Select value={state.team} onChange={(e) => handleFieldChange('team', e.target.value)} label="팀">
                    {teams.map((team) => (
                      <MenuItem key={team} value={team}>
                        {team}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>담당자</InputLabel>
                  <Select value={state.assignee} onChange={(e) => handleFieldChange('assignee', e.target.value)} label="담당자">
                    {assignees.map((assignee) => (
                      <MenuItem key={assignee} value={assignee}>
                        {assignee}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 등록일 - 코드 */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="등록일"
                  type="date"
                  value={state.registrationDate}
                  onChange={(e) => handleFieldChange('registrationDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="코드"
                  value={state.code}
                  onChange={(e) => handleFieldChange('code', e.target.value)}
                  placeholder="예: SEC-ACC-25-001"
                />
              </Grid>
            </Grid>

            {!isFormValid && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                사고내용, 사고유형, 상태는 필수 입력 항목입니다.
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            취소
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!isFormValid} sx={{ minWidth: 80 }}>
            {incident.isNew ? '등록' : '수정'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

SecurityIncidentDialog.displayName = 'SecurityIncidentDialog';

export default SecurityIncidentDialog;
