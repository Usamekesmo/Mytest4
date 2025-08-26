// js/api.js

// 1. استيراد عميل Supabase
import { supabase } from './supabaseClient.js';

// 2. تعريف ثابت لواجهة برمجة تطبيقات القرآن
const ALQURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

/**
 * يجلب كل الإعدادات اللازمة لبدء اللعبة دفعة واحدة من Supabase.
 * هذا يحسن الأداء بشكل كبير عن طريق تجميع عدة طلبات في طلب واحد.
 * @returns {Promise<object|null>} كائن يحتوي على كل إعدادات اللعبة.
 */
export async function fetchGameConfig() {
    try {
        // تنفيذ كل طلبات الجلب بالتوازي لزيادة السرعة
        const [
            gameRules,
            questionsConfig,
            progression,
            storeItems,
            challenges
        ] = await Promise.all([
            supabase.from('game_rules').select('*'),
            supabase.from('questions_config').select('*'),
            supabase.from('progression').select('*').order('level', { ascending: true }), // مهم: ترتيب المستويات
            supabase.from('store_items').select('*'),
            supabase.from('challenges').select('*')
        ]);

        // دالة مساعدة للتحقق من وجود أخطاء في كل استجابة
        const checkError = (response, tableName) => {
            if (response.error) {
                throw new Error(`Failed to fetch ${tableName}: ${response.error.message}`);
            }
            return response.data;
        };

        // إرجاع كائن منظم يحتوي على كل البيانات
        return {
            gameRules: checkError(gameRules, 'game_rules'),
            questionsConfig: checkError(questionsConfig, 'questions_config'),
            progression: checkError(progression, 'progression'),
            storeItems: checkError(storeItems, 'store_items'),
            challenges: checkError(challenges, 'challenges')
        };

    } catch (error) {
        console.error("Fatal Error fetching game config:", error);
        alert("خطأ فادح في تحميل إعدادات اللعبة. لا يمكن بدء التطبيق.");
        return null;
    }
}

/**
 * يجلب بيانات لاعب معين من جدول 'players' في Supabase.
 * @param {string} userName - اسم اللاعب للبحث عنه.
 * @returns {Promise<object|null|'error'>} بيانات اللاعب، null إذا لم يوجد، أو 'error' عند فشل الاتصال.
 */
export async function fetchPlayer(userName) {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('name', userName) // ابحث عن اللاعب الذي يتطابق اسمه
        .single(); // نتوقع نتيجة واحدة فقط أو لا شيء

    // PGRST116 هو كود يعني "لم يتم العثور على الصف"، وهذا ليس خطأ في تطبيقنا
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching player:", error);
        return 'error';
    }
    return data; // سيكون 'data' إما كائن اللاعب أو null
}

/**
 * يحفظ (يحدّث أو ينشئ) بيانات اللاعب في Supabase.
 * @param {object} playerData - كائن بيانات اللاعب المراد حفظه.
 * @returns {Promise<boolean>} true عند النجاح، false عند الفشل.
 */
export async function savePlayer(playerData) {
    // upsert: إذا وجد لاعب بنفس الاسم، سيقوم بتحديثه. إذا لم يجده، سينشئ صفاً جديداً.
    const { error } = await supabase
        .from('players')
        .upsert(playerData, { onConflict: 'name' }); // onConflict يخبر Supabase بالعمود الفريد الذي يجب التحقق منه

    if (error) {
        console.error("Error saving player data:", error);
        return false;
    }
    console.log("Player data saved successfully.");
    return true;
}

/**
 * يجلب بيانات الآيات لنطاق محدد من واجهة برمجة تطبيقات القرآن.
 * (هذه الدالة لا تتصل بـ Supabase).
 * @param {string} scopeType - نوع النطاق (JUZ, SURAH, PAGE, PAGE_RANGE).
 * @param {string|number} scopeValue - قيمة النطاق.
 * @returns {Promise<Array|null>} مصفوفة من كائنات الآيات.
 */
export async function fetchAyahsForScope(scopeType, scopeValue) {
    let endpoint = '';
    switch (scopeType) {
        case 'JUZ': endpoint = `/juz/${scopeValue}/quran-uthmani`; break;
        case 'SURAH': endpoint = `/surah/${scopeValue}/quran-uthmani`; break;
        case 'PAGE': endpoint = `/page/${scopeValue}/quran-uthmani`; break;
        case 'PAGE_RANGE':
            const [start, end] = String(scopeValue).split('-').map(Number);
            if (!start || !end || start > end) return null;
            try {
                let allAyahs = [];
                const promises = [];
                for (let i = start; i <= end; i++) {
                    promises.push(fetch(`${ALQURAN_API_BASE_URL}/page/${i}/quran-uthmani`).then(res => res.json()));
                }
                const results = await Promise.all(promises);
                results.forEach(result => {
                    if (result.code === 200) allAyahs.push(...result.data.ayahs);
                });
                return allAyahs.length > 0 ? allAyahs : null;
            } catch (error) {
                console.error("Error fetching page range:", error);
                return null;
            }
        default: return null;
    }

    try {
        const response = await fetch(`${ALQURAN_API_BASE_URL}${endpoint}`);
        const data = await response.json();
        return (data.code === 200) ? data.data.ayahs : null;
    } catch (error) {
        console.error("Error in fetchAyahsForScope:", error);
        return null;
    }
}
