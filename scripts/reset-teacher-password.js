/**
 * Script to reset a teacher's (or any user's) password.
 * Same idea as create-admin: uses bcrypt so login works.
 *
 * Usage: node scripts/reset-teacher-password.js [username] [password]
 * Example: node scripts/reset-teacher-password.js testtest mynewpassword
 *
 * Defaults: username=testtest, password=testtest (if not provided via env or args)
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent = {};

const envFile = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8')
  : (fs.existsSync(path.join(__dirname, '..', '.env')) ? fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8') : '');

if (envFile) {
  envFile.split(/\r?\n/).forEach(line => {
    const trimmed = line.replace(/^\s+|\s+$/g, '').replace(/^\uFEFF/, '');
    const match = trimmed.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/\r$/, '');
      if (key && value) envContent[key] = value;
    }
  });
}

const supabaseUrl = envContent.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envContent.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (or .env).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const username = (args[0] || process.env.TEACHER_USERNAME || envContent.TEACHER_USERNAME || 'testtest').trim().toLowerCase();
const password = args[1] || process.env.TEACHER_PASSWORD || envContent.TEACHER_PASSWORD || 'testtest';

if (!username || !password) {
  console.error('❌ Error: Username and password are required.');
  console.error('Usage: node scripts/reset-teacher-password.js <username> <password>');
  process.exit(1);
}

async function resetPassword() {
  console.log('🔐 Resetting password for user...');
  console.log(`   Username: ${username}`);
  console.log('');

  try {
    // Prefer teacher with this username; otherwise any user (so admin can reset too)
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, username, role, is_active')
      .ilike('username', username)
      .maybeSingle();

    if (findError) {
      console.error('❌ Error looking up user:', findError.message);
      process.exit(1);
    }

    if (!user) {
      console.error(`❌ No user found with username "${username}".`);
      console.error('   Check the username or create the teacher from the dashboard first.');
      process.exit(1);
    }

    console.log(`   Found: id=${user.id}, role=${user.role}, is_active=${user.is_active}`);
    if (user.is_active === false) {
      console.log('   ⚠️  User is inactive. Setting is_active=true so login works.');
    }
    console.log('🔒 Hashing new password...');
    const passwordHash = await bcrypt.hash(password, 10);

    const updatePayload = {
      password_hash: passwordHash,
      username: username,
      is_active: true,
    };

    const { error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message);
      process.exit(1);
    }

    console.log('');
    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('🚀 Login with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetPassword();
