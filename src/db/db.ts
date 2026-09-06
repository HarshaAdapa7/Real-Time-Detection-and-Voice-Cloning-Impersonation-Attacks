import { Pool, PoolConfig } from 'pg';
import {
  LiveSessionRecord,
  AudioRecord,
  LiveCaptionRecord,
  AnalysisResultRecord,
  EvaluationAudioRecord,
  LabelStatus,
} from '../types';

export interface DbStatus {
  configured: boolean;
  connected: boolean;
  host: string;
  database: string;
  tables: {
    voice_evaluations: number;
    tenant_policies: number;
    enrolled_identities: number;
    audit_trail_events: number;
    live_sessions: number;
    evaluation_audio_library: number;
  };
  message: string;
  error?: string;
}

let pool: Pool | null = null;
let isSchemaInitialized = false;

// In-memory stores for live sessions, captions, analysis, audio chunks, and evaluation audio library
export const inMemoryLiveSessions: LiveSessionRecord[] = [];
export const inMemoryAudioRecords: AudioRecord[] = [];
export const inMemoryLiveCaptions: LiveCaptionRecord[] = [];
export const inMemoryAnalysisResults: AnalysisResultRecord[] = [];
export const inMemoryEvaluationAudio: EvaluationAudioRecord[] = [
  {
    evaluation_audio_id: 'EVAL-LIVE-001',
    source: 'LIVE_MICROPHONE',
    session_id: 'CALL-LIVE-001',
    language: 'Telugu',
    duration: '00:24',
    detected_contexts: ['normal', 'account_discussion', 'urgency', 'credential_request'],
    deepfake_prediction: 'Human Voice',
    prediction_confidence: 0.92,
    label_status: 'UNVERIFIED',
    verified_label: false,
    expected_decision: 'BLOCK',
    expected_risk_level: 'CRITICAL',
    expected_context_flow: ['normal', 'account_discussion', 'urgency', 'credential_request'],
    added_to_evaluation_list: true,
    added_to_test_cases: false,
    transcript: 'నమస్కారం సార్, నేను మీ బ్యాంక్ మేనేజర్ మాట్లాడేది. మీ అకౌంట్ లో అనుమానాస్పద లావాదేవీ జరిగింది. వెంటనే మీ మొబైల్ కు వచ్చిన ఓటీపీ చెప్పండి.',
    turns: [
      { turn_number: 1, text: 'నమస్కారం సార్, నేను మీ బ్యాంక్ మేనేజర్ మాట్లాడేది.', language: 'te', context: 'normal', risk: 14, decision: 'ALLOW' },
      { turn_number: 2, text: 'మీ అకౌంట్ లో అనుమానాస్పద లావాదేవీ జరిగింది.', language: 'te', context: 'account_discussion', risk: 26, decision: 'ALLOW' },
      { turn_number: 3, text: 'వెంటనే ఖాతా లాక్ కాకుండా ఉండాలంటే వెరిఫై చేయాలి.', language: 'te', context: 'urgency', risk: 58, decision: 'PAUSE_ESCALATE' },
      { turn_number: 4, text: 'వెంటనే మీ మొబైల్ కు వచ్చిన ఓటీపీ చెప్పండి.', language: 'te', context: 'credential_request', risk: 89, decision: 'BLOCK' },
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    evaluation_audio_id: 'EVAL-SYNTH-002',
    source: 'SYNTHETIC TEST AUDIO',
    session_id: 'CALL-SYNTH-002',
    language: 'English',
    duration: '00:15',
    detected_contexts: ['financial_transfer_demand', 'urgency'],
    deepfake_prediction: 'Deepfake Clone',
    prediction_confidence: 0.94,
    label_status: 'VERIFIED',
    verified_label: true,
    expected_decision: 'BLOCK',
    expected_risk_level: 'CRITICAL',
    expected_context_flow: ['financial_transfer_demand'],
    added_to_evaluation_list: true,
    added_to_test_cases: true,
    test_case_id: 'LIVE-CS-002',
    transcript: 'This is Rajesh Kumar, CFO. Authorizing urgent wire transfer of 25 lakhs to Zurich account immediately. Bypass standard Slack dual signoff.',
    turns: [
      { turn_number: 1, text: 'This is Rajesh Kumar, CFO. Authorizing urgent wire transfer of 25 lakhs.', language: 'en', context: 'financial_transfer_demand', risk: 92, decision: 'BLOCK' }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    evaluation_audio_id: 'EVAL-LIVE-003',
    source: 'LIVE_MICROPHONE',
    session_id: 'CALL-LIVE-003',
    language: 'Hindi',
    duration: '00:19',
    detected_contexts: ['normal', 'account_discussion'],
    deepfake_prediction: 'Human Voice',
    prediction_confidence: 0.96,
    label_status: 'VERIFIED',
    verified_label: true,
    expected_decision: 'ALLOW',
    expected_risk_level: 'LOW',
    expected_context_flow: ['normal', 'account_discussion'],
    added_to_evaluation_list: true,
    added_to_test_cases: false,
    transcript: 'नमस्ते, मुझे अपने बचत खाते की शेष राशि जाननी है। कृपया मासिक विवरण मेरे ईमेल पर भेज दीजिए।',
    turns: [
      { turn_number: 1, text: 'नमस्ते, मुझे अपने बचत खाते की शेष राशि जाननी है।', language: 'hi', context: 'normal', risk: 10, decision: 'ALLOW' },
      { turn_number: 2, text: 'कृपया मासिक विवरण मेरे ईमेल पर भेज दीजिए।', language: 'hi', context: 'account_discussion', risk: 12, decision: 'ALLOW' }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  }
];

// In-memory fallback store when DATABASE_URL is not provided or offline
const inMemoryEvaluations: any[] = [
  {
    id: 'eval-seed-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString(),
    durationSeconds: 14.5,
    caller: '+91-98765-43210',
    claimedTarget: 'Rajesh Kumar (CFO)',
    requestedAction: 'Immediate NEFT ₹15,00,000 Wire Transfer to unknown vendor account',
    transcript: 'Listen, this is Rajesh Kumar, CFO. I am in an emergency board meeting. Transfer fifteen lakhs immediately to this account, do not verify on Slack.',
    finalRiskScore: 92,
    decision: 'BLOCK',
    dominantRiskFactor: 'Deepfake & Urgent Coercion NLP',
    stepUpAction: 'Simulated Core Banking Hold: Immediate transaction hold created; SOC alert ticket logged.',
    tenantName: 'Apex Trust Bank',
    tenantId: 'tenant-bank',
    breakdown: {
      deepfake: 94,
      speakerMismatch: 88,
      replay: 65,
      nlp: 95,
      context: 85,
    },
    wasRealGemini: true,
  },
  {
    id: 'eval-seed-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toLocaleTimeString(),
    durationSeconds: 9.8,
    caller: '+91-94450-11223',
    claimedTarget: 'Aravind Swamy (Retail)',
    requestedAction: 'Account balance inquiry & statement dispatch',
    transcript: 'Hello, I would like to check my savings balance and have the monthly PDF statement sent to my registered email address.',
    finalRiskScore: 12,
    decision: 'ALLOW',
    dominantRiskFactor: 'None (Nominal Acoustic & Context Signals)',
    stepUpAction: 'None required. Voice trust verified.',
    tenantName: 'Apex Trust Bank',
    tenantId: 'tenant-bank',
    breakdown: {
      deepfake: 8,
      speakerMismatch: 12,
      replay: 10,
      nlp: 15,
      context: 10,
    },
    wasRealGemini: false,
  },
  {
    id: 'eval-seed-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toLocaleTimeString(),
    durationSeconds: 11.2,
    caller: '+91-88990-33445',
    claimedTarget: 'Amit Deshmukh (CTO)',
    requestedAction: 'Production PBX Trunk Routing Reconfiguration',
    transcript: 'This is Amit from engineering. We need the corporate PBX outbound trunk forwarded to external line +91-77889-90011 for maintenance.',
    finalRiskScore: 68,
    decision: 'PAUSE_ESCALATE',
    dominantRiskFactor: 'High Value Configuration & Speaker Distance',
    stepUpAction: 'Simulated Manager Approval Hold: Required secondary authorization from department director.',
    tenantName: 'TechNova Global',
    tenantId: 'tenant-enterprise',
    breakdown: {
      deepfake: 62,
      speakerMismatch: 58,
      replay: 50,
      nlp: 74,
      context: 80,
    },
    wasRealGemini: true,
  },
];

export function normalizePostgresUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Remove quotes
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.substring(1, url.length - 1).trim();
  }

  // Handle bracketed password e.g. postgres:[Harsha@9515445632]@db.xyz...
  const bracketMatch = url.match(/^(postgres(?:ql)?:\/\/[^:]+:)?\[(.*?)\](@.+)$/);
  if (bracketMatch) {
    const prefix = bracketMatch[1] || 'postgresql://postgres:';
    const rawPw = bracketMatch[2];
    const rest = bracketMatch[3];
    url = `${prefix}${encodeURIComponent(rawPw)}${rest}`;
  }

  // If host is direct Supabase db.<project>.supabase.co:5432, convert to Supabase pooler to avoid IPv6 ECONNREFUSED
  const directMatch = url.match(/^postgres(?:ql)?:\/\/([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co:5432\/([a-zA-Z0-9_\-]+)$/);
  if (directMatch) {
    const user = directMatch[1];
    const pw = directMatch[2];
    const projectRef = directMatch[3];
    const dbName = directMatch[4];
    // Pooler user format: postgres.<projectRef>
    const poolerUser = user.includes('.') ? user : `${user}.${projectRef}`;
    url = `postgresql://${poolerUser}:${pw}@aws-0-ap-southeast-2.pooler.supabase.com:6543/${dbName}`;
  }

  return url;
}

export function getDbPool(): Pool | null {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl || rawUrl.trim() === '') {
    return null;
  }

  const connectionString = normalizePostgresUrl(rawUrl);

  if (!pool) {
    try {
      const config: PoolConfig = {
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: {
          rejectUnauthorized: false, // Required for Supabase cloud PostgreSQL
        },
      };

      pool = new Pool(config);

      pool.on('error', (err) => {
        console.error('PostgreSQL unexpected client error on idle connection:', err.message);
      });
    } catch (err) {
      console.error('Failed to initialize PostgreSQL pool:', err);
      return null;
    }
  }

  return pool;
}

/**
 * Initializes tables, schemas, and default tenant seeds in PostgreSQL / Supabase
 */
export async function initDb(): Promise<{ success: boolean; message: string; details?: any }> {
  const p = getDbPool();
  if (!p) {
    return {
      success: false,
      message: 'DATABASE_URL environment variable is not configured. Using in-memory store.',
    };
  }

  const client = await p.connect();
  try {
    // 1. Voice Evaluations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS voice_evaluations (
        id VARCHAR(64) PRIMARY KEY,
        call_id VARCHAR(64) NOT NULL,
        caller VARCHAR(64),
        claimed_target VARCHAR(128),
        tenant_id VARCHAR(64) DEFAULT 'tenant-bank',
        tenant_name VARCHAR(128),
        requested_action TEXT,
        transcript TEXT,
        final_risk_score INTEGER NOT NULL,
        risk_level VARCHAR(32) NOT NULL,
        decision VARCHAR(32) NOT NULL,
        dominant_risk_factor VARCHAR(128),
        step_up_action TEXT,
        breakdown JSONB,
        deepfake_details JSONB,
        speaker_details JSONB,
        replay_details JSONB,
        nlp_details JSONB,
        context_details JSONB,
        was_real_gemini BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tenant Policies Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_policies (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        industry VARCHAR(64),
        description TEXT,
        thresholds JSONB NOT NULL,
        weights JSONB NOT NULL,
        simulated_step_ups JSONB,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Enrolled Speaker Identity Profiles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrolled_identities (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        role VARCHAR(64),
        department VARCHAR(64),
        phone VARCHAR(64),
        typical_transfer_limit NUMERIC,
        business_hours_start INTEGER,
        business_hours_end INTEGER,
        recent_call_frequency VARCHAR(64),
        voiceprint_vector_id VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Audit Trail & Security Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_trail_events (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        evaluation_id VARCHAR(64),
        caller VARCHAR(64),
        tenant_id VARCHAR(64),
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Live Microphone Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        source VARCHAR(32) DEFAULT 'LIVE_MICROPHONE',
        start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMPTZ,
        status VARCHAR(32) DEFAULT 'active',
        total_duration NUMERIC DEFAULT 0,
        detected_languages JSONB DEFAULT '[]'::jsonb,
        final_risk_score INTEGER DEFAULT 0,
        final_decision VARCHAR(32) DEFAULT 'ALLOW',
        turns_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Audio Records Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audio_records (
        audio_id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        audio_file_path TEXT,
        chunk_number INTEGER NOT NULL,
        start_timestamp TIMESTAMPTZ,
        end_timestamp TIMESTAMPTZ,
        duration NUMERIC DEFAULT 0,
        sample_rate INTEGER DEFAULT 16000,
        format VARCHAR(32) DEFAULT 'audio/webm',
        source VARCHAR(32) DEFAULT 'LIVE_MICROPHONE',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Live Captions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_captions (
        caption_id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        turn_number INTEGER NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        transcript TEXT NOT NULL,
        detected_language VARCHAR(32) DEFAULT 'en',
        caption_status VARCHAR(32) DEFAULT 'final',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Analysis Results Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        turn_number INTEGER NOT NULL,
        deepfake_score INTEGER DEFAULT 0,
        speaker_similarity INTEGER DEFAULT 0,
        replay_score INTEGER DEFAULT 0,
        nlp_score INTEGER DEFAULT 0,
        context VARCHAR(128) DEFAULT 'normal',
        previous_context VARCHAR(128),
        context_switch BOOLEAN DEFAULT FALSE,
        language_switch BOOLEAN DEFAULT FALSE,
        risk_score INTEGER DEFAULT 0,
        decision VARCHAR(32) DEFAULT 'ALLOW',
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Evaluation Audio Library Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluation_audio_library (
        evaluation_audio_id VARCHAR(64) PRIMARY KEY,
        source VARCHAR(64) DEFAULT 'LIVE_MICROPHONE',
        session_id VARCHAR(64),
        audio_reference TEXT,
        language VARCHAR(64) DEFAULT 'en',
        duration VARCHAR(32) DEFAULT '00:00',
        detected_contexts JSONB DEFAULT '[]'::jsonb,
        deepfake_prediction VARCHAR(64) DEFAULT 'Human Voice',
        prediction_confidence NUMERIC DEFAULT 0.9,
        label_status VARCHAR(32) DEFAULT 'UNVERIFIED',
        verified_label BOOLEAN DEFAULT FALSE,
        expected_decision VARCHAR(32),
        expected_risk_level VARCHAR(32),
        expected_context_flow JSONB DEFAULT '[]'::jsonb,
        added_to_evaluation_list BOOLEAN DEFAULT TRUE,
        added_to_test_cases BOOLEAN DEFAULT FALSE,
        test_case_id VARCHAR(64),
        transcript TEXT DEFAULT '',
        turns JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for fast querying
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_evaluations_created_at ON voice_evaluations (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_voice_evaluations_tenant ON voice_evaluations (tenant_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_events_created_at ON audit_trail_events (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_live_sessions_created_at ON live_sessions (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_live_captions_session ON live_captions (session_id, turn_number);
      CREATE INDEX IF NOT EXISTS idx_analysis_results_session ON analysis_results (session_id, turn_number);
      CREATE INDEX IF NOT EXISTS idx_evaluation_audio_created_at ON evaluation_audio_library (created_at DESC);
    `);

    // Seed default tenant policies if empty
    const tenantCheck = await client.query('SELECT COUNT(*) as count FROM tenant_policies');
    if (parseInt(tenantCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO tenant_policies (id, name, industry, description, thresholds, weights, simulated_step_ups)
        VALUES 
        (
          'tenant-bank',
          'Apex Trust Bank',
          'Banking & Financial',
          'High-Security Banking & Capital Transfer Policy with aggressive step-up friction on high-value transfers.',
          '{"allowMax": 25, "verifyMax": 55, "escalateMax": 75}',
          '{"deepfake": 0.35, "speaker": 0.20, "replay": 0.15, "nlp": 0.20, "context": 0.10}',
          '{"ALLOW": "None required. Voice trust verified.", "VERIFY": "Simulated Push OTP: Out-of-band mobile verification prompt sent to registered phone.", "PAUSE_ESCALATE": "Simulated Out-of-Band Callback: Automated callback dispatched to corporate desk phone.", "BLOCK": "Simulated Core Banking Hold: Immediate transaction hold created; SOC alert ticket logged."}'
        ),
        (
          'tenant-enterprise',
          'TechNova Global',
          'Enterprise Operations',
          'Enterprise PBX & Identity Management Policy tailored for internal voice routing and executive communications.',
          '{"allowMax": 35, "verifyMax": 65, "escalateMax": 85}',
          '{"deepfake": 0.25, "speaker": 0.20, "replay": 0.15, "nlp": 0.25, "context": 0.15}',
          '{"ALLOW": "None required. Standard clearance.", "VERIFY": "Simulated Slack/SSO 2FA step-up prompt triggered for verification.", "PAUSE_ESCALATE": "Simulated Manager Approval Hold: Required secondary authorization from department director.", "BLOCK": "Simulated Account Lock: PBX route severed; Enterprise IT Security Incident raised."}'
        );
      `);
    }

    // Seed enrolled identities if empty
    const identitiesCheck = await client.query('SELECT COUNT(*) as count FROM enrolled_identities');
    if (parseInt(identitiesCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO enrolled_identities (id, name, role, department, phone, typical_transfer_limit, business_hours_start, business_hours_end, recent_call_frequency, voiceprint_vector_id)
        VALUES
        ('prof-ceo-rajesh', 'Rajesh Kumar', 'Chief Financial Officer', 'Finance & Treasury', '+91-98765-43210', 500000, 9, 18, 'Low (2-3 calls/week)', 'vec-cfo-ecapa-tdnn-09a'),
        ('prof-cfo-priya', 'Priya Sharma', 'Executive VP of Capital', 'Capital Markets', '+91-98123-45678', 1000000, 9, 19, 'Moderate (Daily)', 'vec-evp-ecapa-tdnn-12b'),
        ('prof-cto-amit', 'Amit Deshmukh', 'Chief Technology Officer', 'Infrastructure & Security', '+91-88990-33445', 200000, 8, 20, 'Moderate', 'vec-cto-ecapa-tdnn-04c'),
        ('prof-cust-aravind', 'Aravind Swamy', 'Retail Banking Customer', 'Retail Accounts', '+91-94450-11223', 50000, 9, 21, 'Occasional', 'vec-ret-ecapa-tdnn-88f');
      `);
    }

    // Check if voice_evaluations has initial records; seed in-memory seeds if table is empty
    const evalCheck = await client.query('SELECT COUNT(*) as count FROM voice_evaluations');
    if (parseInt(evalCheck.rows[0].count, 10) === 0) {
      for (const rec of inMemoryEvaluations) {
        await client.query(`
          INSERT INTO voice_evaluations 
          (id, call_id, caller, claimed_target, tenant_id, tenant_name, requested_action, transcript, final_risk_score, risk_level, decision, dominant_risk_factor, step_up_action, breakdown, was_real_gemini)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          rec.id,
          `call-${rec.id}`,
          rec.caller,
          rec.claimedTarget,
          rec.tenantId || 'tenant-bank',
          rec.tenantName,
          rec.requestedAction,
          rec.transcript,
          rec.finalRiskScore,
          rec.finalRiskScore > 75 ? 'CRITICAL' : rec.finalRiskScore > 55 ? 'HIGH' : rec.finalRiskScore > 25 ? 'MEDIUM' : 'LOW',
          rec.decision,
          rec.dominantRiskFactor,
          rec.stepUpAction,
          JSON.stringify(rec.breakdown),
          rec.wasRealGemini,
        ]);
      }
    }

    isSchemaInitialized = true;
    return {
      success: true,
      message: 'PostgreSQL database schemas created and verified successfully.',
    };
  } catch (error: any) {
    console.error('Error during PostgreSQL schema initialization:', error);
    return {
      success: false,
      message: error.message || 'Database schema initialization failed',
      details: error,
    };
  } finally {
    client.release();
  }
}

/**
 * Checks connection and returns current status and table row counts
 */
export async function getDatabaseStatus(): Promise<DbStatus> {
  const p = getDbPool();
  if (!p) {
    return {
      configured: false,
      connected: false,
      host: 'Not configured',
      database: 'In-Memory Fallback Store',
      tables: {
        voice_evaluations: inMemoryEvaluations.length,
        tenant_policies: 2,
        enrolled_identities: 4,
        audit_trail_events: 3,
        live_sessions: inMemoryLiveSessions.length,
        evaluation_audio_library: inMemoryEvaluationAudio.length,
      },
      message: 'DATABASE_URL is not set. Operating seamlessly with in-memory persistence.',
    };
  }

  try {
    const client = await p.connect();
    try {
      // Ensure schemas are initialized if not yet done
      if (!isSchemaInitialized) {
        await initDb();
      }

      const evalCountRes = await client.query('SELECT COUNT(*) as count FROM voice_evaluations').catch(() => ({ rows: [{ count: 0 }] }));
      const policyCountRes = await client.query('SELECT COUNT(*) as count FROM tenant_policies').catch(() => ({ rows: [{ count: 0 }] }));
      const idCountRes = await client.query('SELECT COUNT(*) as count FROM enrolled_identities').catch(() => ({ rows: [{ count: 0 }] }));
      const auditCountRes = await client.query('SELECT COUNT(*) as count FROM audit_trail_events').catch(() => ({ rows: [{ count: 0 }] }));
      const liveSessionsCountRes = await client.query('SELECT COUNT(*) as count FROM live_sessions').catch(() => ({ rows: [{ count: 0 }] }));
      const evalAudioCountRes = await client.query('SELECT COUNT(*) as count FROM evaluation_audio_library').catch(() => ({ rows: [{ count: 0 }] }));

      const parsedUrl = new URL(process.env.DATABASE_URL || '');

      return {
        configured: true,
        connected: true,
        host: parsedUrl.hostname,
        database: parsedUrl.pathname.replace('/', '') || 'postgres',
        tables: {
          voice_evaluations: parseInt(evalCountRes.rows[0]?.count || '0', 10),
          tenant_policies: parseInt(policyCountRes.rows[0]?.count || '0', 10),
          enrolled_identities: parseInt(idCountRes.rows[0]?.count || '0', 10),
          audit_trail_events: parseInt(auditCountRes.rows[0]?.count || '0', 10),
          live_sessions: parseInt(liveSessionsCountRes.rows[0]?.count || '0', 10) + inMemoryLiveSessions.length,
          evaluation_audio_library: parseInt(evalAudioCountRes.rows[0]?.count || '0', 10) + inMemoryEvaluationAudio.length,
        },
        message: 'Connected to Supabase PostgreSQL with active schemas and persistent storage.',
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('PostgreSQL status check failed:', err.message);
    return {
      configured: true,
      connected: false,
      host: 'Database unreachable',
      database: 'Postgres',
      tables: {
        voice_evaluations: inMemoryEvaluations.length,
        tenant_policies: 2,
        enrolled_identities: 4,
        audit_trail_events: 0,
        live_sessions: inMemoryLiveSessions.length,
        evaluation_audio_library: inMemoryEvaluationAudio.length,
      },
      message: 'Connection attempt failed. Using in-memory fallback.',
      error: err.message,
    };
  }
}

/**
 * Persists an evaluation record to PostgreSQL or in-memory fallback
 */
export async function saveEvaluationRecord(record: any): Promise<{ success: boolean; id: string; persistedInDb: boolean }> {
  const p = getDbPool();
  const recId = record.id || `eval-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  if (!p) {
    inMemoryEvaluations.unshift({ ...record, id: recId });
    return { success: true, id: recId, persistedInDb: false };
  }

  try {
    const client = await p.connect();
    try {
      if (!isSchemaInitialized) {
        await initDb();
      }

      await client.query(`
        INSERT INTO voice_evaluations (
          id,
          call_id,
          caller,
          claimed_target,
          tenant_id,
          tenant_name,
          requested_action,
          transcript,
          final_risk_score,
          risk_level,
          decision,
          dominant_risk_factor,
          step_up_action,
          breakdown,
          deepfake_details,
          speaker_details,
          replay_details,
          nlp_details,
          context_details,
          was_real_gemini
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO UPDATE SET
          final_risk_score = EXCLUDED.final_risk_score,
          decision = EXCLUDED.decision,
          step_up_action = EXCLUDED.step_up_action;
      `, [
        recId,
        record.callId || `call-${recId}`,
        record.caller || '+91-98765-43210',
        record.claimedTarget || 'Unspecified Identity',
        record.tenantId || 'tenant-bank',
        record.tenantName || 'Apex Trust Bank',
        record.requestedAction || 'General Inquiry',
        record.transcript || '',
        record.finalRiskScore || 0,
        record.riskLevel || (record.finalRiskScore > 75 ? 'CRITICAL' : record.finalRiskScore > 55 ? 'HIGH' : record.finalRiskScore > 25 ? 'MEDIUM' : 'LOW'),
        record.decision || 'ALLOW',
        record.dominantRiskFactor || 'None',
        record.stepUpAction || 'None required.',
        JSON.stringify(record.breakdown || {}),
        JSON.stringify(record.deepfakeDetails || {}),
        JSON.stringify(record.speakerDetails || {}),
        JSON.stringify(record.replayDetails || {}),
        JSON.stringify(record.nlpDetails || {}),
        JSON.stringify(record.contextDetails || {}),
        record.wasRealGemini ?? true,
      ]);

      // Also log to audit trail
      await client.query(`
        INSERT INTO audit_trail_events (id, event_type, evaluation_id, caller, tenant_id, details)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        `audit-${Date.now().toString(36)}`,
        'EVALUATION_COMPLETED',
        recId,
        record.caller,
        record.tenantId || 'tenant-bank',
        JSON.stringify({ decision: record.decision, riskScore: record.finalRiskScore }),
      ]);

      return { success: true, id: recId, persistedInDb: true };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to save evaluation to PostgreSQL, writing to fallback memory:', err);
    inMemoryEvaluations.unshift({ ...record, id: recId });
    return { success: true, id: recId, persistedInDb: false };
  }
}

/**
 * Fetches evaluations from PostgreSQL or in-memory fallback
 */
export async function getEvaluationRecords(limit = 50, tenantId?: string): Promise<{ records: any[]; fromDb: boolean }> {
  const p = getDbPool();
  if (!p) {
    const filtered = tenantId ? inMemoryEvaluations.filter((r) => r.tenantId === tenantId) : inMemoryEvaluations;
    return { records: filtered.slice(0, limit), fromDb: false };
  }

  try {
    const client = await p.connect();
    try {
      if (!isSchemaInitialized) {
        await initDb();
      }

      let query = `
        SELECT 
          id,
          call_id as "callId",
          caller,
          claimed_target as "claimedTarget",
          tenant_id as "tenantId",
          tenant_name as "tenantName",
          requested_action as "requestedAction",
          transcript,
          final_risk_score as "finalRiskScore",
          risk_level as "riskLevel",
          decision,
          dominant_risk_factor as "dominantRiskFactor",
          step_up_action as "stepUpAction",
          breakdown,
          was_real_gemini as "wasRealGemini",
          to_char(created_at, 'HH12:MI:SS AM') as timestamp
        FROM voice_evaluations
      `;
      const params: any[] = [];

      if (tenantId) {
        query += ` WHERE tenant_id = $1`;
        params.push(tenantId);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const res = await client.query(query, params);
      return { records: res.rows, fromDb: true };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to fetch from PostgreSQL, using fallback memory:', err);
    const filtered = tenantId ? inMemoryEvaluations.filter((r) => r.tenantId === tenantId) : inMemoryEvaluations;
    return { records: filtered.slice(0, limit), fromDb: false };
  }
}

/**
 * Clears evaluation records
 */
export async function clearEvaluationRecords(): Promise<{ success: boolean; clearedFromDb: boolean }> {
  inMemoryEvaluations.length = 0;
  const p = getDbPool();
  if (!p) {
    return { success: true, clearedFromDb: false };
  }

  try {
    const client = await p.connect();
    try {
      await client.query('DELETE FROM voice_evaluations');
      await client.query(`
        INSERT INTO audit_trail_events (id, event_type, details)
        VALUES ($1, $2, $3)
      `, [`audit-${Date.now().toString(36)}`, 'AUDIT_LOG_CLEARED', JSON.stringify({ timestamp: new Date().toISOString() })]);
      return { success: true, clearedFromDb: true };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to clear PostgreSQL table:', err);
    return { success: true, clearedFromDb: false };
  }
}

// ============================================================
// LIVE SESSIONS DATABASE METHODS
// ============================================================

export async function createOrUpdateLiveSession(session: LiveSessionRecord): Promise<{ success: boolean; session: LiveSessionRecord }> {
  // Update in-memory
  const idx = inMemoryLiveSessions.findIndex((s) => s.session_id === session.session_id);
  if (idx >= 0) {
    inMemoryLiveSessions[idx] = { ...inMemoryLiveSessions[idx], ...session };
  } else {
    inMemoryLiveSessions.unshift(session);
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          INSERT INTO live_sessions (
            session_id, source, start_time, end_time, status,
            total_duration, detected_languages, final_risk_score, final_decision, turns_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (session_id) DO UPDATE SET
            end_time = EXCLUDED.end_time,
            status = EXCLUDED.status,
            total_duration = EXCLUDED.total_duration,
            detected_languages = EXCLUDED.detected_languages,
            final_risk_score = EXCLUDED.final_risk_score,
            final_decision = EXCLUDED.final_decision,
            turns_count = EXCLUDED.turns_count
        `, [
          session.session_id,
          session.source || 'LIVE_MICROPHONE',
          session.start_time || new Date().toISOString(),
          session.end_time || null,
          session.status || 'active',
          session.total_duration || 0,
          JSON.stringify(session.detected_languages || []),
          session.final_risk_score || 0,
          session.final_decision || 'ALLOW',
          session.turns_count || 0,
        ]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('PostgreSQL live session upsert warning (stored in memory):', err);
    }
  }

  return { success: true, session };
}

export async function getLiveSessions(): Promise<LiveSessionRecord[]> {
  const p = getDbPool();
  if (!p) {
    return [...inMemoryLiveSessions];
  }

  try {
    const client = await p.connect();
    try {
      if (!isSchemaInitialized) await initDb();
      const res = await client.query(`
        SELECT 
          session_id, source, start_time, end_time, status,
          total_duration, detected_languages, final_risk_score, final_decision, turns_count, created_at
        FROM live_sessions
        ORDER BY created_at DESC
      `);
      const dbRows: LiveSessionRecord[] = res.rows.map((r: any) => ({
        ...r,
        detected_languages: Array.isArray(r.detected_languages) ? r.detected_languages : JSON.parse(r.detected_languages || '[]'),
      }));
      // Merge with in-memory if any newly active
      const dbIds = new Set(dbRows.map((r) => r.session_id));
      const memoryOnly = inMemoryLiveSessions.filter((m) => !dbIds.has(m.session_id));
      return [...memoryOnly, ...dbRows];
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Failed to query PostgreSQL live_sessions, returning in-memory:', err);
    return [...inMemoryLiveSessions];
  }
}

export async function getLiveSessionById(sessionId: string): Promise<{
  session: LiveSessionRecord | null;
  captions: LiveCaptionRecord[];
  analysisResults: AnalysisResultRecord[];
  audioRecords: AudioRecord[];
}> {
  // Check memory first
  const memSession = inMemoryLiveSessions.find((s) => s.session_id === sessionId) || null;
  const memCaptions = inMemoryLiveCaptions.filter((c) => c.session_id === sessionId);
  const memAnalysis = inMemoryAnalysisResults.filter((a) => a.session_id === sessionId);
  const memAudio = inMemoryAudioRecords.filter((au) => au.session_id === sessionId);

  const p = getDbPool();
  if (!p) {
    return {
      session: memSession,
      captions: memCaptions,
      analysisResults: memAnalysis,
      audioRecords: memAudio,
    };
  }

  try {
    const client = await p.connect();
    try {
      if (!isSchemaInitialized) await initDb();
      const sRes = await client.query('SELECT * FROM live_sessions WHERE session_id = $1', [sessionId]);
      const session = sRes.rows[0] ? {
        ...sRes.rows[0],
        detected_languages: Array.isArray(sRes.rows[0].detected_languages) ? sRes.rows[0].detected_languages : JSON.parse(sRes.rows[0].detected_languages || '[]'),
      } : memSession;

      const cRes = await client.query('SELECT * FROM live_captions WHERE session_id = $1 ORDER BY turn_number ASC', [sessionId]);
      const aRes = await client.query('SELECT * FROM analysis_results WHERE session_id = $1 ORDER BY turn_number ASC', [sessionId]);
      const auRes = await client.query('SELECT * FROM audio_records WHERE session_id = $1 ORDER BY chunk_number ASC', [sessionId]);

      return {
        session,
        captions: cRes.rows.length > 0 ? cRes.rows : memCaptions,
        analysisResults: aRes.rows.length > 0 ? aRes.rows : memAnalysis,
        audioRecords: auRes.rows.length > 0 ? auRes.rows : memAudio,
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Error fetching live session by ID, using memory:', err);
    return {
      session: memSession,
      captions: memCaptions,
      analysisResults: memAnalysis,
      audioRecords: memAudio,
    };
  }
}

export async function deleteLiveSession(sessionId: string): Promise<{ success: boolean }> {
  // Delete from in-memory
  const sIdx = inMemoryLiveSessions.findIndex((s) => s.session_id === sessionId);
  if (sIdx >= 0) inMemoryLiveSessions.splice(sIdx, 1);

  for (let i = inMemoryLiveCaptions.length - 1; i >= 0; i--) {
    if (inMemoryLiveCaptions[i].session_id === sessionId) inMemoryLiveCaptions.splice(i, 1);
  }
  for (let i = inMemoryAnalysisResults.length - 1; i >= 0; i--) {
    if (inMemoryAnalysisResults[i].session_id === sessionId) inMemoryAnalysisResults.splice(i, 1);
  }
  for (let i = inMemoryAudioRecords.length - 1; i >= 0; i--) {
    if (inMemoryAudioRecords[i].session_id === sessionId) inMemoryAudioRecords.splice(i, 1);
  }
  for (let i = inMemoryEvaluationAudio.length - 1; i >= 0; i--) {
    if (inMemoryEvaluationAudio[i].session_id === sessionId) inMemoryEvaluationAudio.splice(i, 1);
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query('DELETE FROM live_sessions WHERE session_id = $1', [sessionId]);
        await client.query('DELETE FROM live_captions WHERE session_id = $1', [sessionId]);
        await client.query('DELETE FROM analysis_results WHERE session_id = $1', [sessionId]);
        await client.query('DELETE FROM audio_records WHERE session_id = $1', [sessionId]);
        await client.query('DELETE FROM evaluation_audio_library WHERE session_id = $1', [sessionId]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Error deleting live session from PostgreSQL:', err);
    }
  }

  return { success: true };
}

// ============================================================
// LIVE CAPTIONS & ANALYSIS METHODS
// ============================================================

export async function saveLiveCaption(caption: LiveCaptionRecord): Promise<{ success: boolean; caption: LiveCaptionRecord }> {
  const existingIdx = inMemoryLiveCaptions.findIndex((c) => c.caption_id === caption.caption_id);
  if (existingIdx >= 0) {
    inMemoryLiveCaptions[existingIdx] = { ...inMemoryLiveCaptions[existingIdx], ...caption };
  } else {
    inMemoryLiveCaptions.push(caption);
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          INSERT INTO live_captions (caption_id, session_id, turn_number, timestamp, transcript, detected_language, caption_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (caption_id) DO UPDATE SET
            transcript = EXCLUDED.transcript,
            detected_language = EXCLUDED.detected_language,
            caption_status = EXCLUDED.caption_status;
        `, [
          caption.caption_id,
          caption.session_id,
          caption.turn_number,
          caption.timestamp || new Date().toISOString(),
          caption.transcript,
          caption.detected_language || 'en',
          caption.caption_status || 'final',
        ]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Warning saving live caption to PostgreSQL (saved in memory):', err);
    }
  }

  return { success: true, caption };
}

export async function saveAnalysisResult(analysis: AnalysisResultRecord): Promise<{ success: boolean; analysis: AnalysisResultRecord }> {
  inMemoryAnalysisResults.push(analysis);

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          INSERT INTO analysis_results (
            id, session_id, turn_number, deepfake_score, speaker_similarity,
            replay_score, nlp_score, context, previous_context, context_switch,
            language_switch, risk_score, decision, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING;
        `, [
          `an-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          analysis.session_id,
          analysis.turn_number,
          analysis.deepfake_score,
          analysis.speaker_similarity,
          analysis.replay_score,
          analysis.nlp_score,
          analysis.context,
          analysis.previous_context,
          analysis.context_switch,
          analysis.language_switch,
          analysis.risk_score,
          analysis.decision,
          analysis.timestamp || new Date().toISOString(),
        ]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Warning saving analysis result to PostgreSQL (saved in memory):', err);
    }
  }

  return { success: true, analysis };
}

export async function saveAudioRecord(record: AudioRecord): Promise<{ success: boolean; record: AudioRecord }> {
  const existingIdx = inMemoryAudioRecords.findIndex((r) => r.audio_id === record.audio_id);
  if (existingIdx >= 0) {
    inMemoryAudioRecords[existingIdx] = { ...inMemoryAudioRecords[existingIdx], ...record };
  } else {
    inMemoryAudioRecords.push(record);
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          INSERT INTO audio_records (
            audio_id, session_id, audio_file_path, chunk_number,
            start_timestamp, end_timestamp, duration, sample_rate, format, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (audio_id) DO UPDATE SET
            audio_file_path = EXCLUDED.audio_file_path,
            chunk_number = EXCLUDED.chunk_number,
            start_timestamp = EXCLUDED.start_timestamp,
            end_timestamp = EXCLUDED.end_timestamp,
            duration = EXCLUDED.duration,
            sample_rate = EXCLUDED.sample_rate,
            format = EXCLUDED.format,
            source = EXCLUDED.source;
        `, [
          record.audio_id,
          record.session_id,
          record.audio_file_path || '',
          record.chunk_number,
          record.start_timestamp || new Date().toISOString(),
          record.end_timestamp || new Date().toISOString(),
          record.duration || 0,
          record.sample_rate || 16000,
          record.format || 'audio/webm',
          record.source || 'LIVE_MICROPHONE',
        ]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Warning saving audio record to PostgreSQL (saved in memory):', err);
    }
  }

  return { success: true, record };
}

// ============================================================
// EVALUATION AUDIO LIBRARY METHODS
// ============================================================

export async function saveEvaluationAudioRecord(record: EvaluationAudioRecord): Promise<{ success: boolean; record: EvaluationAudioRecord }> {
  const existingIdx = inMemoryEvaluationAudio.findIndex((r) => r.evaluation_audio_id === record.evaluation_audio_id);
  if (existingIdx >= 0) {
    inMemoryEvaluationAudio[existingIdx] = { ...inMemoryEvaluationAudio[existingIdx], ...record };
  } else {
    inMemoryEvaluationAudio.unshift(record);
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          INSERT INTO evaluation_audio_library (
            evaluation_audio_id, source, session_id, audio_reference, language, duration,
            detected_contexts, deepfake_prediction, prediction_confidence, label_status,
            verified_label, expected_decision, expected_risk_level, expected_context_flow,
            added_to_evaluation_list, added_to_test_cases, test_case_id, transcript, turns, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (evaluation_audio_id) DO UPDATE SET
            label_status = EXCLUDED.label_status,
            verified_label = EXCLUDED.verified_label,
            expected_decision = EXCLUDED.expected_decision,
            expected_risk_level = EXCLUDED.expected_risk_level,
            expected_context_flow = EXCLUDED.expected_context_flow,
            added_to_test_cases = EXCLUDED.added_to_test_cases,
            test_case_id = EXCLUDED.test_case_id,
            transcript = EXCLUDED.transcript,
            turns = EXCLUDED.turns
        `, [
          record.evaluation_audio_id,
          record.source || 'LIVE_MICROPHONE',
          record.session_id,
          record.audio_reference || '',
          record.language || 'en',
          record.duration || '00:00',
          JSON.stringify(record.detected_contexts || []),
          record.deepfake_prediction || 'Human Voice',
          record.prediction_confidence || 0.9,
          record.label_status || 'UNVERIFIED',
          record.verified_label || false,
          record.expected_decision || 'ALLOW',
          record.expected_risk_level || 'LOW',
          JSON.stringify(record.expected_context_flow || []),
          record.added_to_evaluation_list !== false,
          record.added_to_test_cases || false,
          record.test_case_id || null,
          record.transcript || '',
          JSON.stringify(record.turns || []),
          record.created_at || new Date().toISOString(),
        ]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Warning saving evaluation audio to PostgreSQL (saved in memory):', err);
    }
  }

  return { success: true, record };
}

export async function getEvaluationAudioRecords(): Promise<EvaluationAudioRecord[]> {
  const p = getDbPool();
  if (!p) {
    return [...inMemoryEvaluationAudio];
  }

  try {
    const client = await p.connect();
    try {
      if (!isSchemaInitialized) await initDb();
      const res = await client.query('SELECT * FROM evaluation_audio_library ORDER BY created_at DESC');
      const rows: EvaluationAudioRecord[] = res.rows.map((r: any) => ({
        ...r,
        detected_contexts: Array.isArray(r.detected_contexts) ? r.detected_contexts : JSON.parse(r.detected_contexts || '[]'),
        expected_context_flow: Array.isArray(r.expected_context_flow) ? r.expected_context_flow : JSON.parse(r.expected_context_flow || '[]'),
        turns: Array.isArray(r.turns) ? r.turns : JSON.parse(r.turns || '[]'),
      }));
      // Merge with any in-memory only items
      const dbIds = new Set(rows.map((r) => r.evaluation_audio_id));
      const memoryOnly = inMemoryEvaluationAudio.filter((m) => !dbIds.has(m.evaluation_audio_id));
      return [...memoryOnly, ...rows];
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Failed to query evaluation_audio_library from PostgreSQL, using in-memory:', err);
    return [...inMemoryEvaluationAudio];
  }
}

export async function updateEvaluationAudioStatus(
  id: string,
  labelStatus: LabelStatus,
  verifiedLabel: boolean,
  expectedDecision?: string,
  expectedRiskLevel?: string,
  expectedContextFlow?: string[],
  addedToTestCases?: boolean,
  testCaseId?: string
): Promise<{ success: boolean; record: EvaluationAudioRecord | null }> {
  const idx = inMemoryEvaluationAudio.findIndex((r) => r.evaluation_audio_id === id);
  let updatedRecord: EvaluationAudioRecord | null = null;
  if (idx >= 0) {
    inMemoryEvaluationAudio[idx].label_status = labelStatus;
    inMemoryEvaluationAudio[idx].verified_label = verifiedLabel;
    if (expectedDecision) inMemoryEvaluationAudio[idx].expected_decision = expectedDecision as any;
    if (expectedRiskLevel) inMemoryEvaluationAudio[idx].expected_risk_level = expectedRiskLevel as any;
    if (expectedContextFlow) inMemoryEvaluationAudio[idx].expected_context_flow = expectedContextFlow;
    if (addedToTestCases !== undefined) inMemoryEvaluationAudio[idx].added_to_test_cases = addedToTestCases;
    if (testCaseId) inMemoryEvaluationAudio[idx].test_case_id = testCaseId;
    updatedRecord = inMemoryEvaluationAudio[idx];
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          UPDATE evaluation_audio_library
          SET label_status = $1,
              verified_label = $2,
              expected_decision = COALESCE($3, expected_decision),
              expected_risk_level = COALESCE($4, expected_risk_level),
              expected_context_flow = COALESCE($5, expected_context_flow),
              added_to_test_cases = COALESCE($6, added_to_test_cases),
              test_case_id = COALESCE($7, test_case_id)
          WHERE evaluation_audio_id = $8
        `, [
          labelStatus,
          verifiedLabel,
          expectedDecision || null,
          expectedRiskLevel || null,
          expectedContextFlow ? JSON.stringify(expectedContextFlow) : null,
          addedToTestCases ?? null,
          testCaseId || null,
          id,
        ]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Error updating evaluation audio in PostgreSQL:', err);
    }
  }

  return { success: true, record: updatedRecord };
}

export async function deleteEvaluationAudioRecord(id: string): Promise<{ success: boolean }> {
  const idx = inMemoryEvaluationAudio.findIndex((r) => r.evaluation_audio_id === id);
  if (idx >= 0) inMemoryEvaluationAudio.splice(idx, 1);

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query('DELETE FROM evaluation_audio_library WHERE evaluation_audio_id = $1', [id]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Error deleting evaluation audio from PostgreSQL:', err);
    }
  }

  return { success: true };
}

export async function updateLiveSessionAnalysis(
  sessionId: string,
  finalRiskScore: number,
  finalDecision: string,
  detectedLanguages?: string[]
): Promise<{ success: boolean }> {
  const memSession = inMemoryLiveSessions.find((s) => s.session_id === sessionId);
  if (memSession) {
    memSession.final_risk_score = finalRiskScore;
    memSession.final_decision = finalDecision as any;
    if (detectedLanguages && detectedLanguages.length > 0) {
      memSession.detected_languages = detectedLanguages;
    }
  }

  // Also update corresponding evaluation audio item
  const evalItem = inMemoryEvaluationAudio.find((e) => e.session_id === sessionId);
  if (evalItem) {
    evalItem.expected_decision = finalDecision as any;
    evalItem.expected_risk_level = finalRiskScore > 75 ? 'CRITICAL' : finalRiskScore > 55 ? 'HIGH' : finalRiskScore > 35 ? 'MEDIUM' : 'LOW';
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          UPDATE live_sessions
          SET final_risk_score = $1, final_decision = $2
          WHERE session_id = $3
        `, [finalRiskScore, finalDecision, sessionId]);

        await client.query(`
          UPDATE evaluation_audio_library
          SET expected_decision = $1,
              expected_risk_level = $2
          WHERE session_id = $3
        `, [
          finalDecision,
          finalRiskScore > 75 ? 'CRITICAL' : finalRiskScore > 55 ? 'HIGH' : finalRiskScore > 35 ? 'MEDIUM' : 'LOW',
          sessionId,
        ]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Error updating live session analysis in DB:', err);
    }
  }

  return { success: true };
}

export async function updateEvaluationAudioTranscript(
  id: string,
  transcript: string,
  turns?: any[]
): Promise<{ success: boolean }> {
  const item = inMemoryEvaluationAudio.find((e) => e.evaluation_audio_id === id);
  if (item) {
    item.transcript = transcript;
    if (turns) item.turns = turns;
  }

  const p = getDbPool();
  if (p) {
    try {
      const client = await p.connect();
      try {
        if (!isSchemaInitialized) await initDb();
        await client.query(`
          UPDATE evaluation_audio_library
          SET transcript = $1,
              turns = COALESCE($2, turns)
          WHERE evaluation_audio_id = $3
        `, [transcript, turns ? JSON.stringify(turns) : null, id]);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('Error updating evaluation audio transcript in DB:', err);
    }
  }

  return { success: true };
}


