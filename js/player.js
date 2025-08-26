// js/player.js

import * as api from './api.js';
import * as ui from './ui.js';
import * as progression from './progression.js';

// هذا المتغير سيحتفظ بكائن بيانات اللاعب طوال جلسة اللعب
export let playerData = null;

/**
 * يقوم بتحميل بيانات اللاعب من Supabase أو إنشاء لاعب جديد.
 * @param {string} userName - اسم اللاعب.
 * @returns {Promise<boolean>} true عند النجاح، false عند الفشل.
 */
export async function loadPlayer(userName) {
    const fetchedData = await api.fetchPlayer(userName);

    if (fetchedData === 'error') {
        alert("خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
        return false;
    }

    if (fetchedData) {
        // --- لاعب موجود ---
        playerData = fetchedData;
        // تأكد من أن owned_items هي مصفوفة، حتى لو كانت null في قاعدة البيانات
        if (!playerData.owned_items) {
            playerData.owned_items = [];
        }
        console.log(`مرحباً بعودتك: ${playerData.name}`);
    } else {
        // --- لاعب جديد ---
        playerData = {
            name: userName,
            xp: 0,
            diamonds: 0,
            owned_items: [] // ابدأ بمصفوفة فارغة
        };
        console.log(`مرحباً بك أيها اللاعب الجديد: ${userName}`);
    }
    
    // تحديث واجهة المستخدم بمعلومات اللاعب
    const levelInfo = progression.getLevelInfo(playerData.xp);
    ui.updatePlayerDisplay(playerData, levelInfo);
    return true;
}

/**
 * يرسل طلب حفظ بيانات اللاعب الحالية إلى Supabase.
 */
export async function savePlayer() {
    if (!playerData) return;
    const success = await api.savePlayer(playerData);
    ui.updateSaveMessage(success); // تحديث رسالة الحفظ في شاشة النتائج
}

/**
 * يضيف نقاط خبرة إلى اللاعب ويتحقق من وجود ترقية في المستوى.
 * @param {number} amount - كمية نقاط الخبرة المراد إضافتها.
 */
export function addXp(amount) {
    if (!playerData) return;

    const oldXp = playerData.xp;
    playerData.xp += amount;
    
    // التحقق من وجود ترقية
    const levelUpInfo = progression.checkForLevelUp(oldXp, playerData.xp);
    if (levelUpInfo) {
        // إذا تمت الترقية، أضف مكافأة الألماس
        playerData.diamonds += levelUpInfo.reward;
        // اعرض رسالة الترقية في واجهة المستخدم
        ui.displayLevelUp(levelUpInfo);
        console.log(`ترقية! وصل اللاعب إلى المستوى ${levelUpInfo.level} وحصل على ${levelUpInfo.reward} ألماسة.`);
    }
}

/**
 * يضيف الألماس إلى رصيد اللاعب.
 * @param {number} amount - كمية الألماس المراد إضافتها.
 */
export function addDiamonds(amount) {
    if (!playerData) return;
    playerData.diamonds += amount;
}
