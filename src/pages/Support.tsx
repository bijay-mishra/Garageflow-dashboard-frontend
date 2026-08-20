import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import Conversation from '@/components/Support/Conversation'
import {
  useSendSupportMessage,
  useSupportConversation,
  useSupportInbox,
  type ISupportMessage,
  type ISupportThread,
} from '@/components/Support/support-query'

/**
 * Customer questions that need a person.
 *
 * Only escalated threads reach this screen. A conversation the assistant
 * handled on its own is not work for anybody, and putting it here would bury
 * the ones that are — the inbox is a queue, and a queue full of already-solved
 * items is one nobody reads.
 */
export default function Support() {
  const { data: threads = [], isLoading, isError } = useSupportInbox()
  const [selected, setSelected] = useState<number | null>(null)

  const { data: conversation } = useSupportConversation(selected)
  const send = useSendSupportMessage()

  // Open the first thread on arrival so the screen is never a bare list with a
  // grey panel beside it — but only once, or clearing the selection to go back
  // to the list would immediately re-select.
  useEffect(() => {
    if (selected == null && threads.length > 0) setSelected(threads[0].id)
  }, [threads, selected])

  if (isLoading) return <LoadingBlock label="Loading conversations…" />
  if (isError) return <ErrorBlock />

  const waiting = threads.filter((t) => t.needsAttention).length

  return (
    <div className="space-y-6">
      <StickyHeader title="Customer chat">
        {waiting > 0 ? (
          <Badge tone="amber">{waiting} waiting</Badge>
        ) : (
          <Badge tone="green">All answered</Badge>
        )}
      </StickyHeader>

      {threads.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <section className="card max-h-[70vh] overflow-y-auto p-0">
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                active={thread.id === selected}
                onClick={() => setSelected(thread.id)}
              />
            ))}
          </section>

          <section className="card flex h-[70vh] flex-col overflow-hidden p-0">
            {conversation ? (
              <>
                <header className="shrink-0 border-b border-ink-100 px-4 py-3">
                  <p className="text-sm font-bold text-ink-900">
                    {conversation.thread.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {conversation.thread.audience === 'staff' ? 'Mechanic' : 'Customer'} ·{' '}
                    {conversation.thread.openedBy} ·{' '}
                    {conversation.thread.messageCount} message
                    {conversation.thread.messageCount === 1 ? '' : 's'}
                  </p>
                </header>

                <Conversation
                  messages={conversation.messages}
                  // "Mine" is the staff side here — the reader is answering,
                  // not asking, so a customer message sits on the left.
                  mine={(m: ISupportMessage) => m.sender === 'staff'}
                  onSend={(message) =>
                    send.mutate({ id: conversation.thread.id, message })
                  }
                  sending={send.isPending}
                  placeholder="Reply to the customer…"
                  footer={
                    <p className="text-xs text-ink-400">
                      The customer gets a notification as soon as you send this.
                    </p>
                  }
                />
              </>
            ) : (
              <LoadingBlock label="Loading…" />
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function ThreadRow({
  thread,
  active,
  onClick,
}: {
  thread: ISupportThread
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full border-b border-ink-100 px-4 py-3 text-left transition',
        active ? 'bg-brand-50' : 'hover:bg-ink-50',
      )}
    >
      <div className="flex items-center gap-2">
        <p
          className={clsx(
            'min-w-0 flex-1 truncate text-sm',
            thread.needsAttention ? 'font-bold text-ink-900' : 'font-medium text-ink-700',
          )}
        >
          {thread.openedBy || 'Customer'}
        </p>
        {/* Which queue this row is from. Mechanics and customers land in one
            inbox on purpose — whoever is staffing it is watching one list — but
            "the Corolla is in bay 3" and "when is my car ready" need answering
            differently, and the names alone do not say which is which. */}
        <span
          className={clsx(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            thread.audience === 'staff'
              ? 'bg-violet-50 text-violet-700'
              : 'bg-brand-50 text-brand-700',
          )}
        >
          {thread.audience === 'staff' ? 'Mechanic' : 'Customer'}
        </span>
        {thread.needsAttention && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
        )}
      </div>

      <p className="mt-0.5 truncate text-xs font-medium text-ink-600">{thread.subject}</p>
      <p className="mt-0.5 truncate text-xs text-ink-400">{thread.preview}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-400">
        {new Date(thread.lastMessageAt).toLocaleString(undefined, {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </button>
  )
}

function Empty() {
  return (
    <div className="card px-6 py-16 text-center">
      <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-ink-300" />
      <p className="mt-4 text-sm font-bold text-ink-900">Nothing waiting</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-ink-400">
        Customers chat with an assistant in the app, and it answers the ordinary
        questions on its own. Anything it cannot answer — or anyone who asks for
        a person — lands here.
      </p>
    </div>
  )
}
