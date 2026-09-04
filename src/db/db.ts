import { Pool, PoolConfig } from 'pg';

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
  };
  message: string;
  error?: string;
}

let pool: Pool | null = null;
let isSchemaInitialized = false;

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

    // Indexes for fast querying
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_evaluations_created_at ON voice_evaluations (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_voice_evaluations_tenant ON voice_evaluations (tenant_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_events_created_at ON audit_trail_events (created_at DESC);
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
