/**
 * Remove teacher1 (user + teacher record) and all their lessons.
 * Optionally remove the seeded student "طالب تجريبي 1500" and all their lessons.
 * Usage: node scripts/remove-seeded-teacher-and-lessons.js [studentName]
 *        If studentName is provided, also deletes that student and all their lessons.
 *        Default studentName = "طالب تجريبي 1500"
 */

const { createClient } = require('@supabase/supabase-js');
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
  console.error('❌ Missing Supabase credentials (.env.local)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const studentNameToRemove = process.argv[2] || 'طالب تجريبي 1500';

async function run() {
  console.log('🔹 Finding teacher1...');
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .ilike('username', 'teacher1')
    .maybeSingle();

  if (!user?.id) {
    console.log('   No user "teacher1" found. Nothing to remove.');
    process.exit(0);
  }

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!teacher?.id) {
    console.log('   No teacher record for teacher1. Removing user only.');
    await supabase.from('users').delete().eq('id', user.id);
    console.log('✅ Removed user teacher1');
    process.exit(0);
  }

  console.log('🔹 Deleting individual lessons for this teacher...');
  const { error: delErr } = await supabase
    .from('individual_lessons')
    .delete()
    .eq('teacher_id', teacher.id);
  if (delErr) {
    console.error('❌ Failed to delete lessons:', delErr.message);
    process.exit(1);
  }
  console.log('   Individual lessons deleted.');

  console.log('🔹 Deleting teacher record...');
  await supabase.from('teachers').delete().eq('id', teacher.id);

  console.log('🔹 Deleting user teacher1...');
  await supabase.from('users').delete().eq('id', user.id);

  console.log('✅ Teacher1 and their lessons removed.');

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('full_name', studentNameToRemove)
    .is('deleted_at', null)
    .maybeSingle();

  if (student?.id) {
    console.log('🔹 Removing seeded student:', studentNameToRemove, '...');
    await supabase.from('individual_lessons').delete().eq('student_id', student.id);
    await supabase.from('students').delete().eq('id', student.id);
    console.log('✅ Student and their lessons removed.');
  } else {
    console.log('   (No student named "' + studentNameToRemove + '" found to remove)');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
