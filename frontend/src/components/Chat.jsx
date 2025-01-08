import React, { useEffect, useState } from 'react';
import Video from 'twilio-video';

const Chat = () => {
    const [room, setRoom] = useState(null);
    const [token, setToken] = useState(null);
    const [localTracks, setLocalTracks] = useState([]);
    const [remoteParticipants, setRemoteParticipants] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    const roomName = 'my-room';
    const identity = `user-${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = "https://chat-room-4id1.onrender.com";

    const fetchToken = async () => {
        try {
            if (token) return; // Prevent multiple token requests
            const response = await fetch(`${baseUrl}/api/v1/room?identity=${identity}&room=${roomName}`);
            const data = await response.json();
            setToken(data.token);
        } catch (error) {
            console.error('Error fetching token:', error);
        }
    };

    useEffect(() => {
        if (token && !isConnected) {
            const joinRoom = async () => {
                try {
                    const localVideoTrack = await Video.createLocalVideoTrack();
                    const localAudioTrack = await Video.createLocalAudioTrack();
                    setLocalTracks([localVideoTrack, localAudioTrack]);

                    const connectedRoom = await Video.connect(token, {
                        name: roomName,
                        tracks: [localVideoTrack, localAudioTrack],
                    });

                    setRoom(connectedRoom);
                    setIsConnected(true);

                    // Handle remote participants
                    connectedRoom.participants.forEach(handleParticipantConnected);
                    connectedRoom.on('participantConnected', handleParticipantConnected);
                    connectedRoom.on('participantDisconnected', handleParticipantDisconnected);

                    // Cleanup on disconnect
                    connectedRoom.once('disconnected', (room) => {
                        room.localParticipant.tracks.forEach((publication) => {
                            publication.track.stop();
                        });
                        setRoom(null);
                        setLocalTracks([]);
                        setRemoteParticipants([]);
                        setIsConnected(false);
                    });
                } catch (error) {
                    console.error('Error connecting to room:', error);
                }
            };

            joinRoom();
        }
    }, [token]);

    const handleParticipantConnected = (participant) => {
        console.log(`Participant connected: ${participant.identity}`);
        participant.tracks.forEach((publication) => {
            if (publication.isSubscribed) {
                handleTrackSubscribed(publication.track);
            }
        });
        participant.on('trackSubscribed', handleTrackSubscribed);
        participant.on('trackUnsubscribed', handleTrackUnsubscribed);
    };

    const handleParticipantDisconnected = (participant) => {
        console.log(`Participant disconnected: ${participant.identity}`);
        setRemoteParticipants((prevParticipants) =>
            prevParticipants.filter((p) => p.participant !== participant)
        );
    };

    const handleTrackSubscribed = (track) => {
        setRemoteParticipants((prevParticipants) => [
            ...prevParticipants,
            { track },
        ]);
    };

    const handleTrackUnsubscribed = (track) => {
        setRemoteParticipants((prevParticipants) =>
            prevParticipants.filter((p) => p.track !== track)
        );
    };

    const handleLeaveRoom = () => {
        if (room) {
            room.disconnect();
        }
    };

    return (
        <div>
            <h1>Twilio Video Call</h1>
            <button onClick={fetchToken} disabled={isConnected}>
                Start Video Call
            </button>

            <div id="local-video-container">
                {localTracks.map((track, index) =>
                    track.kind === 'video' ? (
                        <video
                            key={index}
                            ref={(video) => {
                                if (video) {
                                    video.srcObject = new MediaStream([track.mediaStreamTrack]);
                                    video.play();
                                }
                            }}
                            width="320"
                            height="240"
                            muted
                        />
                    ) : null
                )}
            </div>

            <div id="remote-video-container">
                {remoteParticipants.map(({ track }, index) =>
                    track.kind === 'video' ? (
                        <video
                            key={index}
                            ref={(video) => {
                                if (video) {
                                    video.srcObject = new MediaStream([track.mediaStreamTrack]);
                                    video.play();
                                }
                            }}
                            width="320"
                            height="240"
                        />
                    ) : track.kind === 'audio' ? (
                        <audio
                            key={index}
                            ref={(audio) => {
                                if (audio) {
                                    audio.srcObject = new MediaStream([track.mediaStreamTrack]);
                                    audio.play();
                                }
                            }}
                        />
                    ) : null
                )}
            </div>

            <button onClick={handleLeaveRoom} disabled={!isConnected}>
                Leave Room
            </button>
        </div>
    );
};

export default Chat;
