const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
const db=new PGlite();
try{
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 grant usage on schema public,auth,storage to authenticated,service_role;
 grant select on storage.objects to authenticated;
 insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
 await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202609280001_user_mascots.sql'),'utf8'));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const reserve=async user=>(await db.query(`select reserve_mascot($1,'Test') as id`,[user])).rows[0].id;
 const aid=await reserve(a),bid=await reserve(b);
 await assert.rejects(()=>reserve(a),/MASCOT_BUSY/);
 await db.query(`update mascot_creations set status='ready',sheet_path=user_id||'/'||id||'.png'`);
 await db.query(`insert into storage.objects(bucket_id,name) values('user-mascots',$1),('user-mascots',$2)`,[`${a}/${aid}.png`,`${b}/${bid}.png`]);
 await db.exec(`set role authenticated; set request.jwt.claim.sub='${a}';`);
 assert.equal((await db.query('select * from mascot_creations')).rows.length,1);
 assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await db.query(`insert into mascot_preferences(user_id,choice) values($1,$2)`,[a,aid]);
 await assert.rejects(()=>db.query('update mascot_preferences set choice=$1',[bid]),/row-level security/);
 await assert.rejects(()=>db.query('insert into mascot_preferences(user_id,choice) values($1,$2)',[b,bid]),/row-level security/);
 await assert.rejects(()=>db.query(`update mascot_creations set status='failed'`),/permission denied/);
 await assert.rejects(()=>reserve(a),/permission denied/);
 await db.query(`update mascot_preferences set choice='fox'`);
 await db.exec('reset role');
 const second=await reserve(a);await db.query(`update mascot_creations set status='failed' where id=$1`,[second]);
 const third=await reserve(a);await db.query(`update mascot_creations set status='failed' where id=$1`,[third]);
 await assert.rejects(()=>reserve(a),/MASCOT_LIMIT/);
 console.log('PASS: migration, owner-only image and row reads, cross-account selection rejection, protected quota, busy reservation, rolling limit');
}finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
