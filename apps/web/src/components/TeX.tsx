// Inline/display LaTeX rendered with KaTeX (no extra React wrapper dep).
import katex from "katex";
import "katex/dist/katex.min.css";

export function TeX({ children, block = false, className = "" }: { children: string; block?: boolean; className?: string }) {
  let html = "";
  try {
    html = katex.renderToString(children, { throwOnError: false, displayMode: block, errorColor: "#CC0000" });
  } catch {
    html = children;
  }
  const Tag = block ? "div" : "span";
  return <Tag className={`${block ? "overflow-x-auto py-1" : ""} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
