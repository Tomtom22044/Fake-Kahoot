import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const Join = () => {
    const location = new URLSearchParams(window.location.search);
    const initialPin = location.get('pin') || '';
    const [pin, setPin] = useState(initialPin);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleJoin = (e) => {
        e.preventDefault();
        if (!pin || !name) {
            setError('נא למלא את כל השדות');
            return;
        }

        const cleanPin = pin.toString().trim();
        const cleanName = name.trim();

        socket.emit('join_game', { pin: cleanPin, name: cleanName }, (response) => {
            if (response.success) {
                navigate(`/player/game/${cleanPin}`, { state: { name: cleanName } });
            } else {
                setError(response.message || 'שגיאה בהצטרפות למשחק');
            }
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 w-full">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">הצטרפות למשחק</h2>
                <form onSubmit={handleJoin} className="flex flex-col gap-4">
                    <input
                        type="number"
                        placeholder="קוד משחק"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full text-center text-2xl p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                    />
                    <input
                        type="text"
                        placeholder="שם שחקן"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-center text-2xl p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                    />
                    {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-gray-800 text-white font-bold p-4 mt-2 rounded-lg text-2xl hover:bg-black transition active:scale-95 shadow-md"
                    >
                        הצטרף
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Join;
