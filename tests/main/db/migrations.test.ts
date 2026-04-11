import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
  runMigrations,
  migrateAddStreamingAndWebSocketFlags,
} from "../../../src/main/db/migrations";
import path from "path";
import fs from "fs";
import os from "os";

describe("Database Migrations", () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(() => {
    // Create a temporary database file for testing
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-db-"));
    dbPath = path.join(tmpDir, "test.db");
    db = new Database(dbPath);

    // Run initial migrations to set up schema
    runMigrations(db);
  });

  afterEach(() => {
    // Clean up
    db.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    const tmpDir = path.dirname(dbPath);
    if (fs.existsSync(tmpDir)) {
      fs.rmdirSync(tmpDir);
    }
  });

  it("应该成功添加 is_streaming 和 is_websocket 列到 requests 表", () => {
    // Check that columns exist after migration
    const tableInfo = db.prepare("PRAGMA table_info(requests)").all() as any[];
    const columnNames = tableInfo.map((col: any) => col.name);

    expect(columnNames).toContain("is_streaming");
    expect(columnNames).toContain("is_websocket");
  });

  it("应该可以重复执行迁移而不抛出错误（幂等性）", () => {
    // First execution (already done in beforeEach via runMigrations)
    // Second execution should not throw
    expect(() => {
      migrateAddStreamingAndWebSocketFlags(db);
    }).not.toThrow();

    // Third execution to ensure idempotency
    expect(() => {
      migrateAddStreamingAndWebSocketFlags(db);
    }).not.toThrow();

    // Verify columns still exist and have correct defaults
    const tableInfo = db.prepare("PRAGMA table_info(requests)").all() as any[];
    const isStreamingCol = tableInfo.find(
      (col: any) => col.name === "is_streaming",
    ) as any;
    const isWebsocketCol = tableInfo.find(
      (col: any) => col.name === "is_websocket",
    ) as any;

    expect(isStreamingCol).toBeDefined();
    expect(isWebsocketCol).toBeDefined();
    expect(isStreamingCol.dflt_value).toBe("0");
    expect(isWebsocketCol.dflt_value).toBe("0");
  });

  it("应该保持向后兼容性 - 现有数据应该继续有效", () => {
    // Insert a request without the new columns (simulating old data)
    const sessionId = "session-1";
    const requestId = "req-1";

    // First, create a session
    db.prepare(
      `
      INSERT INTO sessions (id, name, created_at)
      VALUES (?, ?, ?)
    `,
    ).run(sessionId, "Test Session", Date.now());

    // Insert a request record
    db.prepare(
      `
      INSERT INTO requests
      (id, session_id, sequence, timestamp, method, url)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    ).run(requestId, sessionId, 1, Date.now(), "GET", "https://example.com");

    // Query the request back
    const request = db
      .prepare("SELECT * FROM requests WHERE id = ?")
      .get(requestId) as any;

    // Verify the record exists and new columns have default values
    expect(request).toBeDefined();
    expect(request.id).toBe(requestId);
    expect(request.is_streaming).toBe(0);
    expect(request.is_websocket).toBe(0);
  });
});
