const gameManager = require('./gameManager');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // HOST: Create a new game
        socket.on('create_game', (quizData, callback) => {
            const pin = gameManager.createGame(socket.id, quizData);
            socket.join(pin);
            callback({ pin });
        });

        // PLAYER: Join a game
        socket.on('join_game', ({ pin, name }, callback) => {
            console.log(`[Socket] join_game received: pin=${pin}, name=${name}, socketId=${socket.id}`);
            const success = gameManager.addPlayer(pin, socket.id, name);
            if (success) {
                socket.join(pin);
                // notify host and other players
                io.to(pin).emit('player_joined', { name, socketId: socket.id });
                callback({ success: true });
            } else {
                callback({ success: false, message: 'Game not found, already started, or name taken' });
            }
        });

        // HOST: Start the game -> shows first question
        socket.on('start_game', (pin) => {
            const result = gameManager.nextQuestion(pin);
            if (result) {
                io.to(pin).emit('new_question', result);
            }
        });

        // PLAYER: Submit answer
        socket.on('submit_answer', ({ answerIndex }) => {
            const playerInfo = gameManager.players.get(socket.id);
            if (!playerInfo) return;
            const { pin } = playerInfo;

            const game = gameManager.getGame(pin);
            if (!game || game.state !== 'question') return;

            const player = game.players.find(p => p.socketId === socket.id);
            if (!player) return;

            const prevAnswered = player.hasAnswered;

            gameManager.submitAnswer(socket.id, answerIndex);

            // Calculate isCorrect and points logic manually above? No, we just need to send whether it's right.
            const currentQuestion = game.quiz[game.currentQuestionIndex];
            const isCorrect = answerIndex === currentQuestion.correctIndex;

            // Let the player know right away if they are correct
            socket.emit('answer_feedback', { isCorrect });

            // If everyone answered, end round
            const allAnswered = game.players.every(p => p.hasAnswered);
            if (allAnswered) {
                game.state = 'round_results';

                let answerCounts = new Array(currentQuestion.answers.length).fill(0);
                game.players.forEach(p => {
                    if (p.hasAnswered && typeof p.lastAnswerIndex !== 'undefined') {
                        answerCounts[p.lastAnswerIndex]++;
                    }
                });

                io.to(pin).emit('answer_results', {
                    correctIndex: currentQuestion.correctIndex,
                    answerCounts,
                    leaderboard: gameManager.getLeaderboard(pin)
                });
            } else {
                io.to(game.host).emit('player_answered', { socketId: socket.id });
            }
        });

        // HOST: Time is up for question
        socket.on('time_up', (pin) => {
            const game = gameManager.getGame(pin);
            if (!game || game.state !== 'question') return;

            game.state = 'round_results';
            const currentQuestion = game.quiz[game.currentQuestionIndex];
            let answerCounts = new Array(currentQuestion.answers.length).fill(0);
            game.players.forEach(p => {
                if (p.hasAnswered && typeof p.lastAnswerIndex !== 'undefined') {
                    answerCounts[p.lastAnswerIndex]++;
                }
            });

            io.to(pin).emit('answer_results', {
                correctIndex: currentQuestion.correctIndex,
                answerCounts,
                leaderboard: gameManager.getLeaderboard(pin)
            });
        });

        // HOST: Next round or final results
        socket.on('next_round', (pin) => {
            const result = gameManager.nextQuestion(pin);
            if (result) {
                if (result.state === 'final') {
                    io.to(pin).emit('game_finished', {
                        leaderboard: gameManager.getLeaderboard(pin)
                    });
                } else {
                    io.to(pin).emit('new_question', result);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);

            // Check if it was a host
            const closedPin = gameManager.removeGameByHost(socket.id);
            if (closedPin) {
                io.to(closedPin).emit('game_closed');
            } else {
                // Player disconnected
                const res = gameManager.removePlayer(socket.id);
                if (res && res.pin) {
                    io.to(res.pin).emit('player_left', { socketId: socket.id });
                }
            }
        });
    });
};
