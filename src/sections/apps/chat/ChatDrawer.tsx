import { useState, ChangeEvent } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import ConversationList, { ConversationData } from './ConversationList';
import MainCard from 'components/MainCard';
import SimpleBar from 'components/third-party/SimpleBar';
import { ThemeMode } from 'config';

// types
import { UserProfile } from 'types/user-profile';

// assets
import { Add, SearchNormal1 } from '@wandersonalwes/iconsax-react';

interface ChatDrawerProps {
  handleDrawerOpen: () => void;
  openChatDrawer: boolean | undefined;
  setUser: (u: UserProfile) => void;
  selectedUser: string | null;
  conversations: ConversationData[];
  onAddConversation: (conversation: ConversationData) => void;
  onConversationSelect?: (conversation: ConversationData) => void;
}

// ==============================|| CHAT - DRAWER ||============================== //

export default function ChatDrawer({
  handleDrawerOpen,
  openChatDrawer,
  setUser,
  selectedUser,
  conversations,
  onAddConversation,
  onConversationSelect
}: ChatDrawerProps) {
  const theme = useTheme();
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const [search, setSearch] = useState<string | undefined>('');
  const handleSearch = async (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined) => {
    const newString = event?.target.value;
    setSearch(newString);
  };

  const handleNewChat = () => {
    const now = new Date();
    const newConversation: ConversationData = {
      id: `new-${Date.now()}`,
      title: `새 대화 ${now.getMonth() + 1}/${now.getDate()}`,
      lastModified: `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`,
      lastMessage: '새로운 AI 대화를 시작해보세요...',
      unread: false
    };

    onAddConversation(newConversation);

    // 새 대화를 선택된 상태로 설정
    const aiUser = {
      id: newConversation.id,
      name: newConversation.title,
      status: newConversation.lastMessage,
      lastMessage: newConversation.lastModified,
      avatar: 'ai-avatar.png',
      online_status: 'available'
    };
    setUser(aiUser);
    onConversationSelect?.(newConversation);
  };

  return (
    <Drawer
      sx={(theme) => ({
        width: 320,
        flexShrink: 0,
        display: { xs: openChatDrawer ? 'block' : 'none', lg: 'block' },
        zIndex: { xs: openChatDrawer ? 1300 : -1, lg: 0 },
        '& .MuiDrawer-paper': {
          height: '100%',
          width: 320,
          boxSizing: 'border-box',
          position: { xs: 'fixed', lg: 'relative' },
          border: 'none',
          [theme.breakpoints.up('md')]: {
            borderRadius: '12px 0 0 12px'
          }
        }
      })}
      variant={downLG ? 'temporary' : 'persistent'}
      anchor="left"
      open={openChatDrawer}
      ModalProps={{ keepMounted: true }}
      onClose={handleDrawerOpen}
    >
      <MainCard
        sx={{ borderRadius: '12px 0 0 12px', borderRight: 'none', height: '100%', '& div:nth-of-type(2)': { height: 'auto' } }}
        border={!downLG}
        content={false}
      >
        <Box sx={{ p: 3, pb: 1 }}>
          <Stack sx={{ gap: 2 }}>
            <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
              <Typography variant="h5" color="inherit">
                AI 대화
              </Typography>
              <Chip
                label={conversations.length}
                color={theme.palette.mode === ThemeMode.DARK ? 'default' : 'secondary'}
                sx={{ minWidth: 40, height: 20, borderRadius: '10px', '& .MuiChip-label': { px: 1 } }}
              />
            </Stack>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNewChat}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              새 채팅
            </Button>

            <OutlinedInput
              fullWidth
              id="input-search-header"
              placeholder="Search"
              value={search}
              onChange={handleSearch}
              sx={{ '& .MuiOutlinedInput-input': { p: '10.5px 0px 12px' } }}
              startAdornment={
                <InputAdornment position="start">
                  <SearchNormal1 style={{ fontSize: 'small' }} />
                </InputAdornment>
              }
            />
          </Stack>
        </Box>

        <SimpleBar
          sx={{
            overflowX: 'hidden',
            height: { xs: 'calc(100vh - 360px)', md: 'calc(100vh - 460px)' },
            minHeight: { xs: 200, md: 300 },
            maxHeight: { xs: 'calc(100vh - 360px)', md: 'calc(100vh - 460px)' }
          }}
        >
          <Box sx={{ p: 3, pt: 0 }}>
            <ConversationList
              setUser={setUser}
              search={search}
              selectedUser={selectedUser}
              conversations={conversations}
              onConversationSelect={onConversationSelect}
            />
          </Box>
        </SimpleBar>
      </MainCard>
    </Drawer>
  );
}
