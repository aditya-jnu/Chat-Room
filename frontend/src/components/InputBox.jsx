import React, { useState } from 'react';
import Chat from './Chat';
import { useNavigate } from 'react-router-dom';

export default function InputBox() {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState('');

    const handleJoinRoom = () => {
        if (roomCode.trim()) {
            console.log(`Joining room with code: ${roomCode}`);
            navigate(`/room/${roomCode}`)
        } else {
            alert('Please enter a valid room code to join.');
        }
    };

    const handleCreateRoom = () => {
        const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Example room code generator
        console.log(`Creating room with code: ${newRoomCode}`);
        // Add logic to handle creating a room here
    };

    return (
        <div className='h-screen w-screen bg-black flex flex-col gap-5 justify-center items-center'>
            <p className='text-white font-bold text-5xl'>Party Karyalay</p>
            <div className="p-5 border rounded-lg max-w-md">
                <div className=" mb-5">
                    <input type="text" placeholder="Enter room code" value={roomCode} 
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className='flex justify-between'>
                    <button onClick={handleJoinRoom}
                    className="px-6 py-2 mr-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >Join Room</button>
            
                    <button onClick={handleCreateRoom}
                    className="px-6 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >Create Room</button>
                </div>
            </div>
        </div>
    );
}

