'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// material-ui
import { styled, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid2';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import EmojiPicker, { SkinTones, EmojiClickData } from 'emoji-picker-react';

// project-imports
import CircularWithPath from 'components/@extended/progress/CircularWithPath';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';
import MainCard from 'components/MainCard';
import SimpleBar from 'components/third-party/SimpleBar';

import ChatDrawer from 'sections/apps/chat/ChatDrawer';
import ChatHeader from 'sections/apps/chat/ChatHeader';
import AIChatHistory from 'sections/apps/chat/AIChatHistory';
import { ConversationData } from 'sections/apps/chat/ConversationList';

import { insertChat, useGetUsers } from 'api/chat';
import { sendMessageToAI, convertMessagesToAIFormat } from 'api/ai-chat';
import { openSnackbar } from 'api/snackbar';
import incrementer from 'utils/incrementer';

// assets
import { EmojiHappy, Image as ImageIcon, Paperclip, Send, Trash } from '@wandersonalwes/iconsax-react';

// types
import { SnackbarProps } from 'types/snackbar';
import { UserProfile } from 'types/user-profile';

const drawerWidth = 320;

const Main = styled('main', { shouldForwardProp: (prop: string) => prop !== 'open' })<{ open: boolean }>(({ theme }) => ({
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.shorter
  }),
  marginLeft: `-${drawerWidth}px`,
  [theme.breakpoints.down('lg')]: {
    paddingLeft: 0,
    marginLeft: 0
  },
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.shorter
        }),
        marginLeft: 0
      }
    }
  ]
}));

// ==============================|| APPLICATION - CHAT ||============================== //

// Mock data for AI conversations
const initialConversations: ConversationData[] = [
  {
    id: '1',
    title: 'AI 코드 리뷰 도움',
    lastModified: '2024.12.20',
    lastMessage: 'React 컴포넌트 최적화에 대해 문의...',
    unread: true
  },
  {
    id: '2',
    title: '프로젝트 기획 논의',
    lastModified: '2024.12.19',
    lastMessage: '사용자 요구사항 분석 방법에 대해...',
    unread: false
  },
  {
    id: '3',
    title: '데이터베이스 설계 상담',
    lastModified: '2024.12.18',
    lastMessage: 'ERD 작성 시 고려해야 할 사항들...',
    unread: false
  },
  {
    id: '4',
    title: 'UI/UX 개선 아이디어',
    lastModified: '2024.12.17',
    lastMessage: '사용자 경험 향상을 위한 제안사항...',
    unread: true
  },
  {
    id: '5',
    title: '성능 최적화 방안',
    lastModified: '2024.12.16',
    lastMessage: '웹 애플리케이션 로딩 속도 개선...',
    unread: false
  }
];

export default function Chat() {
  const { usersLoading, users } = useGetUsers();

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const [user, setUser] = useState<UserProfile>({});
  const [conversations, setConversations] = useState<ConversationData[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | null>(null);
  const [anchorEl, setAnchorEl] = useState<Element | (() => Element) | null | undefined>(null);

  // 각 대화별 메시지 히스토리 관리
  const [conversationMessages, setConversationMessages] = useState<{ [key: string]: any[] }>({
    '1': [
      {
        id: 1,
        from: 'AI 코드 리뷰 도움',
        to: 'User1',
        text: '안녕하세요! 코드 리뷰에 대해 어떤 도움이 필요하신가요?',
        time: '10:30',
        isInitial: true
      }
    ],
    '2': [
      {
        id: 1,
        from: '프로젝트 기획 논의',
        to: 'User1',
        text: '프로젝트 기획과 관련해서 궁금한 점이 있으시면 언제든 물어보세요.',
        time: '09:15',
        isInitial: true
      }
    ],
    '3': [
      {
        id: 1,
        from: '데이터베이스 설계 상담',
        to: 'User1',
        text: 'ERD 작성과 데이터베이스 설계에 대해 도움을 드릴 수 있습니다.',
        time: '14:20',
        isInitial: true
      }
    ],
    '4': [
      {
        id: 1,
        from: 'UI/UX 개선 아이디어',
        to: 'User1',
        text: '사용자 경험 향상을 위한 아이디어를 함께 논의해봅시다.',
        time: '16:45',
        isInitial: true
      }
    ],
    '5': [
      {
        id: 1,
        from: '성능 최적화 방안',
        to: 'User1',
        text: '웹 애플리케이션 성능 최적화에 대해 상담해드리겠습니다.',
        time: '11:30',
        isInitial: true
      }
    ]
  });

  useEffect(() => {
    // AI 대화 기본 설정 - 첫 번째 대화를 기본으로 선택
    const defaultConversation = initialConversations[0];
    const defaultAIUser = {
      id: defaultConversation.id,
      name: defaultConversation.title,
      status: defaultConversation.lastMessage,
      lastMessage: defaultConversation.lastModified,
      avatar: 'ai-avatar.png',
      online_status: 'available'
    };
    setUser(defaultAIUser);
    setSelectedConversation(defaultConversation);
  }, []);

  const handleClickSort = (event: React.MouseEvent<HTMLButtonElement> | undefined) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleCloseSort = () => {
    setAnchorEl(null);
  };

  // Delete 기능
  const handleDelete = () => {
    if (selectedConversation) {
      // 대화 삭제
      setConversations((prev) => prev.filter((conv) => conv.id !== selectedConversation.id));

      // 메시지 히스토리도 삭제
      setConversationMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[selectedConversation.id];
        return newMessages;
      });

      // 남은 대화가 있으면 첫 번째 대화 선택, 없으면 null
      const remainingConversations = conversations.filter((conv) => conv.id !== selectedConversation.id);
      if (remainingConversations.length > 0) {
        const newSelected = remainingConversations[0];
        setSelectedConversation(newSelected);
        setUser({
          id: newSelected.id,
          name: newSelected.title,
          status: newSelected.lastMessage,
          lastMessage: newSelected.lastModified,
          avatar: 'ai-avatar.png',
          online_status: 'available'
        });
      } else {
        setSelectedConversation(null);
        setUser({});
      }
    }
    handleCloseSort();
  };

  const handleAddConversation = (newConversation: ConversationData) => {
    setConversations((prev) => [newConversation, ...prev]);
    // 새 대화에 대한 초기 메시지 추가 (AI 인사말)
    setConversationMessages((prev) => ({
      ...prev,
      [newConversation.id]: [
        {
          id: 1,
          from: newConversation.title,
          to: 'User1',
          text: `안녕하세요! ${newConversation.title}에 대해 도움을 드릴 준비가 되었습니다. 궁금한 점이나 도움이 필요한 내용을 언제든 말씀해 주세요.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isInitial: true
        }
      ]
    }));
  };

  const handleConversationSelect = (conversation: ConversationData) => {
    setSelectedConversation(conversation);
  };

  const [openChatDrawer, setOpenChatDrawer] = useState(true);
  const handleDrawerOpen = () => {
    setOpenChatDrawer((prevState) => !prevState);
  };

  const [anchorElEmoji, setAnchorElEmoji] = useState<any>(); /** No single type can cater for all elements */

  const handleOnEmojiButtonClick = (event: React.MouseEvent<HTMLButtonElement> | undefined) => {
    setAnchorElEmoji(anchorElEmoji ? null : event?.currentTarget);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && selectedConversation) {
      const file = files[0];
      const d = new Date();
      const fileMessage = {
        id: Date.now(),
        from: 'User1',
        to: selectedConversation.title,
        text: `[파일] ${file.name}`,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileName: file.name,
        fileType: 'file',
        fileSize: file.size
      };

      // 선택된 대화의 메시지 히스토리에 추가
      setConversationMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [...(prev[selectedConversation.id] || []), fileMessage]
      }));

      // 대화 목록의 마지막 메시지 업데이트
      setConversations((prev) =>
        prev.map((conv) => (conv.id === selectedConversation.id ? { ...conv, lastMessage: `[파일] ${file.name}` } : conv))
      );

      // 파일 입력 초기화
      event.target.value = '';
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && selectedConversation) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // 이미지 파일을 Base64로 변환
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target?.result as string;
          const d = new Date();
          const imageMessage = {
            id: Date.now(),
            from: 'User1',
            to: selectedConversation.title,
            text: `[이미지] ${file.name}`,
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            imageUrl: imageDataUrl,
            fileName: file.name,
            fileType: 'image'
          };

          // 선택된 대화의 메시지 히스토리에 추가
          setConversationMessages((prev) => ({
            ...prev,
            [selectedConversation.id]: [...(prev[selectedConversation.id] || []), imageMessage]
          }));

          // 대화 목록의 마지막 메시지 업데이트
          setConversations((prev) =>
            prev.map((conv) => (conv.id === selectedConversation.id ? { ...conv, lastMessage: `[이미지] ${file.name}` } : conv))
          );
        };
        reader.readAsDataURL(file);
      }

      // 파일 입력 초기화
      event.target.value = '';
    }
  };

  // handle new message form
  const [message, setMessage] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);
  const textInput = useRef(null);

  const handleOnSend = async () => {
    if (message.trim() === '') {
      openSnackbar({
        open: true,
        message: 'Message required',
        variant: 'alert',
        alert: {
          color: 'error'
        }
      } as SnackbarProps);
      return;
    }

    if (!selectedConversation) return;

    const d = new Date();
    const userMessage = {
      id: Date.now(),
      from: 'User1',
      to: selectedConversation.title,
      text: message,
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 사용자 메시지를 즉시 히스토리에 추가
    setConversationMessages((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), userMessage]
    }));

    // 대화 목록의 마지막 메시지 업데이트
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: message.length > 30 ? message.substring(0, 30) + '...' : message }
          : conv
      )
    );

    // 메시지 입력창 초기화
    const currentMessage = message;
    setMessage('');
    setIsAIResponding(true);

    try {
      // 현재 대화의 모든 메시지를 AI 형식으로 변환
      const currentMessages = [...(conversationMessages[selectedConversation.id] || []), userMessage];
      const aiMessages = convertMessagesToAIFormat(currentMessages, selectedConversation.title);

      // AI로부터 응답 받기
      const aiResponse = await sendMessageToAI(aiMessages);

      // AI 응답을 히스토리에 추가
      const aiMessage = {
        id: Date.now() + 1,
        from: selectedConversation.title,
        to: 'User1',
        text: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversationMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [...(prev[selectedConversation.id] || []), aiMessage]
      }));

      // 대화 목록의 마지막 메시지를 AI 응답으로 업데이트
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: aiResponse.length > 30 ? aiResponse.substring(0, 30) + '...' : aiResponse }
            : conv
        )
      );
    } catch (error) {
      console.error('AI 응답 오류:', error);

      // 오류 메시지 추가
      const errorMessage = {
        id: Date.now() + 1,
        from: selectedConversation.title,
        to: 'User1',
        text: '죄송합니다. AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversationMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [...(prev[selectedConversation.id] || []), errorMessage]
      }));

      openSnackbar({
        open: true,
        message: 'AI 응답을 받아올 수 없습니다.',
        variant: 'alert',
        alert: {
          color: 'error'
        }
      } as SnackbarProps);
    } finally {
      setIsAIResponding(false);
    }
  };

  const handleEnter = (event: React.KeyboardEvent<HTMLDivElement> | undefined) => {
    if (event?.key !== 'Enter') {
      return;
    }
    handleOnSend();
  };

  // handle emoji
  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setMessage(message + emojiObject.emoji);
  };

  const emojiOpen = Boolean(anchorElEmoji);
  const emojiId = emojiOpen ? 'simple-popper' : undefined;

  const handleCloseEmoji = () => {
    setAnchorElEmoji(null);
  };

  // close sidebar when widow size below 'md' breakpoint
  useEffect(() => {
    setOpenChatDrawer(!downLG);
  }, [downLG]);

  const chatDrawer = useMemo(
    () => (
      <ChatDrawer
        openChatDrawer={openChatDrawer}
        handleDrawerOpen={handleDrawerOpen}
        setUser={setUser}
        selectedUser={selectedConversation?.id || null}
        conversations={conversations}
        onAddConversation={handleAddConversation}
        onConversationSelect={handleConversationSelect}
      />
    ),
    [user, openChatDrawer, conversations, selectedConversation]
  );

  return (
    <Box sx={{ display: 'flex', overflow: 'hidden' }}>
      {chatDrawer}
      <Main open={openChatDrawer} sx={{ minWidth: 0 }}>
        <Grid container sx={{ height: 1 }}>
          <Grid size={12}>
            <MainCard
              content={false}
              sx={(theme: Theme) => ({
                height: 1,
                bgcolor: 'grey.50',
                ...theme.applyStyles('dark', { bgcolor: 'dark.main' }),
                borderRadius: 1.5,
                ...(openChatDrawer && { borderRadius: '0 12px 12px 0' }),
                [theme.breakpoints.down('md')]: { borderRadius: 1.5 }
              })}
            >
              <Grid container spacing={2} sx={{ height: 1 }}>
                <Grid size={12} sx={{ bgcolor: 'background.paper', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Grid>
                      <ChatHeader loading={usersLoading} user={user} handleDrawerOpen={handleDrawerOpen} />
                    </Grid>
                    <Grid>
                      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                        <IconButton onClick={handleClickSort} sx={{ transform: 'rotate(90deg)' }} size="large" color="secondary">
                          <MoreIcon />
                        </IconButton>
                        <Menu
                          id="simple-menu"
                          anchorEl={anchorEl}
                          keepMounted
                          open={Boolean(anchorEl)}
                          onClose={handleCloseSort}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right'
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right'
                          }}
                          sx={{ p: 0, '& .MuiMenu-list': { p: 0 } }}
                        >
                          <MenuItem onClick={handleDelete}>
                            <Trash style={{ paddingRight: 8 }} />
                            <Typography>삭제</Typography>
                          </MenuItem>
                        </Menu>
                      </Stack>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={12}>
                  <SimpleBar
                    sx={{
                      overflowX: 'hidden',
                      height: 'calc(100vh - 416px)',
                      minHeight: 420,
                      '& .simplebar-content': {
                        height: '100%'
                      }
                    }}
                  >
                    <Box sx={{ pl: 3, pr: 3, pt: 1, height: '100%' }}>
                      {!selectedConversation ? (
                        <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <CircularWithPath />
                        </Stack>
                      ) : (
                        <AIChatHistory
                          messages={conversationMessages[selectedConversation.id] || []}
                          conversationTitle={selectedConversation.title}
                        />
                      )}
                    </Box>
                  </SimpleBar>
                </Grid>
                <Grid
                  size={12}
                  sx={{ height: 1, pt: 2, pl: 2, bgcolor: 'background.paper', borderTop: '1px solid ', borderTopColor: 'divider' }}
                >
                  <Stack>
                    <TextField
                      inputRef={textInput}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder={isAIResponding ? 'AI가 응답 중입니다...' : '메시지를 입력하세요...'}
                      value={message}
                      onChange={(e) => setMessage(e.target.value.length <= 1 ? e.target.value.trim() : e.target.value)}
                      onKeyDown={handleEnter}
                      variant="standard"
                      disabled={isAIResponding}
                      sx={{ pr: 2, '& .MuiInput-root:before': { borderBottomColor: 'divider' } }}
                    />
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" sx={{ py: 2, ml: -1 }}>
                        <>
                          <IconButton
                            ref={anchorElEmoji}
                            aria-describedby={emojiId}
                            onClick={handleOnEmojiButtonClick}
                            sx={{ opacity: 0.5 }}
                            size="medium"
                            color="secondary"
                          >
                            <EmojiHappy />
                          </IconButton>
                          <Popper
                            id={emojiId}
                            open={emojiOpen}
                            anchorEl={anchorElEmoji}
                            disablePortal
                            style={{ zIndex: 1200 }}
                            popperOptions={{
                              modifiers: [
                                {
                                  name: 'offset',
                                  options: {
                                    offset: [-20, 125]
                                  }
                                }
                              ]
                            }}
                          >
                            <ClickAwayListener onClickAway={handleCloseEmoji}>
                              <MainCard elevation={8} content={false}>
                                <EmojiPicker onEmojiClick={onEmojiClick} defaultSkinTone={SkinTones.DARK} autoFocusSearch={false} />
                              </MainCard>
                            </ClickAwayListener>
                          </Popper>
                        </>

                        {/* 파일 업로드 */}
                        <IconButton component="label" sx={{ opacity: 0.5 }} size="medium" color="secondary">
                          <Paperclip />
                          <input type="file" hidden onChange={handleFileUpload} accept="*/*" />
                        </IconButton>

                        {/* 이미지 업로드 */}
                        <IconButton component="label" sx={{ opacity: 0.5 }} size="medium" color="secondary">
                          <ImageIcon />
                          <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                        </IconButton>
                      </Stack>
                      <IconButton
                        color="primary"
                        onClick={handleOnSend}
                        size="large"
                        sx={{ mr: 1.5 }}
                        disabled={isAIResponding || message.trim() === ''}
                      >
                        {isAIResponding ? <CircularWithPath size={20} variant="indeterminate" /> : <Send />}
                      </IconButton>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
        </Grid>
      </Main>
    </Box>
  );
}
