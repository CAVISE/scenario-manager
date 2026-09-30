import { Box, Button, Divider, Modal, Stack, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AttackEditor } from '../components/AttackEditor';
import { AttackList } from '../components/AttackList';
import { useAttackEditor } from '../hooks/useAttackEditor';
import type { AttackConfigModalProps } from '../types/AttackConfigModalTypes';
import '../styles/AttackConfigModal.scss';

export default function AttackConfigModal({
  open,
  onClose,
}: AttackConfigModalProps) {
  const {
    attacks,
    selectedAttack,
    setSelectedAttack,
    currentAttack,
    updateAttackAt,
    updateStageAt,
    addStage,
    removeStage,
    addAttack,
    addGnssSpoofer,
    removeCurrentAttack,
  } = useAttackEditor();

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="attack-config-modal">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">Attack Configuration</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={addGnssSpoofer}
            >
              + GNSS Spoofer
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addAttack}
            >
              Add blank
            </Button>
            <Button onClick={onClose} variant="outlined" size="small">
              Close
            </Button>
          </Stack>
        </Stack>

        <Typography
          className="attack-config-modal__description"
          variant="body2"
          color="text.secondary"
        >
          Configure top-level `attacks` list for OpenCDA adversary framework.
          For GNSS spoofer, use the structured form for precise parameter
          control.
        </Typography>
        <Divider className="attack-config-modal__header-divider" />

        {attacks.length === 0 ? (
          <Typography color="text.secondary">
            No attacks configured. Click &quot;+ GNSS Spoofer&quot; or &quot;Add
            blank&quot;.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <AttackList
              attacks={attacks}
              selectedAttack={selectedAttack}
              onSelect={setSelectedAttack}
            />

            {currentAttack && (
              <AttackEditor
                attack={currentAttack}
                attackIndex={selectedAttack}
                onUpdate={(patch) => updateAttackAt(selectedAttack, patch)}
                onDelete={removeCurrentAttack}
                onUpdateStage={updateStageAt}
                onAddStage={addStage}
                onDeleteStage={removeStage}
              />
            )}
          </Stack>
        )}
      </Box>
    </Modal>
  );
}
