"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";
import { Book, GitFork, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { ProjectCase } from "@/data/projects";

function GithubMark({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>;
}
type Repo = { default_branch: string; description: string | null; stargazers_count: number; forks_count: number; language: string | null; license?: { spdx_id: string | null } | null };
type Entry = { path: string; type: string; size?: number };
function decode(encoded: string) { return new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/\n/g, "")), c => c.charCodeAt(0))); }

function inlineMarkdown(text: string) {
  const tokenPattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  return text.split(tokenPattern).filter(Boolean).map((token, index) => {
    const key = `inline-${index}`;
    if (token.startsWith("**") || token.startsWith("__")) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`")) return <code key={key}>{token.slice(1, -1)}</code>;
    if (token.startsWith("*") || token.startsWith("_")) return <em key={key}>{token.slice(1, -1)}</em>;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return <Fragment key={key}>{token}</Fragment>;
  });
}

function MarkdownReadme({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      index++;
      blocks.push(<pre className="gh-code-block" key={`code-${index}`}><code data-language={language || undefined}>{code.join("\n")}</code></pre>);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const Heading = `h${level}` as keyof JSX.IntrinsicElements;
      blocks.push(<Heading key={`heading-${index}`} className="gh-md-heading">{inlineMarkdown(heading[2].replace(/\s+#+\s*$/, ""))}</Heading>);
      index++;
      continue;
    }
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) { blocks.push(<hr key={`rule-${index}`} />); index++; continue; }
    if (/^\s*>/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) quote.push(lines[index++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={`quote-${index}`}>{quote.map((text, i) => <p key={i}>{inlineMarkdown(text)}</p>)}</blockquote>);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      const pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
      while (index < lines.length && pattern.test(lines[index])) items.push(lines[index++].replace(pattern, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={`list-${index}`}>{items.map((item, i) => <li key={i}>{inlineMarkdown(item)}</li>)}</List>);
      continue;
    }
    const paragraph = [line.trim()];
    index++;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|```|\s*>|\s*[-*+]\s+|\s*\d+\.\s+)/.test(lines[index])) paragraph.push(lines[index++].trim());
    blocks.push(<p key={`paragraph-${index}`}>{inlineMarkdown(paragraph.join(" "))}</p>);
  }
  return <article className="gh-markdown">{blocks}</article>;
}

export function GitHubRepoDetails({ p }: { p: ProjectCase }) {
  const repoPath = (p.repoUrl ?? "").replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
  const [repo, setRepo] = useState<Repo | null>(null);
  const [files, setFiles] = useState<Entry[]>([]);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState("README.md");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setRepo(null); setFiles([]); setLanguages({}); setContent(""); setSelected("README.md"); setLoading(true); setError("");
    const headers = { Accept: "application/vnd.github+json" };
    const loadRepository = async () => {
      try {
        const metadataResponse = await fetch(`https://api.github.com/repos/${repoPath}`, { headers });
        if (!metadataResponse.ok) throw new Error("Repository details are unavailable from GitHub.");
        const metadata = await metadataResponse.json() as Repo;
        if (cancelled) return;
        setRepo(metadata);

        const [treeResult, readmeResult, languageResult] = await Promise.allSettled([
          fetch(`https://api.github.com/repos/${repoPath}/git/trees/${metadata.default_branch}?recursive=1`, { headers }).then(async r => { if (!r.ok) throw new Error("File tree unavailable"); return r.json(); }),
          fetch(`https://api.github.com/repos/${repoPath}/readme`, { headers }).then(async r => { if (!r.ok) throw new Error("README.md not found"); return r.json(); }),
          fetch(`https://api.github.com/repos/${repoPath}/languages`, { headers }).then(async r => r.ok ? r.json() : {}),
        ]);
        if (cancelled) return;

        if (treeResult.status === "fulfilled") {
          setFiles((treeResult.value.tree ?? []).filter((f: Entry) => f.type === "blob" || f.type === "tree"));
        } else {
          const contentsResponse = await fetch(`https://api.github.com/repos/${repoPath}/contents?ref=${metadata.default_branch}`, { headers });
          if (contentsResponse.ok) {
            const contents = await contentsResponse.json();
            setFiles(contents.map((file: { path: string; type: string; size?: number }) => ({ path: file.path, type: file.type === "dir" ? "tree" : "blob", size: file.size })));
          }
        }
        if (readmeResult.status === "fulfilled") setContent(decode(readmeResult.value.content));
        else { setSelected("README.md"); setContent("README.md is not available in this repository. Select a file from the tree to preview it here."); }
        if (languageResult.status === "fulfilled") setLanguages(languageResult.value);
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : "GitHub could not be reached."); setLoading(false); }
      }
    };
    void loadRepository();
    return () => { cancelled = true; };
  }, [repoPath]);
  const openFile = async (path: string) => {
    setSelected(path);
    if (path.toLowerCase() === "readme.md") {
      try { const r = await fetch(`https://api.github.com/repos/${repoPath}/readme`); const file = await r.json(); setContent(decode(file.content)); } catch { /* keep previous content */ }
      return;
    }
    try { const r = await fetch(`https://api.github.com/repos/${repoPath}/contents/${path}`); if (!r.ok) return; const file = await r.json(); setContent(decode(file.content)); } catch { /* keep previous content */ }
  };
  const entries = files;
  const link = p.repoUrl!;
  const languageColors: Record<string, string> = { TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Java: "#b07219", Kotlin: "#A97BFF", C: "#555555", HTML: "#e34c26", CSS: "#563d7c" };
  const languageTotal = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  return <motion.div className="gh-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="gh-wrap">
      <nav className="gh-tabs"><span className="active"><Book size={15}/> Code</span><a href={`${link}/issues`} target="_blank" rel="noreferrer">Issues</a><a href={`${link}/commits`} target="_blank" rel="noreferrer">Commits</a></nav>
      <div className="gh-grid"><div className="gh-files-column"><div className="gh-branch"><button>⌘ &nbsp;{repo?.default_branch ?? "main"} <ChevronRight size={13}/></button><span>{files.length} files</span></div>
        <div className="gh-card"><div className="gh-commit"><i>S</i><b>STACKLOOP</b><a href={`${link}/commits`} target="_blank" rel="noreferrer">History</a></div>{loading ? <p className="gh-state">Loading repository files…</p> : error ? <p className="gh-state">{error} <a href={link} target="_blank" rel="noreferrer">Open GitHub ↗</a></p> : entries.length ? entries.map(file => <button className={`gh-file ${selected === file.path ? "selected" : ""}`} key={file.path} style={{ paddingLeft: 12 + Math.max(0, file.path.split("/").length - 1) * 12 }} onClick={() => file.type === "tree" ? window.open(`${link}/tree/${repo?.default_branch ?? "main"}/${file.path}`, "_blank", "noopener,noreferrer") : openFile(file.path)}><span>{file.type === "tree" ? "▰" : "▤"}</span>{file.path.split("/").pop()}<small>{file.type === "tree" ? "Folder" : file.size ? `${Math.max(1, Math.round(file.size / 1024))} KB` : "File"}</small></button>) : <p className="gh-state">No files returned by GitHub. <a href={`${link}/tree/${repo?.default_branch ?? "main"}`} target="_blank" rel="noreferrer">Browse repository ↗</a></p>}</div></div>
        <section className="gh-reader"><div className="gh-card gh-readme"><div className="gh-readme-title"><span><Book size={15}/> {selected}</span><a href={`${link}/blob/${repo?.default_branch ?? "main"}/${selected}`} target="_blank" rel="noreferrer">View on GitHub ↗</a></div>{loading || error ? <p className="gh-state">{loading ? "Loading README…" : error}</p> : selected.toLowerCase().endsWith(".md") ? <MarkdownReadme source={content} /> : <pre>{content}</pre>}</div></section>
        <aside><h2>About</h2><p>{repo?.description ?? `${p.name} project repository`}</p><a href={link} target="_blank" rel="noreferrer"><GithubMark/> Open source repository ↗</a><div className="gh-stats"><span><Star size={14}/>{repo?.stargazers_count ?? "—"} stars</span><span><GitFork size={14}/>{repo?.forks_count ?? "—"} forks</span></div>{languageTotal > 0 && <><hr/><h2>Languages</h2><div className="gh-language-bar">{Object.entries(languages).map(([name, bytes]) => <i key={name} style={{ width: `${bytes / languageTotal * 100}%`, background: languageColors[name] ?? "#8b949e" }}/>)}</div><div className="gh-language-list">{Object.entries(languages).sort((a, b) => b[1] - a[1]).map(([name, bytes]) => <span key={name}><i style={{ background: languageColors[name] ?? "#8b949e" }}/>{name}<b>{(bytes / languageTotal * 100).toFixed(1)}%</b></span>)}</div></>}<hr/><h2>Details</h2><p>{repo?.language ?? "Repository"}{repo?.language ? " project" : ""}</p>{repo?.license?.spdx_id && <p>License · {repo.license.spdx_id}</p>}<div className="gh-note">Files and README load from the linked public GitHub project.</div></aside>
      </div>
    </div>
  </motion.div>;
}
