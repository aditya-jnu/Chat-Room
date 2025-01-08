import React, { useEffect, useState } from 'react';
import Video from 'twilio-video';

const Chat = () => {
    const [room, setRoom] = useState(null);
    const [token, setToken] = useState(null);
    const [localTrack, setLocalTrack] = useState(null);
    const [remoteParticipants, setRemoteParticipants] = useState([]);

    const roomName = 'my-room';

    const fetchToken = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/v1/room?identity=user123&room=${roomName}`);
            console.log(response)
            const data = await response.json();
            setToken(data.token); // Correct token assignment
        } catch (error) {
            console.error('Error fetching token:', error);
        }
    };

    // useEffect(() => {
    //     fetchToken();
    // }, []);

    useEffect(() => {
        if (token) {
            console.log("Connecting to Twilio...");
            const joinRoom = async () => {
                try {
                    const room = await Video.connect(token, {
                        name: roomName,
                        video: true,
                        audio: true,
                    });

                    setRoom(room);

                    // Handle local participant's video track
                    const localParticipant = room.localParticipant;
                    localParticipant.videoTracks.forEach((publication) => {
                        if (publication.track) {
                            setLocalTrack(publication.track);
                        }
                    });

                    // Handle remote participants
                    room.on('participantConnected', (participant) => {
                        participant.on('trackSubscribed', (track) => {
                            if (track.kind === 'video') {
                                setRemoteParticipants((prevParticipants) => [
                                    ...prevParticipants,
                                    { participant, track },
                                ]);
                            }
                        });
                    });

                    // Handle participant disconnection
                    room.on('participantDisconnected', (participant) => {
                        setRemoteParticipants((prevParticipants) =>
                            prevParticipants.filter((p) => p.participant !== participant)
                        );
                    });
                } catch (error) {
                    console.error('Error connecting to room:', error);
                }
            };

            joinRoom();
        }
    }, [token]);

    const handleLeaveRoom = () => {
        if (room) {
            room.disconnect();
            setRoom(null);
            setRemoteParticipants([]);
            setLocalTrack(null);
        }
    };

    return (
        <div>
            <h1>Twilio Video Call</h1>
            <button onClick={fetchToken}>Start Video Call</button>

            <div id="local-video-container">
                {localTrack && (
                    <video
                        ref={(video) => {
                            if (video) {
                                video.srcObject = new MediaStream([localTrack.mediaStreamTrack]); // Corrected
                                video.play();
                            }
                        }}
                        width="320"
                        height="240"
                        muted
                    />
                )}
            </div>

            <div id="remote-video-container">
                {remoteParticipants.map((remote, index) => (
                    <div key={index}>
                        <video
                            ref={(video) => {
                                if (video) {
                                    video.srcObject = new MediaStream([remote.track.mediaStreamTrack]); // Corrected
                                    video.play();
                                }
                            }}
                            width="320"
                            height="240"
                        />
                    </div>
                ))}
            </div>

            <button onClick={handleLeaveRoom}>Leave Room</button>
        </div>
    );
};

export default Chat;
