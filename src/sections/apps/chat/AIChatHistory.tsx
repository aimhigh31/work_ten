import { useEffect, useRef } from 'react';

// material-ui
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import ChatMessageAction from './ChatMessageAction';
import IconButton from 'components/@extended/IconButton';

// assets
import { Edit, Message, DocumentDownload } from '@wandersonalwes/iconsax-react';

interface Message {
  id: number;
  from: string;
  to: string;
  text: string;
  time: string;
  imageUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface AIChatHistoryProps {
  messages: Message[];
  conversationTitle: string;
}

// ==============================|| AI CHAT - HISTORY ||============================== //

export default function AIChatHistory({ messages = [], conversationTitle }: AIChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <Grid container spacing={2.5} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Grid size={12} sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              opacity: 0.6
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                color: 'primary.main'
              }}
            >
              <Message size={32} />
            </Box>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              새로운 AI 대화를 시작해보세요
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              메시지를 입력하여 {conversationTitle}와 대화를 시작할 수 있습니다.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {messages.map((message, index) => (
        <Grid key={message.id} size={12}>
          {message.from === 'User1' ? (
            // 사용자 메시지 (오른쪽)
            <Stack direction="row" sx={{ gap: 1.25, alignItems: 'flex-start' }}>
              <Grid container size={12} sx={{ justifyContent: 'flex-end' }}>
                <Grid size={{ xs: 2, md: 3, xl: 4 }} />

                <Grid size={{ xs: 10, md: 9, xl: 8 }}>
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                    <ChatMessageAction index={index} />
                    <IconButton size="small" color="secondary">
                      <Edit />
                    </IconButton>
                    <Card
                      sx={{
                        display: 'inline-block',
                        float: 'right',
                        bgcolor: 'primary.main',
                        boxShadow: 'none',
                        ml: 1
                      }}
                    >
                      <CardContent sx={{ p: 1, pb: '8px !important', width: 'fit-content', ml: 'auto' }}>
                        {message.fileType === 'image' && message.imageUrl ? (
                          <Box>
                            <img
                              src={message.imageUrl}
                              alt={message.fileName}
                              style={{
                                maxWidth: '200px',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                              onClick={() => window.open(message.imageUrl, '_blank')}
                            />
                            <Typography
                              variant="caption"
                              sx={(theme) => ({
                                display: 'block',
                                mt: 0.5,
                                color: 'background.default',
                                ...theme.applyStyles('dark', { color: 'text.primary' })
                              })}
                            >
                              {message.fileName}
                            </Typography>
                          </Box>
                        ) : message.fileType === 'file' ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                          >
                            <DocumentDownload size={16} />
                            <Box>
                              <Typography
                                variant="h6"
                                sx={(theme) => ({
                                  color: 'background.default',
                                  ...theme.applyStyles('dark', { color: 'text.primary' })
                                })}
                              >
                                {message.fileName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={(theme) => ({
                                  color: 'background.default',
                                  opacity: 0.7,
                                  ...theme.applyStyles('dark', { color: 'text.primary' })
                                })}
                              >
                                {message.fileSize ? `${Math.round(message.fileSize / 1024)} KB` : ''}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography
                            variant="h6"
                            sx={(theme) => ({
                              overflowWrap: 'anywhere',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.6,
                              color: 'background.default',
                              ...theme.applyStyles('dark', { color: 'text.primary' })
                            })}
                          >
                            {message.text}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
                <Grid sx={{ mt: 1 }} size={12}>
                  <Typography align="right" variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    {message.time}
                  </Typography>
                </Grid>
              </Grid>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'success.lighter',
                  color: 'success.main',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                U
              </Box>
            </Stack>
          ) : (
            // AI 메시지 (왼쪽)
            <Stack direction="row" sx={{ gap: 1.25, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main'
                }}
              >
                <Message size={16} />
              </Box>

              <Grid container size={12}>
                <Grid size={{ xs: 12, sm: 9, md: 8 }}>
                  <Card
                    sx={{
                      display: 'inline-block',
                      float: 'left',
                      bgcolor: 'background.paper',
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <CardContent sx={{ p: 1, pb: '8px !important' }}>
                      {message.fileType === 'image' && message.imageUrl ? (
                        <Box>
                          <img
                            src={message.imageUrl}
                            alt={message.fileName}
                            style={{
                              maxWidth: '200px',
                              maxHeight: '200px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(message.imageUrl, '_blank')}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              color: 'text.secondary'
                            }}
                          >
                            {message.fileName}
                          </Typography>
                        </Box>
                      ) : message.fileType === 'file' ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                        >
                          <DocumentDownload size={16} />
                          <Box>
                            <Typography variant="h6" sx={{ color: 'text.primary' }}>
                              {message.fileName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {message.fileSize ? `${Math.round(message.fileSize / 1024)} KB` : ''}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'text.primary',
                            overflowWrap: 'anywhere',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6
                          }}
                        >
                          {message.text}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid sx={{ mt: 1 }} size={12}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    {message.time}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </Grid>
      ))}
      <Grid ref={bottomRef} />
    </Grid>
  );
}
