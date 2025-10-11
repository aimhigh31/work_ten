'use client';

// material-ui
import Box from '@mui/material/Box';

// third-party
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// project imports
import { ThemeDirection } from 'config';

interface Props {
  value?: string;
  editorMinHeight?: number;
  onChange?: (value: string) => void;
}

// ==============================|| QUILL EDITOR ||============================== //

export default function ReactQuillDemo({ value, editorMinHeight = 135, onChange }: Props) {
  return (
    <Box
      sx={(theme) => ({
        '& .quill': {
          bgcolor: 'background.paper',
          ...theme.applyStyles('dark', { bgcolor: 'secondary.main' }),
          borderRadius: '4px',
          '& .ql-toolbar': {
            bgcolor: 'secondary.100',
            ...theme.applyStyles('dark', { bgcolor: 'secondary.light' }),
            borderColor: 'divider',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          },
          '& .ql-container': {
            bgcolor: 'transparent',
            ...theme.applyStyles('dark', { bgcolor: 'background.default' }),
            borderColor: `${theme.palette.secondary.light} !important`,
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            '& .ql-editor': { minHeight: editorMinHeight }
          },
          ...(theme.direction === ThemeDirection.RTL && {
            '& .ql-snow .ql-picker:not(.ql-color-picker):not(.ql-icon-picker) svg': {
              right: '0%',
              left: 'inherit'
            }
          })
        }
      })}
    >
      <ReactQuill {...(value && { value })} {...(onChange && { onChange })} />
    </Box>
  );
}
