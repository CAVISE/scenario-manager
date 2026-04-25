import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { BottomNavbar } from './components/BottomNavbar';
import { useEffect, useState } from 'react';
import { useEditorStore } from '../store';

const ParamsPage = () => {
  const [weather, setWeather] = useState('ClearNoon');
  const updateScenario = useEditorStore((state) => state.updateScenario);
  useEffect(() => {
    const wthr = JSON.parse(window.localStorage.getItem('weather')!);
    setWeather(wthr);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('weather', JSON.stringify(weather));
  }, [weather]);

  const handleWeatherChange = (event: SelectChangeEvent) => {
    setWeather(event.target.value);
    updateScenario({ weather: event.target.value });
  };

  return (
    <div>
      <BottomNavbar />
      <div>
        <h3>World parameters:</h3>
        <FormControl fullWidth margin="normal">
          <InputLabel id={'wthr-label'}>Weather</InputLabel>
          <Select
            labelId={'wthr-label'}
            id="wthr"
            value={weather as string}
            label="Weather"
            onChange={handleWeatherChange}
          >
            {[
              'ClearNoon',
              'CloudyNoon',
              'WetNoon',
              'WetCloudyNoon',
              'SoftRainNoon',
              'MidRainyNoon',
              'HardRainNoon',
              'ClearSunset',
              'CloudySunset',
              'WetSunset',
              'WetCloudySunset',
              'SoftRainSunset',
              'MidRainSunset',
              'HardRainSunset',
            ].map((val) => (
              <MenuItem value={val} key={val}>
                {val}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default ParamsPage;
