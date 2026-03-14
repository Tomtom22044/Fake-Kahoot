import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 w-full">
            <h1 className="text-5xl font-black text-gray-800 mb-12 drop-shadow-md tracking-tight">Kahoot! Clone</h1>
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <button
                    onClick={() => navigate('/host/create')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg text-2xl shadow-lg transform transition active:scale-95"
                >
                    יצירת משחק
                </button>
                <button
                    onClick={() => navigate('/join')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-2xl shadow-lg transform transition active:scale-95"
                >
                    הצטרפות למשחק
                </button>
            </div>
        </div>
    );
};

export default Home;
