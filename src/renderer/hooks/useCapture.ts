import { useState, useEffect, useCallback, useRef } from "react";
import type {
  CapturedRequest,
  JsHookRecord,
  StorageSnapshot,
  AnalysisReport,
  ChatMessage,
} from "@shared/types";
import { IPC_CHANNELS } from "@shared/types";

interface UseCaptureState {
  requests: CapturedRequest[];
  hooks: JsHookRecord[];
  snapshots: StorageSnapshot[];
  reports: AnalysisReport[];
  isAnalyzing: boolean;
  analysisError: string | null;
  streamingContent: string;
  selectedRequest: CapturedRequest | null;
  chatHistory: ChatMessage[];
  isChatting: boolean;
  chatError: string | null;
}

interface UseCaptureReturn extends UseCaptureState {
  loadData: (sessionId: string) => Promise<void>;
  clearData: () => void;
  clearCaptureData: (sessionId: string) => Promise<void>;
  selectRequest: (request: CapturedRequest | null) => void;
  startAnalysis: (sessionId: string, purpose?: string, selectedSeqs?: number[]) => Promise<void>;
  cancelAnalysis: (sessionId: string) => Promise<void>;
  sendFollowUp: (sessionId: string, message: string) => Promise<void>;
}

const INITIAL_STATE: UseCaptureState = {
  requests: [],
  hooks: [],
  snapshots: [],
  reports: [],
  isAnalyzing: false,
  analysisError: null,
  streamingContent: "",
  selectedRequest: null,
  chatHistory: [],
  isChatting: false,
  chatError: null,
};

export function useCapture(sessionId: string | null): UseCaptureReturn {
  const [state, setState] = useState<UseCaptureState>(INITIAL_STATE);
  const sessionIdRef = useRef(sessionId);

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Clear all data
  const clearData = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Clear all capture data from DB and reset local state
  const clearCaptureData = useCallback(async (sid: string) => {
    await window.electronAPI.clearCaptureData(sid);
    setState(INITIAL_STATE);
  }, []);

  // Select a request for detail view
  const selectRequest = useCallback((request: CapturedRequest | null) => {
    setState((prev) => ({ ...prev, selectedRequest: request }));
  }, []);

  // Load all data for a session from main process
  const loadData = useCallback(async (sid: string) => {
    try {
      const [requests, hooks, snapshots, reports] = await Promise.all([
        window.electronAPI.getRequests(sid),
        window.electronAPI.getHooks(sid),
        window.electronAPI.getStorage(sid),
        window.electronAPI.getReports(sid),
      ]);

      // Only update if session hasn't changed while loading
      if (sessionIdRef.current === sid) {
        setState((prev) => ({
          ...prev,
          requests: requests.sort((a, b) => a.sequence - b.sequence),
          hooks: hooks.sort((a, b) => b.timestamp - a.timestamp),
          snapshots,
          reports: reports.sort((a, b) => b.created_at - a.created_at),
        }));
      }
    } catch (err) {
      console.error("Failed to load capture data:", err);
    }
  }, []);

  // Start AI analysis for a session
  const startAnalysis = useCallback(async (sid: string, purpose?: string, selectedSeqs?: number[]) => {
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      analysisError: null,
      streamingContent: "",
    }));

    try {
      const report = await window.electronAPI.startAnalysis(sid, purpose, selectedSeqs);

      // Only update if session hasn't changed
      if (sessionIdRef.current === sid) {
        setState((prev) => {
          // Build context summary from captured data for follow-up chat
          const reqSummary = prev.requests.slice(0, 50).map(r => {
            let path = r.url
            try { path = new URL(r.url).pathname } catch { /* keep full url */ }
            return `#${r.sequence} ${r.method} ${path} → ${r.status_code ?? '?'}`
          }).join('\n')

          const hookSummary = prev.hooks.length > 0
            ? '\n\nDetected hooks:\n' + prev.hooks.slice(0, 20).map(h =>
                `[${h.hook_type}] ${h.function_name}`
              ).join('\n')
            : ''

          const contextBlock = reqSummary
            ? `\n\n<captured_data_summary>\nCaptured ${prev.requests.length} requests:\n${reqSummary}${prev.requests.length > 50 ? `\n... and ${prev.requests.length - 50} more` : ''}${hookSummary}\n</captured_data_summary>`
            : ''

          const systemContent = `你是一位网站协议分析专家。基于之前的分析报告和捕获数据，回答用户的追问。保持技术精确，用中文回复。

你可以使用 get_request_detail 工具，通过传入请求序号(seq)来查看任意请求的完整详情（请求头、请求体、响应头、响应体）。当用户追问某个具体请求或需要更多细节时，请主动调用此工具获取数据。${contextBlock}`

          return {
            ...prev,
            isAnalyzing: false,
            streamingContent: "",
            reports: [report, ...prev.reports],
            chatHistory: [
              { role: 'system' as const, content: systemContent },
              { role: 'assistant' as const, content: report.report_content },
            ],
            chatError: null,
          }
        });
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isCancelled = errMsg.includes("Analysis cancelled") || errMsg.includes("aborted");
      if (sessionIdRef.current === sid) {
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          streamingContent: "",
          analysisError: isCancelled ? null : errMsg,
        }));
      }
    }
  }, []);

  // Cancel an in-progress analysis
  const cancelAnalysis = useCallback(async (sid: string) => {
    await window.electronAPI.cancelAnalysis(sid);
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      streamingContent: "",
      analysisError: null,
    }));
  }, []);

  const chatHistoryRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    chatHistoryRef.current = state.chatHistory;
  }, [state.chatHistory]);

  const sendFollowUp = useCallback(async (sid: string, message: string) => {
    setState((prev) => ({
      ...prev,
      isChatting: true,
      chatError: null,
      streamingContent: "",
      chatHistory: [...prev.chatHistory, { role: 'user' as const, content: message }],
    }));

    try {
      const reply = await window.electronAPI.sendFollowUp(sid, chatHistoryRef.current, message);

      if (sessionIdRef.current === sid) {
        setState((prev) => ({
          ...prev,
          isChatting: false,
          streamingContent: "",
          chatHistory: [...prev.chatHistory, { role: 'assistant' as const, content: reply }],
        }));
      }
    } catch (err) {
      console.error("Follow-up chat failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (sessionIdRef.current === sid) {
        setState((prev) => ({
          ...prev,
          isChatting: false,
          streamingContent: "",
          chatError: errMsg,
        }));
      }
    }
  }, []);

  // Set up IPC event listeners for real-time updates
  useEffect(() => {
    if (!sessionId) {
      clearData();
      return;
    }

    // Load initial data
    loadData(sessionId);

    // --- Batched request/hook buffering for performance ---
    const requestBuffer: CapturedRequest[] = [];
    const hookBuffer: JsHookRecord[] = [];
    let flushTimer: ReturnType<typeof setInterval> | null = null;

    const flush = () => {
      if (requestBuffer.length > 0 || hookBuffer.length > 0) {
        const reqBatch = requestBuffer.splice(0);
        const hookBatch = hookBuffer.splice(0);
        setState((prev) => ({
          ...prev,
          requests: reqBatch.length > 0 ? [...prev.requests, ...reqBatch] : prev.requests,
          hooks: hookBatch.length > 0 ? [...hookBatch, ...prev.hooks] : prev.hooks,
        }));
      }
    };

    flushTimer = setInterval(flush, 300);

    // Listen for new captured requests — buffer instead of immediate setState
    const handleRequest = (data: CapturedRequest) => {
      if (data.session_id !== sessionIdRef.current) return;
      requestBuffer.push(data);
    };

    // Listen for new hook records — buffer instead of immediate setState
    const handleHook = (data: JsHookRecord) => {
      if (data.session_id !== sessionIdRef.current) return;
      hookBuffer.push(data);
    };

    // Listen for analysis progress (streaming chunks)
    const handleAnalysisProgress = (chunk: string) => {
      setState((prev) => ({
        ...prev,
        streamingContent: prev.streamingContent + chunk,
      }));
    };

    window.electronAPI.onRequestCaptured(handleRequest);
    window.electronAPI.onHookCaptured(handleHook);
    window.electronAPI.onAnalysisProgress(handleAnalysisProgress);

    // Cleanup listeners on unmount or session change
    return () => {
      if (flushTimer) clearInterval(flushTimer);
      flush(); // flush remaining buffered items
      window.electronAPI.removeAllListeners(IPC_CHANNELS.CAPTURE_REQUEST);
      window.electronAPI.removeAllListeners(IPC_CHANNELS.CAPTURE_HOOK);
      window.electronAPI.removeAllListeners(IPC_CHANNELS.AI_PROGRESS);
    };
  }, [sessionId, loadData, clearData]);

  return {
    ...state,
    loadData,
    clearData,
    clearCaptureData,
    selectRequest,
    startAnalysis,
    cancelAnalysis,
    sendFollowUp,
  };
}

export default useCapture;
