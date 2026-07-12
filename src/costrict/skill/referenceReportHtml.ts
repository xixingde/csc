const REFERENCE_REPORT_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Strict Code Review · {{BRANCH}} · {{DATE}}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css">
<style>
  :root {
    --bg: #f7f8fa;
    --surface: #ffffff;
    --surface-alt: #f3f4f6;
    --border: #e5e7eb;
    --text: #111827;
    --text-soft: #4b5563;
    --text-muted: #6b7280;

    --blocker: #b91c1c;
    --blocker-bg: #fef2f2;
    --blocker-border: #fecaca;

    --strong: #b45309;
    --strong-bg: #fffbeb;
    --strong-border: #fde68a;

    --polish: #475569;
    --polish-bg: #f1f5f9;
    --polish-border: #cbd5e1;

    --good: #047857;
    --good-bg: #ecfdf5;
    --good-border: #a7f3d0;

    --neutral: #1d4ed8;
    --neutral-bg: #eff6ff;
    --neutral-border: #bfdbfe;

    --accent: #1d4ed8;
    --code-bg: #f6f8fa;

    --mono: "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    --sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    line-height: 1.55;
    font-size: 15px;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .layout {
    max-width: 1240px;
    margin: 0 auto;
    padding: 32px 24px 80px;
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 40px;
  }

  .page-header { grid-column: 1 / -1; margin-bottom: 16px; }
  .branch-meta {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .page-title {
    font-size: 32px;
    font-weight: 700;
    margin: 6px 0 4px;
  }
  .subtitle {
    color: var(--text-soft);
    font-size: 16px;
    margin: 0 0 24px;
  }

  .verdict {
    border: 1px solid var(--border);
    border-left: 4px solid var(--polish);
    border-radius: 6px;
    padding: 18px 22px;
    margin-bottom: 24px;
    background: var(--surface);
  }
  .verdict.request-changes {
    background: var(--blocker-bg);
    border-color: var(--blocker-border);
    border-left-color: var(--blocker);
  }
  .verdict.approve {
    background: var(--good-bg);
    border-color: var(--good-border);
    border-left-color: var(--good);
  }
  .verdict-label {
    font-weight: 700;
    letter-spacing: 0.5px;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .verdict.request-changes .verdict-label { color: var(--blocker); }
  .verdict.approve .verdict-label { color: var(--good); }
  .verdict p { margin: 6px 0 0; font-size: 14.5px; }

  .scope-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .scope-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 14px 16px;
  }
  .scope-card .label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 4px;
  }
  .scope-card .val {
    font-family: var(--mono);
    font-weight: 600;
    font-size: 14px;
  }
  .scope-card .sub {
    font-size: 12.5px;
    color: var(--text-soft);
    margin-top: 4px;
  }

  .summary-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .stat-pill .dot { width: 8px; height: 8px; border-radius: 50%; }
  .stat-pill.blocker .dot { background: var(--blocker); }
  .stat-pill.strong .dot { background: var(--strong); }
  .stat-pill.polish .dot { background: var(--polish); }
  .stat-pill .ids {
    font-family: var(--mono);
    color: var(--text-muted);
    font-size: 12px;
  }

  .toc {
    position: sticky;
    top: 24px;
    align-self: start;
    border-right: 1px solid var(--border);
    padding-right: 16px;
    font-size: 13.5px;
  }
  .toc h3 {
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    margin: 0 0 12px;
    font-weight: 600;
  }
  .toc ol { list-style: none; padding: 0; margin: 0; }
  .toc li {
    margin-bottom: 7px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    line-height: 1.4;
  }
  .toc-dot {
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 7px;
  }
  .toc-dot.blocker { background: var(--blocker); }
  .toc-dot.strong { background: var(--strong); }
  .toc-dot.polish { background: var(--polish); }
  .toc a { color: var(--text-soft); }
  .toc a:hover { color: var(--accent); }
  .toc-section {
    text-transform: uppercase;
    font-size: 10.5px;
    letter-spacing: 0.7px;
    color: var(--text-muted);
    margin: 16px 0 6px;
    font-weight: 600;
  }

  main { min-width: 0; }
  .group-heading {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
    color: var(--text-muted);
    margin: 28px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .group-heading:first-of-type { margin-top: 0; }

  .finding {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 22px 24px;
    margin-bottom: 18px;
    scroll-margin-top: 24px;
  }
  .finding.blocker { border-left: 4px solid var(--blocker); }
  .finding.strong { border-left: 4px solid var(--strong); }
  .finding.polish { border-left: 4px solid var(--polish); }

  .finding-head {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .severity-badge {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.7px;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .severity-badge.blocker {
    background: var(--blocker-bg);
    color: var(--blocker);
    border: 1px solid var(--blocker-border);
  }
  .severity-badge.strong {
    background: var(--strong-bg);
    color: var(--strong);
    border: 1px solid var(--strong-border);
  }
  .severity-badge.polish {
    background: var(--polish-bg);
    color: var(--polish);
    border: 1px solid var(--polish-border);
  }
  .finding h2 {
    font-size: 18px;
    margin: 0;
    font-weight: 600;
  }
  .fid {
    color: var(--text-muted);
    font-family: var(--mono);
    font-weight: 500;
    margin-right: 6px;
  }
  .location {
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--text-muted);
    margin: 4px 0 12px;
  }
  .lede {
    font-size: 14.5px;
    color: var(--text);
    margin: 8px 0 14px;
  }
  .finding h4 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    font-weight: 600;
    margin: 18px 0 8px;
  }

  pre {
    margin: 8px 0;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px 14px;
    overflow-x: auto;
    font-size: 12.5px;
    line-height: 1.55;
  }
  pre code {
    font-family: var(--mono) !important;
    background: none;
    padding: 0;
  }
  code {
    font-family: var(--mono);
    background: var(--surface-alt);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 12.5px;
  }

  figure.mockup { margin: 14px 0; padding: 0; }
  figure.mockup figcaption {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
  }
  .mockup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .mockup-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .mockup-title {
    background: var(--surface-alt);
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-soft);
    border-bottom: 1px solid var(--border);
    font-family: var(--mono);
  }
  .mockup-card.bad .mockup-title {
    color: var(--blocker);
    background: var(--blocker-bg);
    border-bottom-color: var(--blocker-border);
  }
  .mockup-card.good .mockup-title {
    color: var(--good);
    background: var(--good-bg);
    border-bottom-color: var(--good-border);
  }
  .mockup-card pre {
    margin: 0;
    border: none;
    border-radius: 0;
    background: var(--surface);
    font-size: 11.5px;
    padding: 12px 14px;
  }
  .approval {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px 26px;
    margin-top: 32px;
  }
  .approval h3 { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
  .verdict-line {
    font-weight: 600;
    color: var(--blocker);
    background: var(--blocker-bg);
    border: 1px solid var(--blocker-border);
    padding: 10px 14px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; gap: 16px; }
    .toc {
      position: static;
      border-right: none;
      padding-right: 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .mockup-grid,
    .scope-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<!--
  Generic skeleton for strict-codereview.
  Replace all {{PLACEHOLDER}} values and sample finding content.
  Keep report prose in Chinese, while preserving code/professional terms such as PR, diff, schema, state machine, fallback, and API in English when clearer.
-->

<div class="layout">
  <header class="page-header">
    <div class="branch-meta">{{BRANCH}} · {{DATE}} · baseline {{BASELINE}}</div>
    <h1 class="page-title">Strict Code Review</h1>
    <p class="subtitle">{{SCOPE_SUMMARY}}</p>

    <div class="verdict request-changes">
      <div class="verdict-label">Verdict · {{VERDICT}}</div>
      <p>{{VERDICT_REASON}}</p>
    </div>

    <div class="scope-grid">
      <div class="scope-card">
        <div class="label">Scope</div>
        <div class="val">{{FILES_CHANGED}} files / {{LINES_CHANGED}} lines</div>
        <div class="sub">{{COMMITS_OR_RANGE}}</div>
      </div>
      <div class="scope-card">
        <div class="label">Focus</div>
        <div class="val">{{PRIMARY_RISK_AREA}}</div>
        <div class="sub">{{SECONDARY_RISK_AREA}}</div>
      </div>
      <div class="scope-card">
        <div class="label">Largest file</div>
        <div class="val">{{LARGEST_FILE}}</div>
        <div class="sub">{{LARGEST_FILE_LINES}} lines</div>
      </div>
    </div>

    <div class="summary-row">
      <span class="stat-pill blocker"><span class="dot"></span>{{BLOCKER_COUNT}} Blocker <span class="ids">{{BLOCKER_IDS}}</span></span>
      <span class="stat-pill strong"><span class="dot"></span>{{STRONG_COUNT}} Strong <span class="ids">{{STRONG_IDS}}</span></span>
      <span class="stat-pill polish"><span class="dot"></span>{{POLISH_COUNT}} Polish <span class="ids">{{POLISH_IDS}}</span></span>
    </div>
  </header>

  <aside class="toc">
    <h3>Findings</h3>
    <div class="toc-section">Blocker</div>
    <ol>
      <li><span class="toc-dot blocker"></span><a href="#f1">F1 · {{BLOCKER_TITLE}}</a></li>
    </ol>
    <div class="toc-section">Strong</div>
    <ol>
      <li><span class="toc-dot strong"></span><a href="#f2">F2 · {{STRONG_TITLE}}</a></li>
    </ol>
    <div class="toc-section">Polish</div>
    <ol>
      <li><span class="toc-dot polish"></span><a href="#f3">F3 · {{POLISH_TITLE}}</a></li>
    </ol>
    <div class="toc-section">Conclusion</div>
    <ol>
      <li><a href="#approval">Approval</a></li>
    </ol>
  </aside>

  <main>
    <div class="group-heading">Blocker</div>

    <section class="finding blocker" id="f1">
      <div class="finding-head">
        <span class="severity-badge blocker">Blocker</span>
        <h2><span class="fid">F1</span>{{BLOCKER_TITLE}}</h2>
      </div>
      <div class="location">{{FILE_PATH}}:{{LINE}}</div>
      <p class="lede">{{ONE_SENTENCE_PROBLEM_IN_CHINESE_WITH_TERMS_PRESERVED}}</p>

<pre><code class="language-{{LANGUAGE}}">{{REAL_SOURCE_SNIPPET_ESCAPED}}
// &lt;- point at the exact issue
</code></pre>

      <figure class="mockup">
        <figcaption>Current vs Proposed</figcaption>
        <div class="mockup-grid">
          <div class="mockup-card bad">
            <div class="mockup-title">Current</div>
<pre>{{CURRENT_STRUCTURE_OR_FLOW}}</pre>
          </div>
          <div class="mockup-card good">
            <div class="mockup-title">Proposed</div>
<pre>{{PROPOSED_STRUCTURE_OR_FLOW}}</pre>
          </div>
        </div>
      </figure>

      <h4>Proposed fix</h4>
      <p>{{ACTIONABLE_FIX_IN_CHINESE_WITH_TERMS_PRESERVED}}</p>
    </section>

    <div class="group-heading">Strong</div>

    <section class="finding strong" id="f2">
      <div class="finding-head">
        <span class="severity-badge strong">Strong</span>
        <h2><span class="fid">F2</span>{{STRONG_TITLE}}</h2>
      </div>
      <div class="location">{{FILE_PATH}}:{{LINE}}</div>
      <p class="lede">{{ONE_SENTENCE_PROBLEM}}</p>
<pre><code class="language-{{LANGUAGE}}">{{REAL_SOURCE_SNIPPET_ESCAPED}}</code></pre>
      <h4>Proposed fix</h4>
      <p>{{ACTIONABLE_FIX}}</p>
    </section>

    <div class="group-heading">Polish</div>

    <section class="finding polish" id="f3">
      <div class="finding-head">
        <span class="severity-badge polish">Polish</span>
        <h2><span class="fid">F3</span>{{POLISH_TITLE}}</h2>
      </div>
      <div class="location">{{FILE_PATH}}:{{LINE}}</div>
      <p>{{SMALL_MAINTAINABILITY_NOTE}}</p>
    </section>

    <section class="approval" id="approval">
      <h3>Approval</h3>
      <div class="verdict-line">{{VERDICT}} · {{BLOCKER_COUNT}} Blocker / {{STRONG_COUNT}} Strong / {{POLISH_COUNT}} Polish</div>
      <p>{{FINAL_APPROVAL_REASON}}</p>
    </section>
  </main>
</div>

<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
<script>
  if (window.hljs) {
    hljs.configure({ ignoreUnescapedHTML: true });
    document.querySelectorAll("pre code[class^='language-']").forEach((el) => {
      try { hljs.highlightElement(el); } catch (e) {}
    });
  }
</script>

</body>
</html>
`

export { REFERENCE_REPORT_HTML }
