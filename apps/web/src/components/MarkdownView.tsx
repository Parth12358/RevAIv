// Renders an agent's Markdown output with Newsprint styling. Falls back to a
// JSON <pre> when the output isn't a string.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ value, className = "" }: { value: unknown; className?: string }) {
  if (typeof value !== "string") {
    return (
      <pre className={`border border-ink bg-neutral-100 p-4 font-mono text-xs whitespace-pre-wrap overflow-auto ${className}`}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return (
    <div className={`border border-ink bg-paper p-4 overflow-auto ${className}`}>
      <div className="md-prose font-body text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noreferrer" className="underline decoration-editorial decoration-2 underline-offset-2" />
            ),
          }}
        >
          {value}
        </ReactMarkdown>
      </div>
    </div>
  );
}
