/**
 * アプリケーションのメインスクリプト
 * イベントリスナーやナビゲーション機能を設定
 */

// 画面要素の参照
const homeScreen = document.getElementById('home-screen');
const pitchQuizScreen = document.getElementById('pitch-quiz-screen');
const noteQuizScreen = document.getElementById('note-quiz-screen');
const progressScreen = document.getElementById('progress-screen');
const audioOverlay = document.getElementById('audio-overlay');

// 現在の画面
let currentScreen = 'home';

/**
 * アプリの初期化
 */
function initApp() {
  // イベントリスナーの設定
  setupEventListeners();
  
  // 初期レベルに応じて音符セットを更新
  updateNotesForLevel(level);
  
  // ホーム画面表示
  showScreen('home');
}


/**
 * 画面を切り替える関数
 * @param {string} screenId - 表示する画面のID
 */
function showScreen(screenId) {
  // すべての画面を非表示にする
  homeScreen.classList.remove('active');
  pitchQuizScreen.classList.remove('active');
  noteQuizScreen.classList.remove('active');
  progressScreen.classList.remove('active');
  
  // 指定された画面を表示する
  if (screenId === 'home') {
    homeScreen.classList.add('active');
    updateHomeScreenLevel(); // ホーム画面のレベル表示を更新
  } else if (screenId === 'pitch-quiz') {
    pitchQuizScreen.classList.add('active');
    startPitchQuiz();
    
    // オーディオ初期化チェック
    checkAudioInitialized();
  } else if (screenId === 'note-quiz') {
    noteQuizScreen.classList.add('active');
    startNoteQuiz();
    
    // オーディオ初期化チェック
    checkAudioInitialized();
  } else if (screenId === 'progress') {
    progressScreen.classList.add('active');
    updateProgressDisplay();
  }
  
  currentScreen = screenId;
}

/**
 * オーディオが初期化されているかチェックし、
 * 初期化されていない場合はオーバーレイを表示する
 */
function checkAudioInitialized() {
  if (!isAudioInitialized()) {
    audioOverlay.style.display = 'flex';
  } else {
    audioOverlay.style.display = 'none';
  }
}

/**
 * イベントリスナーを設定する関数
 */
function setupEventListeners() {
  // オーディオ初期化ボタン
  const initAudioBtn = document.getElementById('init-audio');
  if (initAudioBtn) {
    // クリックイベント
    initAudioBtn.addEventListener('click', async () => {
      console.log('Init audio button clicked');
      await initializeAudio();
    });
    
    // タッチイベント（スマホ対応）
    initAudioBtn.addEventListener('touchend', async (e) => {
      console.log('Init audio button touched');
      e.preventDefault(); // デフォルトの動作を防止
      await initializeAudio();
    }, false);
  }
  
  // ホーム画面ボタン
  document.getElementById('btn-pitch-quiz').addEventListener('click', () => {
    showScreen('pitch-quiz');
  });
  
  document.getElementById('btn-note-quiz').addEventListener('click', () => {
    showScreen('note-quiz');
  });
  
  document.getElementById('btn-progress').addEventListener('click', () => {
    showScreen('progress');
  });
  
  // ホームに戻るボタン
  const homeButtons = document.querySelectorAll('.go-home');
  homeButtons.forEach(button => {
    button.addEventListener('click', () => {
      showScreen('home');
    });
  });
  
  // 音を再生するボタン
  const playButton = document.getElementById('play-note');
  if (playButton) {
    playButton.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          playPitchQuizSound();
        });
      } else {
        playPitchQuizSound();
      }
    });
    
    // タッチイベント（スマホ対応）
    playButton.addEventListener('touchend', (e) => {
      e.preventDefault(); // デフォルトの動作を防止
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          playPitchQuizSound();
        });
      } else {
        playPitchQuizSound();
      }
    }, false);
  }
  
  // 音当てクイズの回答ボタン
  const pitchAnswerButtons = pitchQuizScreen.querySelectorAll('.btn-answer');
  pitchAnswerButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          checkPitchAnswer(button.dataset.note);
        });
      } else {
        checkPitchAnswer(button.dataset.note);
      }
    });
  });
  
  // 楽譜クイズの回答ボタン
  const noteAnswerButtons = noteQuizScreen.querySelectorAll('.btn-answer');
  noteAnswerButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          checkNoteAnswer(button.dataset.note);
        });
      } else {
        checkNoteAnswer(button.dataset.note);
      }
    });
  });

  // スコアリセットボタン
  document.getElementById('btn-reset-scores').addEventListener('click', () => {
    showResetConfirmation();
  });

  // オーディオオーバーレイ - 画面全体をタップ対応に
  if (audioOverlay) {
    audioOverlay.addEventListener('touchend', async (e) => {
      console.log('Audio overlay touched');
      e.preventDefault();
      await initializeAudio();
    }, false);
  }
}

// ページ読み込み完了時にアプリを初期化
document.addEventListener('DOMContentLoaded', initApp);


/**
 * スコアをローカルストレージに保存
 */
function saveScoresToStorage() {
  try {
    const scoreData = {
      pitchScore,
      noteScore,
      totalScore,
      level,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('musicQuizScores', JSON.stringify(scoreData));
    console.log('Scores saved to localStorage');
  } catch (error) {
    console.error('Failed to save scores to localStorage:', error);
  }
}

/**
 * ローカルストレージからスコアを読み込む
 */
function loadScoresFromStorage() {
  try {
    const savedData = localStorage.getItem('musicQuizScores');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // スコアの復元
      pitchScore = parsedData.pitchScore || 0;
      noteScore = parsedData.noteScore || 0;
      totalScore = parsedData.totalScore || 0;
      level = parsedData.level || 1;
      
      // レベルに応じた音符セットの更新
      updateNotesForLevel(level);
      
      // 表示の更新
      updateScoreDisplay('pitch-score', pitchScore);
      updateScoreDisplay('note-score', noteScore);
      updateProgressDisplay();
      updateHomeScreenLevel();
      
      console.log('Scores loaded successfully from localStorage');
      return true;
    }
  } catch (error) {
    console.error('Failed to load scores from localStorage:', error);
  }
  
  return false;
}

// ウィンドウが閉じられる前にスコアを保存
window.addEventListener('beforeunload', saveScoresToStorage);

// 初期ロード時にスコアを読み込む試行
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  loadScoresFromStorage();
});


/**
 * ホーム画面のレベル表示を更新する関数
 */
function updateHomeScreenLevel() {
  const subtitle = document.querySelector('#home-screen .subtitle');
  if (subtitle) {
    if (level >= 2) {
      subtitle.innerHTML = '音楽を楽しく学ぼう！ <span class="level-badge">レベル ' + level + '</span>';
    } else {
      subtitle.innerHTML = '音楽を楽しく学ぼう！ <span class="level-badge">レベル ' + level + '</span>';
    }
  }
}