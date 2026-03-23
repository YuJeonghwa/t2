const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const ui = {
    startBtn: document.getElementById('start-btn'),
    retryBtn: document.getElementById('retry-btn'),
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    question: document.getElementById('question'),
    answerBtns: document.querySelectorAll('.answer-btn'),
    feedback: document.getElementById('feedback'),
    finalScore: document.getElementById('final-score'),
    evaluation: document.getElementById('evaluation'),
    questionContainer: document.querySelector('.question-container')
};

let gameState = {
    score: 0,
    lives: 3,
    currentQuestion: {
        num1: 0,
        num2: 0,
        answer: 0
    },
    isPlaying: false
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

function switchScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.isPlaying = true;
    updateUI();
    generateQuestion();
    switchScreen('game');
}

function endGame() {
    gameState.isPlaying = false;
    ui.finalScore.textContent = gameState.score;
    
    let evalText = "";
    if (gameState.score > 20) evalText = "구구단 천재! 🎓✨";
    else if (gameState.score > 10) evalText = "대단해요! 👍";
    else evalText = "조금 더 연습해봐요! 💪";
    
    ui.evaluation.textContent = evalText;
    switchScreen('result');
}

function updateUI() {
    ui.score.textContent = gameState.score;
    ui.lives.textContent = '❤️'.repeat(gameState.lives) + '🖤'.repeat(3 - gameState.lives);
}

function generateQuestion() {
    // 2단부터 9단까지
    const num1 = Math.floor(Math.random() * 8) + 2; 
    const num2 = Math.floor(Math.random() * 9) + 1; // 1~9
    gameState.currentQuestion.num1 = num1;
    gameState.currentQuestion.num2 = num2;
    gameState.currentQuestion.answer = num1 * num2;
    
    ui.question.textContent = `${num1} X ${num2} = ?`;
    
    // Animation reset
    ui.questionContainer.classList.remove('jelly');
    void ui.questionContainer.offsetWidth; // trigger reflow
    ui.questionContainer.style.animation = 'none';
    setTimeout(() => ui.questionContainer.style.animation = 'jelly 0.5s', 10);

    // 오답 생성
    let answers = [gameState.currentQuestion.answer];
    while(answers.length < 4) {
        const wrongOffset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const wrongAns = Math.max(1, gameState.currentQuestion.answer + wrongOffset + (Math.random() > 0.5 ? num1 : 0));
        if(!answers.includes(wrongAns) && wrongAns !== gameState.currentQuestion.answer && wrongAns > 0) {
            answers.push(wrongAns);
        }
    }
    
    // 정답 섞기
    answers.sort(() => Math.random() - 0.5);
    
    ui.answerBtns.forEach((btn, index) => {
        btn.textContent = answers[index];
        btn.onclick = () => checkAnswer(answers[index], btn);
    });
}

function showFeedback(isCorrect) {
    const fx = ui.feedback;
    fx.textContent = isCorrect ? '⭕' : '❌';
    fx.classList.remove('feedback-anim');
    void fx.offsetWidth;
    fx.classList.add('feedback-anim');
    
    if (!isCorrect) {
        document.getElementById('app').classList.add('shake');
        setTimeout(() => document.getElementById('app').classList.remove('shake'), 400);
    }
}

function checkAnswer(selectedAns, btnElement) {
    if(!gameState.isPlaying) return;
    
    btnElement.classList.remove('jelly');
    void btnElement.offsetWidth;
    btnElement.style.animation = 'none';
    setTimeout(() => btnElement.style.animation = 'jelly 0.3s', 10);

    if (selectedAns === gameState.currentQuestion.answer) {
        playSound('correct');
        gameState.score += 1;
        showFeedback(true);
        updateUI();
        setTimeout(generateQuestion, 500);
    } else {
        playSound('wrong');
        gameState.lives -= 1;
        showFeedback(false);
        updateUI();
        
        if (gameState.lives <= 0) {
            setTimeout(endGame, 500);
        } else {
            setTimeout(generateQuestion, 500);
        }
    }
}

ui.startBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startGame();
});

ui.retryBtn.addEventListener('click', startGame);
