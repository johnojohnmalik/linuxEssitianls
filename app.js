(function() {
  const STORAGE_KEYS = {
    weak: 'linux-essentials-weak',
    mastered: 'linux-essentials-mastered'
  };

  let currentIndex = 0;
  let currentDeck = [];
  let isFlipped = false;
  let isExamMode = false;
  let examScore = 0;
  let currentShuffledOptions = null;

  const card = document.getElementById('card');
  const questionEl = document.getElementById('question');
  const optionsEl = document.getElementById('options');
  const answerEl = document.getElementById('answer');
  const explanationEl = document.getElementById('explanation');
  const cardNumEl = document.getElementById('cardNum');
  const progressEl = document.getElementById('progress');
  const masteredEl = document.getElementById('mastered');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnWeak = document.getElementById('btnWeak');
  const btnMastered = document.getElementById('btnMastered');
  const btnWrong = document.getElementById('btnWrong');
  const modeBtns = document.querySelectorAll('.mode-btn');
  const mainContent = document.getElementById('mainContent');
  const examResults = document.getElementById('examResults');
  const examScoreEl = document.getElementById('examScore');
  const examRetryBtn = document.getElementById('examRetryBtn');

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getWeakIds() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.weak) || '[]');
    } catch {
      return [];
    }
  }

  function getMasteredIds() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.mastered) || '[]');
    } catch {
      return [];
    }
  }

  function setWeakIds(ids) {
    localStorage.setItem(STORAGE_KEYS.weak, JSON.stringify(ids));
  }

  function setMasteredIds(ids) {
    localStorage.setItem(STORAGE_KEYS.mastered, JSON.stringify(ids));
  }

  function formatAnswerByContent(q) {
    const ans = q.answer;
    if (!q.options) return ans;
    const letters = ans.split('');
    return letters.map(l => q.options[l]).filter(Boolean).join('\n');
  }

  function buildDeck(mode) {
    isExamMode = mode === 'exam';
    examScore = 0;

    if (mode === 'exam') {
      const shuffled = shuffle(QUESTIONS);
      currentDeck = shuffled.slice(0, 40);
      mainContent.classList.add('exam-mode');
      examResults.classList.add('hidden');
      examResults.innerHTML = '';
    } else {
      mainContent.classList.remove('exam-mode');
      if (mode === 'weak') {
        const weakIds = getWeakIds();
        currentDeck = QUESTIONS.filter(q => weakIds.includes(q.id));
        if (currentDeck.length === 0) currentDeck = [...QUESTIONS];
      } else if (mode === 'random') {
        currentDeck = shuffle(QUESTIONS);
      } else {
        currentDeck = [...QUESTIONS];
      }
    }

    currentIndex = 0;
    isFlipped = false;
    currentShuffledOptions = null;
    renderCard();
  }

  function renderCard() {
    const q = currentDeck[currentIndex];
    if (!q) return;

    questionEl.textContent = q.question;
    optionsEl.innerHTML = '';

    if (q.options) {
      const keys = Object.keys(q.options);
      currentShuffledOptions = shuffle(keys);

      currentShuffledOptions.forEach((letter, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = `${String.fromCharCode(65 + idx)}. ${q.options[letter]}`;
        optionsEl.appendChild(div);
      });

      const correctText = formatAnswerByContent(q);
      answerEl.textContent = 'Correct answer(s):\n\n' + correctText;
    } else {
      currentShuffledOptions = null;
      answerEl.textContent = 'Answer: ' + q.answer;
    }
    if (explanationEl) {
      if (q.explanation) {
        explanationEl.textContent = 'Why: ' + q.explanation;
        explanationEl.classList.remove('hidden');
      } else {
        explanationEl.textContent = '';
        explanationEl.classList.add('hidden');
      }
    }

    cardNumEl.textContent = `Question ${currentIndex + 1} of ${currentDeck.length}`;
    card.classList.remove('flipped');
    isFlipped = false;

    updateProgress();

    if (isExamMode) {
      btnPrev.classList.add('hidden');
      btnWeak.classList.add('hidden');
      btnMastered.classList.remove('hidden');
      btnMastered.textContent = 'Got it right';
      if (btnWrong) btnWrong.classList.remove('hidden');
      btnNext.classList.add('hidden');
    } else {
      btnPrev.classList.remove('hidden');
      btnPrev.disabled = currentIndex === 0;
      btnWeak.classList.remove('hidden');
      btnMastered.textContent = 'Got it!';
      if (btnWrong) btnWrong.classList.add('hidden');
      btnNext.classList.remove('hidden');
      btnNext.disabled = currentIndex === currentDeck.length - 1;
    }
  }

  function updateProgress() {
    const mastered = getMasteredIds();
    const total = QUESTIONS.length;
    const count = mastered.length;
    progressEl.textContent = `${count}/${total}`;
    masteredEl.textContent = `✓ ${count} mastered`;
  }

  function flipCard() {
    isFlipped = !isFlipped;
    card.classList.toggle('flipped', isFlipped);
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      isFlipped = false;
      renderCard();
    }
  }

  function goNext() {
    if (isExamMode) {
      if (currentIndex < currentDeck.length - 1) {
        currentIndex++;
        isFlipped = false;
        renderCard();
      } else {
        showExamResults();
      }
    } else {
      if (currentIndex < currentDeck.length - 1) {
        currentIndex++;
        isFlipped = false;
        renderCard();
      }
    }
  }

  function showExamResults() {
    mainContent.classList.add('hidden');
    examResults.classList.remove('hidden');
    const pct = Math.round((examScore / currentDeck.length) * 100);
    examScoreEl.innerHTML = `
      <span class="score-number">${examScore}/${currentDeck.length}</span>
      <span class="score-pct">${pct}%</span>
    `;
    const passThreshold = 70;
    examResults.classList.toggle('passed', pct >= passThreshold);
  }

  function markCorrect() {
    if (isExamMode) {
      examScore++;
    } else {
      const q = currentDeck[currentIndex];
      if (q) {
        const mastered = getMasteredIds();
        if (!mastered.includes(q.id)) {
          mastered.push(q.id);
          setMasteredIds(mastered);
        }
      }
    }
    btnMastered.textContent = '✓';
    btnMastered.disabled = true;
    setTimeout(() => {
      btnMastered.textContent = isExamMode ? 'Got it right' : 'Got it!';
      btnMastered.disabled = false;
    }, 800);
    if (currentIndex < currentDeck.length - 1) {
      setTimeout(goNext, 400);
    } else if (isExamMode) {
      setTimeout(showExamResults, 400);
    }
  }

  function markWrong() {
    if (isExamMode && btnWrong) {
      btnWrong.classList.add('pressed');
      setTimeout(() => btnWrong && btnWrong.classList.remove('pressed'), 300);
      if (currentIndex < currentDeck.length - 1) {
        setTimeout(goNext, 300);
      } else {
        setTimeout(showExamResults, 300);
      }
    }
  }

  function markWeak() {
    if (isExamMode) return;
    const q = currentDeck[currentIndex];
    if (!q) return;
    const weak = getWeakIds();
    if (!weak.includes(q.id)) {
      weak.push(q.id);
      setWeakIds(weak);
    }
    btnWeak.textContent = '✓ Marked';
    btnWeak.disabled = true;
    setTimeout(() => {
      btnWeak.textContent = 'Mark weak';
      btnWeak.disabled = false;
    }, 1500);
  }

  function markMastered() {
    if (isExamMode) {
      markCorrect();
      return;
    }
    const q = currentDeck[currentIndex];
    if (!q) return;
    const mastered = getMasteredIds();
    if (!mastered.includes(q.id)) {
      mastered.push(q.id);
      setMasteredIds(mastered);
    }
    btnMastered.textContent = '✓ Got it!';
    btnMastered.disabled = true;
    updateProgress();
    setTimeout(() => {
      btnMastered.textContent = 'Got it!';
      btnMastered.disabled = false;
    }, 1000);
    if (currentIndex < currentDeck.length - 1) {
      setTimeout(goNext, 500);
    }
  }

  card.addEventListener('click', flipCard);

  btnPrev.addEventListener('click', goPrev);
  btnNext.addEventListener('click', goNext);
  btnWeak.addEventListener('click', markWeak);
  btnMastered.addEventListener('click', markMastered);

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildDeck(btn.dataset.mode);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      flipCard();
    } else if (e.code === 'ArrowLeft') goPrev();
    else if (e.code === 'ArrowRight') goNext();
  });

  if (btnWrong) btnWrong.addEventListener('click', markWrong);
  if (examRetryBtn) {
    examRetryBtn.addEventListener('click', () => {
      examResults.classList.add('hidden');
      mainContent.classList.remove('hidden');
      buildDeck('exam');
    });
  }

  buildDeck('learn');
})();
