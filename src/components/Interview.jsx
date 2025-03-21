import React, { useState, useEffect, useRef, useCallback } from 'react';
import config from '../config';
import { Container, Typography, Box, Button, LinearProgress, Paper, Grid } from '@mui/material';
import VideoPreview from '../components/VideoPreview.jsx'; // Import the VideoPreview component

const Interview = () => {
    // State management
    const [recording, setRecording] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState('');
    const [prerecordedVideoUrl, setPrerecordedVideoUrl] = useState('prerecorded/prerecorded.mp4');
    const [reviewing, setReviewing] = useState(false);
    const [recordingComplete, setRecordingComplete] = useState(false);
    const [canvasReady, setCanvasReady] = useState(true);
    const [mergedPreviewUrl, setMergedPreviewUrl] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [mergeProgress, setMergeProgress] = useState(0);
    const [showCanvas, setShowCanvas] = useState(true);
    const [showPrerecordedPreview, setShowPrerecordedPreview] = useState(true);
    const [responseId, setResponseId] = useState(null);

  useEffect(() => {
    if (!isMerging && responseId) {
        // If we just finished merging, and we have a responseId, fetch the updated data
        const fetchData = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                const answersResponse = await fetch(config.serverUrl + '/api/dashboard', {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken,
                    },
                });
                if (!answersResponse.ok) {
                    throw new Error('Failed to fetch answers: ' + answersResponse.status);
                }
                const answersData = await answersResponse.json();

                if (answersData && answersData.questionnaire && answersData.questionnaire.video_url) {
                    setMergedPreviewUrl(config.serverUrl + answersData.questionnaire.video_url);
                }
            } catch (error) {
                console.error("Error fetching updated data after merge: ", error);
            }
        }
        fetchData();
    }
  }, [isMerging, responseId]);

    // Ref elements
    const videoRef = useRef(null);
    const prerecordedRef = useRef(null);
    const canvasRef = useRef(null);
    const [canvasWidth, setCanvasWidth] = useState(640); // Reduced width for side-by-side
    const [canvasHeight, setCanvasHeight] = useState(480); // Reduced height for side-by-side
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const animationFrameRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const ctxRef = useRef(null);
    const prerecordedDurationRef = useRef(0);

    // Error handling
    const handleError = (error) => {
        console.error('Error:', error);
        setDebugInfo(error.message || 'An error occurred');
    };

    // Initialize canvas context
    useEffect(() => {
        if (canvasRef.current) {
            ctxRef.current = canvasRef.current.getContext('2d');
            setCanvasReady(true);
        }
    }, []);

    // Draw webcam on the canvas - ONLY WEBCAM
    const drawCanvas = useCallback(() => {
        if (!canvasReady || !ctxRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        const width = canvasWidth;
        const height = canvasHeight;

        ctx.clearRect(0, 0, width, height);
        if (videoRef.current && videoRef.current.readyState === 4) {
            ctx.drawImage(videoRef.current, 0, 0, width, height); // Draw the video only in half part
        } else {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading Webcam...', width / 2, height / 2);
        }

        animationFrameRef.current = requestAnimationFrame(drawCanvas);
    }, [canvasReady, canvasWidth, canvasHeight]);

    // Initialize webcam and prerecorded video
    useEffect(() => {
        let mounted = true;
        let currentVideoRef = null;

        const initializeVideo = async () => {
            if (!canvasReady) return;
            try {
                console.log('Requesting webcam and microphone access...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: canvasWidth },
                        height: { ideal: canvasHeight },
                        aspectRatio: canvasWidth / canvasHeight // Usa il rapporto d'aspetto calcolato
                    },
                    audio: true // Enable audio from the webcam
                });

                console.log('Stream obtained:', stream);
                if (!stream) {
                    throw new Error('Stream is null or undefined.');
                }
                if (!mounted) {
                    console.log('Component unmounted, stopping stream tracks.');
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                if (videoRef.current) {
                    console.log('Setting videoRef.current.srcObject to stream:', stream);
                    videoRef.current.srcObject = stream;
                    console.log('videoRef.current.srcObject set.');
                    currentVideoRef = videoRef.current;
                    videoRef.current.onloadedmetadata = async () => {
                        console.log('Attempting to play videoRef.current:', videoRef.current);
                        try {
                            await videoRef.current.play();
                            console.log('videoRef.current.play() called successfully.');
                        } catch (error) {
                            console.error('Error playing video:', error);
                            console.warn('Autoplay Webcam failed:', error);
                            setDebugInfo('Webcam autoplay failed. Please click on the video area to enable it.');
                        }
                    };
                } else {
                    console.error('Webcam video element not found.');
                    setDebugInfo('Webcam video element not found');
                }

                if (prerecordedRef.current) {
                    console.log('Setting prerecordedRef.current.src to prerecorded.mp4.');
                    console.log('Prerecorded video URL:', prerecordedVideoUrl);
                    prerecordedRef.current.src = prerecordedVideoUrl;
                    prerecordedRef.current.addEventListener('error', (event) => {
                        console.error('Prerecorded video error:', event.target.error);
                        setDebugInfo(`Prerecorded video error: ${event.target.error.message || 'Unknown error'}. Ensure the file is correctly located at: ${prerecordedVideoUrl}`);
                    });
                    prerecordedRef.current.load();

                    prerecordedRef.current.onloadedmetadata = () => {
                        prerecordedDurationRef.current = prerecordedRef.current.duration;
                        // Ottieni le dimensioni del video preregistrato e imposta il rapporto d'aspetto
                        if (prerecordedRef.current) {
                            const videoWidth = prerecordedRef.current.videoWidth;
                            const videoHeight = prerecordedRef.current.videoHeight;
                            if (videoWidth && videoHeight) {
                                const aspectRatio = videoWidth / videoHeight;
                                setCanvasWidth(videoWidth / 2); // Imposta la larghezza del canvas a metà della larghezza del video preregistrato
                                // Calcola l'altezza del canvas basata sull'aspect ratio e la larghezza
                                setCanvasHeight(canvasWidth / aspectRatio);
                                console.log(`Prerecorded video dimensions: ${videoWidth}x${videoHeight}, Aspect Ratio: ${aspectRatio}`);
                            } else {
                                console.warn('Could not determine prerecorded video dimensions.');
                            }
                        }
                    };
                } else {
                    setDebugInfo('Prerecorded video element not found');
                }

                if (mounted) {
                    drawCanvas();
                }
            } catch (error) {
                if (mounted) {
                    handleError(new Error('Failed to access camera or prerecorded video: ' + error.message));
                    console.error('Error accessing webcam or prerecorded video:', error);
                }
            }
        };

        initializeVideo();

        return () => {
            mounted = false;
            cancelAnimationFrame(animationFrameRef.current);
            clearInterval(progressIntervalRef.current);

            if (currentVideoRef?.srcObject) {
                currentVideoRef.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [drawCanvas, canvasReady, canvasWidth, canvasHeight, prerecordedVideoUrl]);

    // Start recording function - MODIFIED FOR WEBCAM ONLY
    const startRecording = async () => {
        if (!videoRef.current || !prerecordedRef.current) {
            setDebugInfo('Video references are not ready. Please try again.');
            return;
        }
        try {
            recordedChunksRef.current = [];
            setProgress(0);
            setRecordingComplete(false);
            setReviewing(false);
            setPreviewUrl('');
            setMergedPreviewUrl('');
            setShowCanvas(true);
            setShowPrerecordedPreview(true);

            const webcamStream = videoRef.current.srcObject;
            if (!webcamStream) {
                throw new Error('Webcam stream not available');
            }

            console.log('Webcam stream tracks:', webcamStream.getTracks());

            mediaRecorderRef.current = new MediaRecorder(webcamStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                console.log("mediaRecorderRef.current.onstop called"); // Log when onstop is called
                setRecordingComplete(true);
                setShowPrerecordedPreview(true);
                setShowCanvas(true);

                if (recordedChunksRef.current.length === 0) {
                    setDebugInfo('No video data was recorded');
                    return;
                }

                const webmBlob = new Blob(recordedChunksRef.current, {
                    type: 'video/webm;codecs=vp9'
                });
                const tempFileUrl = URL.createObjectURL(webmBlob);
                setPreviewUrl(tempFileUrl);
                setReviewing(true); // Ready to review and merge
                approveRecording(); // Call approveRecording here WITHOUT await
            };

            mediaRecorderRef.current.start();
            setRecording(true);

            try {
                prerecordedRef.current.volume = 1.0; // Set volume to max before play
                await prerecordedRef.current.play().catch(error => {
                    console.warn('Autoplay prerecorded video failed:', error);
                    setDebugInfo('Autoplay prerecorded video failed. Please click on the video controls to start playback.');
                });
            } catch (error) {
                console.warn('Error playing prerecorded video:', error);
                setDebugInfo('Error playing prerecorded video. Please click on the video controls to start playback.');
            }

            progressIntervalRef.current = setInterval(() => {
                if (prerecordedDurationRef.current > 0 && prerecordedRef.current) {
                    const currentProgress = (prerecordedRef.current.currentTime / prerecordedDurationRef.current) * 100;
                    setProgress(currentProgress);

                    // Auto-stop recording when prerecorded video ends
                    if (currentProgress >= 99.5 && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                        clearInterval(progressIntervalRef.current);
                        mediaRecorderRef.current.stop();
                        setRecording(false);
                    }
                }
            }, 100);

        } catch (error) {
            handleError(error);
            setRecording(false);
        }
    };

    // Function to handle rerecording
    const handleRerecord = () => {
        setReviewing(false);
        setRecordingComplete(false);
        setPreviewUrl('');
        setMergedPreviewUrl('');
        setDebugInfo('');
        setProgress(0);
        setMergeProgress(0);
    };


    // Function to merge the videos
    const approveRecording = async () => {
        if (recordedChunksRef.current.length > 0) {
            setIsMerging(true);
            setMergeProgress(0);
            try{
                const webmBlob = new Blob(recordedChunksRef.current, {
                    type: 'video/webm;codecs=vp9'
                });
                const formData = new FormData();
                formData.append('webcamVideo', webmBlob, 'webcam_recording.webm');
                formData.append('prerecordedVideoPath', 'prerecorded/prerecorded.mp4'); // Send correct path
                // Assuming you have userId available in your component's scope, e.g., from props or context
                let userId = localStorage.getItem('userId'); // Or however you are storing/accessing userId
                console.log('Attempting to retrieve userId from localStorage...'); // Added log
                console.log('Retrieved userId from localStorage:', userId); // ADDED LOGGING
                if (userId) {
                    formData.append('userId', userId);
                    console.log('UserId appended to formData:', userId); // Added log
                } else {
                    console.warn('User ID is not available in localStorage to send to server.');
                    setDebugInfo('User authentication issue: User ID not found. Please login again.'); // User-friendly message
                    // Removed return to allow request to proceed for debugging
                }

                console.log('Form data being sent:', formData); // Log form data before sending
                console.log('Sending webcam video to server for merging...');
                const mergeResponse = await fetch(`${config.serverUrl}/merge-videos`, {
                    method: 'POST',
                    body: formData,
                 });

                if (!mergeResponse.ok) {
                    const errorText = await mergeResponse.text(); // Get detailed error text
                    throw new Error(`Failed to merge videos: ${mergeResponse.statusText} - Detail: ${errorText}`);
                }

                const mergeResult = await mergeResponse.json();
                console.log('Videos merged:', mergeResult);
                setMergeProgress(100);
                const responseIdFromMerge = mergeResult.responseId;
                setResponseId(responseIdFromMerge);
                console.log('Merged video URL:', mergeResult.mergedVideoUrl); // Log the URL

                setMergedPreviewUrl(`${config.serverUrl}${mergeResult.mergedVideoUrl}`);
                setIsMerging(false);
            } catch (error) {
              handleError(error)
                console.error('Error processing video:', error);
                if (error.message.includes('Failed to merge videos: INTERNAL SERVER ERROR'))
                  setDebugInfo('Error: The server has encountered a temporary issue. Please try again later. If the problem persists, please contact support. ');
                else
                  setDebugInfo(`Error processing video: ${error.message}`);
                setIsMerging(false);
            }
        } else {
            setDebugInfo('No recording data available to process');
        }
    };

    // Function to restart the process
    const restartRecording = () => {
        setReviewing(false);
        setRecordingComplete(false);
        setPreviewUrl('');
        setMergedPreviewUrl('');
        setDebugInfo('');

        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());

            navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: canvasWidth },
                    height: { ideal: canvasHeight },
                    aspectRatio: canvasWidth / canvasHeight // Usa il rapporto d'aspetto calcolato
                },
                audio: true
            }).then(stream => {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(error => {
                    console.error('Error playing video:', error);
                    setDebugInfo('Failed to restart webcam. Please refresh the page.');
                });
            }).catch(error => {
                handleError(new Error(`Failed to access camera: ${error.message}`));
            });
        } else {
            setDebugInfo('Cannot restart recording: webcam not initialized');
        }
    };

    // Renders the Interview component
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 500 }}>
                    Video Interview
                </Typography>
            </Box>

            <Paper elevation={3} sx={{
                p: 3,
                border: '2px solid #1976d2',
                borderRadius: 2,
                backgroundColor: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: 'md' // Limit paper width for larger screens
            }}>
                {!reviewing ? (
                    <>
                        <Box sx={{ width: '100%' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}> {/* Prerecorded video container - Full width on small screens, half width on medium and up */}
                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <video
                                            ref={prerecordedRef}
                                            src={prerecordedVideoUrl}
                                            style={{
                                                width: '100%',
                                                maxWidth: '100%',
                                                borderRadius: '8px'
                                            }}
                                            playsInline
                                            controls
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}> {/* Webcam video container - Full width on small screens, half width on medium and up */}
                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <video
                                            ref={videoRef}
                                            style={{
                                                display: 'none'
                                            }}
                                            playsInline
                                            muted
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            width={canvasWidth}
                                            height={canvasHeight}
                                            style={{
                                                width: '100%',
                                                maxWidth: '100%',
                                                backgroundColor: '#000',
                                                borderRadius: '8px',
                                                objectFit: 'cover',
                                                objectPosition: 'center'
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Debug messages area */}
                        {debugInfo && (
                            <Box sx={{
                                mt: 2,
                                p: 2,
                                backgroundColor: '#ffebee',
                                borderRadius: 1,
                                width: '100%',
                                maxWidth: `calc(${canvasWidth * 2}px + 10px)` // Adjust to total width
                            }}>
                                <Typography color="error">⚠️ <span role="img" aria-label="warning">⚠️</span> {debugInfo}</Typography>
                            </Box>
                        )}

                        {/* Progress bar and buttons */}
                        {recording && (
                            <Box sx={{ mt: 2, width: '100%', maxWidth: `calc(${canvasWidth * 2}px + 10px)` }}>
                                <LinearProgress variant="determinate" value={progress} />
                            </Box>
                        )}
                        <Box sx={{ mt: 2 }}>
                            {!recording && !reviewing && (
                                <Button variant="contained" color="primary" onClick={startRecording}>
                                    Start Recording
                                </Button>
                            )}
                            {reviewing && !mergedPreviewUrl && (
                                <Button variant="contained" color="secondary" onClick={restartRecording} sx={{ mr: 2 }}>
                                    Restart
                                </Button>
                            )}
                        </Box>
                        {isMerging && (
                            <Box sx={{ mt: 2, width: '100%', maxWidth: `calc(${canvasWidth * 2}px + 10px)` }}>
                                <LinearProgress variant="determinate" value={mergeProgress} />
                            </Box>
                        )}
                    </>
                ) : (
                    <>
                        {mergedPreviewUrl && !isMerging && responseId && ( // Pass responseId as prop
                            <Box sx={{ mt: 3, width: '100%' }}>
                                <VideoPreview src={mergedPreviewUrl} onRerecord={handleRerecord} responseId={responseId} isProcessing={isMerging} />
                            </Box>
                        )}
                        {previewUrl && !mergedPreviewUrl && (
                            <Box sx={{ mt: 3, width: '100%' }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Webcam Recording Preview:
                                </Typography>
                                <VideoPreview src={previewUrl} onRerecord={handleRerecord} isProcessing={false} />
                            </Box>
                        )}
                    </>
                )}
            </Paper>
        </Container>
    );
};

export default Interview;
