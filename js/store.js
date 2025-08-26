// js/store.js

import * as player from './player.js';
import * as ui from './ui.js';
import * as progression from './progression.js';

let storeItems = [];
let ownedPages = [];

/**
 * يقوم بتهيئة وحدة المتجر بالبيانات التي تم جلبها.
 * @param {Array} items - مصفوفة كائنات عناصر المتجر.
 */
export function initialize(items) {
    storeItems = items;
    console.log("Store initialized with", storeItems.length, "items.");
}

/**
 * @returns {Array} مصفوفة عناصر المتجر.
 */
export function getStoreItems() {
    return storeItems;
}

/**
 * ينفذ عملية شراء عنصر معين.
 * @param {string} itemId - المعرف الفريد للعنصر المراد شراؤه.
 */
export function buyItem(itemId) {
    const item = storeItems.find(i => i.item_id === itemId);
    if (!item || !player.playerData) return;

    if (player.playerData.diamonds < item.price) {
        alert("ليس لديك ما يكفي من الألماس لشراء هذا العنصر!");
        return;
    }
    if (player.playerData.owned_items.includes(itemId)) {
        alert("أنت تمتلك هذا العنصر بالفعل!");
        return;
    }

    // 1. خصم السعر
    player.playerData.diamonds -= item.price;
    // 2. إضافة العنصر إلى مصفوفة الممتلكات
    player.playerData.owned_items.push(itemId);
    
    // 3. حفظ بيانات اللاعب المحدثة في Supabase
    player.savePlayer();
    
    // 4. تحديث الواجهة فوراً
    applyOwnedItems(); // أعد تطبيق كل التأثيرات (بما في ذلك قائمة الصفحات)
    ui.renderStore(); // أعد رسم المتجر لإظهار العنصر كمملوك
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo); // تحديث عرض الألماس
    
    alert(`تهانينا! لقد اشتريت "${item.item_name}" بنجاح.`);
}

/**
 * يطبق تأثيرات كل العناصر التي يمتلكها اللاعب على واجهة المستخدم.
 * يتم استدعاؤها بعد تسجيل الدخول وبعد كل عملية شراء.
 */
export function applyOwnedItems() {
    if (!player.playerData) return;
    
    // 1. تطبيق الثيمات
    const themeItem = player.playerData.owned_items
        .map(id => storeItems.find(i => i.item_id === id && i.item_type === 'THEME'))
        .find(Boolean); // .find(Boolean) يجد أول عنصر غير null
    
    // إزالة أي ثيمات قديمة أولاً
    document.body.className = ''; 
    if (themeItem) {
        document.body.classList.add(themeItem.value);
    }

    // 2. تحديث قائمة الصفحات المملوكة
    const defaultPagesStr = progression.getRuleValue('defaultPages') || "1";
    const defaultPages = defaultPagesStr.split(',').map(Number);
    
    const purchasedPageItems = player.playerData.owned_items
        .map(id => storeItems.find(i => i.item_id === id && i.item_type === 'PAGE'))
        .filter(Boolean);
        
    const purchasedPageNumbers = purchasedPageItems.map(item => parseInt(item.value, 10));

    // دمج الصفحات الافتراضية والمشتراة، وإزالة التكرار، ثم الترتيب
    ownedPages = [...new Set([...defaultPages, ...purchasedPageNumbers])].sort((a, b) => a - b);

    // 3. تحديث واجهة المستخدم بالصفحات المتاحة
    ui.updateAvailablePages(ownedPages);
}

/**
 * يتحقق مما إذا كان اللاعب يمتلك كل الصفحات ضمن نطاق معين.
 * @param {number} start - بداية النطاق.
 * @param {number} end - نهاية النطاق.
 * @returns {boolean}
 */
export function ownsPageRange(start, end) {
    for (let i = start; i <= end; i++) {
        if (!ownedPages.includes(i)) {
            return false; // إذا كانت هناك صفحة واحدة غير مملوكة، يفشل التحقق
        }
    }
    return true;
}


