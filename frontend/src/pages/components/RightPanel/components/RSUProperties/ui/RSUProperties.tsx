import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useEditorStore } from '@/store';
import type { RSUPropertiesProps } from '../types/RSUPropertiesTypes';
import { BehaviorServicesSection } from './components/BehaviorServicesSection';
import { OpenCDAColorSection } from './components/OpenCDAColorSection';
import { OpenCDAIdentitySection } from './components/OpenCDAIdentitySection';
import { OpenCDASensingSection } from './components/OpenCDASensingSection';
import { PositionSection } from './components/PositionSection';
import { ScriptSection } from './components/ScriptSection';
import { V2XParametersSection } from './components/V2XParametersSection';

export default function RSUProperties({ rsu, onDelete }: RSUPropertiesProps) {
  const updateRSU = useEditorStore((s) => s.updateRSU);

  const [showBehaviorServices, setShowBehaviorServices] = useState(
    (rsu.opencda_behavior_services?.length ?? 0) > 0
  );
  const [showColor, setShowColor] = useState(rsu.opencda_color != null);
  const [showId, setShowId] = useState(rsu.opencda_id != null);
  const [showName, setShowName] = useState(Boolean(rsu.opencda_name?.trim()));

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">RSU Object</Typography>

      <PositionSection rsu={rsu} updateRSU={updateRSU} />

      <V2XParametersSection rsu={rsu} updateRSU={updateRSU} />

      <OpenCDAIdentitySection
        rsu={rsu}
        updateRSU={updateRSU}
        showName={showName}
        setShowName={setShowName}
        showId={showId}
        setShowId={setShowId}
        setShowBehaviorServices={setShowBehaviorServices}
      />

      <OpenCDAColorSection
        rsu={rsu}
        updateRSU={updateRSU}
        showColor={showColor}
        setShowColor={setShowColor}
      />

      <BehaviorServicesSection
        rsu={rsu}
        updateRSU={updateRSU}
        showBehaviorServices={showBehaviorServices}
        setShowBehaviorServices={setShowBehaviorServices}
      />

      <OpenCDASensingSection rsu={rsu} updateRSU={updateRSU} />

      <ScriptSection rsu={rsu} updateRSU={updateRSU} />

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete RSU
      </Button>
    </Stack>
  );
}
