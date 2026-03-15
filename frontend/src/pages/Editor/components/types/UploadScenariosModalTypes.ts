import { styled } from '@mui/system';
import {  Box } from '@mui/material';
import Card from '@mui/joy/Card';

export interface MockScenario {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
}

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'SCN-001',
    name: 'Highway Merge',
    description: 'A scenario simulating vehicle merging onto a highway with moderate traffic.',
    thumbnail: '/results/44_kinematics_plotting.png',
  },
  {
    id: 'SCN-002',
    name: 'Urban Intersection',
    description: 'Complex urban intersection scenario with pedestrian crossings.',
    thumbnail: '/results/50_localization_plotting.png',
  },
  {
    id: 'SCN-003',
    name: 'Rain Collision Test',
    description: 'Testing collision avoidance systems under heavy rain conditions.',
    thumbnail: '/results/20250513_081759_Collide_1.png',
  },
  {
    id: 'SCN-004',
    name: 'Accelerometer Calibration',
    description: 'Calibration run capturing accelerometer magnitude data.',
    thumbnail: '/results/20250513_081758_Accelerometer_Magnitude_4.png',
  },
  {
    id: 'SCN-005',
    name: 'Velocity Profile Test',
    description: 'Testing velocity profiles across varied terrain.',
    thumbnail: '/results/20250513_081757_velocity_1.png',
  },
  {
    id: 'SCN-006',
    name: 'Localization Benchmark',
    description: 'Benchmarking localization accuracy with GPS signal interference.',
    thumbnail: '/results/56_localization_plotting.png',
  },
];

export const ModalContainer = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 900,
  maxHeight: '85vh',
  overflow: 'auto',
  backgroundColor: 'white',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: 24,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
});

export const ModalHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
});

export const ScenarioCard = styled(Card)({
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
  },
});

export interface UploadScenariosModalProps {
  open: boolean;
  onClose: () => void;
}
