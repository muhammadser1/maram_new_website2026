/**
 * Demo seed: teachers, students, individual/group/special lessons, payments.
 * Prints summary stats and total price + payment1, payment2, payment3.
 *
 * Usage: node scripts/demo-seed.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPaths = [
  path.join(__dirname, '..', '.env.local'),
  path.join(__dirname, '..', '.env'),
];
const envContent = {};
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim().replace(/\r$/, '');
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
          val = val.slice(1, -1);
        envContent[key] = val;
      }
    });
    break;
  }
}

const supabaseUrl =
  envContent.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  envContent.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  console.error('❌ Missing Supabase credentials:', missing.join(', '));
  console.error('   Check .env or .env.local in the project root.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// --- Helpers ---
function getLevelsMap() {
  return supabase
    .from('education_levels')
    .select('id, name_ar')
    .then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return new Map((data || []).map((r) => [r.name_ar, r.id]));
    });
}

function getSubjects() {
  return supabase
    .from('subjects')
    .select('id, name_ar, price_per_hour')
    .then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return data || [];
    });
}

// --- Seed teachers (2) ---
async function seedTeachers() {
  console.log('👩\u200d🏫 Creating demo teachers...');
  const seeds = [
    { username: 'demo_teacher1', password: 'demo123', full_name: 'معلمة تجريبية ١', phone: '0511111111' },
    { username: 'demo_teacher2', password: 'demo123', full_name: 'معلمة تجريبية ٢', phone: '0522222222' },
  ];
  const teachers = [];
  for (const s of seeds) {
    const password_hash = await bcrypt.hash(s.password, 10);
    const { data: user, error: uErr } = await supabase
      .from('users')
      .upsert(
        { username: s.username, password_hash, role: 'teacher', is_active: true },
        { onConflict: 'username' }
      )
      .select()
      .single();
    if (uErr || !user) throw new Error(uErr?.message || 'User insert failed');

    const { data: teacher, error: tErr } = await supabase
      .from('teachers')
      .upsert(
        { user_id: user.id, full_name: s.full_name, phone: s.phone },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    if (tErr || !teacher) throw new Error(tErr?.message || 'Teacher insert failed');
    teachers.push(teacher);
  }
  return teachers;
}

// --- Seed students (5) ---
async function seedStudents(levelsMap) {
  console.log('👨\u200d🎓 Creating demo students...');
  const rows = [
    { full_name: 'طالب تجريبي ١', parent_contact: '0530000001', level: 'ابتدائي' },
    { full_name: 'طالب تجريبي ٢', parent_contact: '0530000002', level: 'إعدادي' },
    { full_name: 'طالب تجريبي ٣', parent_contact: '0530000003', level: 'ثانوي' },
    { full_name: 'طالب تجريبي ٤', parent_contact: '0530000004', level: 'ثانوي' },
    { full_name: 'طالب تجريبي ٥', parent_contact: '0530000005', level: 'إعدادي' },
  ];
  const payload = rows.map((r) => ({
    full_name: r.full_name,
    parent_contact: r.parent_contact,
    education_level_id: levelsMap.get(r.level),
  }));
  const { error } = await supabase.from('students').upsert(payload, { onConflict: 'full_name' });
  if (error) throw new Error(error.message);

  const { data } = await supabase.from('students').select('id, full_name, education_level_id').order('id');
  return data || [];
}

// --- Individual lessons (regular + special), group lessons, payments ---
async function seedLessonsAndPayments(teachers, students, levelsMap, subjects) {
  console.log('📘 Creating individual (regular + special), group lessons and payments...');

  const levelIds = Object.fromEntries(levelsMap);
  const ثانوي = levelIds['ثانوي'];
  const إعدادي = levelIds['إعدادي'];
  const ابتدائي = levelIds['ابتدائي'];
  const subjectId = (subjects.find((s) => s.name_ar && s.name_ar.includes('رياضيات')) || subjects[0])?.id || null;

  const t1 = teachers[0].id;
  const t2 = teachers[1].id;
  const [s1, s2, s3, s4, s5] = students.map((s) => s.id);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 864e5).toISOString().split('T')[0];

  // Individual: 2 regular, 1 special (subject)
  const individualRows = [
    { teacher_id: t1, student_id: s1, education_level_id: ابتدائي, subject_id: null, date: twoDaysAgo, start_time: '10:00', hours: 1.5, approved: true },
    { teacher_id: t1, student_id: s2, education_level_id: إعدادي, subject_id: null, date: yesterday, start_time: '14:00', hours: 1, approved: true },
    { teacher_id: t2, student_id: s3, education_level_id: ثانوي, subject_id: subjectId, date: today, start_time: '16:00', hours: 2, approved: true },
  ];
  const { error: indErr } = await supabase.from('individual_lessons').insert(individualRows);
  if (indErr) throw new Error(indErr.message);

  // Group: 1 regular (2 students), 1 with subject (2 students)
  const { data: gl1, error: gl1Err } = await supabase
    .from('group_lessons')
    .insert({
      teacher_id: t1,
      education_level_id: إعدادي,
      subject_id: null,
      date: yesterday,
      start_time: '11:00',
      hours: 1,
      approved: true,
      total_cost: 80, // إعدادي group 80/hr
    })
    .select()
    .single();
  if (gl1Err || !gl1) throw new Error(gl1Err?.message || 'Group lesson 1 failed');

  await supabase.from('group_lesson_students').insert([
    { group_lesson_id: gl1.id, student_id: s2 },
    { group_lesson_id: gl1.id, student_id: s5 },
  ]);

  const { data: gl2, error: gl2Err } = await supabase
    .from('group_lessons')
    .insert({
      teacher_id: t2,
      education_level_id: ثانوي,
      subject_id: subjectId,
      date: today,
      start_time: '15:00',
      hours: 1.5,
      approved: true,
      total_cost: subjectId ? 150 * 1.5 : 90 * 1.5, // subject 150/hr or group 90
    })
    .select()
    .single();
  if (gl2Err || !gl2) throw new Error(gl2Err?.message || 'Group lesson 2 failed');

  await supabase.from('group_lesson_students').insert([
    { group_lesson_id: gl2.id, student_id: s3 },
    { group_lesson_id: gl2.id, student_id: s4 },
  ]);

  // Payments (3) — so we can report payment1, payment2, payment3
  const paymentsPayload = [
    { student_id: s1, amount: 100, payment_date: twoDaysAgo, note: 'دفعة تجريبية ١' },
    { student_id: s2, amount: 200, payment_date: yesterday, note: 'دفعة تجريبية ٢' },
    { student_id: s3, amount: 250, payment_date: today, note: 'دفعة تجريبية ٣' },
  ];
  const { error: payErr } = await supabase.from('payments').insert(paymentsPayload);
  if (payErr) throw new Error(payErr.message);
}

// --- Summary from DB ---
async function printSummary() {
  const [
    { count: teacherCount },
    { count: studentCount },
    { data: ind },
    { data: grp },
    { data: payments },
    { data: dues },
  ] = await Promise.all([
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('individual_lessons').select('id, total_cost, approved').is('deleted_at', null),
    supabase.from('group_lessons').select('id, total_cost, approved').is('deleted_at', null),
    supabase.from('payments').select('id, student_id, amount, payment_date, note').order('id'),
    supabase.rpc('get_student_dues_summary').then((r) => (r.error ? { data: null } : r)),
  ]);

  const indApproved = (ind || []).filter((l) => l.approved);
  const grpApproved = (grp || []).filter((l) => l.approved);
  const totalLessonCost =
    indApproved.reduce((s, l) => s + (Number(l.total_cost) || 0), 0) +
    grpApproved.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);
  const totalPayments = (payments || []).reduce((s, p) => s + Number(p.amount), 0);

  console.log('\n========== DEMO SEED SUMMARY (saved in DB) ==========\n');
  console.log('Counts:');
  console.log('  Teachers:', teacherCount ?? 0);
  console.log('  Students:', studentCount ?? 0);
  console.log('  Individual lessons:', (ind || []).length, '(approved:', indApproved.length + ')');
  console.log('  Group lessons:', (grp || []).length, '(approved:', grpApproved.length + ')');
  console.log('  Payments:', (payments || []).length);
  console.log('');
  console.log('Total approved lessons cost (ر.س):', totalLessonCost.toFixed(2));
  console.log('Total payments (ر.س):', totalPayments.toFixed(2));
  console.log('');
  console.log('Payment 1:', payments?.[0] ? `${payments[0].amount} ر.س (student_id=${payments[0].student_id}, ${payments[0].payment_date}) ${payments[0].note || ''}` : '—');
  console.log('Payment 2:', payments?.[1] ? `${payments[1].amount} ر.س (student_id=${payments[1].student_id}, ${payments[1].payment_date}) ${payments[1].note || ''}` : '—');
  console.log('Payment 3:', payments?.[2] ? `${payments[2].amount} ر.س (student_id=${payments[2].student_id}, ${payments[2].payment_date}) ${payments[2].note || ''}` : '—');
  if (dues && dues.length) {
    console.log('\nDues summary (get_student_dues_summary):');
    dues.slice(0, 5).forEach((r) => {
      console.log(`  Student ${r.student_id} (${r.student_name}): due=${r.total_due}, paid=${r.total_paid}, remaining=${r.remaining}`);
    });
  }
  console.log('\n====================================================\n');
}

async function main() {
  try {
    const levelsMap = await getLevelsMap();
    const subjects = await getSubjects();
    const teachers = await seedTeachers();
    const students = await seedStudents(levelsMap);
    await seedLessonsAndPayments(teachers, students, levelsMap, subjects);
    await printSummary();
    console.log('✅ Demo seed complete.');
  } catch (e) {
    console.error('❌ Demo seed failed:', e.message);
    process.exit(1);
  }
}

main();
