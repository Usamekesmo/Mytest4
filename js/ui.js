// js/ui.js

import * as store from './store.js';
import * as challenges from './challenges.js';
import * as player from './player.js';

// --- 1. استهداف عناصر الصفحة (DOM Elements) ---
const screens = {
    start: document.getElementById('start-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    store: document.getElementById('store-screen'),
    challenges: document.getElementById('challenges-screen')
};

export const userNameInput = document.getElementById('userName');
export const pageSelect = document.getElementById('pageSelect');
export const rangeStartInput = document.getElementById('rangeStart');
export const rangeEndInput = document.getElementById('rangeEnd');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');

export const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');

const playerInfoDiv = document.getElementById('player-info');
const playerInfoHr = document.getElementById('player-info-hr');
const playerLevelEl = document.getElementById('player-level');
const playerTitleEl = document.getElementById('player-title');
const playerDiamondsEl = document.getElementById('player-diamonds');
const playerXpEl = document.getElementById('player-xp');
const xpBarEl = document.getElementById('xp-bar');

const mainMenuDiv = document.getElementById('main-menu');
const quizOptionsDiv = document.getElementById('quiz-options');

export const questionArea = document.getElementById('question-area');
export const feedbackArea = document.getElementById('feedback-area');
const progressCounter = document.getElementById('progress-counter');
const progressBar = document.getElementById('progress-bar');

const storeItemsContainer = document.getElementById('store-items-container');
const challengesContainer = document.getElementById('challenges-container');
const storeDiamondsEl = document.getElementById('store-diamonds');

const resultNameEl = document.getElementById('resultName');
const finalScoreEl = document.getElementById('finalScore');
const levelUpMessageEl = document.getElementById('level-up-message');
const saveMessageEl = document.getElementById('save-message');


// --- 2. دوال التحكم بالواجهة (UI Control Functions) ---

/**
 * يخفي كل الشاشات الرئيسية ثم يظهر الشاشة المطلوبة.
 * @param {string} screenId - معرف الشاشة التي نريد إظهارها (start, quiz, store, etc.).
 */
export function showScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    if (screens[screenId]) {
        screens[screenId].classList.remove('hidden');
    }
}

/**
 * يظهر أو يخفي أيقونة التحميل ويعطل/يفعل زر البدء.
 * @param {boolean} show - إذا كانت true، يظهر المحمل، وإلا يخفيه.
 * @param {string} text - النص الذي سيظهر تحت أيقونة التحميل.
 */
export function toggleLoader(show, text = "جاري التحميل...") {
    loader.classList.toggle('hidden', !show);
    loaderText.textContent = text;
    // يمكنك تعطيل الأزرار هنا إذا أردت
}

/**
 * يعرض معلومات اللاعب المحدثة في شاشة البداية.
 * @param {object} playerData - كائن بيانات اللاعب.
 * @param {object} levelInfo - كائن معلومات المستوى من progression.js.
 */
export function updatePlayerDisplay(playerData, levelInfo) {
    playerLevelEl.textContent = levelInfo.level;
    playerTitleEl.textContent = levelInfo.title;
    playerDiamondsEl.textContent = playerData.diamonds;
    playerXpEl.textContent = `${levelInfo.currentLevelXp} / ${levelInfo.xpForNextLevel} XP`;
    xpBarEl.style.width = `${levelInfo.progress}%`;
    playerInfoDiv.classList.remove('hidden');
    playerInfoHr.classList.remove('hidden');
}

/**
 * يظهر القائمة الرئيسية وخيارات الاختبار بعد تسجيل الدخول.
 */
export function showMainUI() {
    mainMenuDiv.classList.remove('hidden');
    quizOptionsDiv.classList.remove('hidden');
}

/**
 * يحدّث شريط وعداد التقدم في الاختبار.
 */
export function updateProgress(current, total, finished = false) {
    progressCounter.textContent = `السؤال ${current} من ${total}`;
    const percentage = finished ? 100 : ((current - 1) / total) * 100;
    progressBar.style.width = `${percentage}%`;
}

/**
 * يعرض رسالة التقييم (صحيح/خطأ) بعد إجابة المستخدم.
 */
export function showFeedback(isCorrect, correctAnswerText = '') {
    feedbackArea.classList.remove('hidden');
    if (isCorrect) {
        feedbackArea.textContent = 'إجابة صحيحة! أحسنت.';
        feedbackArea.className = 'correct-feedback';
    } else {
        feedbackArea.textContent = `إجابة خاطئة. ${correctAnswerText}`;
        feedbackArea.className = 'wrong-feedback';
    }
}

/**
 * يعطل التفاعل مع خيارات السؤال بعد الإجابة.
 */
export function disableQuestionInteraction(area) {
    area.querySelectorAll('button, .option-div').forEach(el => {
        el.disabled = true;
        el.style.pointerEvents = 'none';
    });
}

/**
 * يلون الإجابة باللون الصحيح أو الخاطئ.
 */
export function markAnswer(element, isCorrect) {
    element.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
}

/**
 * يعرض شاشة النتيجة النهائية.
 */
export function displayFinalResult(resultState) {
    showScreen('result');
    resultNameEl.textContent = player.playerData.name;
    finalScoreEl.textContent = `${resultState.score} من ${resultState.totalQuestions}`;
    saveMessageEl.textContent = 'جاري حفظ تقدمك على السحابة...';
}

/**
 * يعرض رسالة الترقية في شاشة النتائج.
 */
export function displayLevelUp(levelUpInfo) {
    levelUpMessageEl.innerHTML = `🎉 <strong>ترقية!</strong> لقد وصلت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وحصلت على ${levelUpInfo.reward} ألماسة!`;
    levelUpMessageEl.classList.remove('hidden');
}

/**
 * يحدّث رسالة حفظ النتيجة بعد استجابة الخادم.
 */
export function updateSaveMessage(success) {
    if (success) {
        saveMessageEl.textContent = 'تم حفظ تقدمك بنجاح على السحابة!';
    } else {
        saveMessageEl.textContent = 'حدث خطأ أثناء حفظ التقدم. قد لا يتم تسجيل نتيجتك.';
        saveMessageEl.style.color = 'red';
    }
}

/**
 * يبني واجهة المتجر ديناميكياً.
 */
export function renderStore() {
    const items = store.getStoreItems();
    const ownedItems = player.playerData.owned_items;
    storeItemsContainer.innerHTML = '';
    storeDiamondsEl.textContent = player.playerData.diamonds;

    items.forEach(item => {
        const isOwned = ownedItems.includes(item.item_id);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'store-item';
        itemDiv.innerHTML = `
            <h4>${item.item_name}</h4>
            <p>${item.description}</p>
            <button class="buy-button" data-item-id="${item.item_id}" ${isOwned ? 'disabled' : ''}>
                ${isOwned ? 'تم الشراء' : `${item.price} 💎`}
            </button>
        `;
        storeItemsContainer.appendChild(itemDiv);
    });
}

/**
 * يبني واجهة التحديات ديناميكياً.
 */
export function renderChallenges() {
    const availableChallenges = challenges.getAvailableChallenges();
    challengesContainer.innerHTML = '';

    if (availableChallenges.length === 0) {
        challengesContainer.innerHTML = '<p>لا توجد تحديات متاحة في الوقت الحالي. عد قريباً!</p>';
        return;
    }

    availableChallenges.forEach(challenge => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'challenge-item';
        const endTime = new Date(challenge.end_time);
        itemDiv.innerHTML = `
            <h4>${challenge.title}</h4>
            <p>${challenge.description}</p>
            <p class="time-left">ينتهي في: ${endTime.toLocaleString()}</p>
            <button class="start-challenge-button" data-challenge-id="${challenge.challenge_id}">ابدأ التحدي</button>
        `;
        challengesContainer.appendChild(itemDiv);
    });
}

/**
 * يحدّث قائمة الصفحات المنسدلة بالصفحات والنطاقات المتاحة للاعب.
 */
export function updateAvailablePages(availablePages) {
    pageSelect.innerHTML = '<option value="" disabled selected>اختر صفحة أو نطاقاً للاختبار</option>';

    availablePages.forEach(page => {
        const option = document.createElement('option');
        option.value = `PAGE-${page}`;
        option.textContent = `صفحة ${page}`;
        pageSelect.appendChild(option);
    });

    const ranges = findConsecutiveRanges(availablePages);
    if (ranges.length > 0) {
        const group = document.createElement('optgroup');
        group.label = 'اختبارات النطاقات المتاحة';
        ranges.forEach(range => {
            const option = document.createElement('option');
            option.value = `RANGE-${range.start}-${range.end}`;
            option.textContent = `نطاق الصفحات (${range.start} - ${range.end})`;
            group.appendChild(option);
        });
        pageSelect.appendChild(group);
    }
}

/**
 * دالة مساعدة لاكتشاف النطاقات المتتالية في مصفوفة من الأرقام.
 */
function findConsecutiveRanges(numbers) {
    const ranges = [];
    if (numbers.length === 0) return ranges;
    let start = numbers[0], end = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] === end + 1) {
            end = numbers[i];
        } else {
            if (end > start) ranges.push({ start, end });
            start = end = numbers[i];
        }
    }
    if (end > start) ranges.push({ start, end });
    return ranges;
}
