'use client'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('prose prose-invert prose-sm max-w-none', 'prose-p:leading-relaxed prose-p:my-2', 'prose-headings:font-bold prose-headings:text-text-primary', 'prose-strong:text-text-primary', 'prose-li:my-0.5', 'prose-a:text-accent-blue prose-a:no-underline hover:prose-a:underline', className)}>
      <ReactMarkdown
        components={{
          code: ({ className: codeClass, children, ...props }: any) => {
            const isBlock = /language-/.test(codeClass || '')
            if (!isBlock) {
              return <code className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-accent-cyan font-mono text-[0.85em]" {...props}>{children}</code>
            }
            return (
              <pre className="bg-bg-base border border-white/[0.07] rounded-xl p-3.5 overflow-x-auto text-xs leading-relaxed font-mono my-2">
                <code className={codeClass} {...props}>{children}</code>
              </pre>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
