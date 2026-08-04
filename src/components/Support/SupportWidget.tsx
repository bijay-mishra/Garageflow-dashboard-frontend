import { useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { LoadingBlock } from '@/components/common/loaders/States'
import Conversation from './Conversation'
import {
  useEscalateSupportThread,
  useMySupportThreads,
  useSendSupportMessage,
  useStartSupportThread,
  useSupportConversation,
  type ISupportMessage,
} from './support-query'

/**
 * "Chat with us" — the workshop's own line to GarageFlow.
 *
 * A floating panel rather than a page because the questions it answers are
 * asked *while* you are doing something else ("where is this setting?"), and
 * making somebody leave the screen they are stuck on to ask about it is the
 * wrong shape. It sits above the content and below modals.
 *
 * Not shown to the operator: they answer these threads, and a support widget
 * that opens a ticket with yourself is a joke at the user's expense.
 */
export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [threadId, setThreadId] = useState<number | null>(null)

  const { data: threads = [], isLoading } = useMySupportThreads(open)
  const { data: conversation } = useSupportConversation(open ? threadId : null)

  const start = useStartSupportThread()
  const send = useSendSupportMessage()
  const escalate = useEscalateSupportThread()

  const waiting = threads.filter((t) => t.status === 'waiting').length

  const onSend = async (message: string) => {
    if (threadId == null) {
      const res = await start.mutateAsync(message)
      const created = res?.data?.data?.thread?.id
      if (created != null) setThreadId(created)
      return
    }

    await send.mutateAsync({ id: threadId, message })
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow transition hover:bg-brand-700"
          aria-label="Chat with GarageFlow"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {/* Only when a human owes them a reply — a badge for "the bot
              answered" would cry wolf on every conversation. */}
          {waiting > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold ring-2 ring-white">
              {waiting}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-30 flex h-[min(560px,calc(100vh-3rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-ink-200">
          <header className="flex shrink-0 items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-800 px-3 py-3 text-white">
            {threadId != null && (
              <button
                onClick={() => setThreadId(null)}
                className="rounded-md p-1 transition hover:bg-white/15"
                aria-label="Back to conversations"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {threadId == null ? 'Chat with GarageFlow' : conversation?.thread.subject}
              </p>
              <p className="truncate text-[11px] text-brand-200">
                {threadId == null
                  ? 'Ask about anything in the product'
                  : conversation?.thread.escalatedAt
                    ? 'With the GarageFlow team'
                    : 'Answered by the assistant'}
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 transition hover:bg-white/15"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </header>

          {threadId == null ? (
            <ThreadList
              loading={isLoading}
              threads={threads}
              onPick={setThreadId}
              onNew={() => setThreadId(null)}
            />
          ) : conversation ? (
            <Conversation
              messages={conversation.messages}
              mine={(m: ISupportMessage) => m.sender === 'staff'}
              onSend={onSend}
              sending={send.isPending}
              placeholder="Ask about GarageFlow…"
              footer={
                conversation.botActive ? (
                  <button
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    onClick={() => escalate.mutate(conversation.thread.id)}
                    disabled={escalate.isPending}
                  >
                    Talk to the GarageFlow team instead
                  </button>
                ) : (
                  <p className="text-xs text-ink-400">
                    The GarageFlow team has this. They will reply here.
                  </p>
                )
              }
            />
          ) : (
            <LoadingBlock label="Loading…" />
          )}

          {/* A brand-new conversation has no thread to load, so the composer is
              rendered directly rather than waiting on a fetch that has nothing
              to fetch. */}
          {threadId == null && threads.length === 0 && !isLoading && (
            <Conversation
              messages={[]}
              mine={() => true}
              onSend={onSend}
              sending={start.isPending}
              placeholder="What do you need help with?"
            />
          )}
        </div>
      )}
    </>
  )
}

function ThreadList({
  loading,
  threads,
  onPick,
  onNew,
}: {
  loading: boolean
  threads: ReturnType<typeof useMySupportThreads>['data']
  onPick: (id: number) => void
  onNew: () => void
}) {
  if (loading) return <LoadingBlock label="Loading…" />

  if (!threads || threads.length === 0) {
    return (
      <div className="flex-1 px-4 py-6 text-center">
        <ChatBubbleLeftRightIcon className="mx-auto h-8 w-8 text-ink-300" />
        <p className="mt-3 text-sm font-semibold text-ink-800">Ask us anything</p>
        <p className="mt-1 text-xs text-ink-400">
          Where a setting lives, why something is not showing, how a feature works.
          The assistant answers first and passes anything it cannot to our team.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <button
        onClick={onNew}
        className="flex w-full items-center gap-2 border-b border-ink-100 px-4 py-3 text-left text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
      >
        <PlusIcon className="h-4 w-4" /> New conversation
      </button>

      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onPick(thread.id)}
          className="w-full border-b border-ink-100 px-4 py-3 text-left transition hover:bg-ink-50"
        >
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
              {thread.subject}
            </p>
            {thread.status === 'waiting' && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                waiting
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-400">{thread.preview}</p>
        </button>
      ))}
    </div>
  )
}

/**
 * Whether this role should see the widget at all.
 *
 * The operator answers these threads, so offering them a button that opens a
 * ticket with themselves would be a joke at their expense — and the server
 * refuses it anyway.
 */
export const showSupportWidget = (role?: string) =>
  role !== undefined && role !== 'SuperAdmin' && role !== 'Customer'
