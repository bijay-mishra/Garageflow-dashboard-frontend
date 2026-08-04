import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { PaperAirplaneIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import type { ISupportMessage } from './support-query'

/**
 * A thread of messages and the box you reply in.
 *
 * Shared by all three places a conversation appears — the "Chat with us" panel,
 * the customer inbox, and the operator console — because they differ only in
 * who is reading. `mine` decides which side of the bubble list a message sits
 * on, and it is the caller's job to say, since "me" is the customer in one
 * place and the person answering them in another.
 */
export default function Conversation({
  messages,
  mine,
  onSend,
  sending,
  disabled,
  placeholder,
  footer,
}: {
  messages: ISupportMessage[]
  /** True for messages this reader wrote. */
  mine: (message: ISupportMessage) => boolean
  onSend: (message: string) => void
  sending: boolean
  disabled?: boolean
  placeholder?: string
  /** Rendered under the composer — the "talk to a human" line, usually. */
  footer?: React.ReactNode
}) {
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // Follows the conversation down as it grows. Keyed on the count rather than
  // the array so a refetch that returns identical messages doesn't yank the
  // view while somebody is reading back through it.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const send = () => {
    const text = draft.trim()
    if (!text || sending || disabled) return

    onSend(text)
    setDraft('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <Bubble key={message.id} message={message} mine={mine(message)} />
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Spinner /> Thinking…
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-ink-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            className="input max-h-32 min-h-[42px] flex-1 resize-none py-2.5"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter breaks the line — the convention every
              // chat box has, and the one people's fingers already know.
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
            placeholder={placeholder ?? 'Type your message…'}
            disabled={disabled}
          />
          <button
            className="btn-primary h-[42px] shrink-0 px-3"
            onClick={send}
            disabled={sending || disabled || draft.trim().length === 0}
            aria-label="Send"
          >
            {sending ? <Spinner /> : <PaperAirplaneIcon className="h-4 w-4" />}
          </button>
        </div>

        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </div>
  )
}

function Bubble({ message, mine }: { message: ISupportMessage; mine: boolean }) {
  const isBot = message.sender === 'bot'

  // A generated answer is labelled, a scripted one is not. The distinction is
  // the point: `faq` was written by a person and is reliable, `ai` is a good
  // guess. Presenting them identically would be the misleading choice.
  const generated = isBot && message.source === 'ai'

  return (
    <div className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-[85%] space-y-1', mine && 'items-end')}>
        {!mine && (
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-ink-400">
            {isBot ? (
              <SparklesIcon className="h-3 w-3" />
            ) : (
              <UserIcon className="h-3 w-3" />
            )}
            {message.senderName}
            {generated && (
              <span className="rounded bg-ink-100 px-1 py-px font-medium text-ink-500">
                AI answer
              </span>
            )}
          </div>
        )}

        <div
          className={clsx(
            'whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            mine
              ? 'rounded-br-sm bg-brand-600 text-white'
              : isBot
                ? 'rounded-bl-sm bg-ink-50 text-ink-800 ring-1 ring-ink-100'
                : 'rounded-bl-sm bg-white text-ink-800 ring-1 ring-ink-200',
          )}
        >
          {message.body}
        </div>

        <div className={clsx('px-1 text-[10px] text-ink-400', mine && 'text-right')}>
          {new Date(message.createdAt).toLocaleString(undefined, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
