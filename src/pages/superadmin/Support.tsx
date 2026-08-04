import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import Conversation from '@/components/Support/Conversation'
import {
  useSendSupportMessage,
  useSupportConversation,
  useSupportInbox,
  type ISupportMessage,
} from '@/components/Support/support-query'

/**
 * Workshops asking GarageFlow for help.
 *
 * The operator side of the same inbox a workshop sees for its own customers.
 * This one crosses the tenant boundary — every company's threads land in one
 * queue — which is why each row leads with the company code rather than the
 * person: "who is asking" is a question about the account here, not about an
 * individual.
 */
export default function SuperAdminSupport() {
  const { data: threads = [], isLoading, isError } = useSupportInbox()
  const [selected, setSelected] = useState<number | null>(null)

  const { data: conversation } = useSupportConversation(selected)
  const send = useSendSupportMessage()

  useEffect(() => {
    if (selected == null && threads.length > 0) setSelected(threads[0].id)
  }, [threads, selected])

  const waiting = threads.filter((t) => t.needsAttention).length

  return (
    <>
      <ConsoleHeader title="Support" subtitle="Workshops asking GarageFlow for help">
        {waiting > 0 ? (
          <Badge tone="amber">{waiting} waiting</Badge>
        ) : (
          <Badge tone="green">All answered</Badge>
        )}
      </ConsoleHeader>

      <div className="p-5 lg:p-8">
        {isLoading ? (
          <LoadingBlock label="Loading conversations…" />
        ) : isError ? (
          <ErrorBlock />
        ) : threads.length === 0 ? (
          <div className="card px-6 py-16 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 text-sm font-bold text-ink-900">Nothing waiting</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-ink-400">
              Workshops ask through the Chat with us panel in their dashboard. The
              assistant answers the common product questions itself; anything it
              cannot answer arrives here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
            <section className="card max-h-[70vh] overflow-y-auto p-0">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelected(thread.id)}
                  className={clsx(
                    'w-full border-b border-ink-100 px-4 py-3 text-left transition',
                    thread.id === selected ? 'bg-brand-50' : 'hover:bg-ink-50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-600">
                      {thread.companyCode}
                    </code>
                    <p
                      className={clsx(
                        'min-w-0 flex-1 truncate text-xs',
                        thread.needsAttention
                          ? 'font-bold text-ink-900'
                          : 'font-medium text-ink-600',
                      )}
                    >
                      {thread.openedBy}
                    </p>
                    {thread.needsAttention && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    )}
                  </div>

                  <p className="mt-1 truncate text-xs font-medium text-ink-700">
                    {thread.subject}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">{thread.preview}</p>
                </button>
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
                      {conversation.thread.companyCode} · {conversation.thread.openedBy}
                    </p>
                  </header>

                  <Conversation
                    messages={conversation.messages}
                    // The operator is answering, so their own messages are the
                    // ones on the right — the workshop's sit on the left.
                    mine={(m: ISupportMessage) => m.sender === 'operator'}
                    onSend={(message) =>
                      send.mutate({ id: conversation.thread.id, message })
                    }
                    sending={send.isPending}
                    placeholder="Reply to the workshop…"
                  />
                </>
              ) : (
                <LoadingBlock label="Loading…" />
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}
