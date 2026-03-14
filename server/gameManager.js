class GameManager {
    constructor() {
        this.games = new Map(); // pin -> game state
        this.players = new Map(); // socketId -> { pin, name, score }
    }

    generatePin() {
        let pin;
        do {
            pin = Math.floor(100000 + Math.random() * 900000).toString();
        } while (this.games.has(pin));
        return pin;
    }

    createGame(hostSocketId, quizData) {
        const pin = this.generatePin();
        this.games.set(pin, {
            host: hostSocketId,
            quiz: quizData,
            players: [], // array of { socketId, name, score, responseTime, hasAnswered }
            state: 'lobby', // lobby, question, round_results, final
            currentQuestionIndex: -1,
            roundStartTime: 0,
        });
        return pin;
    }

    getGame(pin) {
        return this.games.get(pin);
    }

    addPlayer(pin, socketId, name) {
        pin = String(pin);
        const game = this.games.get(pin);
        if (!game) {
            console.log(`addPlayer failed: game ${pin} not found. Active games:`, Array.from(this.games.keys()));
            return false;
        }

        const existingPlayer = game.players.find(p => p.name === name);
        if (existingPlayer) {
            if (existingPlayer.socketId !== socketId) {
                this.players.set(socketId, { pin, name });
                existingPlayer.socketId = socketId;
            }
            console.log(`addPlayer success: reconnected ${name}`);
            return true;
        }

        if (game.state !== 'lobby') {
            console.log(`addPlayer failed: game ${pin} already started, state=${game.state}`);
            return false;
        }

        const newPlayer = { socketId, name, score: 0, responseTime: 0, hasAnswered: false };
        game.players.push(newPlayer);
        this.players.set(socketId, { pin, name });
        console.log(`addPlayer success: new player ${name}`);
        return true;
    }

    removePlayer(socketId) {
        const playerInfo = this.players.get(socketId);
        if (!playerInfo) return null;

        const { pin } = playerInfo;
        const game = this.games.get(pin);
        if (game) {
            game.players = game.players.filter(p => p.socketId !== socketId);
        }
        this.players.delete(socketId);

        return { pin, game };
    }

    removeGameByHost(socketId) {
        let closedPin = null;
        for (const [pin, game] of this.games.entries()) {
            if (game.host === socketId) {
                closedPin = pin;
                // removing all players mapping
                game.players.forEach(p => this.players.delete(p.socketId));
                this.games.delete(pin);
                break;
            }
        }
        return closedPin;
    }

    nextQuestion(pin) {
        const game = this.games.get(pin);
        if (!game) return null;

        game.currentQuestionIndex++;
        if (game.currentQuestionIndex >= game.quiz.length) {
            game.state = 'final';
            return { state: 'final' };
        }

        game.state = 'question';
        game.roundStartTime = Date.now();

        // Reset players for the new round
        game.players.forEach(p => {
            p.hasAnswered = false;
            p.responseTime = 0;
        });

        return {
            state: 'question',
            question: game.quiz[game.currentQuestionIndex],
            questionIndex: game.currentQuestionIndex
        };
    }

    submitAnswer(socketId, answerIndex) {
        const playerInfo = this.players.get(socketId);
        if (!playerInfo) return null;

        const { pin } = playerInfo;
        const game = this.games.get(pin);
        if (!game || game.state !== 'question') return null;

        const player = game.players.find(p => p.socketId === socketId);
        if (!player || player.hasAnswered) return null; // Prevent multi answers

        player.hasAnswered = true;
        player.lastAnswerIndex = answerIndex;

        const currentQuestion = game.quiz[game.currentQuestionIndex];
        const isCorrect = (answerIndex === currentQuestion.correctIndex);

        const timeTaken = (Date.now() - game.roundStartTime) / 1000; // in seconds
        player.responseTime = timeTaken;

        if (isCorrect) {
            // Score calculation: 1000 - (responseTime * 50)
            // Max score 1000, min 0
            let points = Math.max(0, 1000 - Math.floor(timeTaken * 50));
            player.score += points;
        }

        return {
            pin,
            allAnswered: game.players.every(p => p.hasAnswered)
        };
    }

    getRoundResults(pin) {
        const game = this.games.get(pin);
        if (!game) return null;

        game.state = 'round_results';

        const currentQuestion = game.quiz[game.currentQuestionIndex];
        let answerCounts = new Array(currentQuestion.answers.length).fill(0);

        game.players.forEach(p => {
            if (p.hasAnswered && p.lastAnswerIndex >= 0 && p.lastAnswerIndex < answerCounts.length) {
                answerCounts[p.lastAnswerIndex]++;
            }
        });

        return {
            correctIndex: currentQuestion.correctIndex,
            answerCounts,
            leaderboard: this.getLeaderboard(pin)
        };
    }

    getLeaderboard(pin) {
        const game = this.games.get(pin);
        if (!game) return [];

        // Sort descending by score
        return [...game.players]
            .sort((a, b) => b.score - a.score)
            .map((p, index) => ({
                rank: index + 1,
                name: p.name,
                score: p.score
            }));
    }
}

module.exports = new GameManager();
