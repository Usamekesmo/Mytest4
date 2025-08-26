// js/questions.js

/**
 * =================================================================
 * وحدة توليد الأسئلة (Questions Module)
 * =================================================================
 * هذا الملف يحتوي على كل دوال توليد الأسئلة المختلفة.
 * كل دالة مسؤولة عن إنشاء نوع واحد من الأسئلة.
 */

// --- دالة مساعدة لخلط عناصر مصفوفة (تستخدم في كل دوال الأسئلة) ---
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

// =================================================================
// --- قسم دوال توليد الأسئلة ---
// =================================================================

/**
 * سؤال: اختر الآية التالية.
 * @param {Array} pageAyahs - مصفوفة الآيات المتاحة للاختبار.
 * @param {string} qari - معرف القارئ.
 * @param {Function} handleResultCallback - دالة обратного вызова للتعامل مع نتيجة إجابة المستخدم.
 * @returns {object|null} كائن السؤال أو null إذا لم يكن بالإمكان إنشاؤه.
 */
function generateChooseNextQuestion(pageAyahs, qari, handleResultCallback) {
    if (pageAyahs.length < 4) return null; // يتطلب 4 آيات على الأقل لخيارات كافية

    // اختر آية عشوائية ليست الأخيرة
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    
    // إنشاء خيارات خاطئة من آيات أخرى في الصفحة
    const wrongOptions = shuffleArray(
        pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)
    ).slice(0, 2);
    
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    
    const questionHTML = `
        <h3>السؤال: استمع واختر الآية التالية</h3>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        ${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`).join('')}
    `;

    const correctAnswerText = correctNextAyah.text;

    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.option-div').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.number == correctNextAyah.number;
                handleResultCallback(isCorrect, correctAnswerText, el, questionArea);
            });
        });
    };

    return { questionHTML, setupListeners };
}

/**
 * سؤال: حدد موقع الآية في الصفحة.
 */
function generateLocateAyahQuestion(pageAyahs, qari, handleResultCallback) {
    const ayahIndex = Math.floor(Math.random() * pageAyahs.length);
    const questionAyah = pageAyahs[ayahIndex];
    const totalAyahs = pageAyahs.length;
    
    let correctLocation;
    if (ayahIndex < totalAyahs / 3) correctLocation = 'بداية';
    else if (ayahIndex < (totalAyahs * 2) / 3) correctLocation = 'وسط';
    else correctLocation = 'نهاية';

    const questionHTML = `
        <h3>السؤال: أين يقع موضع هذه الآية في الصفحة؟</h3>
        <p style="font-family: 'Amiri', serif; font-size: 22px;">"${questionAyah.text}"</p>
        <audio controls src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        <div class="interactive-area" style="display: flex; justify-content: center; gap: 15px; margin: 20px 0;">
            ${['بداية', 'وسط', 'نهاية'].map(loc => `<button class="choice-button" data-location="${loc}">${loc} الصفحة</button>`).join('')}
        </div>
    `;
    
    const correctAnswerText = `${correctLocation} الصفحة`;

    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.choice-button').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.location === correctLocation;
                handleResultCallback(isCorrect, correctAnswerText, el, questionArea);
            });
        });
    };

    return { questionHTML, setupListeners };
}

/**
 * سؤال: أكمل الكلمة الأخيرة من الآية.
 */
function generateCompleteLastWordQuestion(pageAyahs, qari, handleResultCallback) {
    // ابحث عن آيات مناسبة (أكثر من 3 كلمات)
    const suitableAyahs = pageAyahs.filter(a => a.text.split(' ').length > 3);
    if (suitableAyahs.length < 4) return null; // نحتاج 4 آيات على الأقل للخيارات

    const questionAyah = shuffleArray(suitableAyahs)[0];
    const words = questionAyah.text.split(' ');
    const correctLastWord = words.pop();
    const incompleteAyahText = words.join(' ');
    
    // إنشاء خيارات خاطئة من كلمات أخيرة لآيات أخرى
    const wrongOptions = shuffleArray(suitableAyahs.filter(a => a.number !== questionAyah.number))
        .slice(0, 3)
        .map(a => a.text.split(' ').pop());
        
    const options = shuffleArray([correctLastWord, ...wrongOptions]);

    const questionHTML = `
        <h3>السؤال: اختر الكلمة الصحيحة لإكمال الآية التالية:</h3>
        <p style="font-family: 'Amiri', serif; font-size: 22px;">${incompleteAyahText} (...)</p>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        <div class="interactive-area" style="display: flex; justify-content: center; gap: 15px; margin: 20px 0; flex-wrap: wrap;">
            ${options.map(opt => `<button class="choice-button" data-word="${opt}">${opt}</button>`).join('')}
        </div>
    `;

    const correctAnswerText = `الكلمة الصحيحة هي: "${correctLastWord}"`;

    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.choice-button').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.word === correctLastWord;
                handleResultCallback(isCorrect, correctAnswerText, el, questionArea);
            });
        });
    };

    return { questionHTML, setupListeners };
}


// =================================================================
// --- تجميع وتصدير كل دوال الأسئلة ---
// =================================================================

/**
 * هذا الكائن هو "كتالوج" لكل دوال الأسئلة المتاحة في التطبيق.
 * المفتاح (key) يجب أن يطابق 'id' في جدول questions_config في قاعدة البيانات.
 */
export const allQuestionGenerators = {
    generateChooseNextQuestion,
    generateLocateAyahQuestion,
    generateCompleteLastWordQuestion,
    // لإضافة سؤال جديد، اكتب دالته في الأعلى ثم أضف اسمه هنا
};
