// material-ui
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import IconButton from 'components/@extended/IconButton';

// assets
import { HambergerMenu, Message } from '@wandersonalwes/iconsax-react';

// types
import { UserProfile } from 'types/user-profile';

interface Props {
  loading: boolean;
  user: UserProfile;
  handleDrawerOpen: () => void;
}

// ==============================|| CHAT HEADER ||============================== //

export default function ChatHeader({ loading, user, handleDrawerOpen }: Props) {
  return (
    <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
      <IconButton onClick={handleDrawerOpen} color="secondary" size="large">
        <HambergerMenu />
      </IconButton>
      {loading && Object.keys(user).length === 0 ? (
        <List disablePadding>
          <ListItem disablePadding disableGutters>
            <ListItemAvatar>
              <Skeleton variant="circular" width={40} height={40} />
            </ListItemAvatar>
            <ListItemText
              sx={{ my: 0 }}
              primary={<Skeleton animation="wave" height={24} width={50} />}
              secondary={<Skeleton animation="wave" height={16} width={80} />}
            />
          </ListItem>
        </List>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.lighter',
              color: 'primary.main'
            }}
          >
            <Message size={20} />
          </Box>
          <Stack>
            <Typography variant="subtitle1">{user.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              마지막 수정일: {user.lastMessage}
            </Typography>
          </Stack>
        </>
      )}
    </Stack>
  );
}
