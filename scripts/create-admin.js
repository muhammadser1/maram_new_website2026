/**
 * Script to create the first admin user
 * 
 * Usage: node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = {};

// Load from .env.local or .env
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
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (or .env) in the project root.');
  console.error('Expected file: ' + path.resolve(__dirname, '..', '.env.local'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const usernameArg = args[0];
const passwordArg = args[1];
const roleArg = args[2];

const username = usernameArg || process.env.ADMIN_USERNAME || envContent.ADMIN_USERNAME || 'admin';
const password = passwordArg || process.env.ADMIN_PASSWORD || envContent.ADMIN_PASSWORD || 'admin123';
const role = (roleArg || process.env.ADMIN_ROLE || envContent.ADMIN_ROLE || 'admin').trim();

if (!username || !password) {
  console.error('❌ Error: Username and password are required.');
  console.error('Usage: node scripts/create-admin.js <username> <password> [role]');
  process.exit(1);
}

async function createAdmin() {
  console.log('🔐 Creating admin user...');
  console.log(`Username: ${username}`);
  console.log(`Role: ${role}`);
  console.log('');

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUser && !checkError) {
      console.log('⚠️  User already exists. Updating password (and role) to match your input...');
      const passwordHash = await bcrypt.hash(password, 10);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash, role, is_active: true })
        .eq('id', existingUser.id);
      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
        return;
      }
      console.log('');
      console.log('✅ Password updated successfully!');
      console.log('');
      console.log('🚀 You can now login with:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log('');
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    console.log('👤 Creating user in database...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username: username.toLowerCase(),
        password_hash: passwordHash,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user:', userError.message);
      if (userError.code === '23505') {
        console.error('User already exists with this username');
      }
      return;
    }

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log('');
    console.log('🚀 You can now login at: http://localhost:3000/login');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();

