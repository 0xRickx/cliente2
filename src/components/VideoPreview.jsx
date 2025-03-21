import React, { useEffect, useRef } from 'react';
import { Button, Box, LinearProgress } from '@mui/material';

function VideoPreview({ src, onRerecord, responseId, isProcessing }) {
  console.log("VideoPreview: src prop:", src);
  const videoUrl = src;
  console.log("VideoPreview: videoUrl:", videoUrl);
  const videoRef = useRef(null);

  useEffect(() => {
    console.log("VideoPreview useEffect, src:", src); // Log the src prop
    if (videoRef.current && src) {
      videoRef.current.src = src;
      videoRef.current.load();
    }
  }, [src]);

  function updateVideoUrl() {
    if (!responseId) {
      console.error('responseId prop is missing!');
      alert('responseId is missing. Cannot update video URL.');
      return;
    }

    const apiUrl = `/api/questionnaire-response/${responseId}/video-url`;

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl: videoUrl }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP error! status: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('Video URL updated successfully:', data);
        alert('Video Accepted and URL updated!');
      })
      .catch(error => {
        console.error('Error updating video URL:', error);
        alert('Failed to update video URL.');
      });
  }

  return (
    <div>
      <h1>Video Preview</h1>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {src ? (
          <video ref={videoRef} src={videoUrl} width="640" height="360" controls style={{ margin: '0 auto' }} />
        ) : (
          <p>No video to preview.</p>
        )}
      </div>
      {isProcessing && (
                <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress />
                </Box>
            )}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        {!isProcessing && (
                    <>
                        <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={() => updateVideoUrl()}>
                            Accetta
                        </Button>
                        <Button variant="contained" color="secondary" onClick={onRerecord}>
                            Riregistra
                        </Button>
                    </>
                )}
      </Box>
    </div>
  );
}

export default VideoPreview;
