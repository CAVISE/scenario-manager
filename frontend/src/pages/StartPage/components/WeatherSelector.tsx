import { WEATHER_OPTIONS } from '@/pages/types/StartPageTypes';
import { CarlaWeather } from '@/store/types/useEditorStoreTypes';
import { WeatherSelectorProps } from './types/StartPageComponentsTypes';

export const WeatherSelector: React.FC<WeatherSelectorProps> = ({
  value,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as CarlaWeather);
  };

  return (
    <div className="sm-home-select-wrap">
      <select
        className="sm-home-select"
        value={value}
        onChange={handleChange}
        aria-label="Weather preset"
      >
        {WEATHER_OPTIONS.map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
      <span className="sm-home-select-arrow">&#9662;</span>
    </div>
  );
};
