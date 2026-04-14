import type Database from 'better-sqlite3'
import type {
  Session,
  CapturedRequest,
  JsHookRecord,
  StorageSnapshot,
  AnalysisReport
} from '@shared/types'

// ============================================================
// Sessions Repository
// ============================================================

export class SessionsRepo {
  private stmts: {
    insert: Database.Statement
    findById: Database.Statement
    findAll: Database.Statement
    updateStatus: Database.Statement
    delete: Database.Statement
  }

  constructor(private db: Database.Database) {
    this.stmts = {
      insert: db.prepare(
        `INSERT INTO sessions (id, name, target_url, status, created_at, stopped_at)
         VALUES (@id, @name, @target_url, @status, @created_at, @stopped_at)`
      ),
      findById: db.prepare('SELECT * FROM sessions WHERE id = ?'),
      findAll: db.prepare('SELECT * FROM sessions ORDER BY created_at DESC'),
      updateStatus: db.prepare(
        'UPDATE sessions SET status = @status, stopped_at = @stopped_at WHERE id = @id'
      ),
      delete: db.prepare('DELETE FROM sessions WHERE id = ?')
    }
  }

  insert(session: Session): void {
    this.stmts.insert.run(session)
  }

  findById(id: string): Session | undefined {
    return this.stmts.findById.get(id) as Session | undefined
  }

  findAll(): Session[] {
    return this.stmts.findAll.all() as Session[]
  }

  updateStatus(id: string, status: string, stoppedAt: number | null = null): void {
    this.stmts.updateStatus.run({ id, status, stopped_at: stoppedAt })
  }

  delete(id: string): void {
    this.stmts.delete.run(id)
  }
}

// ============================================================
// Requests Repository
// ============================================================

export class RequestsRepo {
  private stmts: {
    insert: Database.Statement
    updateResponse: Database.Statement
    findBySession: Database.Statement
    findById: Database.Statement
    getNextSequence: Database.Statement
  }

  constructor(private db: Database.Database) {
    this.stmts = {
      insert: db.prepare(
        `INSERT INTO requests (id, session_id, sequence, timestamp, method, url, request_headers, request_body, content_type, initiator)
         VALUES (@id, @session_id, @sequence, @timestamp, @method, @url, @request_headers, @request_body, @content_type, @initiator)`
      ),
      updateResponse: db.prepare(
        `UPDATE requests SET status_code = @status_code, response_headers = @response_headers,
         response_body = @response_body, content_type = @content_type, duration_ms = @duration_ms,
         is_streaming = @is_streaming, is_websocket = @is_websocket
         WHERE id = @id`
      ),
      findBySession: db.prepare(
        'SELECT * FROM requests WHERE session_id = ? ORDER BY sequence ASC'
      ),
      findById: db.prepare('SELECT * FROM requests WHERE id = ?'),
      getNextSequence: db.prepare(
        'SELECT COALESCE(MAX(sequence), 0) + 1 AS next_seq FROM requests WHERE session_id = ?'
      )
    }
  }

  insert(request: Partial<CapturedRequest>): void {
    this.stmts.insert.run(request)
  }

  updateResponse(data: {
    id: string
    status_code: number
    response_headers: string
    response_body: string | null
    content_type: string | null
    duration_ms: number
    is_streaming: number  // 0 or 1
    is_websocket: number  // 0 or 1
  }): void {
    this.stmts.updateResponse.run(data)
  }

  findBySession(sessionId: string): CapturedRequest[] {
    return this.stmts.findBySession.all(sessionId) as CapturedRequest[]
  }

  findById(id: string): CapturedRequest | undefined {
    return this.stmts.findById.get(id) as CapturedRequest | undefined
  }

  getNextSequence(sessionId: string): number {
    const row = this.stmts.getNextSequence.get(sessionId) as { next_seq: number }
    return row.next_seq
  }
}

// ============================================================
// JS Hooks Repository
// ============================================================

export class JsHooksRepo {
  private stmts: {
    insert: Database.Statement
    findBySession: Database.Statement
  }

  constructor(private db: Database.Database) {
    this.stmts = {
      insert: db.prepare(
        `INSERT INTO js_hooks (session_id, timestamp, hook_type, function_name, arguments, result, call_stack, related_request_id)
         VALUES (@session_id, @timestamp, @hook_type, @function_name, @arguments, @result, @call_stack, @related_request_id)`
      ),
      findBySession: db.prepare(
        'SELECT * FROM js_hooks WHERE session_id = ? ORDER BY timestamp ASC'
      )
    }
  }

  insert(record: Omit<JsHookRecord, 'id'>): void {
    this.stmts.insert.run(record)
  }

  findBySession(sessionId: string): JsHookRecord[] {
    return this.stmts.findBySession.all(sessionId) as JsHookRecord[]
  }
}

// ============================================================
// Storage Snapshots Repository
// ============================================================

export class StorageSnapshotsRepo {
  private stmts: {
    insert: Database.Statement
    findBySession: Database.Statement
    findLatest: Database.Statement
  }

  constructor(private db: Database.Database) {
    this.stmts = {
      insert: db.prepare(
        `INSERT INTO storage_snapshots (session_id, timestamp, domain, storage_type, data)
         VALUES (@session_id, @timestamp, @domain, @storage_type, @data)`
      ),
      findBySession: db.prepare(
        'SELECT * FROM storage_snapshots WHERE session_id = ? ORDER BY timestamp ASC'
      ),
      findLatest: db.prepare(
        `SELECT * FROM storage_snapshots
         WHERE session_id = ? AND storage_type = ?
         ORDER BY timestamp DESC LIMIT 1`
      )
    }
  }

  insert(snapshot: Omit<StorageSnapshot, 'id'>): void {
    this.stmts.insert.run(snapshot)
  }

  findBySession(sessionId: string): StorageSnapshot[] {
    return this.stmts.findBySession.all(sessionId) as StorageSnapshot[]
  }

  findLatest(sessionId: string, storageType: string): StorageSnapshot | undefined {
    return this.stmts.findLatest.get(sessionId, storageType) as StorageSnapshot | undefined
  }
}

// ============================================================
// Analysis Reports Repository
// ============================================================

export class AnalysisReportsRepo {
  private stmts: {
    insert: Database.Statement
    findBySession: Database.Statement
    findById: Database.Statement
  }

  constructor(private db: Database.Database) {
    this.stmts = {
      insert: db.prepare(
        `INSERT INTO analysis_reports (id, session_id, created_at, llm_provider, llm_model, prompt_tokens, completion_tokens, report_content, filter_prompt_tokens, filter_completion_tokens)
         VALUES (@id, @session_id, @created_at, @llm_provider, @llm_model, @prompt_tokens, @completion_tokens, @report_content, @filter_prompt_tokens, @filter_completion_tokens)`
      ),
      findBySession: db.prepare(
        'SELECT * FROM analysis_reports WHERE session_id = ? ORDER BY created_at DESC'
      ),
      findById: db.prepare('SELECT * FROM analysis_reports WHERE id = ?')
    }
  }

  insert(report: AnalysisReport): void {
    this.stmts.insert.run(report)
  }

  findBySession(sessionId: string): AnalysisReport[] {
    return this.stmts.findBySession.all(sessionId) as AnalysisReport[]
  }

  findById(id: string): AnalysisReport | undefined {
    return this.stmts.findById.get(id) as AnalysisReport | undefined
  }
}
