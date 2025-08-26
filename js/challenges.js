// js/challenges.js

import { startQuizWithScope } from './main.js';

let allChallenges = [];

/**
 * يقوم بتهيئة وحدة التحديات بالبيانات التي تم جلبها.
 * @param {Array} items - مصفوفة كائنات التحديات.
 */
export function initialize(items) {
    allChallenges = items;
    console.log("Challenges module initialized with", allChallenges.length, "challenges.");
}

/**
 * يقوم بفلترة كل التحديات لإرجاع التحديات المتاحة حالياً فقط.
 * @returns {Array} مصفوفة من كائنات التحديات المتاحة.
 */
export function getAvailableChallenges() {
    const now = new Date();
    return allChallenges.filter(challenge => {
        const startTime = new Date(challenge.start_time);
        const endTime = new Date(challenge.end_time);
        return now >= startTime && now <= endTime;
    });
}

/**
 * يبدأ تحدياً معيناً.
 * @param {string} challengeId - المعرف الفريد للتحدي.
 */
export function startChallenge(challengeId) {
    const challenge = allChallenges.find(c => c.challenge_id === challengeId);
    if (!challenge) {
        alert("عفواً، هذا التحدي لم يعد متاحاً.");
        return;
    }

    console.log(`Starting challenge: ${challenge.title}`);

    // استدعاء الدالة الرئيسية لبدء الاختبار مع تمرير إعدادات التحدي
    // (النطاق القرآني، وعدد الأسئلة الخاص بالتحدي)
    startQuizWithScope(
        challenge.scope_type, 
        challenge.scope_value, 
        challenge.questions_count
    );
}


