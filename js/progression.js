// js/progression.js

// متغيرات لتخزين الإعدادات التي تم جلبها
let levels = [];
let gameRules = {};

/**
 * يقوم بتهيئة وحدة التقدم بالبيانات التي تم جلبها من Supabase.
 * @param {Array} progressionData - مصفوفة كائنات المستويات.
 * @param {Array} gameRulesData - مصفوفة كائنات قواعد اللعبة.
 */
export function initialize(progressionData, gameRulesData) {
    levels = progressionData;
    
    // تحويل مصفوفة قواعد اللعبة إلى كائن يسهل الوصول إليه
    gameRules = gameRulesData.reduce((acc, rule) => {
        acc[rule.rule_name] = rule.rule_value;
        return acc;
    }, {});

    console.log("Progression system initialized with", levels.length, "levels and", Object.keys(gameRules).length, "rules.");
}

/**
 * دالة مساعدة للوصول إلى قيمة قاعدة معينة من قواعد اللعبة.
 * @param {string} ruleName - اسم القاعدة (مثال: 'xpPerCorrectAnswer').
 * @returns {string|null} قيمة القاعدة كنص.
 */
export function getRuleValue(ruleName) {
    return gameRules[ruleName] || null;
}

/**
 * يحسب معلومات المستوى الحالي للاعب بناءً على نقاط خبرته.
 * @param {number} currentXp - نقاط الخبرة الحالية للاعب.
 * @returns {object} كائن يحتوي على معلومات المستوى الحالي والتالي.
 */
export function getLevelInfo(currentXp) {
    if (!levels || levels.length === 0) {
        // قيمة افتراضية في حال عدم وجود مستويات
        return { level: 1, title: 'لاعب جديد', progress: 0, nextLevelXp: 100, currentLevelXp: 0 };
    }

    // البحث عن المستوى الحالي (أعلى مستوى تم الوصول إليه)
    let currentLevelInfo = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
        if (currentXp >= levels[i].xp_required) {
            currentLevelInfo = levels[i];
            break;
        }
    }

    // البحث عن المستوى التالي
    const nextLevelInfo = levels.find(l => l.level === currentLevelInfo.level + 1);

    const xpForCurrentLevel = currentLevelInfo.xp_required;
    
    if (nextLevelInfo) {
        // إذا كان هناك مستوى تالٍ
        const xpForNextLevel = nextLevelInfo.xp_required;
        const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
        const xpEarnedInCurrentLevel = currentXp - xpForCurrentLevel;
        const progressPercentage = (xpEarnedInCurrentLevel / xpNeededForNextLevel) * 100;
        
        return {
            level: currentLevelInfo.level,
            title: currentLevelInfo.title,
            progress: Math.min(100, progressPercentage),
            xpForNextLevel: xpForNextLevel,
            currentLevelXp: currentXp
        };
    } else {
        // إذا كان هذا هو أعلى مستوى متاح
        return {
            level: currentLevelInfo.level,
            title: currentLevelInfo.title,
            progress: 100, // وصل للقمة
            xpForNextLevel: 'MAX',
            currentLevelXp: currentXp
        };
    }
}

/**
 * يتحقق مما إذا كان اللاعب قد ترقى لمستوى جديد بعد كسب نقاط خبرة.
 * @param {number} oldXp - نقاط الخبرة قبل الاختبار.
 * @param {number} newXp - نقاط الخبرة بعد الاختبار.
 * @returns {object|null} معلومات المستوى الجديد إذا تمت الترقية، وإلا null.
 */
export function checkForLevelUp(oldXp, newXp) {
    const oldLevelInfo = getLevelInfo(oldXp);
    const newLevelInfo = getLevelInfo(newXp);

    if (newLevelInfo.level > oldLevelInfo.level) {
        // تمت الترقية!
        const newLevelData = levels.find(l => l.level === newLevelInfo.level);
        return {
            ...newLevelInfo,
            reward: newLevelData ? newLevelData.diamonds_reward : 0
        };
    }
    
    return null;
}
