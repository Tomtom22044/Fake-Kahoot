import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { socket } from '../socket';

const PlayerGame = () => {
    const { pin } = useParams();
    const location = useLocation();
    const playerName = location.state?.name || "שחקן";

    const [gameState, setGameState] = useState('waiting'); // waiting, question, answered, results, final
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState(0);

    useEffect(() => {
        socket.on('new_question', (data) => {
            setGameState('question');
            setCurrentQuestion(data.question);
            setIsCorrect(null);
        });

        socket.on('answer_feedback', (data) => {
            setGameState('answered');
            setIsCorrect(data.isCorrect);
        });

        socket.on('answer_results', (data) => {
            setGameState('results');
            const myPlayer = data.leaderboard.find(p => p.name === playerName);
            if (myPlayer) {
                setScore(myPlayer.score);
                setRank(myPlayer.rank);
            }
        });

        socket.on('game_finished', (data) => {
            setGameState('final');
            const myPlayer = data.leaderboard.find(p => p.name === playerName);
            if (myPlayer) {
                setScore(myPlayer.score);
                setRank(myPlayer.rank);
            }
        });

        socket.on('game_closed', () => {
            alert("המשחק נסגר על ידי המנחה!");
            window.location.href = "/";
        });

        return () => {
            socket.off('new_question');
            socket.off('answer_feedback');
            socket.off('answer_results');
            socket.off('game_finished');
            socket.off('game_closed');
        };
    }, [playerName]);

    const submitAnswer = (index) => {
        socket.emit('submit_answer', { answerIndex: index });
    };

    const colors = [
        'bg-[#e21b3c]', // red
        'bg-[#1368ce]', // blue
        'bg-[#d89e00]', // yellow
        'bg-[#26890c]', // green
    ];

    if (gameState === 'waiting') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-4">
                <h2 className="text-3xl font-black mb-4">שלום {playerName}!</h2>
                <div className="text-xl animate-pulse font-bold text-gray-500">מחכים לשחקנים...</div>
            </div>
        );
    }

    if (gameState === 'question') {
        return (
            <div className="min-h-screen w-full flex flex-col bg-gray-50">
                {currentQuestion && (
                    <div className="bg-white p-6 shadow-md text-center text-3xl font-bold mb-2 flex items-center justify-center min-h-[120px]">
                        {currentQuestion.question}
                    </div>
                )}
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 p-2">
                    {colors.map((color, idx) => (
                        <button
                            key={idx}
                            onClick={() => submitAnswer(idx)}
                            className={`${color} rounded-lg shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center min-h-[150px] w-full border-b-8 border-black/20 focus:outline-none relative p-4`}
                        >
                            <div className="w-12 h-12 mb-2 bg-white/20 rounded-full flex flex-shrink-0 items-center justify-center">
                                {/* Decorative shapes commonly used in Kahoot */}
                                {idx === 0 && <div className="w-6 h-6 bg-white rotate-45" />}
                                {idx === 1 && <div className="w-6 h-6 bg-white rotate-45 skew-x-12" />}
                                {idx === 2 && <div className="w-6 h-6 bg-white rounded-full" />}
                                {idx === 3 && <div className="w-6 h-6 bg-white" />}
                            </div>
                            {currentQuestion && currentQuestion.answers[idx] && (
                                <span className="text-white text-xl font-bold text-center drop-shadow-md break-words">
                                    {currentQuestion.answers[idx]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="h-16 bg-white flex justify-between items-center px-6 shadow-up z-10 font-bold border-t border-gray-200 text-xl">
                    <span>{playerName}</span>
                    <span className="bg-black text-white px-4 py-1 rounded-full">{score}</span>
                </div>
            </div>
        );
    }

    if (gameState === 'answered') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-indigo-600 text-white p-4">
                <div className="text-6xl mb-6">⏳</div>
                <h2 className="text-3xl font-black mb-4">ממתין לתוצאות...</h2>
                <div className="text-xl font-medium opacity-80">שתף פעולה עם כולם, נראה אם צדקת!</div>
            </div>
        );
    }

    if (gameState === 'results') {
        return (
            <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 text-white transition-colors duration-500 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                <div className="text-8xl mb-6 drop-shadow-lg">
                    {isCorrect ? '✔' : '✖'}
                </div>
                <h2 className="text-5xl font-black mb-4 drop-shadow-md">
                    {isCorrect ? 'תשובה נכונה!' : 'תשובה לא נכונה'}
                </h2>
                <div className="bg-black/20 px-8 py-3 rounded-full mt-6 flex gap-4 text-xl font-bold shadow-inner">
                    <span>ניקוד: {score}</span>
                    <span>מקום: {rank}</span>
                </div>
                <div className="text-xl font-medium mt-auto mb-8 animate-pulse text-white/80">
                    מחכה לשאלה הבאה...
                </div>
            </div >
        );
    }

    if (gameState === 'final') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-purple-600 text-white p-4 text-center pb-24">
                <h1 className="text-5xl font-black mb-8 drop-shadow-lg">המשחק נגמר!</h1>
                <div className="bg-white/10 p-8 rounded-2xl shadow-xl w-full max-w-sm backdrop-blur-sm border border-white/20">
                    <h2 className="text-2xl font-bold mb-4">התוצאה שלך:</h2>
                    <div className="text-6xl font-black text-yellow-300 drop-shadow-md mb-4">{score}</div>
                    <p className="text-2xl font-bold">סיימת במקום: <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded text-3xl ml-1">{rank}</span></p>
                </div>
                <button className="mt-12 bg-white text-purple-800 font-bold py-3 px-8 rounded-full text-xl shadow-lg active:scale-95 transition" onClick={() => window.location.href = '/'}>
                    חזרה לדף הבית
                </button>
            </div>
        );
    }

    return null;
};

export default PlayerGame;
