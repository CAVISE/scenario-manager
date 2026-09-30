import { HexLogo } from '@/shared/ui/HexLogo';
import './styles/EditorLoadingScreen.scss';

export const AppLoader = () => {
  return (
    <div className="sm-loader-root">
      <div className="sm-loader-grid" />
      <div className="sm-loader-scan" />

      <div className="sm-loader-card">
        <HexLogo withWordmark />

        <div className="sm-loader-bar-track">
          <div className="sm-loader-bar-scroll" />
        </div>
      </div>
    </div>
  );
};
