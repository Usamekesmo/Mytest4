// js/main.js

import * as api from './api.js';
import * as ui from './ui.js';
import * as player from './player.js';
import * as store from './store.js';
import * as challenges from './challenges.js';
import * as quiz from './quiz.js';
import * as progression from './progression.js';

/**
 * الدالة الرئيسية التي تبدأ عند تحميل الصفحة.
 */
async function initialize() {
    ui.toggleLoader(true, "جاري تحميل إعدادات اللعبة...");
    const config = await api.fetchGameConfig();
    
    if (!config) {
        ui.toggleLoader(false);
        // لا يمكن إكمال التحميل إذا فشلت الإعدادات
        return;
    }

    // تهيئة كل الوحدات بالبيانات التي تم جلبها
    progression.initialize(config.progression, config.gameRules);
    quiz.initialize(config.questionsConfig);
    store.initialize(config.storeItems);
    challenges.initialize(config.challenges);
    
    setupEventListeners();
    ui.toggleLoader(false);
    ui.showScreen('start'); // إظهار شاشة البداية
    console.log("التطبيق جاهز لاستقبال اسم المستخدم.");
}

/**
 * ربط كل أحداث المستخدم (النقر، الإدخال) بالدوال المناسبة.
 */
function setupEventListeners() {
    // حدث الضغط على Enter في حقل اسم المستخدم
    ui.userNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // منع السلوك الافتراضي للـ Enter
            handleLogin();
        }
    });

    // التعديل هنا: ربط زر الدخول الجديد بنفس دالة تسجيل الدخول
    document.getElementById('loginButton').addEventListener('click', handleLogin);

    // أزرار بدء الاختبار
    document.getElementById('startButton').addEventListener('click', startSelectedQuiz);
    document.getElementById('startCustomRangeButton').addEventListener('click', startCustomRangeQuiz);
    
    // زر العودة للقائمة الرئيسية في شاشة النتائج
    document.getElementById('reload-button').addEventListener('click', () => location.reload());
    
    // أزرار القائمة الرئيسية (المتجر والتحديات)
    document.getElementById('storeButton').addEventListener('click', () => {
        ui.renderStore();
        ui.showScreen('store');
    });
    document.getElementById('challengesButton').addEventListener('click', () => {
        ui.renderChallenges();
        ui.showScreen('challenges');
    });
    
    // أزرار العودة العامة
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', () => ui.showScreen(btn.dataset.target));
    });

    // أحداث الشراء في المتجر
    document.getElementById('store-items-container').addEventListener('click', (e) => {
        const buyButton = e.target.closest('.buy-button');
        if (buyButton) {
            store.buyItem(buyButton.dataset.itemId);
        }
    });

    // أحداث بدء التحديات
    document.getElementById('challenges-container').addEventListener('click', (e) => {
        const challengeButton = e.target.closest('.start-challenge-button');
        if (challengeButton) {
            challenges.startChallenge(challengeButton.dataset.challengeId);
        }
    });
}

/**
 * يتم تشغيلها عند إدخال اسم المستخدم والضغط على Enter أو زر الدخول.
 */
async function handleLogin() {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert('الرجاء إدخال اسمك.');
        return;
    }
    ui.toggleLoader(true, "جاري تحميل بياناتك...");
    const playerLoaded = await player.loadPlayer(userName);
    ui.toggleLoader(false);

    if (playerLoaded) {
        ui.userNameInput.disabled = true;
        // إخفاء زر الدخول بعد نجاح العملية
        document.getElementById('loginButton').classList.add('hidden');
        // بعد تحميل اللاعب، قم بتطبيق ممتلكاته وإظهار واجهة اللعب
        store.applyOwnedItems();
        ui.showMainUI();
    }
}

/**
 * تبدأ اختباراً بناءً على الاختيار من القائمة المنسدلة.
 */
async function startSelectedQuiz() {
    const selectedValue = ui.pageSelect.value;
    if (!selectedValue) {
        alert('الرجاء اختيار صفحة أو نطاق لبدء الاختبار.');
        return;
    }
    const parts = selectedValue.split('-');
    const type = parts[0] === 'PAGE' ? 'PAGE' : 'PAGE_RANGE';
    const value = type === 'PAGE' ? parts[1] : `${parts[1]}-${parts[2]}`;
    
    await startQuizWithScope(type, value);
}

/**
 * تبدأ اختباراً بناءً على النطاق المخصص الذي أدخله المستخدم.
 */
async function startCustomRangeQuiz() {
    const start = parseInt(ui.rangeStartInput.value, 10);
    const end = parseInt(ui.rangeEndInput.value, 10);

    if (!start || !end || start > end) {
        alert("الرجاء إدخال نطاق صحيح (البداية أصغر من النهاية).");
        return;
    }
    if (!store.ownsPageRange(start, end)) {
        alert(`لا يمكنك الاختبار على هذا النطاق لأنك لا تمتلك كل الصفحات فيه.`);
        return;
    }
    await startQuizWithScope('PAGE_RANGE', `${start}-${end}`);
}

/**
 * دالة مركزية لبدء أي اختبار، سواء كان عادياً أو تحدياً.
 * @param {string} scopeType - نوع النطاق (PAGE, PAGE_RANGE, JUZ, SURAH).
 * @param {string} scopeValue - قيمة النطاق.
 * @param {number|null} questionsCountOverride - لتجاوز عدد الأسئلة المحدد في الواجهة (يستخدم للتحديات).
 */
export async function startQuizWithScope(scopeType, scopeValue, questionsCountOverride = null) {
    ui.toggleLoader(true, "جاري تحضير الاختبار...");
    const ayahs = await api.fetchAyahsForScope(scopeType, scopeValue);
    ui.toggleLoader(false);

    if (ayahs && ayahs.length > 0) {
        const questionsCount = questionsCountOverride || parseInt(ui.questionsCountSelect.value, 10);
        quiz.start({
            pageAyahs: ayahs,
            totalQuestions: questionsCount,
            selectedQari: ui.qariSelect.value,
        });
    } else {
        alert("حدث خطأ أثناء تحميل بيانات الاختبار. قد يكون النطاق غير صالح أو هناك مشكلة في الاتصال.");
    }
}

// نقطة انطلاق التطبيق عند تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', initialize);
