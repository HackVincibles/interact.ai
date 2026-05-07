"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

export default function MarkdownRenderer({ content }: { content: string }) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");
          const id = Math.random().toString(36).slice(2);

          if (match) {
            return (
              <div className="relative my-3 rounded-xl overflow-hidden border border-border/50">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-border/30">
                  <span className="text-xs text-zinc-400 font-mono">{match[1]}</span>
                  <button
                    onClick={() => handleCopy(code, id)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {copied === id ? (
                      <><Check size={12} className="text-green-400" /><span className="text-green-400">Copied!</span></>
                    ) : (
                      <><Copy size={12} /><span>Copy</span></>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: 0, background: "#18181b", fontSize: "0.82rem" }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          }
          return (
            <code className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1 list-disc list-outside">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1 list-decimal list-outside">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 text-foreground">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 my-3 text-muted-foreground italic">{children}</blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full border-collapse border border-border/50 text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-border/50 px-3 py-2 bg-muted font-semibold text-left">{children}</th>,
        td: ({ children }) => <td className="border border-border/50 px-3 py-2">{children}</td>,
        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
            {children}
          </a>
        ),
        hr: () => <hr className="my-4 border-border/50" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
