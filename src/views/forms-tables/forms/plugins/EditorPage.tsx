'use client';

import { useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid2';

// project imports
import ReactQuill from 'components/third-party/ReactQuill';
import MainCard from 'components/MainCard';
import ReactDraft from 'sections/forms/plugins/ReactDraft';
import { ThemeDirection } from 'config';

// ==============================|| PLUGINS - EDITOR ||============================== //

export default function Editor() {
  const [text, setText] = useState(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
  );

  const handleChange = (value: string) => {
    setText(value);
  };

  return (
    <Grid container spacing={3}>
      <Grid
        sx={(theme) => ({
          '& .rdw-editor-wrapper': {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'secondary.light',
            borderRadius: '4px',
            overflow: 'visible',
            '& .rdw-editor-main': {
              px: 2,
              py: 0.5,
              border: 'none'
            },
            '& .rdw-editor-toolbar': {
              pt: 1.25,
              border: 'none',
              borderBottom: '1px solid',
              borderColor: 'secondary.light',
              bgcolor: 'secondary.lighter',
              ...theme.applyStyles('dark', { bgcolor: 'background.default' }),
              color: 'text.primary',
              ...theme.applyStyles('dark', { color: 'secondary.lighter' }),
              '& .rdw-option-wrapper': {
                bgcolor: 'secondary.light',
                borderColor: 'divider'
              },
              '& .rdw-dropdown-wrapper': {
                bgcolor: 'secondary.light',
                borderColor: 'divider'
              }
            },
            ...(theme.direction === ThemeDirection.RTL && {
              '& .rdw-dropdown-carettoopen': {
                right: '10%',
                left: 'inherit'
              },
              '& .rdw-dropdown-carettoclose': {
                right: '10%',
                left: 'inherit'
              }
            }),
            ...theme.applyStyles('dark', {
              '& .rdw-link-modal-btn': { color: 'common.black' },
              '& .rdw-image-modal-btn': { color: 'common.black' },
              '& .rdw-embedded-modal-btn': { color: 'common.black' }
            })
          }
        })}
        size={12}
      >
        <MainCard title="React Draft" sx={{ overflow: 'visible', '& .rdw-editor-wrapper': { overflow: 'visible' } }}>
          <ReactDraft />
        </MainCard>
      </Grid>
      <Grid size={12}>
        <MainCard title="React Quill">
          <ReactQuill value={text} onChange={handleChange} />
        </MainCard>
      </Grid>
    </Grid>
  );
}
