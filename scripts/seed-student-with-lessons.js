/**
 * Add individual lessons for a student.
 * Usage:
 *   node scripts/seed-student-with-lessons.js [studentName] [numLessons] [teacherId] [studentId] [mode] [year] [monthsCsv] [specialSubjectName] [specialEvery]
 *
 * Examples:
 *   node scripts/seed-student-with-lessons.js
 *   node scripts/seed-student-with-lessons.js "طالب تجريبي 1500" 1500
 *   node scripts/seed-student-with-lessons.js "احمد سينا" 1500 1 2 regular
 *   node scripts/seed-student-with-lessons.js "احمد سينا" 1500 1 2 mixed 2026 1,2,3 "حاسوب للثانوي" 3
 *
 * Defaults:
 *   studentName = "طالب تجريبي 1500", numLessons = 1500, mode = "mixed"
 *
 * Requires: at least one teacher (teacher1), education_levels, and subjects in DB.
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = {};

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.replace(/^\s+|\s+$/g, '').replace(/^\uFEFF/, '');
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/\r$/, '');
        if (key && value) envContent[key] = value;
      }
    });
}

const supabaseUrl =
  envContent.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  envContent.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials (.env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BATCH_SIZE = 200;
const args = process.argv.slice(2);
const studentName = args[0] || 'طالب تجريبي 1500';
const numLessons = Math.min(parseInt(args[1], 10) || 1500, 5000);
const teacherIdArg = args[2] ? parseInt(args[2], 10) : null;
const studentIdArg = args[3] ? parseInt(args[3], 10) : null;
const modeArg = (args[4] || 'mixed').toLowerCase();
const regularOnly = modeArg === 'regular';
const yearArg = args[5] ? parseInt(args[5], 10) : null;
const monthsArg = args[6]
  ? args[6]
      .split(',')
      .map((m) => parseInt(m, 10))
      .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
  : [];
const specialSubjectNameArg = args[7] || null;
const specialEveryArg = Math.max(parseInt(args[8], 10) || 3, 2);

function pad2(value) {
  return String(value).padStart(2, '0');
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

async function run() {
  console.log('🔹 Fetching teacher...');
  let user = null;
  let teacher = null;

  if (teacherIdArg) {
    teacher = (
      await supabase
        .from('teachers')
        .select('id, user_id, full_name')
        .eq('id', teacherIdArg)
        .maybeSingle()
    ).data;
    if (!teacher?.id) {
      console.error(`❌ Teacher with id ${teacherIdArg} not found.`);
      process.exit(1);
    }
    console.log(`   Using existing teacher #${teacher.id}: ${teacher.full_name || 'بدون اسم'}`);
  } else {
    user = (await supabase.from('users').select('id').ilike('username', 'teacher1').maybeSingle()).data;
    teacher = user?.id
      ? (await supabase.from('teachers').select('id, user_id, full_name').eq('user_id', user.id).maybeSingle()).data
      : null;
  }

  if (!teacher?.id) {
    console.log('   Teacher1 not found. Creating user + teacher...');
    const passwordHash = await bcrypt.hash('teacher1', 10);
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username: 'teacher1',
        password_hash: passwordHash,
        role: 'teacher',
        is_active: true,
      })
      .select('id')
      .single();
    if (userError || !newUser) {
      console.error('❌ Failed to create user teacher1:', userError?.message);
      process.exit(1);
    }
    user = newUser;
    const { data: newTeacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: newUser.id,
        full_name: 'معلم تجريبي',
        phone: null,
      })
      .select('id, user_id, full_name')
      .single();
    if (teacherError || !newTeacher) {
      console.error('❌ Failed to create teacher record:', teacherError?.message);
      process.exit(1);
    }
    teacher = newTeacher;
    console.log('   Created teacher1 (login: teacher1 / teacher1)');
  }

  console.log('🔹 Fetching education levels and subjects...');
  const { data: levels } = await supabase.from('education_levels').select('id').order('id', { ascending: true });
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_ar, name_en, price_per_hour, education_level_id')
    .order('id', { ascending: true });

  if (!levels?.length) {
    console.error('❌ No education_levels found. Run schema first.');
    process.exit(1);
  }

  const levelId = levels[0].id;
  let student = null;
  if (studentIdArg) {
    console.log(`🔹 Using existing student id: ${studentIdArg}`);
    const { data: existingStudent, error: existingStudentError } = await supabase
      .from('students')
      .select('id, education_level_id, full_name')
      .eq('id', studentIdArg)
      .maybeSingle();
    if (existingStudentError || !existingStudent) {
      console.error('❌ Failed to fetch existing student:', existingStudentError?.message || 'Student not found');
      process.exit(1);
    }
    student = existingStudent;
    console.log(`   Student: ${student.full_name}`);
  } else {
    console.log('🔹 Creating student:', studentName);
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({
        full_name: studentName,
        education_level_id: levelId,
        parent_contact: null,
        class: null,
      })
      .select('id, education_level_id, full_name')
      .single();

    if (studentError || !newStudent) {
      console.error('❌ Failed to create student:', studentError?.message);
      if (studentError?.code === '23505') console.error('   (اسم الطالب موجود مسبقاً – اختر اسماً آخراً)');
      process.exit(1);
    }
    student = newStudent;
  }

  console.log('   Student id:', student.id);

  const { data: pricingRow } = await supabase
    .from('pricing')
    .select('price_per_hour')
    .eq('education_level_id', student.education_level_id)
    .eq('lesson_type', 'individual')
    .maybeSingle();
  const regularPricePerHour = Number(pricingRow?.price_per_hour) || 100;
  const scopedSubjects = (subjects || []).filter(
    (s) => !s.education_level_id || s.education_level_id === student.education_level_id
  );
  const selectedSpecialSubject =
    (specialSubjectNameArg
      ? scopedSubjects.find(
          (s) => s.name_ar === specialSubjectNameArg || s.name_en === specialSubjectNameArg
        )
      : null) || null;

  if (!regularOnly && specialSubjectNameArg && !selectedSpecialSubject) {
    console.error(`❌ Special subject "${specialSubjectNameArg}" not found for this student's level.`);
    process.exit(1);
  }

  if (!regularOnly && selectedSpecialSubject) {
    console.log(
      `🔹 Using special subject: ${selectedSpecialSubject.name_ar} (${Number(
        selectedSpecialSubject.price_per_hour
      ).toFixed(2)} per hour)`
    );
  }

  const today = new Date();
  const lessons = [];
  const regularRatio = 0.7; // fallback only when no explicit special subject is provided
  const targetMonths = monthsArg.length ? monthsArg : null;
  const monthCounters = Object.create(null);
  let regularCount = 0;
  let specialCount = 0;
  let regularHoursTotal = 0;
  let specialHoursTotal = 0;
  let regularCostTotal = 0;
  let specialCostTotal = 0;

  for (let i = 0; i < numLessons; i++) {
    let dateStr;
    if (yearArg && targetMonths?.length) {
      const month = targetMonths[i % targetMonths.length];
      const usedCount = monthCounters[month] || 0;
      const day = (usedCount % daysInMonth(yearArg, month)) + 1;
      monthCounters[month] = usedCount + 1;
      dateStr = `${yearArg}-${pad2(month)}-${pad2(day)}`;
    } else {
      const daysAgo = Math.floor((i * 1.2) % 800); // spread over ~800 days back
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      dateStr = date.toISOString().split('T')[0];
    }

    const explicitSpecial = !regularOnly && selectedSpecialSubject && (i + 1) % specialEveryArg === 0;
    const fallbackSpecial =
      !regularOnly &&
      !selectedSpecialSubject &&
      scopedSubjects.length > 0 &&
      Math.random() > regularRatio;
    const specialSubject = explicitSpecial
      ? selectedSpecialSubject
      : fallbackSpecial
      ? scopedSubjects[i % scopedSubjects.length]
      : null;
    const isSpecial = Boolean(specialSubject);
    const subjectId = specialSubject?.id || null;
    const pricePerHour = isSpecial
      ? Number(specialSubject?.price_per_hour) || regularPricePerHour
      : regularPricePerHour;
    const hours = yearArg && targetMonths?.length ? [1, 2][i % 2] : [1, 1.5, 2, 2.5][i % 4];
    const totalCost = Math.round(pricePerHour * hours * 100) / 100;

    if (isSpecial) {
      specialCount += 1;
      specialHoursTotal += hours;
      specialCostTotal += totalCost;
    } else {
      regularCount += 1;
      regularHoursTotal += hours;
      regularCostTotal += totalCost;
    }

    lessons.push({
      teacher_id: teacher.id,
      student_id: student.id,
      education_level_id: student.education_level_id,
      subject_id: subjectId,
      date: dateStr,
      start_time: null,
      hours,
      approved: true,
      total_cost: totalCost,
      price_locked: true,
      seeded_by_script: true,
    });
  }

  if (yearArg && targetMonths?.length) {
    console.log(`🔹 Period: ${yearArg} / months ${targetMonths.join(', ')}`);
  }
  console.log(`🔹 Inserting ${lessons.length} ${regularOnly ? 'regular' : 'mixed'} lessons in batches of ${BATCH_SIZE} ...`);
  let inserted = 0;
  for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
    const batch = lessons.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('individual_lessons').insert(batch);
    if (error) {
      console.error('❌ Batch insert failed at offset', i, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    if (inserted % 500 === 0 || inserted === lessons.length) {
      console.log('   ', inserted, '/', lessons.length);
    }
  }

  console.log('✅ Done. Student:', student.full_name || studentName, '| Lessons:', inserted, '| Teacher:', teacher.full_name || teacher.id);
  console.log('📊 Summary');
  console.log('   Regular lessons:', regularCount, '| Hours:', regularHoursTotal, '| Cost:', regularCostTotal.toFixed(2));
  console.log('   Special lessons:', specialCount, '| Hours:', specialHoursTotal, '| Cost:', specialCostTotal.toFixed(2));
  console.log('   Total lessons:', inserted, '| Total hours:', (regularHoursTotal + specialHoursTotal), '| Total cost:', (regularCostTotal + specialCostTotal).toFixed(2));
  process.exit(0);
}

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
