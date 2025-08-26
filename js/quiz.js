// js/quiz.js

import * as ui from './ui.js';
import * as player from './player.js';
import * as progression from './progression.js';
import { allQuestionGenerators } from './questions.js';

// --- حالة الاختبار (State) ---
// هذا الكائن يحتفظ بكل المعلومات المؤقتة الخاصة بالاختبار الحالي فقط.
let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    xpEarned: 0
};

// مصفوفة لتخزين دوال الأسئلة المفعّلة
let activeQuestionFunctions = [];

// دالة مساعدة لخلط الأسئلة
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

/**
 * يقوم بتهيئة وحدة الاختبار بإعدادات الأسئلة المفعّلة.
 * @param {Array} config - مصفوفة إعدادات الأسئلة من Supabase.
 */
export function initialize(config) {
    if (config && config.length > 0) {
        activeQuestionFunctions = config
            .filter(q => q.enabled) // فلترة الأسئلة المفعّلة فقط
            .map(q => allQuestionGenerators[q.id]) // ربط المعرف بالدالة الفعلية
            .filter(f => typeof f === 'function'); // التأكد من أن الدالة موجودة
        
        console.log(`Quiz module initialized with ${activeQuestionFunctions.length} active question types.`);
    } else {
        console.warn("Could not load questions config, using all available generators.");
        activeQuestionFunctions = Object.values(allQuestionGenerators);
    }

    if (activeQuestionFunctions.length === 0) {
        alert("خطأ فادح: لا توجد أي أسئلة مفعّلة! يرجى مراجعة إعداداتك.");
    }
}

/**
 * يبدأ اختبارًا جديدًا بالإعدادات المحددة.
 * @param {object} settings - كائن يحتوي على إعدادات الاختبار.
 */
export function start(settings) {
    state = {
        ...state, // نسخ الحالة القديمة
        ...settings, // دمج الإعدادات الجديدة
        score: 0,
        currentQuestionIndex: 0,
        xpEarned: 0
    };
    
    ui.showScreen('quiz-screen');
    displayNextQuestion();
}

/**
 * يعرض السؤال التالي أو ينهي الاختبار إذا اكتملت الأسئلة.
 */
function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    if (activeQuestionFunctions.length === 0) {
        alert("لا يمكن عرض السؤال لعدم وجود أسئلة مفعّلة.");
        return;
    }
    
    // اختيار مولد سؤال عشوائي من قائمة المولدات المفعّلة
    const randomGenerator = shuffleArray(activeQuestionFunctions)[0];
    const question = randomGenerator(state.pageAyahs, state.selectedQari, handleResult);

    if (question) {
        ui.questionArea.innerHTML = question.questionHTML;
        question.setupListeners(ui.questionArea);
    } else {
        // إذا فشل مولد في إنشاء سؤال (لعدم كفاية الآيات مثلاً)، حاول مرة أخرى
        console.warn(`Generator ${randomGenerator.name} failed. Retrying...`);
        displayNextQuestion();
    }
}

/**
 * يتعامل مع إجابة المستخدم.
 * @param {boolean} isCorrect - هل الإجابة صحيحة؟
 * @param {string} correctAnswerText - النص الذي سيظهر في حالة الإجابة الخاطئة.
 * @param {HTMLElement} clickedElement - العنصر الذي تم النقر عليه.
 * @param {HTMLElement} questionArea - منطقة السؤال لتعطيل كل الأزرار فيها.
 */
function handleResult(isCorrect, correctAnswerText, clickedElement, questionArea) {
    ui.disableQuestionInteraction(questionArea);

    if (isCorrect) {
        state.score++;
        // إضافة نقاط الخبرة من قواعد اللعبة
        const xpAmount = parseInt(progression.getRuleValue('xpPerCorrectAnswer') || '0', 10);
        state.xpEarned += xpAmount;
        ui.markAnswer(clickedElement, true);
    } else {
        ui.markAnswer(clickedElement, false, correctAnswerText);
    }

    ui.showFeedback(isCorrect, correctAnswerText);
    setTimeout(displayNextQuestion, 3000); // الانتقال للسؤال التالي بعد 3 ثوانٍ
}

/**
 * ينهي الاختبار، يحسب النتائج، يحفظ البيانات، ويعرض الشاشة النهائية.
 */
async function endQuiz() {
    ui.updateProgress(state.totalQuestions, state.totalQuestions, true);
    
    // --- منطق المكافآت الإضافية ---
    // 1. مكافأة الأداء المثالي
    if (state.score === state.totalQuestions) {
        const bonusXp = parseInt(progression.getRuleValue('xpBonusAllCorrect') || '0', 10);
        const bonusDiamonds = parseInt(progression.getRuleValue('diamondsBonusAllCorrect') || '0', 10);
        state.xpEarned += bonusXp;
        player.addDiamonds(bonusDiamonds);
        console.log(`Perfect score bonus: +${bonusXp} XP, +${bonusDiamonds} Diamonds`);
    }
    
    // إضافة مجموع نقاط الخبرة المكتسبة إلى اللاعب
    player.addXp(state.xpEarned);
    
    // عرض شاشة النتيجة النهائية
    ui.displayFinalResult(state);
    
    // حفظ كل شيء في السحابة (Supabase)
    await player.savePlayer();
}
