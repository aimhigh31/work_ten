import { Fragment, useEffect, useState } from 'react';

// material-ui
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import Dot from 'components/@extended/Dot';

// assets
import { Message } from '@wandersonalwes/iconsax-react';

// types
import { KeyedObject } from 'types/root';

// ==============================|| CHAT - CONVERSATION LIST ||============================== //

export interface ConversationData {
  id: string;
  title: string;
  lastModified: string;
  lastMessage?: string;
  unread?: boolean;
}

interface ConversationListProps {
  setUser: (u: any) => void;
  search?: string;
  selectedUser: string | null;
  conversations: ConversationData[];
  onConversationSelect?: (conversation: ConversationData) => void;
}

interface ConversationListItemProps {
  conversation: ConversationData;
  setUser: (u: any) => void;
  selectedUser: string | null;
  onConversationSelect?: (conversation: ConversationData) => void;
}

// ==============================|| CHAT - CONVERSATION ITEM ||============================== //

function ConversationListItem({ conversation, setUser, selectedUser, onConversationSelect }: ConversationListItemProps) {
  return (
    <ListItemButton
      sx={{ pl: 1, borderRadius: 0, '&:hover': { borderRadius: 1 } }}
      onClick={() => {
        // AI 대화를 위한 mock user 객체 생성
        const aiUser = {
          id: conversation.id,
          name: conversation.title,
          status: conversation.lastMessage,
          lastMessage: conversation.lastModified,
          avatar: 'ai-avatar.png',
          online_status: 'available'
        };
        setUser(aiUser);
        onConversationSelect?.(conversation);
      }}
      selected={conversation.id === selectedUser}
    >
      <ListItemText
        primary={
          <Stack component="span" direction="row" sx={{ gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack component="span" direction="row" sx={{ gap: 1, alignItems: 'center', flex: 1 }}>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
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
              <Typography
                component="span"
                variant="subtitle1"
                sx={{
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}
              >
                {conversation.title}
              </Typography>
            </Stack>
            <Typography component="span" variant="caption" sx={{ color: 'text.secondary', minWidth: 'fit-content' }}>
              {conversation.lastModified}
            </Typography>
          </Stack>
        }
        secondary={
          <Stack component="span" direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}
            >
              {conversation.lastMessage}
            </Typography>
            {conversation.unread && (
              <Box component="span" sx={{ ml: 1 }}>
                <Dot />
              </Box>
            )}
          </Stack>
        }
      />
    </ListItemButton>
  );
}

export default function ConversationList({ setUser, search, selectedUser, conversations, onConversationSelect }: ConversationListProps) {
  const [data, setData] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let result = conversations;
    if (search) {
      result = conversations.filter((conversation: ConversationData) => {
        return (
          conversation.title.toLowerCase().includes(search.toLowerCase()) ||
          conversation.lastMessage?.toLowerCase().includes(search.toLowerCase())
        );
      });
    }
    setData(result);
  }, [search, conversations]);

  if (loading)
    return (
      <List>
        {[1, 2, 3, 4, 5].map((index: number) => (
          <ListItem key={index} divider>
            <ListItemText
              primary={<Skeleton animation="wave" height={24} />}
              secondary={<Skeleton animation="wave" height={16} width="60%" />}
            />
          </ListItem>
        ))}
      </List>
    );

  return (
    <List component="nav">
      {data.map((conversation) => (
        <Fragment key={conversation.id}>
          <ConversationListItem
            conversation={conversation}
            selectedUser={selectedUser}
            setUser={setUser}
            onConversationSelect={onConversationSelect}
          />
          <Divider />
        </Fragment>
      ))}
    </List>
  );
}
