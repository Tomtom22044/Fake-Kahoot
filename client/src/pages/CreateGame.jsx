import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateGame = () => {
    const navigate = useNavigate();
    const [quizTitle, setQuizTitle] = useState('שאלון חדש');
    const [savedQuizzes, setSavedQuizzes] = useState([]);
    const [activeQuizId, setActiveQuizId] = useState(null);

    const [questions, setQuestions] = useState([
        {
            question: '',
            answers: ['', '', '', ''],
            correctIndex: 0,
            timeLimit: 20
        }
    ]);

    useEffect(() => {
        const saved = localStorage.getItem('kahoot_cl_quizzes');
        if (saved) {
            setSavedQuizzes(JSON.parse(saved));
        }
    }, []);

    const handleSaveQuiz = () => {
        if (!quizTitle.trim()) {
            alert("נא להזין כותרת לשאלון");
            return;
        }

        // Basic validation before saving
        for (const q of questions) {
            if (!q.question.trim()) {
                alert("לא ניתן לשמור שאלון עם שאלות ריקות. נא למלא תוכן מינימלי בשאלות.");
                return;
            }
        }

        const idToSave = activeQuizId || Date.now();
        const newQuiz = {
            id: idToSave,
            title: quizTitle,
            questions: questions,
            updatedAt: new Date().toISOString()
        };

        const updatedQuizzes = activeQuizId
            ? savedQuizzes.map(q => q.id === activeQuizId ? newQuiz : q)
            : [...savedQuizzes, newQuiz];

        setSavedQuizzes(updatedQuizzes);
        setActiveQuizId(idToSave);
        localStorage.setItem('kahoot_cl_quizzes', JSON.stringify(updatedQuizzes));
        alert("השאלון נשמר בהצלחה בדפדפן שלך!");
    };

    const loadSavedQuiz = (quiz) => {
        if (window.confirm("האם לטעון את השאלון הזה? כל שינוי נוכחי שלא נשמר יאבד.")) {
            setQuizTitle(quiz.title);
            setQuestions(quiz.questions);
            setActiveQuizId(quiz.id);
        }
    };

    const handleQuestionChange = (index, value) => {
        const newQs = [...questions];
        newQs[index].question = value;
        setQuestions(newQs);
    };

    const handleAnswerChange = (qIndex, aIndex, value) => {
        const newQs = [...questions];
        newQs[qIndex].answers[aIndex] = value;
        setQuestions(newQs);
    };

    const setCorrectAnswer = (qIndex, aIndex) => {
        const newQs = [...questions];
        newQs[qIndex].correctIndex = aIndex;
        setQuestions(newQs);
    };

    const setTimeLimit = (qIndex, value) => {
        const newQs = [...questions];
        newQs[qIndex].timeLimit = Number(value);
        setQuestions(newQs);
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question: '',
                answers: ['', '', '', ''],
                correctIndex: 0,
                timeLimit: 20
            }
        ]);
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        const newQs = questions.filter((_, i) => i !== index);
        setQuestions(newQs);
    };

    const handleCreateGame = () => {
        // Validate
        for (const q of questions) {
            if (!q.question.trim()) {
                alert("נא למלא את כל השאלות");
                return;
            }
            for (const a of q.answers) {
                if (!a.trim()) {
                    alert("נא למלא את כל התשובות בכל השאלות");
                    return;
                }
            }
        }
        navigate('/host/lobby', { state: { quizData: questions } });
    };

    const colors = [
        'text-[#e21b3c] focus:border-[#e21b3c]',
        'text-[#1368ce] focus:border-[#1368ce]',
        'text-[#d89e00] focus:border-[#d89e00]',
        'text-[#26890c] focus:border-[#26890c]'
    ];

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6 w-full pb-20">
            <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-gray-100 pb-6 relative z-10">
                    <input
                        type="text"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="כותרת השאלון..."
                        className="text-4xl font-black text-indigo-800 drop-shadow-sm bg-transparent border-b-4 border-transparent hover:border-indigo-100 focus:border-indigo-600 focus:outline-none text-center md:text-right w-full md:w-auto transition-all"
                    />
                    <div className="flex gap-3">
                        {savedQuizzes.length > 0 && (
                            <div className="relative group">
                                <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold transition border border-gray-200">
                                    החידונים שלי ▾
                                </button>
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 hidden group-hover:block z-50 overflow-hidden">
                                    <div className="bg-gray-50 uppercase text-xs font-bold text-gray-500 p-3 text-right">שמורים בדפדפן</div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {[...savedQuizzes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(q => (
                                            <div key={q.id} onClick={() => loadSavedQuiz(q)} className="p-4 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition text-right">
                                                <div className="font-bold text-gray-800 truncate text-lg">{q.title}</div>
                                                <div className="text-sm text-gray-400 font-normal mt-1">{new Date(q.updatedAt).toLocaleString('he-IL')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <button onClick={handleSaveQuiz} className="bg-green-100 hover:bg-green-200 text-green-800 px-6 py-3 rounded-xl font-bold border border-green-300 transition shadow-sm flex items-center gap-2 active:scale-95">
                            <span className="text-2xl">💾</span> שמירה
                        </button>
                    </div>
                </div>

                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="mb-8 p-6 border-2 border-indigo-100 rounded-xl relative bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold bg-indigo-100 text-indigo-800 px-4 py-1 rounded-full">שאלה {qIndex + 1}</h2>
                            {questions.length > 1 && (
                                <button
                                    onClick={() => removeQuestion(qIndex)}
                                    className="text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 rounded-lg transition"
                                >
                                    הסר שאלה
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="הכנס את תוכן השאלה כאן..."
                            value={q.question}
                            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                            className="w-full text-2xl font-bold p-4 mb-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition text-center shadow-inner bg-gray-50"
                        />

                        <div className="mb-6 flex justify-end items-center gap-2">
                            <label className="font-bold text-gray-600">הגבלת זמן (בשניות):</label>
                            <select
                                value={q.timeLimit}
                                onChange={(e) => setTimeLimit(qIndex, e.target.value)}
                                className="p-2 border rounded font-bold bg-gray-50 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="60">60</option>
                            </select>
                        </div>

                        <p className="text-sm text-gray-500 mb-2 font-bold">* סמן את העיגול ליד התשובה הנכונה</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.answers.map((ans, aIndex) => (
                                <div key={aIndex} className={`flex items-center gap-3 p-3 border-2 rounded-lg transition ${q.correctIndex === aIndex ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name={`correct-${qIndex}`}
                                        checked={q.correctIndex === aIndex}
                                        onChange={() => setCorrectAnswer(qIndex, aIndex)}
                                        className="w-6 h-6 text-green-600 focus:ring-green-500 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        placeholder={`תשובה ${aIndex + 1}`}
                                        value={ans}
                                        onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value)}
                                        className={`w-full p-2 text-xl font-bold rounded focus:outline-none bg-transparent ${colors[aIndex]}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t font-bold border-gray-200 gap-4">
                    <button
                        onClick={addQuestion}
                        className="w-full md:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-xl text-xl transition shadow"
                    >
                        + הוסף שאלה
                    </button>

                    <button
                        onClick={handleCreateGame}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-xl text-2xl transition shadow-xl active:scale-95"
                    >
                        סיום ויצירת חדר משחק
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGame;
