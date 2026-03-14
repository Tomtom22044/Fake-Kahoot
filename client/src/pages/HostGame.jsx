import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';

const HostGame = () => {
    const { pin } = useParams();
    const [gameState, setGameState] = useState('loading'); // loading, question, results, final
    const [questionData, setQuestionData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(20);
    const [resultsData, setResultsData] = useState(null);
    const [answersCount, setAnswersCount] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        socket.on('new_question', (data) => {
            setGameState('question');
            setQuestionData(data.question);
            setTimeLeft(data.question.timeLimit || 20);
            setAnswersCount(0);

            // Clear old timer if any
            if (timerRef.current) clearInterval(timerRef.current);

            // Start timer
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        socket.emit('time_up', pin);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        socket.on('player_answered', () => {
            setAnswersCount(prev => prev + 1);
        });

        socket.on('answer_results', (data) => {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('results');
            setResultsData(data);
        });

        socket.on('game_finished', (data) => {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('final');
            setResultsData(data);
        });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            socket.off('new_question');
            socket.off('player_answered');
            socket.off('answer_results');
            socket.off('game_finished');
        };
    }, [pin]);

    const handleNext = () => {
        socket.emit('next_round', pin);
    };

    const colors = [
        'bg-[#e21b3c]', // Kahoot red
        'bg-[#1368ce]', // Kahoot blue
        'bg-[#d89e00]', // Kahoot yellow
        'bg-[#26890c]', // Kahoot green
    ];

    if (gameState === 'loading') {
        return <div className="min-h-screen flex items-center justify-center font-bold text-3xl">טוען שאלה...</div>;
    }

    if (gameState === 'final') {
        const sortedLeaderboard = resultsData?.leaderboard?.sort((a, b) => a.rank - b.rank) || [];
        const top3 = sortedLeaderboard.slice(0, 3);

        return (
            <div className="min-h-screen flex flex-col items-center bg-indigo-900 w-full p-8 text-white relative overflow-hidden">
                <h1 className="text-6xl font-black mb-12 drop-shadow-lg z-10 text-center">המשחק נגמר!</h1>
                <h2 className="text-4xl font-bold mb-16 z-10 text-center">🏆 המנצחים 🏆</h2>

                <div className="flex gap-8 items-end z-10 mb-12 h-64">
                    {top3[1] && (
                        <div className="flex flex-col items-center animate-slideUp" style={{ animationDelay: '0.4s' }}>
                            <span className="text-3xl font-bold mb-2 break-all text-center px-2">{top3[1].name}</span>
                            <span className="text-xl opacity-80 mb-2">{top3[1].score} נק'</span>
                            <div className="w-32 bg-gray-400 h-32 rounded-t-lg flex items-start justify-center pt-4">
                                <span className="text-4xl text-white font-black">2</span>
                            </div>
                        </div>
                    )}
                    {top3[0] && (
                        <div className="flex flex-col items-center animate-slideUp" style={{ animationDelay: '1.2s' }}>
                            <span className="text-4xl font-black mb-2 break-all text-center px-2 text-yellow-300">{top3[0].name}</span>
                            <span className="text-xl opacity-80 mb-2">{top3[0].score} נק'</span>
                            <div className="w-32 bg-yellow-500 h-48 rounded-t-lg flex items-start justify-center pt-4 shadow-2xl">
                                <span className="text-5xl text-white font-black">1</span>
                            </div>
                        </div>
                    )}
                    {top3[2] && (
                        <div className="flex flex-col items-center animate-slideUp" style={{ animationDelay: '0s' }}>
                            <span className="text-2xl font-semibold mb-2 break-all text-center px-2">{top3[2].name}</span>
                            <span className="text-xl opacity-80 mb-2">{top3[2].score} נק'</span>
                            <div className="w-32 bg-orange-700 h-24 rounded-t-lg flex items-start justify-center pt-4">
                                <span className="text-3xl text-white font-black">3</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Simple Confetti Implementation via CSS */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                </div>

                <style>{`
          .animate-slideUp {
            animation: slideUp 1s ease-out both;
          }
          @keyframes slideUp {
            0% { transform: translateY(100px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 w-full p-6 pt-12 items-center text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-5xl mb-8 relative">
                <h2 className="text-4xl font-bold text-gray-800 leading-tight">{questionData?.question}</h2>
                {gameState === 'question' && (
                    <div className="absolute top-8 left-8 bg-indigo-100 text-indigo-800 font-bold px-4 py-2 rounded-full text-xl border border-indigo-200">
                        ענו: {answersCount}
                    </div>
                )}
            </div>

            {gameState === 'question' && (
                <div className="flex-1 w-full max-w-5xl flex flex-col justify-end">
                    <div className="w-full flex justify-between items-end mb-8">
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-xl transition-transform ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}>
                            {timeLeft}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-64">
                        {questionData?.answers.map((ans, idx) => (
                            <div key={idx} className={`${colors[idx]} rounded-lg shadow border-b-4 border-black/20 flex items-center justify-center p-4`}>
                                <span className="text-3xl font-bold text-white text-center break-words w-full px-4 drop-shadow-md">{ans}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'results' && (
                <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center">
                    <div className="w-full grid grid-cols-2 gap-4 h-64 mb-8">
                        {questionData?.answers.map((ans, idx) => {
                            const isCorrect = idx === resultsData.correctIndex;
                            const count = resultsData.answerCounts[idx] || 0;
                            return (
                                <div key={idx} className={`${isCorrect ? colors[idx] : 'bg-gray-300'} rounded-lg shadow-sm flex flex-col items-center justify-center p-4 opacity-${isCorrect ? '100' : '50'} transition-all`}>
                                    <span className="text-3xl font-bold text-white text-center drop-shadow mb-4">{ans}</span>
                                    {isCorrect && <span className="text-white text-2xl font-black bg-black/20 px-4 py-1 rounded-full">✔ נכון</span>}
                                    <span className="text-2xl font-bold text-black/50 mt-2 bg-white/30 px-3 rounded">{count} ענו</span>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 rounded-full text-2xl shadow-xl transition active:transform active:scale-95"
                    >
                        הבא
                    </button>
                </div>
            )}
        </div>
    );
};

export default HostGame;
