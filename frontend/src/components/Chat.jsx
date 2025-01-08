import React, { useEffect, useState } from 'react';
import Video from 'twilio-video';

const Chat = () => {
    const [room, setRoom] = useState(null);
    const [token, setToken] = useState(null);
    const [localTracks, setLocalTracks] = useState([]);
    const [remoteParticipants, setRemoteParticipants] = useState([]);

    const roomName = 'my-room';
    const identity = `user-${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = "https://chat-room-4id1.onrender.com";
    // const baseUrl = "http://localhost:4000";

    const fetchToken = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/v1/room?identity=${identity}&room=${roomName}`);
            const data = await response.json();
            setToken(data.token);
        } catch (error) {
            console.error('Error fetching token:', error);
        }
    };

    useEffect(() => {
        if (token) {
            console.log("Connecting to Twilio...");
            const joinRoom = async () => {
                try {
                    const connectedRoom = await Video.connect(token, {
                        name: roomName,
                        tracks: localTracks,
                        video: true,
                        audio: true,
                    });

                    setRoom(connectedRoom);

                    // Handle local participant's tracks
                    setLocalTracks([...connectedRoom.localParticipant.tracks.values()]);

                    // Handle remote participants
                    connectedRoom.participants.forEach(participant => {
                        handleParticipantConnected(participant);
                    });

                    connectedRoom.on('participantConnected', handleParticipantConnected);
                    connectedRoom.on('participantDisconnected', handleParticipantDisconnected);
                } catch (error) {
                    console.error('Error connecting to room:', error);
                }
            };

            joinRoom();
        }
    }, [token]);

    const handleParticipantConnected = (participant) => {
        console.log(`Participant connected: ${participant.identity}`);
        participant.tracks.forEach(publication => {
            if (publication.isSubscribed) {
                handleTrackSubscribed(participant, publication.track);
            }
        });
        participant.on('trackSubscribed', (track) => handleTrackSubscribed(participant, track));
        participant.on('trackUnsubscribed', handleTrackUnsubscribed);
    };

    const handleParticipantDisconnected = (participant) => {
        console.log(`Participant disconnected: ${participant.identity}`);
        setRemoteParticipants(prevParticipants =>
            prevParticipants.filter(p => p.participant !== participant)
        );
    };

    const handleTrackSubscribed = (participant, track) => {
        if (track.kind === 'video' || track.kind === 'audio') {
            setRemoteParticipants(prevParticipants => [
                ...prevParticipants,
                { participant, track }
            ]);
        }
    };

    const handleTrackUnsubscribed = (track) => {
        setRemoteParticipants(prevParticipants =>
            prevParticipants.filter(p => p.track !== track)
        );
    };

    const handleLeaveRoom = () => {
        if (room) {
            room.localParticipant.tracks.forEach((publication) => {
                publication.track.stop();
            });
            room.disconnect();
            setRoom(null);
            setRemoteParticipants([]);
            setLocalTracks([]);
        }
    };

    return (
        <div>
            <h1>Twilio Video Call</h1>
            <button onClick={fetchToken}>Start Video Call</button>

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
                {remoteParticipants.map(({ participant, track }, index) =>
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

            <button onClick={handleLeaveRoom}>Leave Room</button>
        </div>
    );
};

export default Chat;
