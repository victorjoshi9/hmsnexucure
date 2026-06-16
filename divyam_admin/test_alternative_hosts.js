const { Client } = require('pg');

const hosts = [
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-1-ap-south-1.pooler.supabase.com',
  'aws-2-ap-south-1.pooler.supabase.com',
  'aws-3-ap-south-1.pooler.supabase.com'
];

async function testHost(host) {
  const client = new Client({
    host,
    port: 6543,
    user: 'postgres.fglrshzodiroznjmxepx',
    password: 'Madhu97*raja',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    console.log(`Connecting to host ${host}...`);
    await client.connect();
    console.log(`SUCCESS on host ${host}!`);
    const res = await client.query("SELECT current_database(), now();");
    console.log("Result:", res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Host ${host} failed: ${err.message}`);
    if (err.message.includes('password authentication failed')) {
      console.log(`FOUND CORRECT HOST: ${host} (password incorrect)`);
      return true;
    }
    return false;
  }
}

async function run() {
  for (const host of hosts) {
    const success = await testHost(host);
    if (success) break;
  }
}

run();
