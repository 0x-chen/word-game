// 游戏状态管理
const GameState = {
    mode: null,           // 'level' 或 'endless'
    currentUnit: 1,       // 当前单元
    difficulty: null,     // 'easy', 'medium', 'hard'
    score: 0,            // 当前得分
    correctCount: 0,      // 正确单词数
    totalSteps: 15,       // 总步数
    words: [],           // 当前游戏单词列表
    currentWord: null,    // 当前单词
    options: [],         // 当前选项
    allWords: [],        // 所有单词数据
    isGameActive: false, // 游戏是否进行中
    selectedOption: null // 当前选中的选项
};

// DOM 元素
const elements = {
    screens: {
        start: document.getElementById('start-screen'),
        unitSelect: document.getElementById('unit-select-screen'),
        difficultySelect: document.getElementById('difficulty-select-screen'),
        game: document.getElementById('game-screen'),
        end: document.getElementById('end-screen')
    },
    buttons: {
        levelMode: document.getElementById('level-mode'),
        endlessMode: document.getElementById('endless-mode'),
        backToStart: document.getElementById('back-to-start'),
        backToUnits: document.getElementById('back-to-units'),
        quitGame: document.getElementById('quit-game'),
        playAgain: document.getElementById('play-again-btn'),
        backToStartFromEnd: document.getElementById('back-to-start-from-end')
    },
    gameElements: {
        unitsGrid: document.getElementById('units-grid'),
        selectedUnitInfo: document.getElementById('selected-unit-info'),
        topLilyPads: document.getElementById('top-lily-pads'),
        currentLilyPad: document.getElementById('current-lily-pad'),
        frog: document.getElementById('frog'),
        englishWord: document.getElementById('current-english-word'),
        optionButtons: document.getElementById('option-buttons'),
        currentUnitDisplay: document.getElementById('current-unit-display'),
        currentDifficultyDisplay: document.getElementById('current-difficulty-display'),
        progressDisplay: document.getElementById('progress-display'),
        scoreDisplay: document.getElementById('score-display')
    },
    endElements: {
        resultIcon: document.getElementById('result-icon'),
        resultTitle: document.getElementById('result-title'),
        resultMessage: document.getElementById('result-message'),
        finalScore: document.getElementById('final-score'),
        correctWords: document.getElementById('correct-words'),
        passStatus: document.getElementById('pass-status')
    },
    loadingOverlay: document.getElementById('loading-overlay')
};

// 初始化游戏
async function initGame() {
    showLoading(true);
    
    try {
        // 加载单词数据
        const response = await fetch('words.json');
        if (!response.ok) {
            throw new Error('无法加载单词数据');
        }
        
        GameState.allWords = await response.json();
        console.log('单词数据加载成功:', GameState.allWords.length, '个单元');
        
        // 初始化单元选择
        initUnitSelection();
        
        // 绑定事件
        bindEvents();
        
        // 显示开始屏幕
        showScreen('start');
        
    } catch (error) {
        console.error('初始化游戏失败:', error);
        alert('加载单词数据失败，请检查words.json文件是否存在且格式正确。');
    } finally {
        showLoading(false);
    }
}

// 显示/隐藏加载动画
function showLoading(show) {
    // elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 切换屏幕
function showScreen(screenName) {
    // 隐藏所有屏幕
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 显示目标屏幕
    elements.screens[screenName].classList.add('active');
}

// 初始化单元选择界面
function initUnitSelection() {
    const unitsGrid = elements.gameElements.unitsGrid;
    unitsGrid.innerHTML = '';
    
    GameState.allWords.forEach((unit, index) => {
        const unitBtn = document.createElement('div');
        unitBtn.className = 'unit-btn';
        unitBtn.dataset.unit = unit.unit;
        
        unitBtn.innerHTML = `
            <i class="fas fa-book"></i>
            <div class="unit-number">第 ${unit.unit} 单元</div>
            <div class="word-count">${unit.words.length} 个单词</div>
        `;
        
        unitBtn.addEventListener('click', () => {
            GameState.currentUnit = unit.unit;
            elements.gameElements.selectedUnitInfo.textContent = `第 ${unit.unit} 单元`;
            showScreen('difficultySelect');
        });
        
        unitsGrid.appendChild(unitBtn);
    });
}

// 绑定事件
function bindEvents() {
    // 模式选择
    elements.buttons.levelMode.addEventListener('click', () => {
        GameState.mode = 'level';
        showScreen('unitSelect');
    });
    
    elements.buttons.endlessMode.addEventListener('click', () => {
        GameState.mode = 'endless';
        startEndlessMode();
    });
    
    // 返回按钮
    elements.buttons.backToStart.addEventListener('click', () => {
        showScreen('start');
    });
    
    elements.buttons.backToUnits.addEventListener('click', () => {
        showScreen('unitSelect');
    });
    
    // 难度选择
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', function() {
            const difficulty = this.dataset.difficulty;
            startLevelMode(difficulty);
        });
    });
    
    // 游戏控制
    elements.buttons.quitGame.addEventListener('click', endGame);
    elements.buttons.playAgain.addEventListener('click', restartGame);
    elements.buttons.backToStartFromEnd.addEventListener('click', () => {
        showScreen('start');
    });
}

// 开始闯关模式
function startLevelMode(difficulty) {
    GameState.difficulty = difficulty;
    GameState.mode = 'level';
    
    // 根据难度设置总步数
    const currentUnitWords = GameState.allWords.find(u => u.unit === GameState.currentUnit).words;
    switch(difficulty) {
        case 'easy':
            GameState.totalSteps = 15;
            break;
        case 'medium':
            GameState.totalSteps = 25;
            break;
        case 'hard':
            GameState.totalSteps = currentUnitWords.length;
            break;
    }
    
    // 重置游戏状态
    resetGameState();
    
    // 获取当前单元的单词
    const unitWords = [...currentUnitWords].sort(() => Math.random() - 0.5);
    GameState.words = unitWords.slice(0, GameState.totalSteps);
    
    // 更新显示
    updateGameDisplay();
    
    // 开始游戏
    startGame();
}

// 开始无尽模式
function startEndlessMode() {
    GameState.mode = 'endless';
    GameState.difficulty = 'endless';
    GameState.totalSteps = Infinity;
    
    // 重置游戏状态
    resetGameState();
    
    // 合并所有单元单词
    const allWords = GameState.allWords.flatMap(unit => unit.words);
    GameState.words = [...allWords].sort(() => Math.random() - 0.5);
    
    // 更新显示
    updateGameDisplay();
    
    // 开始游戏
    startGame();
}

// 重置游戏状态
function resetGameState() {
    GameState.score = 0;
    GameState.correctCount = 0;
    GameState.currentWord = null;
    GameState.options = [];
    GameState.isGameActive = true;
    GameState.selectedOption = null;
}

// 更新游戏显示
function updateGameDisplay() {
    elements.gameElements.currentUnitDisplay.textContent = GameState.currentUnit;
    
    const difficultyText = {
        'easy': '简单',
        'medium': '中等',
        'hard': '困难',
        'endless': '无尽'
    };
    
    elements.gameElements.currentDifficultyDisplay.textContent = difficultyText[GameState.difficulty];
    
    updateProgress();
}

// 更新进度显示
function updateProgress() {
    if (GameState.mode === 'endless') {
        elements.gameElements.progressDisplay.textContent = GameState.correctCount;
    } else {
        elements.gameElements.progressDisplay.textContent = `${GameState.correctCount}/${GameState.totalSteps}`;
    }
    
    elements.gameElements.scoreDisplay.textContent = GameState.score;
}

// 开始游戏
function startGame() {
    showScreen('game');
    nextWord();
}

// 获取下一个单词
function nextWord() {
    // 检查游戏是否结束
    if (!GameState.isGameActive) return;
    
    // 检查是否完成关卡
    if (GameState.mode === 'level' && GameState.correctCount >= GameState.totalSteps) {
        endGame(true);
        return;
    }
    
    // 如果单词用完，重新打乱
    if (GameState.words.length === 0) {
        if (GameState.mode === 'level') {
            const currentUnitWords = GameState.allWords.find(u => u.unit === GameState.currentUnit).words;
            GameState.words = [...currentUnitWords].sort(() => Math.random() - 0.5);
        } else {
            const allWords = GameState.allWords.flatMap(unit => unit.words);
            GameState.words = [...allWords].sort(() => Math.random() - 0.5);
        }
    }
    
    // 获取当前单词
    GameState.currentWord = GameState.words.shift();
    
    // 显示单词
    elements.gameElements.englishWord.textContent = GameState.currentWord.english;
    
    // 生成选项
    generateOptions();
}

// 生成选项
function generateOptions() {
    GameState.options = [];
    
    // 添加正确答案
    GameState.options.push({
        text: GameState.currentWord.chinese,
        correct: true,
        index: 0
    });
    
    // 添加错误答案
    let wrongWords = [];
    
    if (GameState.mode === 'level') {
        // 从当前单元获取错误答案
        const currentUnitWords = GameState.allWords.find(u => u.unit === GameState.currentUnit).words;
        wrongWords = currentUnitWords
            .filter(word => word.chinese !== GameState.currentWord.chinese)
            .map(word => word.chinese);
    } else {
        // 从所有单词中获取错误答案
        const allWords = GameState.allWords.flatMap(unit => unit.words);
        wrongWords = allWords
            .filter(word => word.chinese !== GameState.currentWord.chinese)
            .map(word => word.chinese);
    }
    
    // 随机选择3个错误答案
    const selectedWrongWords = [...wrongWords]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    
    selectedWrongWords.forEach((text, i) => {
        GameState.options.push({
            text: text,
            correct: false,
            index: i + 1
        });
    });
    
    // 打乱选项顺序
    GameState.options = GameState.options.sort(() => Math.random() - 0.5);
    
    // 为每个选项分配新的索引
    GameState.options.forEach((option, index) => {
        option.displayIndex = index;
    });
    
    // 显示选项
    displayOptions();
}

// 显示选项
function displayOptions() {
    const topPadsContainer = elements.gameElements.topLilyPads;
    const optionButtonsContainer = elements.gameElements.optionButtons;
    
    // 清空容器
    topPadsContainer.innerHTML = '';
    optionButtonsContainer.innerHTML = '';
    
    // 创建荷叶选项
    GameState.options.forEach((option, index) => {
        // 创建上方荷叶
        const lilyPad = document.createElement('div');
        lilyPad.className = 'lily-pad';
        lilyPad.dataset.optionIndex = index;
        
        const padContent = document.createElement('div');
        padContent.className = 'lily-pad-content';
        padContent.textContent = option.text;
        lilyPad.appendChild(padContent);
        
        // 添加点击事件
        lilyPad.addEventListener('click', () => selectOption(index));
        
        topPadsContainer.appendChild(lilyPad);
        
        // 创建下方按钮选项
        const optionBtn = document.createElement('div');
        optionBtn.className = 'option-btn';
        optionBtn.dataset.optionIndex = index;
        optionBtn.textContent = `${index + 1}. ${option.text}`;
        
        // 添加点击事件
        optionBtn.addEventListener('click', () => selectOption(index));
        
        optionButtonsContainer.appendChild(optionBtn);
    });
}

// 选择选项
function selectOption(optionIndex) {
    if (!GameState.isGameActive || GameState.selectedOption !== null) {
        return; // 游戏已结束或已有选择
    }
    
    GameState.selectedOption = optionIndex;
    const selectedOption = GameState.options[optionIndex];
    
    // 禁用所有选项
    document.querySelectorAll('.lily-pad, .option-btn').forEach(el => {
        el.style.pointerEvents = 'none';
    });
    
    // 青蛙跳跃到选中的荷叶
    jumpToLilyPad(optionIndex, selectedOption.correct);
    
    // 显示结果
    setTimeout(() => {
        showResult(selectedOption.correct);
    }, 10);
}

// 青蛙跳跃到荷叶
function jumpToLilyPad(optionIndex, isCorrect) {
    const frog = elements.gameElements.frog;
    const topPads = document.querySelectorAll('.lily-pad');
    const selectedPad = topPads[optionIndex];
    
    // 计算跳跃位置
    const padRect = selectedPad.getBoundingClientRect();
    const frogRect = frog.getBoundingClientRect();
    
    // 添加跳跃动画
    frog.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    frog.style.transform = `translate(${padRect.left - frogRect.left}px, ${padRect.top - frogRect.top - 50}px)`;
    
    // 荷叶效果
    selectedPad.style.transform = 'scale(1.15)';
    selectedPad.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4)';
    
    // 根据正确性改变颜色
    if (isCorrect) {
        selectedPad.style.background = 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)';
    } else {
        selectedPad.style.background = 'linear-gradient(135deg, #EF5350 0%, #D32F2F 100%)';
    }
}

// 显示结果
function showResult(isCorrect) {
    if (isCorrect) {
        // 正确答案
        GameState.score += 10;
        GameState.correctCount++;
        
        // 更新进度
        updateProgress();
        
        // 荷叶下移动画
        // moveLilyPadDown();
        
        // 延迟后进入下一个单词
        setTimeout(() => {
            resetForNextWord();
        }, 10);
    } else {
        // 错误答案
        GameState.score = Math.max(0, GameState.score);
        
        // 青蛙落水动画
        frogFall();
        
        // 延迟后结束游戏
        setTimeout(() => {
            endGame(false);
        }, 1500);
    }
}

// 荷叶下移动画
function moveLilyPadDown() {
    const topPads = document.querySelectorAll('.lily-pad');
    const selectedPadIndex = GameState.selectedOption;
    const selectedPad = topPads[selectedPadIndex];
    const currentPad = elements.gameElements.currentLilyPad;
    
    // 青蛙回到原来位置
    const frog = elements.gameElements.frog;
    frog.style.transition = 'transform 0.5s ease';
    frog.style.transform = 'translate(0, 0)';
    
    // 选中的荷叶下移到底部
    selectedPad.style.transition = 'all 0.8s ease-in-out';
    selectedPad.style.position = 'fixed';
    selectedPad.style.zIndex = '1000';
    
    // 计算目标位置（当前荷叶位置）
    const targetRect = currentPad.getBoundingClientRect();
    const selectedRect = selectedPad.getBoundingClientRect();
    
    selectedPad.style.transform = `
        translate(${targetRect.left - selectedRect.left}px, 
                  ${targetRect.top - selectedRect.top}px)
        scale(0.8)
    `;
    
    // 当前荷叶淡出
    currentPad.style.opacity = '0';
    currentPad.style.transform = 'scale(0.8)';
    
    // 更新当前荷叶内容
    setTimeout(() => {
        selectedPad.remove();
        currentPad.style.opacity = '1';
        currentPad.style.transform = 'scale(1)';
    }, 50);
}

// 青蛙落水动画
function frogFall() {
    const frog = elements.gameElements.frog;
    
    // 青蛙下沉
    frog.style.transition = 'transform 1s ease, opacity 1s ease';
    frog.style.transform = 'translate(0, 100px) rotate(180deg)';
    frog.style.opacity = '0';
    
    // 所有荷叶变红（错误效果）
    document.querySelectorAll('.lily-pad').forEach(pad => {
        pad.style.background = 'linear-gradient(135deg, #EF5350 0%, #D32F2F 100%)';
        pad.style.transform = 'scale(0.9)';
    });
}

// 重置为下一个单词
function resetForNextWord() {
    // 重置青蛙位置和样式
    const frog = elements.gameElements.frog;
    frog.style.transition = '';
    frog.style.transform = '';
    frog.style.opacity = '1';
    
    // 清空选项
    elements.gameElements.topLilyPads.innerHTML = '';
    elements.gameElements.optionButtons.innerHTML = '';
    
    // 重置当前荷叶
    const currentPad = elements.gameElements.currentLilyPad;
    currentPad.style.opacity = '1';
    currentPad.style.transform = 'scale(1)';
    
    // 重置选择状态
    GameState.selectedOption = null;
    
    // 下一个单词
    setTimeout(() => {
        nextWord();
    }, 50);
}

// 结束游戏
function endGame(isSuccess = false) {
    GameState.isGameActive = false;
    
    // 更新结束屏幕
    if (isSuccess) {
        // 成功通关
        elements.endElements.resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        elements.endElements.resultTitle.textContent = '恭喜通关！';
        elements.endElements.resultMessage.textContent = '你成功帮助青蛙过河了！';
        elements.endElements.passStatus.textContent = '已通过';
    } else {
        // 游戏失败
        elements.endElements.resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
        elements.endElements.resultTitle.textContent = '游戏结束';
        elements.endElements.resultMessage.textContent = '青蛙掉进河里了，再试一次吧！';
        elements.endElements.passStatus.textContent = '未通过';
    }
    
    elements.endElements.finalScore.textContent = GameState.score;
    elements.endElements.correctWords.textContent = GameState.correctCount;
    
    // 显示结束屏幕
    showScreen('end');
}

// 重新开始游戏
function restartGame() {
    if (GameState.mode === 'level') {
        startLevelMode(GameState.difficulty);
    } else {
        startEndlessMode();
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);