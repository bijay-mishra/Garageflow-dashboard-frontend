import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'

// ── Support ──────────────────────────────────────────────────────────────────
// Two conversations, one API. Workshop staff ask GarageFlow for help through
// the "Chat with us" panel; the same staff answer their own customers from the
// Customer chat inbox. Which one a request is about is decided by the server
// from the caller's role, not by anything sent from here — a client that could
// name its own audience could open a thread into somebody else's queue.

export const supportApi = {
  myThreads: {
    actionName: 'SUPPORT_MY_THREADS',
    controllerName: '/support/threads',
    requestMethod: RequestMethod.GET,
  },
  inbox: {
    actionName: 'SUPPORT_INBOX',
    controllerName: '/support/inbox',
    requestMethod: RequestMethod.GET,
  },
  conversation: {
    actionName: 'SUPPORT_CONVERSATION',
    controllerName: '/support/threads/{id}',
    requestMethod: RequestMethod.GET,
  },
  start: {
    actionName: 'SUPPORT_START',
    controllerName: '/support/threads',
    requestMethod: RequestMethod.POST,
  },
  send: {
    actionName: 'SUPPORT_SEND',
    controllerName: '/support/threads/{id}/messages',
    requestMethod: RequestMethod.POST,
  },
  escalate: {
    actionName: 'SUPPORT_ESCALATE',
    controllerName: '/support/threads/{id}/escalate',
    requestMethod: RequestMethod.POST,
  },
} as const

export interface ISupportThread {
  id: number
  /** `customer` (customer ↔ garage) or `workshop` (garage ↔ GarageFlow). */
  audience: string
  subject: string
  /** `bot` | `waiting` | `answered` | `closed`. */
  status: string
  openedBy: string
  companyCode: string
  createdAt: string
  lastMessageAt: string
  /** Null while the bot is still handling it. */
  escalatedAt: string | null
  preview: string
  messageCount: number
  /** Waiting, and not read since the last message. Bolds a row in an inbox. */
  needsAttention: boolean
}

export interface ISupportMessage {
  id: number
  /** `customer` | `staff` | `operator` | `bot`. */
  sender: string
  senderName: string
  body: string
  /**
   * For a bot message: `faq` (written by a person), `ai` (generated), or
   * `none` (it gave up). Null for a human.
   *
   * The UI labels `ai` differently on purpose — a generated answer is a good
   * guess, not a promise, and saying so is the difference between a helpful
   * bot and a misleading one.
   */
  source: string | null
  createdAt: string
}

export interface ISupportConversation {
  thread: ISupportThread
  messages: ISupportMessage[]
  /** False once a human owns the thread — the bot stops interjecting. */
  botActive: boolean
}

/** The conversations this person started. */
export const useMySupportThreads = (enabled = true) =>
  useQuery({
    queryKey: [supportApi.myThreads.actionName],
    queryFn: () => initApiRequest<ISupportThread[]>({ apiDetails: supportApi.myThreads }),
    enabled,
    select: (res) => res?.data?.data ?? [],
  })

/**
 * The conversations this person is expected to answer.
 *
 * Polled while the tab is open: somebody staffing an inbox wants a new question
 * to appear without a refresh, and thirty seconds is frequent enough to feel
 * live without being a busy-wait. `refetchIntervalInBackground` is left off, so
 * a forgotten tab stops asking.
 */
export const useSupportInbox = (enabled = true) =>
  useQuery({
    queryKey: [supportApi.inbox.actionName],
    queryFn: () => initApiRequest<ISupportThread[]>({ apiDetails: supportApi.inbox }),
    enabled,
    refetchInterval: 30_000,
    select: (res) => res?.data?.data ?? [],
  })

export const useSupportConversation = (id: number | null) =>
  useQuery({
    queryKey: [supportApi.conversation.actionName, id],
    queryFn: () =>
      initApiRequest<ISupportConversation>({
        apiDetails: supportApi.conversation,
        pathVariables: { id: id as number },
      }),
    enabled: id != null,
    select: (res) => res?.data?.data ?? null,
  })

/**
 * Invalidates everything a new message could have changed.
 *
 * One helper rather than three call sites, because the answer is always the
 * same: the conversation itself, the sender's list, and the inbox that may now
 * have a row waiting in it.
 */
const useRefreshSupport = () => {
  const queryClient = useQueryClient()

  return (id?: number) => {
    if (id != null) {
      queryClient.invalidateQueries({ queryKey: [supportApi.conversation.actionName, id] })
    }
    queryClient.invalidateQueries({ queryKey: [supportApi.myThreads.actionName] })
    queryClient.invalidateQueries({ queryKey: [supportApi.inbox.actionName] })
  }
}

export const useStartSupportThread = () => {
  const refresh = useRefreshSupport()
  const toast = useToast()

  return useMutation({
    mutationKey: [supportApi.start.actionName],
    mutationFn: (message: string) =>
      initApiRequest<ISupportConversation>({
        apiDetails: supportApi.start,
        requestData: { message },
      }),
    onSuccess: (res) => refresh(res?.data?.data?.thread?.id),
    onError: (error: Error) => toast.error(error.message || 'Could not send that message'),
  })
}

export const useSendSupportMessage = () => {
  const refresh = useRefreshSupport()
  const toast = useToast()

  return useMutation({
    mutationKey: [supportApi.send.actionName],
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      initApiRequest<ISupportConversation>({
        apiDetails: supportApi.send,
        pathVariables: { id },
        requestData: { message },
      }),
    onSuccess: (_res, variables) => refresh(variables.id),
    onError: (error: Error) => toast.error(error.message || 'Could not send that message'),
  })
}

export const useEscalateSupportThread = () => {
  const refresh = useRefreshSupport()
  const toast = useToast()

  return useMutation({
    mutationKey: [supportApi.escalate.actionName],
    mutationFn: (id: number) =>
      initApiRequest<ISupportConversation>({
        apiDetails: supportApi.escalate,
        pathVariables: { id },
      }),
    onSuccess: (res, id) => {
      refresh(id)
      toast.success(res?.data?.message ?? 'A person will reply here')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not pass that on'),
  })
}
