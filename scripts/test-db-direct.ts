#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'

// .env.localを明示的に読み込み
config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseDirectly() {
  console.log('🔍 Supabase直接接続テスト...')
  
  try {
    // 1. テーブル一覧確認
    console.log('\n📊 1. テーブル一覧確認:')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.log('❌ テーブル一覧取得エラー:', tablesError.message)
    } else {
      console.log('✅ 公開テーブル:', tables?.map(t => t.table_name).join(', '))
    }

    // 2. 各テーブルの件数確認
    console.log('\n📊 2. テーブル件数確認:')
    const tableNames = ['speeches', 'speech_chunks', 'speech_embeddings', 'sns_posts', 'highlights']
    
    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: ${count} 件`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err}`)
      }
    }

    // 3. pgvector拡張確認
    console.log('\n📊 3. pgvector拡張確認:')
    try {
      const { data: extensions, error: extError } = await supabase.rpc('sql', {
        query: "SELECT extname FROM pg_extension WHERE extname = 'vector'"
      })
      
      if (extError) {
        console.log('⚠️  直接RPC呼び出しエラー:', extError.message)
      } else {
        console.log('✅ pgvector拡張:', extensions?.length ? 'インストール済み' : '未インストール')
      }
    } catch (err) {
      console.log('⚠️  RPC呼び出し方法が利用できません')
    }

    // 4. RPC関数テスト（小さなベクター）
    console.log('\n📊 4. RPC関数テスト:')
    try {
      const testVector = new Array(3072).fill(0.1) // 小さなテストベクター
      const { data: rpcResult, error: rpcError } = await supabase.rpc('match_speech_chunks', {
        query_embedding: testVector,
        match_count: 1,
        match_threshold: 0.1
      })
      
      if (rpcError) {
        console.log('❌ RPC関数エラー:', rpcError.message)
      } else {
        console.log('✅ match_speech_chunks RPC: 正常動作 (結果数:', rpcResult?.length || 0, ')')
      }
    } catch (err) {
      console.log('❌ RPC関数テストエラー:', err)
    }

    console.log('\n🎉 テスト完了!')
    
  } catch (error) {
    console.error('❌ 全体的なエラー:', error)
  }
}

testDatabaseDirectly().catch(console.error)