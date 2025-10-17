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
import { useSession } from 'next-auth/react';

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

// localStorage 키
const STORAGE_KEY_PREFIX = 'ai-chat';

export default function Chat() {
  const { usersLoading, users } = useGetUsers();
  const { data: session } = useSession();
  const currentUserId = session?.user?.email || 'anonymous';

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const [user, setUser] = useState<UserProfile>({});
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | null>(null);
  const [anchorEl, setAnchorEl] = useState<Element | (() => Element) | null | undefined>(null);

  // 각 대화별 메시지 히스토리 관리
  const [conversationMessages, setConversationMessages] = useState<{ [key: string]: any[] }>({});

  // localStorage에서 사용자별 대화 불러오기
  useEffect(() => {
    if (!currentUserId) return;

    const storageKey = `${STORAGE_KEY_PREFIX}-conversations-${currentUserId}`;
    const messagesKey = `${STORAGE_KEY_PREFIX}-messages-${currentUserId}`;

    try {
      const savedConversations = localStorage.getItem(storageKey);
      const savedMessages = localStorage.getItem(messagesKey);

      if (savedConversations) {
        const parsedConversations = JSON.parse(savedConversations);
        setConversations(parsedConversations);

        // 첫 번째 대화 선택
        if (parsedConversations.length > 0) {
          const defaultConversation = parsedConversations[0];
          setSelectedConversation(defaultConversation);
          setUser({
            id: defaultConversation.id,
            name: defaultConversation.title,
            status: defaultConversation.lastMessage,
            lastMessage: defaultConversation.lastModified,
            avatar: 'ai-avatar.png',
            online_status: 'available'
          });
        }
      }

      if (savedMessages) {
        setConversationMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('localStorage 불러오기 오류:', error);
    }
  }, [currentUserId]);

  // 대화 목록 변경 시 localStorage에 저장
  useEffect(() => {
    if (!currentUserId || conversations.length === 0) return;

    const storageKey = `${STORAGE_KEY_PREFIX}-conversations-${currentUserId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('localStorage 저장 오류:', error);
    }
  }, [conversations, currentUserId]);

  // 메시지 히스토리 변경 시 localStorage에 저장
  useEffect(() => {
    if (!currentUserId || Object.keys(conversationMessages).length === 0) return;

    const messagesKey = `${STORAGE_KEY_PREFIX}-messages-${currentUserId}`;
    try {
      localStorage.setItem(messagesKey, JSON.stringify(conversationMessages));
    } catch (error) {
      console.error('localStorage 저장 오류:', error);
    }
  }, [conversationMessages, currentUserId]);

  const handleClickSort = (event: React.MouseEvent<HTMLButtonElement> | undefined) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleCloseSort = () => {
    setAnchorEl(null);
  };

  // Delete 기능 (상단 메뉴에서)
  const handleDelete = () => {
    if (selectedConversation) {
      handleConversationDelete(selectedConversation.id);
    }
    handleCloseSort();
  };

  // 대화 삭제 핸들러 (카드에서 직접 삭제)
  const handleConversationDelete = (conversationId: string) => {
    // 대화 삭제
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));

    // 메시지 히스토리도 삭제
    setConversationMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[conversationId];
      return newMessages;
    });

    // 삭제된 대화가 현재 선택된 대화인 경우
    if (selectedConversation?.id === conversationId) {
      // 남은 대화가 있으면 첫 번째 대화 선택, 없으면 null
      const remainingConversations = conversations.filter((conv) => conv.id !== conversationId);
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
        onConversationDelete={handleConversationDelete}
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
                        <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                          <Typography variant="h4" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            💬 AI 대화를 시작해보세요
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
                            왼쪽 상단의 "새 채팅" 버튼을 클릭하여
                            <br />
                            AI와 대화를 시작할 수 있습니다.
                          </Typography>
                          <Box
                            sx={{
                              mt: 2,
                              p: 3,
                              borderRadius: 2,
                              bgcolor: 'primary.lighter',
                              maxWidth: 500
                            }}
                          >
                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500, mb: 1 }}>
                              💡 사용 팁
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                              • 코드 리뷰, 프로젝트 기획, 기술 상담 등 다양한 주제로 대화할 수 있습니다
                              <br />
                              • 파일과 이미지를 첨부하여 질문할 수 있습니다
                              <br />
                              • 대화 내역은 자동으로 저장됩니다
                            </Typography>
                          </Box>
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
