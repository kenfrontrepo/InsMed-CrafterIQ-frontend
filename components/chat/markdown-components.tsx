"use client";

import { Components } from "react-markdown";

export const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-border-mid rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-hover">{children}</thead>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border-mid">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-sm text-black border-b border-border-subtle">
      {children}
    </td>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-hover transition-colors">{children}</tr>
  ),
  p: ({ children }) => (
    <p className="text-black leading-relaxed mb-3">{children}</p>
  ),
  // Custom list styling
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 text-black my-3">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 text-black my-3">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="my-1 leading-relaxed">{children}</li>,
  // Custom code styling
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="px-1.5 py-0.5 bg-black text-white rounded text-sm font-mono">
        {children}
      </code>
    ) : (
      <code className="block p-3 bg-black text-white rounded-lg text-sm font-mono overflow-x-auto">
        {children}
      </code>
    );
  },
  // Custom heading styles
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-black mb-3">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-black mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-black mb-2">{children}</h3>
  ),
  // Custom link styling
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  // Custom blockquote styling
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 py-1 my-3 text-black italic">
      {children}
    </blockquote>
  ),
  // Custom strong/bold styling
  strong: ({ children }) => (
    <strong className="font-semibold text-black">{children}</strong>
  ),
};
