import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket';

const HostLobby = () => {
    const [pin, setPin] = useState(null);
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const quizData = location.state?.quizData;

    useEffect(() => {
        if (!quizData) {
            navigate('/host/create');
            return;
        }

        socket.emit('create_game', quizData, (response) => {
            setPin(response.pin);
        });

        const handlePlayerJoined = (player) => {
            setPlayers((prev) => [...prev, player]);
        };

        const handlePlayerLeft = (data) => {
            setPlayers((prev) => prev.filter(p => p.socketId !== data.socketId));
        };

        socket.on('player_joined', handlePlayerJoined);
        socket.on('player_left', handlePlayerLeft);

        return () => {
            socket.off('player_joined', handlePlayerJoined);
            socket.off('player_left', handlePlayerLeft);
        };
    }, []);

    const handleStartGame = () => {
        if (!pin) return;
        socket.emit('start_game', pin);
        navigate(`/host/game/${pin}`);
    };

    if (!pin) {
        return <div className="min-h-screen flex items-center justify-center"><h2 className="text-3xl font-bold animate-pulse">מייצר משחק...</h2></div>;
    }

    // QR Join Link
    const joinUrl = `${window.location.origin}/join?pin=${pin}`;

    return (
        <div className="flex flex-col min-h-screen w-full bg-gray-50 p-6 pt-12 items-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl text-center">
                <h1 className="text-2xl font-semibold text-gray-500 mb-2">קוד משחק</h1>
                <div className="text-7xl font-black text-indigo-700 tracking-widest mb-8">{pin}</div>

                <div className="mb-8">
                    <p className="text-gray-600 mb-2 font-medium">סרוק להצטרפות מהירה:</p>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`}
                        alt="QR Code"
                        className="mx-auto rounded border-4 border-white shadow-sm"
                    />
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-800">שחקנים שממתינים: {players.length}</h2>
                    </div>
                    <button
                        onClick={handleStartGame}
                        disabled={players.length === 0}
                        className={`font-bold py-3 px-8 rounded-lg text-2xl transition shadow-lg ${players.length > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        התחל משחק
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap w-full max-w-4xl mt-8 gap-4 justify-center">
                {players.map((p, idx) => (
                    <div key={idx} className="bg-white px-6 py-3 rounded-full text-xl font-bold shadow-md text-indigo-900 border border-indigo-100 pop-animation">
                        {p.name}
                    </div>
                ))}
                {players.length === 0 && (
                    <div className="text-2xl text-gray-400 font-medium animate-pulse mt-8">
                        מחכה לשחקנים...
                    </div>
                )}
            </div>

            <style>{`
        .pop-animation { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
        </div>
    );
};

export default HostLobby;
