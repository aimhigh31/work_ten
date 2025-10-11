import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, TextField, Popover, Stack, Divider } from '@mui/material';
import { ChevronUp, ChevronDown } from '@wandersonalwes/iconsax-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CustomDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [selectedTime, setSelectedTime] = useState({
    hour: value ? format(value, 'HH') : '09',
    minute: value ? format(value, 'mm') : '00'
  });
  const textFieldRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!disabled) {
      setAnchorEl(textFieldRef.current);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeChange = (type: 'hour' | 'minute', increment: number) => {
    if (type === 'hour') {
      let newHour = parseInt(selectedTime.hour) + increment;
      if (newHour < 0) newHour = 23;
      if (newHour > 23) newHour = 0;
      setSelectedTime({ ...selectedTime, hour: newHour.toString().padStart(2, '0') });
    } else {
      let newMinute = parseInt(selectedTime.minute) + increment;
      if (newMinute < 0) newMinute = 59;
      if (newMinute > 59) newMinute = 0;
      setSelectedTime({ ...selectedTime, minute: newMinute.toString().padStart(2, '0') });
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(parseInt(selectedTime.hour));
    newDate.setMinutes(parseInt(selectedTime.minute));
    onChange(newDate);
    handleClose();
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 첫 주의 빈 날짜 채우기
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const displayValue = value ? format(value, 'yyyy-MM-dd HH:mm', { locale: ko }) : '';

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setSelectedTime({
        hour: format(value, 'HH'),
        minute: format(value, 'mm')
      });
    }
  }, [value]);

  return (
    <>
      <TextField
        ref={textFieldRef}
        label={label}
        value={displayValue}
        onClick={handleClick}
        fullWidth
        InputProps={{
          readOnly: true
        }}
        disabled={disabled}
        error={error}
        helperText={helperText}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <Paper sx={{ p: 2, width: 320 }}>
          {/* 달력 헤더 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronUp size={20} style={{ transform: 'rotate(-90deg)' }} />
            </IconButton>
            <Typography variant="subtitle1" fontWeight="bold">
              {format(currentMonth, 'yyyy년 MM월')}
            </Typography>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronDown size={20} style={{ transform: 'rotate(-90deg)' }} />
            </IconButton>
          </Box>

          {/* 요일 헤더 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
            {weekDays.map((day, index) => (
              <Box key={day} sx={{ textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: index === 0 ? 'error.main' : index === 6 ? 'info.main' : 'text.secondary',
                    fontWeight: 'bold'
                  }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* 날짜 그리드 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {emptyDays.map((_, index) => (
              <Box key={`empty-${index}`} sx={{ height: 32 }} />
            ))}
            {monthDays.map((day) => {
              const dayOfWeek = getDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <Box
                  key={day.toString()}
                  onClick={() => handleDateSelect(day)}
                  sx={{
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: 1,
                    backgroundColor: isSelected ? 'primary.main' : isTodayDate ? 'primary.light' : 'transparent',
                    color: isSelected ? 'white' : dayOfWeek === 0 ? 'error.main' : dayOfWeek === 6 ? 'info.main' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isSelected ? 'primary.main' : 'action.hover'
                    }
                  }}
                >
                  <Typography variant="body2">{format(day, 'd')}</Typography>
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 시간 선택 */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Stack alignItems="center">
                <IconButton size="small" onClick={() => handleTimeChange('hour', 1)}>
                  <ChevronUp size={16} />
                </IconButton>
                <Typography variant="h5" sx={{ minWidth: 40, textAlign: 'center' }}>
                  {selectedTime.hour}
                </Typography>
                <IconButton size="small" onClick={() => handleTimeChange('hour', -1)}>
                  <ChevronDown size={16} />
                </IconButton>
              </Stack>
            </Box>

            <Typography variant="h5">:</Typography>

            <Box sx={{ flex: 1 }}>
              <Stack alignItems="center">
                <IconButton size="small" onClick={() => handleTimeChange('minute', 1)}>
                  <ChevronUp size={16} />
                </IconButton>
                <Typography variant="h5" sx={{ minWidth: 40, textAlign: 'center' }}>
                  {selectedTime.minute}
                </Typography>
                <IconButton size="small" onClick={() => handleTimeChange('minute', -1)}>
                  <ChevronDown size={16} />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ flex: 1.5 }}>
              <Button variant="outlined" size="small" fullWidth onClick={handleToday}>
                오늘
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button fullWidth variant="outlined" onClick={handleClose}>
              취소
            </Button>
            <Button fullWidth variant="contained" onClick={handleConfirm}>
              확인
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default CustomDateTimePicker;
