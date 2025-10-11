// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import CardMedia from '@mui/material/CardMedia';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project-imports
import { handlerDrawerOpen } from 'api/menu';
import { MenuOrientation } from 'config';
import MainCard from 'components/MainCard';
import useConfig from 'hooks/useConfig';

// assets
const defaultLayout = '/assets/images/customization/vertical.svg';
const horizontalLayout = '/assets/images/customization/horizontal.svg';

// ==============================|| CUSTOMIZATION - CONTAINER ||============================== //

export default function ThemeMenuLayout() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const { menuOrientation, onChangeMenuOrientation } = useConfig();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  const handleContainerChange = (e: any) => {
    onChangeMenuOrientation(e.target.value);
    handlerDrawerOpen(e.target.value !== MenuOrientation.HORIZONTAL);
  };

  return (
    <RadioGroup row aria-label="payment-card" name="payment-card" value={menuOrientation} onChange={handleContainerChange}>
      <Stack direction="row" sx={{ gap: 2.5, alignItems: 'center', width: 1 }}>
        <FormControlLabel
          control={<Radio value={MenuOrientation.VERTICAL} sx={{ display: 'none' }} />}
          sx={{ width: 1, m: 0, display: 'flex', '& .MuiFormControlLabel-label': { flex: 1 } }}
          label={
            <Stack sx={{ gap: 0.5, alignItems: 'center' }}>
              <MainCard content={false} sx={{ borderWidth: 2, p: 1, ...(!isHorizontal && { borderColor: 'primary.main' }) }}>
                <CardMedia component="img" src={defaultLayout} alt="defaultLayout" />
              </MainCard>
              <Typography variant="caption">Vertical</Typography>
            </Stack>
          }
        />
        <FormControlLabel
          control={<Radio value={MenuOrientation.HORIZONTAL} sx={{ display: 'none' }} />}
          sx={{ width: 1, m: 0, display: 'flex', '& .MuiFormControlLabel-label': { flex: 1 } }}
          label={
            <Stack sx={{ gap: 0.5, alignItems: 'center' }}>
              <MainCard content={false} sx={{ borderWidth: 2, p: 1, ...(isHorizontal && { borderColor: 'primary.main' }) }}>
                <CardMedia component="img" src={horizontalLayout} alt="horizontalLayout" />
              </MainCard>
              <Typography variant="caption">Horizontal</Typography>
            </Stack>
          }
        />
      </Stack>
    </RadioGroup>
  );
}
