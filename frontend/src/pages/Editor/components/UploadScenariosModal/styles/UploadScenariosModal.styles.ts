export const ACCENT = '#69f0ae';

export const styles = {
  ModalContainerStyles: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: 560 },
    maxHeight: '90vh',
    bgcolor: '#0D1117',
    border: '1px solid rgba(105, 240, 174, 0.08)',
    borderRadius: '20px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
    p: 3,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },

  uploadModalBoxStyles: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },

  backButtonStyles: {
    color: '#9AA1AC',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
  },

  titleStyles: {
    color: '#E8F0F0',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },

  closeButtonStyles: {
    color: '#9AA1AC',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
  },

  alertStyles: {
    mb: 2,
    borderRadius: '12px',
    bgcolor: 'rgba(105, 240, 174, 0.04)',
    border: '1px solid rgba(105, 240, 174, 0.08)',
    '& .MuiAlert-icon': { color: ACCENT },
  },

  listContainerStyles: {
    flex: 1,
    overflowY: 'auto' as const,
    pr: 0.5,
    '&::-webkit-scrollbar': { width: 4 },
    '&::-webkit-scrollbar-thumb': {
      bgcolor: 'rgba(105, 240, 174, 0.15)',
      borderRadius: 2,
    },
  },

  emptyStateStyles: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    py: 8,
  },

  scenarioCardStyles: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 1.5,
    bgcolor: 'rgba(255,255,255,0.02)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: '1px solid transparent',
    '&:hover': {
      bgcolor: 'rgba(105, 240, 174, 0.04)',
      borderColor: 'rgba(105, 240, 174, 0.06)',
      transform: 'translateX(4px)',
    },
  },

  cardThumbWrapStyles: {
    width: 56,
    height: 56,
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0,
    bgcolor: 'rgba(255,255,255,0.03)',
    position: 'relative' as const,
  },

  imgStyles: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },

  boxStyles: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7A828D',
    fontSize: 13,
  },

  cardBodyStyles: {
    flex: 1,
    minWidth: 0,
  },

  cardTitleStyles: {
    color: '#E8F0F0',
    fontWeight: 500,
    fontSize: '0.95rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cardIdStyles: {
    color: '#7A828D',
    fontSize: '0.65rem',
    fontFamily: 'monospace',
    opacity: 0.5,
    flexShrink: 0,
  },

  cardAnnotationStyles: {
    color: '#9AA1AC',
    fontSize: '0.8rem',
    mt: 0.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  cardAnnotationEmptyStyles: {
    color: '#4A525D',
    fontSize: '0.8rem',
    mt: 0.25,
    fontStyle: 'italic',
  },

  cardChevronStyles: {
    color: '#4A525D',
    ml: 1,
    flexShrink: 0,
  },

  detailImageStyles: {
    width: '100%',
    height: 180,
    objectFit: 'contain' as const,
    bgcolor: 'rgba(255,255,255,0.02)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.04)',
  },

  detailImagePlaceholderStyles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    bgcolor: 'rgba(255,255,255,0.02)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.04)',
    color: '#4A525D',
  },

  fieldStyles: {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(255,255,255,0.02)',
      borderRadius: '12px',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
      '&.Mui-focused fieldset': { borderColor: ACCENT },
    },
    '& .MuiInputLabel-root': {
      color: '#7A828D',
      '&.Mui-focused': { color: ACCENT },
    },
    '& .MuiInputBase-input': {
      color: '#E8F0F0',
    },
  },

  saveButtonStyles: {
    color: '#E8F0F0',
    borderColor: 'rgba(255,255,255,0.08)',
    '&:hover': {
      borderColor: 'rgba(255,255,255,0.15)',
      bgcolor: 'rgba(255,255,255,0.04)',
    },
    '&:disabled': {
      color: 'rgba(255,255,255,0.2)',
      borderColor: 'rgba(255,255,255,0.04)',
    },
  },

  loadButtonStyles: {
    bgcolor: ACCENT,
    color: '#0D1117',
    fontWeight: 600,
    '&:hover': {
      bgcolor: '#5bd99c',
    },
    '&:disabled': {
      bgcolor: 'rgba(105, 240, 174, 0.2)',
      color: 'rgba(255,255,255,0.3)',
    },
  },
} as const;
