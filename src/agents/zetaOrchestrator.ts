import { useZetaStore, subscribeToMutations } from '../store/zetaStore';
import type { ThoughtLedgerEntry, AgentNameBadge } from '../types/zeta';
import {
  handleDatabaseMutation,
  subscribeToDbEvents,
  unsubscribeFromDbEvents,
} from './agentRouter';

let orchestratorInitialized = false;
let heartbeatIntervalId: number | null = null;
let mutationUnsubscribe: (() => void) | null = null;
let isDispatching = false;

interface MutationDetails {
  targetCollection: 'leads' | 'inventory' | 'invoices' | 'payouts' | 'dossiers' | null;
  actionType:
    | 'update_stage'
    | 'trigger_restock'
    | 'approve_commission'
    | 'merge_duplicates'
    | 'database_write_success';
  payloadDelta: Record<string, unknown>;
}

export const dispatchMutationTelemetry = async (
  triggerType: 'mutation' | 'heartbeat',
  mutationDetails: MutationDetails | null
): Promise<void> => {
  if (isDispatching) return;
  isDispatching = true;

  try {
    const store = useZetaStore.getState();
    const currentUser = store.currentUser;
    const activeTenantTrack =
      currentUser?.role === 'tenant_rep' && currentUser?.tenantLock
        ? currentUser.tenantLock
        : 'global_admin';

    // Build current state snapshots
    const stateSnapshot = {
      leads: store.leads.map((l) => ({ ...l })),
      warehouseAssets: store.warehouseAssets.map((a) => ({ ...a })),
      invoices: store.invoices.map((i) => ({ ...i })),
      ambassadors: store.ambassadors.map((amb) => ({ ...amb })),
      currentUser: currentUser ? { ...currentUser } : null,
    };

    const payload = {
      triggerType,
      activeTenantTrack,
      mutationDetails,
      state: stateSnapshot,
    };

    const response = await fetch('/api/orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const data = (await response.json()) as {
      id: string;
      agentName: AgentNameBadge;
      internalReasoningText?: string;
      terminalOutputLog?: string;
      modelUsed?: string;
      activeTenantTrack?: string;
      currentTask?: string;
      executionTimeMs?: number;
      mutations?: ThoughtLedgerEntry['mutations'];
    };

    if (!data || typeof data !== 'object') {
      throw new Error('Malformed JSON response from orchestrator API');
    }

    // Add entry to Thought Ledger
    const thoughtEntry: Omit<ThoughtLedgerEntry, 'timestamp'> & { id: string } = {
      id: data.id,
      agentName: data.agentName,
      status: 'action_executed',
      thoughtProcess:
        `[REASONING COMPONENT]\n${data.internalReasoningText ?? 'No analytical trace recorded.'}\n\n` +
        `[SYSTEM OUTPUT LOG]\n${data.terminalOutputLog ?? 'Operation completed.'}`,
      message: data.terminalOutputLog,
      modelUsed: data.modelUsed,
      activeTenantTrack: data.activeTenantTrack,
      currentTask: data.currentTask,
      executionTimeMs: data.executionTimeMs,
      mutations: data.mutations,
    };

    store.addThoughtLedgerEntry(thoughtEntry);

    // Dynamic Execution of Agent mutations
    if (data.mutations) {
      const { targetCollection, actionType, payloadDelta } = data.mutations;

      if (
        targetCollection === 'inventory' &&
        actionType === 'trigger_restock' &&
        payloadDelta &&
        typeof (payloadDelta as Record<string, unknown>).skuCode === 'string'
      ) {
        store.restockSKU((payloadDelta as Record<string, string>).skuCode);
      }

      if (
        targetCollection === 'leads' &&
        actionType === 'update_stage' &&
        payloadDelta &&
        typeof (payloadDelta as Record<string, unknown>).leadId === 'string'
      ) {
        const pd = payloadDelta as Record<string, string>;
        store.updateLeadStage(pd.leadId, pd.stage as any);
      }

      if (
        targetCollection === 'invoices' &&
        actionType === 'approve_commission' &&
        payloadDelta &&
        typeof (payloadDelta as Record<string, unknown>).invoiceId === 'string'
      ) {
        const pd = payloadDelta as Record<string, string>;
        store.updateInvoiceStatus(pd.invoiceId, pd.status as any);
      }
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[ORCHESTRATOR ERROR] Telemetry exception logged:', errMsg);

    const store = useZetaStore.getState();
    const localizedError = `[ORCHESTRATOR FAULT] Telemetry transaction exception: ${errMsg}`;

    store.addThoughtLedgerEntry({
      agentName: 'DirectorAgent',
      status: 'idle',
      thoughtProcess: localizedError,
      message: localizedError,
      modelUsed: 'gemini-2.5-pro',
      activeTenantTrack: 'global_admin',
      currentTask: 'Orchestrator error diagnostics',
    });
  } finally {
    isDispatching = false;
  }
};

export const initZetaAgents = (): void => {
  if (orchestratorInitialized) return;
  orchestratorInitialized = true;

  const store = useZetaStore.getState();

  store.addThoughtLedgerEntry({
    agentName: 'DirectorAgent',
    status: 'inspecting',
    thoughtProcess:
      '[DirectorAgent] Multi-Agent Crew Orchestration Frame active. Heartbeat loop initialized.',
    message:
      '[DirectorAgent] Multi-Agent Crew Orchestration Frame active. Heartbeat loop initialized.',
    modelUsed: 'gemini-2.5-pro',
    activeTenantTrack: 'global_admin',
    currentTask: 'Initializing crew loop',
  });

  // ── Wire OpsAgent to DB event bus ──────────────────────────────────────
  // Every cryptographically sealed WAL commit fires a real-time telemetry entry.
  subscribeToDbEvents(store.addThoughtLedgerEntry);

  // ── Subscribe to frontend store mutations ───────────────────────────────
  mutationUnsubscribe = subscribeToMutations(
    (targetCollection: string, actionType: string, payloadDelta: Record<string, unknown>) => {
      if (targetCollection === 'dossiers') {
        handleDatabaseMutation(
          payloadDelta.internId as string,
          payloadDelta.description as string,
          store.addThoughtLedgerEntry
        );
      } else {
        void dispatchMutationTelemetry('mutation', {
          targetCollection: targetCollection as MutationDetails['targetCollection'],
          actionType: actionType as MutationDetails['actionType'],
          payloadDelta,
        });
      }
    }
  );

  // Run initial heartbeat immediately
  void dispatchMutationTelemetry('heartbeat', null);

  // Strict 10-second heartbeat interval for cross-venture forecasting
  heartbeatIntervalId = window.setInterval(() => {
    void dispatchMutationTelemetry('heartbeat', null);
  }, 10000) as unknown as number;
};

export const stopZetaAgents = (): void => {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
  if (mutationUnsubscribe) {
    mutationUnsubscribe();
    mutationUnsubscribe = null;
  }
  unsubscribeFromDbEvents();
  orchestratorInitialized = false;
};
