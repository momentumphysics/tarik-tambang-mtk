document.addEventListener('DOMContentLoaded', () => {
    console.log("New script loaded!");
    // Screens
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');

    // Buttons
    const startButton = document.getElementById('start-button');
    const playAgainButton = document.getElementById('play-again-button');
    const answerLeftButton = document.getElementById('answer-left');
    const answerRightButton = document.getElementById('answer-right');

    // Player Info
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const p1NameDisplay = document.getElementById('p1-name-display');
    const p2NameDisplay = document.getElementById('p2-name-display');

    // Game Elements
    const rope = document.getElementById('rope');
    const questionEl = document.getElementById('question');
    const winnerMessage = document.getElementById('winner-message');

    // Game State
    let player1Name = 'Pemain 1';
    let player2Name = 'Pemain 2';
    let ropePosition = 50;
    const pullStrength = 1;
    let currentCorrectAnswer = null;
    let gameActive = false;

    // --- Event Listeners ---

    startButton.addEventListener('click', startGame);
    playAgainButton.addEventListener('click', resetGame);
    document.addEventListener('keydown', handleKeyPress);

    // --- Functions ---

    function startGame() {
        player1Name = player1Input.value || 'Pemain 1';
        player2Name = player2Input.value || 'Pemain 2';

        if (!player1Input.value || !player2Input.value) {
            alert('Silakan masukkan nama untuk kedua pemain.');
            return;
        }

        p1NameDisplay.textContent = player1Name;
        p2NameDisplay.textContent = player2Name;

        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        resetRope();
        getNewQuestion();
    }

    function resetGame() {
        endScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        player1Input.value = '';
        player2Input.value = '';
    }

    function resetRope() {
        ropePosition = 50;
        updateRope();
    }

    async function getNewQuestion() {
        gameActive = false; // Disable input immediately
        try {
            const response = await fetch('/question');
            const data = await response.json();

            questionEl.textContent = data.question + ' = ?';
            answerLeftButton.textContent = data.answers[0];
            answerRightButton.textContent = data.answers[1];
            currentCorrectAnswer = data.correct;

            // Re-enable input after a delay
            setTimeout(() => {
                gameActive = true;
            }, 200);

        } catch (error) {
            console.error('Gagal mengambil soal:', error);
            questionEl.textContent = 'Gagal memuat soal.';
            // Even if there's an error, re-enable input after a delay
            setTimeout(() => {
                gameActive = true;
            }, 200);
        }
    }

    function handleKeyPress(e) {
        if (!gameActive) return;

        const answerLeftValue = parseInt(answerLeftButton.textContent);
        const answerRightValue = parseInt(answerRightButton.textContent);

        let player = null;
        let chosenAnswer = null;

        // Player 1 controls
        if (e.key.toLowerCase() === 'a') {
            player = 1;
            chosenAnswer = answerLeftValue;
        }
        if (e.key.toLowerCase() === 'd') {
            player = 1;
            chosenAnswer = answerRightValue;
        }

        // Player 2 controls
        if (e.key === 'ArrowLeft') {
            player = 2;
            chosenAnswer = answerLeftValue;
        }
        if (e.key === 'ArrowRight') {
            player = 2;
            chosenAnswer = answerRightValue;
        }

        if (player) {
            checkAnswer(player, chosenAnswer);
        }
    }

    function checkAnswer(player, answer) {
        if (answer === currentCorrectAnswer) {
            // Correct answer
            if (player === 1) {
                ropePosition -= pullStrength;
            } else { // player === 2
                ropePosition += pullStrength;
            }
        } else {
            // Wrong answer
            if (player === 1) {
                ropePosition += pullStrength;
            } else { // player === 2
                ropePosition -= pullStrength;
            }
        }
        updateRope();
        checkWinCondition();
    }

    function updateRope() {
        rope.style.left = ropePosition + '%';
    }

    function checkWinCondition() {
        let winner = null;
        // Player 1 wins if the rope's center is at 40% or less
        if (ropePosition <= 44) {
            winner = player1Name;
        }
        // Player 2 wins if the rope's center is at 60% or more
        else if (ropePosition >= 56) {
            winner = player2Name;
        }

        if (winner) {
            gameActive = false;
            endGame(winner);
        }
        else {
            getNewQuestion();
        }
    }

    async function endGame(winner) {
        winnerMessage.textContent = `${winner} Menang!`;
        gameScreen.classList.add('hidden');
        endScreen.classList.remove('hidden');

        // Send winner to the server
        try {
            await fetch('/winner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ winner: winner })
            });
        } catch (error) {
            console.error('Gagal menyimpan pemenang:', error);
        }
    }
});
