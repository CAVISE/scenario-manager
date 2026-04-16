import React, { Suspense } from 'react';
import { styled } from '@mui/material/styles';
import { CircularProgress } from '@mui/material';
import Editor from '../Editor';
import ThreeSceneProvider from '../../contexts/ThreeSceneProvider';

const StyledEditorContainer = styled('div')({
  width: '100vw',
  height: '100vh',
  position: 'relative',
  backgroundColor: '#f5f5f5',
  overflow: 'hidden',
});

const LoadingOverlay = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  zIndex: 9999,
  '& .progress-indicator': {
    marginBottom: '16px',
  }
});

const EditorWrapper: React.FC = () => {
  return (
    <StyledEditorContainer>
      <Suspense 
        fallback={
          <LoadingOverlay>
            <CircularProgress size={60} thickness={4} className="progress-indicator" />
            <div>Loading scene editor...</div>
          </LoadingOverlay>
        }
      >
        <ThreeSceneProvider>
          <Editor />
        </ThreeSceneProvider>
      </Suspense>
    </StyledEditorContainer>
  );
};

export default EditorWrapper;