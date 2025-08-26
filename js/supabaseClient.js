// js/supabaseClient.js

// 1. استيراد دالة إنشاء العميل من مكتبة Supabase
// ملاحظة: لا حاجة لتغيير هذا السطر، المتصفح سيجلبه من الـ CDN الذي أضفناه في HTML.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 2. تعريف متغيرات الاتصال
// !! هام جداً: استبدل هذه القيم بالقيم الحقيقية من مشروعك في Supabase !!
const supabaseUrl = 'https://mfytyecyiwpvsvfvmgaa.supabase.co'; // <--- الصق هنا عنوان URL الخاص بمشروعك
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meXR5ZWN5aXdwdnN2ZnZtZ2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzk1NDMsImV4cCI6MjA3MTgxNTU0M30.doXt3SRJykWBO0swU-VZIFOjquNI2EN9JhFzPMhIuSw'; // <--- الصق هنا مفتاح anon (public)

// 3. إنشاء وتصدير عميل Supabase
// سيتم استيراد هذا الكائن 'supabase' في الملفات الأخرى للتواصل مع قاعدة البيانات.
export const supabase = createClient(supabaseUrl, supabaseKey);


