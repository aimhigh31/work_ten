'use client';

import { useState, ChangeEvent } from 'react';

// material-ui
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import MainCard from 'components/MainCard';

// assets
import { Add, SearchNormal1, Filter, User, Calendar, Flag } from '@wandersonalwes/iconsax-react';

// types
import { KanbanProfile } from 'types/kanban';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

interface BoardHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  assigneeFilter: string[];
  onAssigneeFilterChange: (assignees: string[]) => void;
  priorityFilter: string[];
  onPriorityFilterChange: (priorities: string[]) => void;
  profiles: KanbanProfile[];
  onAddTask: () => void;
}

const priorities = [
  { value: 'high', label: '높음', color: '#f44336' },
  { value: 'medium', label: '보통', color: '#ff9800' },
  { value: 'low', label: '낮음', color: '#2196f3' }
];

// ==============================|| KANBAN BOARD - HEADER ||============================== //

export default function BoardHeader({
  searchValue,
  onSearchChange,
  assigneeFilter,
  onAssigneeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  profiles,
  onAddTask
}: BoardHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleAssigneeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onAssigneeFilterChange(typeof value === 'string' ? value.split(',') : value);
  };

  const handlePriorityChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onPriorityFilterChange(typeof value === 'string' ? value.split(',') : value);
  };

  const clearFilters = () => {
    onAssigneeFilterChange([]);
    onPriorityFilterChange([]);
    onSearchChange('');
  };

  const hasActiveFilters = assigneeFilter.length > 0 || priorityFilter.length > 0 || searchValue;

  return (
    <MainCard content={false} sx={{ mb: 3 }}>
      <Box sx={{ p: 3 }}>
        {/* 상단 섹션: 제목과 액션 버튼들 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4" component="h1">
            📋 프로젝트 보드
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Filter />}
              onClick={() => setShowFilters(!showFilters)}
              color={hasActiveFilters ? 'primary' : 'secondary'}
            >
              필터 {hasActiveFilters && `(${assigneeFilter.length + priorityFilter.length})`}
            </Button>

            <Button variant="contained" startIcon={<Add />} onClick={onAddTask} sx={{ minWidth: 120 }}>
              새 태스크
            </Button>
          </Stack>
        </Stack>

        {/* 검색바 */}
        <TextField
          fullWidth
          placeholder="태스크 제목이나 설명으로 검색..."
          value={searchValue}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchNormal1 size={20} />
              </InputAdornment>
            )
          }}
          sx={{ mb: showFilters ? 2 : 0 }}
        />

        {/* 필터 섹션 */}
        {showFilters && (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* 담당자 필터 */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="assignee-filter-label">담당자</InputLabel>
                <Select
                  labelId="assignee-filter-label"
                  multiple
                  value={assigneeFilter}
                  onChange={handleAssigneeChange}
                  input={<OutlinedInput label="담당자" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const profile = profiles.find((p) => p.id === value);
                        return (
                          <Chip
                            key={value}
                            label={profile?.name || value}
                            size="small"
                            onDelete={() => {
                              onAssigneeFilterChange(assigneeFilter.filter((id) => id !== value));
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {profiles.map((profile) => (
                    <MenuItem key={profile.id} value={profile.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <User size={16} />
                        <Typography>{profile.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 우선순위 필터 */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="priority-filter-label">우선순위</InputLabel>
                <Select
                  labelId="priority-filter-label"
                  multiple
                  value={priorityFilter}
                  onChange={handlePriorityChange}
                  input={<OutlinedInput label="우선순위" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const priority = priorities.find((p) => p.value === value);
                        return (
                          <Chip
                            key={value}
                            label={priority?.label || value}
                            size="small"
                            sx={{ color: priority?.color }}
                            onDelete={() => {
                              onPriorityFilterChange(priorityFilter.filter((p) => p !== value));
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Flag size={16} color={priority.color} />
                        <Typography>{priority.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 필터 초기화 버튼 */}
              {hasActiveFilters && (
                <Button variant="outlined" color="secondary" onClick={clearFilters} sx={{ minWidth: 100 }}>
                  초기화
                </Button>
              )}
            </Stack>

            {/* 활성 필터 요약 */}
            {hasActiveFilters && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  활성 필터:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {searchValue && (
                    <Chip label={`검색: "${searchValue}"`} size="small" variant="outlined" onDelete={() => onSearchChange('')} />
                  )}
                  {assigneeFilter.map((assigneeId) => {
                    const profile = profiles.find((p) => p.id === assigneeId);
                    return (
                      <Chip
                        key={assigneeId}
                        label={`담당자: ${profile?.name || assigneeId}`}
                        size="small"
                        variant="outlined"
                        onDelete={() => {
                          onAssigneeFilterChange(assigneeFilter.filter((id) => id !== assigneeId));
                        }}
                      />
                    );
                  })}
                  {priorityFilter.map((priority) => {
                    const priorityObj = priorities.find((p) => p.value === priority);
                    return (
                      <Chip
                        key={priority}
                        label={`우선순위: ${priorityObj?.label || priority}`}
                        size="small"
                        variant="outlined"
                        onDelete={() => {
                          onPriorityFilterChange(priorityFilter.filter((p) => p !== priority));
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </MainCard>
  );
}
