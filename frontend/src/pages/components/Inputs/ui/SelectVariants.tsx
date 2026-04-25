import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import { SelectVariantsProps } from '../types/Scenario';

const SelectVariants = ({
  param,
  variants,
  state,
  setState,
}: SelectVariantsProps) => {
  const handleChange = (event: SelectChangeEvent) => {
    setState({ ...state, [param]: event.target.value });
  };

  return (
    <FormControl fullWidth margin="normal">
      <InputLabel id={param + '-label'}>{param}</InputLabel>
      <Select
        labelId={param + '-label'}
        id={param}
        value={state[param] as string}
        label={param}
        onChange={handleChange}
      >
        {variants.map((val) => (
          <MenuItem value={val} key={val}>
            {val}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectVariants;
