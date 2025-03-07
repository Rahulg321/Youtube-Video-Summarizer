"use client";

//@ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Split,
  Bold,
  Italic,
  List,
  Code,
  Heading1,
  Heading2,
  ExternalLink,
  Image,
  Table,
  Quote,
  Check,
  Download,
  Sun,
  Moon,
  X,
  HelpCircle,
  Maximize,
  Minimize,
  Clock,
  Book,
  Search,
  Printer,
  FileText,
  Save,
  Settings,
  ChevronDown,
  Target,
  Smile,
} from "lucide-react";

// Simple Markdown parser implementation with syntax highlighting
const parseMarkdown = function (markdown: any) {
  if (!markdown) return "";

  let html = markdown;

  // Make HTML tags safe
  html = html.replace(/</g, "&lt;");
  html = html.replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");

  // Preserve code blocks with syntax highlighting
  const codeBlocks: any = [];
  interface CodeBlock {
    id: string;
    content: string;
    language?: string;
  }

  interface SyntaxHighlightRules {
    pattern: RegExp;
    color: string;
  }

  const syntaxRules: SyntaxHighlightRules[] = [
    { pattern: /function/g, color: "#569cd6" },
    { pattern: /const|let|var/g, color: "#569cd6" },
    { pattern: /console/g, color: "#4ec9b0" },
    { pattern: /log/g, color: "#dcdcaa" },
    { pattern: /"([^"]*)"/g, color: "#ce9178" },
    { pattern: /`([^`]*)`/g, color: "#ce9178" },
    { pattern: /\$\{([^}]*)\}/g, color: "#9cdcfe" },
  ];

  html = html.replace(
    /```([a-z]*)\n([\s\S]*?)```/g,
    function (match: string, language: string, code: string): string {
      const id: string = `CODE_BLOCK_${codeBlocks.length}`;
      let highlightedCode: string = code;

      // Apply syntax highlighting rules
      highlightedCode = highlightedCode
        .replace(/function/g, '<span style="color: #569cd6">function</span>')
        .replace(/const|let|var/g, '<span style="color: #569cd6">$&</span>')
        .replace(/console/g, '<span style="color: #4ec9b0">console</span>')
        .replace(/log/g, '<span style="color: #dcdcaa">log</span>')
        .replace(/"([^"]*)"/g, '<span style="color: #ce9178">"$1"</span>')
        .replace(/`([^`]*)`/g, '<span style="color: #ce9178">`$1`</span>')
        .replace(
          /\$\{([^}]*)\}/g,
          '<span style="color: #9cdcfe">${</span>$1<span style="color: #9cdcfe">}</span>'
        );

      const languageClass: string = language
        ? ` class="language-${language}"`
        : "";

      const block: string = `<pre class="code-block"><code${languageClass}>${highlightedCode}</code></pre>`;
      codeBlocks.push(block);
      return id;
    }
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.+<\/li>\n?)+/g, "<ul>$&</ul>");

  // Task lists
  html = html.replace(
    /- \[ \] ([^\n]+)/g,
    '<div class="task-list-item"><input type="checkbox" disabled /> $1</div>'
  );
  html = html.replace(
    /- \[x\] ([^\n]+)/g,
    '<div class="task-list-item"><input type="checkbox" checked disabled /> $1</div>'
  );

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Basic Tables
  const tableRegex =
    /\|(.+)\|\s*\n\|(?:[-:]|[:|-])+\|\s*\n((?:\|.+\|\s*\n?)+)/g;
  html = html.replace(
    tableRegex,
    function (_match: string, headerRow: string, bodyRows: string): string {
      const headers = headerRow
        .split("|")
        .filter(Boolean)
        .map(function (header) {
          return `<th>${header.trim()}</th>`;
        })
        .join("");
      const headerHtml = `<tr>${headers}</tr>`;

      const rows: string[] = bodyRows
        .split("\n")
        .filter(function (row: string): boolean {
          return row.trim() !== "";
        });
      interface TableRow {
        content: string;
        cells: string[];
      }

      interface TableCellData {
        content: string;
        html: string;
      }

      const bodyHtml: string = rows
        .map(function (row: string): string {
          const cells: string = row
            .split("|")
            .filter(Boolean)
            .map(function (cell: string): string {
              return `<td>${cell.trim()}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `<table><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table>`;
    }
  );

  // Replace line breaks with <br> except if followed by certain elements
  html = html.replace(
    /\n(?!<\/?(h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|table|thead|tbody|tr|th|td))/g,
    "<br>"
  );

  // Restore code blocks
  codeBlocks.forEach(function (block: string, index: number): void {
    html = html.replace(`CODE_BLOCK_${index}`, block);
  });

  return html;
};

// Format selection with markdown syntax
const formatText = function (
  textarea: HTMLTextAreaElement | null,
  startSyntax: string,
  endSyntax = ""
): { newText: string; selectionStart: number; selectionEnd: number } {
  if (!textarea) return { newText: "", selectionStart: 0, selectionEnd: 0 };
  if (textarea.selectionStart === null)
    return { newText: "", selectionStart: 0, selectionEnd: 0 };
  const start: number = textarea.selectionStart;
  const end: number = textarea.selectionEnd;
  const text = textarea.value;
  const selection = text.substring(start, end);

  const formattedText = startSyntax + selection + (endSyntax || startSyntax);
  const newText =
    text.substring(0, start) + formattedText + text.substring(end);

  return {
    newText,
    selectionStart: start + startSyntax.length,
    selectionEnd: end + startSyntax.length,
  };
};

// Main component
const MarkdownEditor = function () {
  // Initial example markdown content
  const initialMarkdown = `# Welcome to the Markdown Editor

## Features

- **Live Preview** - See your changes instantly
- **Split Pane** - Resize the editor and preview panes
- **Syntax Highlighting** - For code blocks
- **GitHub Flavored Markdown** - Tables, task lists, and more
- **Keyboard Shortcuts** - Boost your productivity

## Examples

### Code Block

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet("World");
\`\`\`

### Table

| Feature | Description |
|---------|-------------|
| Editor  | Write markdown text |
| Preview | See rendered output |
| Save    | Content is automatically saved |

### Task List

- [x] Split pane view
- [x] Live preview
- [x] Syntax highlighting
- [x] Word count & statistics
- [ ] Export to PDF
- [ ] Custom themes

> Enjoy writing with markdown!
`;

  // All state declarations
  const [markdown, setMarkdown] = useState<string>(initialMarkdown);

  const ISSERVER = typeof window === "undefined";

  useEffect(() => {
    if (!ISSERVER) {
      const markdownContent = localStorage.getItem("markdown-content");
      if (markdownContent) {
        setMarkdown(markdownContent);
      }
    }
  }, []);

  const [renderedHtml, setRenderedHtml] = useState("");
  const [editorSize, setEditorSize] = useState(50);
  const [darkMode, setDarkMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [readingTime, setReadingTime] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [wordGoal, setWordGoal] = useState(500);
  const [showSettings, setShowSettings] = useState(false);
  interface Notification {
    message: string;
    type: "success" | "error" | "info" | "warning";
  }
  const [notification, setNotification] = useState<Notification | null>(null);

  // Reference to the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Show notification
  interface NotificationType {
    message: string;
    type: "success" | "error" | "info" | "warning";
  }

  const showNotification = useCallback(function (
    message: string,
    type: NotificationType["type"] = "info"
  ): void {
    setNotification({ message, type });
    setTimeout(function (): void {
      setNotification(null);
    }, 3000);
  },
  []);

  // Update the rendered HTML whenever markdown changes
  useEffect(
    function () {
      setRenderedHtml(parseMarkdown(markdown));

      // Trigger auto-save animation
      setShowSaveIndicator(true);
      setTimeout(function () {
        setShowSaveIndicator(false);
      }, 1500);

      // Save to localStorage
      localStorage.setItem("markdown-content", markdown);

      // Update word count
      const words = markdown.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);

      // Calculate reading time (average reading speed: 200 words per minute)
      const minutes = Math.ceil(words / 200);
      setReadingTime(minutes <= 1 ? "< 1 min read" : `${minutes} min read`);
    },
    [markdown]
  );

  // Add keyboard shortcuts
  useEffect(
    function () {
      interface KeyboardShortcuts {
        key: string;
        ctrlKey: boolean;
        metaKey: boolean;
        preventDefault: () => void;
      }

      const handleKeyDown = function (e: KeyboardShortcuts): void {
        if (!(e.ctrlKey || e.metaKey)) return;

        switch (e.key) {
          case "b": // Bold
            e.preventDefault();
            applyFormatting("bold");
            break;
          case "i": // Italic
            e.preventDefault();
            applyFormatting("italic");
            break;
          case "1": // Heading 1
            e.preventDefault();
            applyFormatting("h1");
            break;
          case "2": // Heading 2
            e.preventDefault();
            applyFormatting("h2");
            break;
          case "k": // Link
            e.preventDefault();
            applyFormatting("link");
            break;
          case "l": // List
            e.preventDefault();
            applyFormatting("list");
            break;
          case "`": // Code
            e.preventDefault();
            applyFormatting("code");
            break;
          case "q": // Quote
            e.preventDefault();
            applyFormatting("quote");
            break;
          case "s": // Save as Markdown
            e.preventDefault();
            handleDownload();
            break;
          case "d": // Dark mode toggle
            e.preventDefault();
            setDarkMode(!darkMode);
            break;
          case "f": // Focus mode toggle
            e.preventDefault();
            setFocusMode(!focusMode);
            break;
          case "h": // Help
            e.preventDefault();
            setShowHelp(!showHelp);
            break;
          default:
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return function () {
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
    [darkMode, focusMode, showHelp]
  );

  // Handle input changes
  interface InputChangeEvent extends React.ChangeEvent<HTMLTextAreaElement> {
    target: HTMLTextAreaElement;
  }

  const handleInputChange = function (e: InputChangeEvent): void {
    setMarkdown(e.target.value);
  };

  // Search functionality
  const handleSearch = function () {
    if (!searchTerm) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const searchIndex = text.indexOf(searchTerm, textarea.selectionEnd);

    if (searchIndex !== -1) {
      textarea.focus();
      textarea.setSelectionRange(searchIndex, searchIndex + searchTerm.length);

      // Scroll to selection
      const lineHeight = 20; // Approximate line height
      const lines = text.substr(0, searchIndex).split("\n").length - 1;
      textarea.scrollTop = lines * lineHeight;
    } else {
      // Start from beginning if not found
      const fromStartIndex = text.indexOf(searchTerm);
      if (fromStartIndex !== -1) {
        textarea.focus();
        textarea.setSelectionRange(
          fromStartIndex,
          fromStartIndex + searchTerm.length
        );

        // Scroll to selection
        const lineHeight = 20;
        const lines = text.substr(0, fromStartIndex).split("\n").length - 1;
        textarea.scrollTop = lines * lineHeight;

        showNotification("Search wrapped to the beginning", "info");
      } else {
        showNotification("No results found", "error");
      }
    }
  };

  // Replace functionality
  const handleReplace = function () {
    if (!searchTerm) return;

    const textarea = textareaRef.current;
    const start = textarea?.selectionStart;
    const end = textarea?.selectionEnd;
    const selection = textarea?.value.substring(start!, end);

    if (selection === searchTerm) {
      const newText =
        textarea?.value.substring(0, start) +
        replaceText +
        textarea?.value.substring(end!);
      setMarkdown(newText);

      // Set selection to after the replaced text
      setTimeout(function () {
        textarea?.focus();
        if (start !== undefined) {
          textarea?.setSelectionRange(
            start + replaceText.length,
            start + replaceText.length
          );
        }
      }, 0);

      showNotification("Text replaced", "success");
    } else {
      // Find and select next occurrence for replacement
      handleSearch();
      showNotification("Selected text for replacement", "info");
    }
  };

  // Replace all functionality
  const handleReplaceAll = function () {
    if (!searchTerm) return;

    const newText = markdown.split(searchTerm).join(replaceText);
    const count = (markdown.match(new RegExp(searchTerm, "g")) || []).length;

    setMarkdown(newText);
    showNotification(`Replaced ${count} occurrences`, "success");
  };

  // Handle smart paste
  interface ClipboardEvent extends React.ClipboardEvent<HTMLTextAreaElement> {
    clipboardData: DataTransfer;
  }

  interface HTMLToMarkdownOptions {
    start: number;
    end: number;
    text: string;
  }

  interface RegexReplacer {
    (match: string, content: string): string;
  }

  const handlePaste = function (e: ClipboardEvent): void {
    // Only process if it's HTML content
    const clipboardData: DataTransfer = e.clipboardData;
    if (!clipboardData.types.includes("text/html") || !textareaRef.current)
      return;

    e.preventDefault();
    const html: string = clipboardData.getData("text/html");

    // Convert HTML to Markdown
    let md: string = html;

    // Basic HTML-to-Markdown conversions
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n");
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n");
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n");
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n");
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n");
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n");

    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
    md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, "```\n$1\n```");

    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
    md = md.replace(
      /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
      "![$2]($1)"
    );

    md = md.replace(
      /<ul[^>]*>(.*?)<\/ul>/gis,
      function (match: string, content: string): string {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
      }
    );

    md = md.replace(
      /<ol[^>]*>(.*?)<\/ol>/gis,
      function (match: string, content: string): string {
        let index: number = 1;
        return content.replace(
          /<li[^>]*>(.*?)<\/li>/gi,
          function (match: string, content: string): string {
            return `${index++}. ${content}\n`;
          }
        );
      }
    );

    md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n");

    // Replace any remaining HTML tags
    md = md.replace(/<[^>]*>/g, "");

    // Decode HTML entities
    md = md.replace(/&nbsp;/g, " ");
    md = md.replace(/&lt;/g, "<");
    md = md.replace(/&gt;/g, ">");
    md = md.replace(/&amp;/g, "&");
    md = md.replace(/&quot;/g, '"');

    // Insert at cursor position
    const start: number = textareaRef.current.selectionStart;
    const end: number = textareaRef.current.selectionEnd;
    const text: string = textareaRef.current.value;

    const newText: string = text.substring(0, start) + md + text.substring(end);
    setMarkdown(newText);

    // Set cursor position after the pasted content
    setTimeout(function (): void {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + md.length;
        textareaRef.current.selectionEnd = start + md.length;
      }
    }, 0);
  };

  // Format handlers
  interface FormatResult {
    newText: string;
    selectionStart: number;
    selectionEnd: number;
  }

  type FormatType =
    | "bold"
    | "italic"
    | "h1"
    | "h2"
    | "code"
    | "codeblock"
    | "link"
    | "image"
    | "list"
    | "quote"
    | "tasklist"
    | "table";

  const applyFormatting = function (formatType: FormatType): void {
    if (!textareaRef.current) return;

    const textarea: HTMLTextAreaElement = textareaRef.current;
    let result: FormatResult;

    switch (formatType) {
      case "bold":
        result = formatText(textarea, "**");
        break;
      case "italic":
        result = formatText(textarea, "*");
        break;
      case "h1":
        result = formatText(textarea, "# ", "");
        break;
      case "h2":
        result = formatText(textarea, "## ", "");
        break;
      case "code":
        result = formatText(textarea, "`");
        break;
      case "codeblock":
        result = formatText(textarea, "```\n", "\n```");
        break;
      case "link":
        result = formatText(textarea, "[", "](url)");
        break;
      case "image":
        result = formatText(textarea, "![alt text](", ")");
        break;
      case "list":
        result = formatText(textarea, "- ", "");
        break;
      case "quote":
        result = formatText(textarea, "> ", "");
        break;
      case "tasklist":
        result = formatText(textarea, "- [ ] ", "");
        break;
      case "table":
        const tableTemplate: string =
          "| Header | Header |\n|--------|--------|\n| Cell   | Cell   |";
        result = formatText(textarea, tableTemplate, "");
        break;
      default:
        return;
    }

    setMarkdown(result.newText);

    // Set focus back to textarea with cursor position
    setTimeout(function (): void {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    }, 0);
  };

  // Download Markdown
  const handleDownload = function () {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Markdown file downloaded", "success");
  };

  // Download HTML
  const handleDownloadHtml = function () {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    /* Add all the markdown styles here */
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    pre { background-color: #f5f5f5; padding: 1rem; overflow: auto; }
    code { background-color: #f5f5f5; padding: 0.2rem 0.4rem; }
    blockquote { border-left: 0.25rem solid #ddd; margin-left: 0; padding-left: 1rem; }
    table { border-collapse: collapse; }
    table, th, td { border: 1px solid #ddd; padding: 0.5rem; }
  </style>
</head>
<body>
  ${renderedHtml}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("HTML file downloaded", "success");
  };

  // Handle resize of the panes
  const handleResize = function (e: MouseEvent): void {
    const container = e.currentTarget as HTMLElement;
    const containerWidth = container.offsetWidth;
    const newPosition = e.clientX - container.getBoundingClientRect().left;
    const newSize = (newPosition / containerWidth) * 100;

    // Limit the size between 20% and 80%
    if (newSize >= 20 && newSize <= 80) {
      setEditorSize(newSize);
    }
  };

  // Print document
  const handlePrint = function () {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showNotification("Could not open print window", "error");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Markdown Document</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            padding: 3rem;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { font-size: 2rem; margin-bottom: 1rem; }
          h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; }
          h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
          p { margin-bottom: 1rem; }
          pre { background-color: #f5f5f5; padding: 1rem; border-radius: 0.5rem; overflow: auto; }
          code { font-family: monospace; background-color: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
          th, td { border: 1px solid #ddd; padding: 0.5rem; }
          th { background-color: #f5f5f5; }
          blockquote { border-left: 0.25rem solid #ddd; padding-left: 1rem; margin-left: 0; }
          img { max-width: 100%; }
          @media print {
            body { padding: 0; }
            pre, code { border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        ${renderedHtml}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Print after content is loaded
    setTimeout(function () {
      printWindow.print();
      printWindow.close();
    }, 500);

    showNotification("Document sent to printer", "success");
  };

  // Export as PDF (simulated)
  const handleExportPdf = function () {
    showNotification("Exporting as PDF...", "info");

    setTimeout(function () {
      // Simulate PDF generation
      const blob = new Blob([renderedHtml], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification("PDF exported successfully", "success");
    }, 1500);
  };

  // Insert emoji
  const insertEmoji = function (emoji: any) {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newText = text.substring(0, start) + emoji + text.substring(end);
    setMarkdown(newText);

    // Set cursor position after the inserted emoji
    setTimeout(function () {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Render Help Modal
  const renderHelpModal = function () {
    if (!showHelp) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
        <div className="bg-white text-gray-800 p-6 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-transform duration-300 transform">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-indigo-700 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Markdown Cheat Sheet
            </h2>
            <button
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
              onClick={() => setShowHelp(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Text Formatting</h3>
              <table className="w-full border-collapse border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Markdown</th>
                    <th className="text-left p-2 border">Result</th>
                    <th className="text-left p-2 border">Shortcut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">**Bold**</td>
                    <td className="p-2 border">
                      <strong>Bold</strong>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+B</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">*Italic*</td>
                    <td className="p-2 border">
                      <em>Italic</em>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+I</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono"># Heading 1</td>
                    <td className="p-2 border">
                      <h1 className="text-2xl">Heading 1</h1>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+1</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">## Heading 2</td>
                    <td className="p-2 border">
                      <h2 className="text-xl">Heading 2</h2>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+2</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Lists</h3>
              <table className="w-full border-collapse border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Markdown</th>
                    <th className="text-left p-2 border">Result</th>
                    <th className="text-left p-2 border">Shortcut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">
                      - Item 1<br />- Item 2
                    </td>
                    <td className="p-2 border">
                      <ul className="list-disc pl-5">
                        <li>Item 1</li>
                        <li>Item 2</li>
                      </ul>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+L</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">
                      1. Item 1<br />
                      2. Item 2
                    </td>
                    <td className="p-2 border">
                      <ol className="list-decimal pl-5">
                        <li>Item 1</li>
                        <li>Item 2</li>
                      </ol>
                    </td>
                    <td className="p-2 border"></td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">
                      - [ ] Task
                      <br />- [x] Done
                    </td>
                    <td className="p-2 border">
                      <div>☐ Task</div>
                      <div>☑ Done</div>
                    </td>
                    <td className="p-2 border"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Other</h3>
              <table className="w-full border-collapse border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Markdown</th>
                    <th className="text-left p-2 border">Result</th>
                    <th className="text-left p-2 border">Shortcut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">
                      [Link](https://example.com)
                    </td>
                    <td className="p-2 border">
                      <a href="#" className="text-blue-500 underline">
                        Link
                      </a>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+K</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">
                      ![Alt text](image.jpg)
                    </td>
                    <td className="p-2 border">[Image: Alt text]</td>
                    <td className="p-2 border"></td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">`code`</td>
                    <td className="p-2 border">
                      <code className="bg-gray-100 px-1 rounded">code</code>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+`</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">
                      ```
                      <br />
                      code block
                      <br />
                      ```
                    </td>
                    <td className="p-2 border">
                      <pre className="bg-gray-100 p-2 rounded">code block</pre>
                    </td>
                    <td className="p-2 border"></td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono"> Quote</td>
                    <td className="p-2 border">
                      <blockquote className="border-l-4 border-gray-300 pl-2">
                        Quote
                      </blockquote>
                    </td>
                    <td className="p-2 border font-mono">Ctrl+Q</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Editor Shortcuts</h3>
              <table className="w-full border-collapse border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Shortcut</th>
                    <th className="text-left p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">Ctrl+S</td>
                    <td className="p-2 border">Save as Markdown</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">Ctrl+D</td>
                    <td className="p-2 border">Toggle Dark Mode</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">Ctrl+F</td>
                    <td className="p-2 border">Toggle Focus Mode</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">Ctrl+H</td>
                    <td className="p-2 border">Show/Hide Help</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render settings modal
  const renderSettings = function () {
    if (!showSettings) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white text-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Settings</h2>
            <button
              className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-150"
              onClick={() => setShowSettings(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Word Count Goal
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={wordGoal}
                  onChange={(e) => setWordGoal(parseInt(e.target.value))}
                  className="w-full mr-4"
                />
                <input
                  type="number"
                  value={wordGoal}
                  onChange={(e) => setWordGoal(parseInt(e.target.value))}
                  className="w-20 p-1 border border-gray-300 rounded"
                  min="100"
                  max="10000"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150"
                onClick={() => {
                  setShowSettings(false);
                  showNotification("Settings saved", "success");
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render search bar
  const renderSearchBar = function () {
    if (!showSearch) return null;

    return (
      <div className="flex items-center space-x-2 p-2 bg-white border-b border-gray-200">
        <div className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2">
              <Search size={16} className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Find in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-150"
            onClick={handleSearch}
          >
            Find
          </button>
        </div>

        <div className="flex-1 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-150"
            onClick={handleReplace}
          >
            Replace
          </button>
          <button
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-150"
            onClick={handleReplaceAll}
          >
            All
          </button>
        </div>

        <button
          className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-150"
          onClick={() => setShowSearch(false)}
        >
          <X size={18} />
        </button>
      </div>
    );
  };

  // Render notifications
  const renderNotification = function () {
    if (!notification) return null;

    const bgColors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      warning: "bg-yellow-500",
    };

    const icons = {
      success: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      error: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
      info: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      warning: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    };

    return (
      <div className="fixed top-20 right-4 flex items-center p-3 rounded-md shadow-lg text-white max-w-md z-50 animate-fadeIn">
        <div className={`${bgColors[notification.type]} p-2 rounded-md mr-2`}>
          {icons[notification.type]}
        </div>
        <div className="bg-white text-gray-800 py-2 px-3 rounded-md">
          {notification.message}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans transition-colors duration-200">
      {/* Help Modal */}
      {renderHelpModal()}

      {/* Settings Modal */}
      {renderSettings()}

      {/* Notifications */}
      {renderNotification()}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold tracking-tight">Markdown Mirage</h1>
          <div className="ml-4 flex items-center text-sm bg-black bg-opacity-20 px-2 py-1 rounded-full text-gray-100">
            <Clock size={14} className="mr-1" />
            <span>{readingTime}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md flex items-center space-x-1 transition-all duration-200 shadow-sm"
            onClick={() => setShowSearch(!showSearch)}
            title="Search (Ctrl+F)"
          >
            <Search size={16} />
          </button>
          <button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md flex items-center space-x-1 transition-all duration-200 shadow-sm"
            onClick={() => handlePrint()}
            title="Print document"
          >
            <Printer size={16} />
          </button>
          <div className="relative group">
            <button
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md flex items-center space-x-1 transition-all duration-200 shadow-sm"
              title="Export options"
            >
              <FileText size={16} />
              <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
              <div className="py-1">
                <button
                  className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 flex items-center"
                  onClick={() => handleDownload()}
                >
                  <Download size={14} className="mr-2" />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 flex items-center"
                  onClick={() => handleDownloadHtml()}
                >
                  <Download size={14} className="mr-2" />
                  <span>HTML (.html)</span>
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 flex items-center"
                  onClick={() => handleExportPdf()}
                >
                  <Download size={14} className="mr-2" />
                  <span>PDF (.pdf)</span>
                </button>
              </div>
            </div>
          </div>
          <button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md transition-all duration-200 shadow-sm"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark Mode (Ctrl+D)"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md transition-all duration-200 shadow-sm"
            onClick={() => setFocusMode(!focusMode)}
            title="Toggle Focus Mode (Ctrl+F)"
          >
            {focusMode ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md transition-all duration-200 shadow-sm"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md transition-all duration-200 shadow-sm"
            onClick={() => setShowHelp(true)}
            title="Help (Ctrl+H)"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Toolbar */}
      <div className="flex items-center p-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex space-x-1 mr-4">
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Bold (Ctrl+B)"
            onClick={() => applyFormatting("bold")}
          >
            <Bold size={16} />
          </button>
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Italic (Ctrl+I)"
            onClick={() => applyFormatting("italic")}
          >
            <Italic size={16} />
          </button>
        </div>

        <div className="flex space-x-1 mr-4">
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Heading 1 (Ctrl+1)"
            onClick={() => applyFormatting("h1")}
          >
            <Heading1 size={16} />
          </button>
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Heading 2 (Ctrl+2)"
            onClick={() => applyFormatting("h2")}
          >
            <Heading2 size={16} />
          </button>
        </div>

        <div className="flex space-x-1 mr-4">
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="List (Ctrl+L)"
            onClick={() => applyFormatting("list")}
          >
            <List size={16} />
          </button>
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Task List"
            onClick={() => applyFormatting("tasklist")}
          >
            <Check size={16} />
          </button>
        </div>

        <div className="flex space-x-1 mr-4">
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Inline Code (Ctrl+`)"
            onClick={() => applyFormatting("code")}
          >
            <Code size={16} />
          </button>
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Code Block"
            onClick={() => applyFormatting("codeblock")}
          >
            <Code size={16} className="mr-1" />
            <Code size={16} />
          </button>
        </div>

        <div className="flex space-x-1 mr-4">
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Link (Ctrl+K)"
            onClick={() => applyFormatting("link")}
          >
            <ExternalLink size={16} />
          </button>
        </div>

        <div className="flex space-x-1 mr-4">
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Quote (Ctrl+Q)"
            onClick={() => applyFormatting("quote")}
          >
            <Quote size={16} />
          </button>
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Table"
            onClick={() => applyFormatting("table")}
          >
            <Table size={16} />
          </button>
        </div>

        <div className="relative group ml-auto">
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 transition-colors duration-150"
            title="Insert Emoji"
          >
            <Smile size={16} />
          </button>
          <div className="absolute right-0 mt-2 p-2 bg-white rounded-md shadow-lg grid grid-cols-6 gap-1 z-20 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 w-60">
            {[
              "😀",
              "😂",
              "🙂",
              "😍",
              "🤔",
              "😎",
              "😊",
              "👍",
              "👋",
              "🎉",
              "🔥",
              "⭐",
              "❤️",
              "✅",
              "❌",
              "💡",
              "📝",
              "🔗",
              "⚠️",
              "🚫",
              "🔒",
              "🔍",
              "⚙️",
              "📁",
            ].map((emoji) => (
              <button
                key={emoji}
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 border-b border-gray-200">
        <button className="px-4 py-2 font-medium bg-white text-gray-800 rounded-t-md border-t border-l border-r border-gray-300">
          Code
        </button>
        <button className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150">
          Preview
        </button>
      </div>

      {/* Editor and Preview Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div
          className="overflow-auto bg-white"
          style={{ width: `${editorSize}%` }}
        >
          <div className="p-4">
            <h2 className="text-lg font-medium mb-2 text-gray-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Markdown Editor
            </h2>
            <div className="bg-gray-100 text-gray-500 p-1 text-xs mb-2 rounded">
              MARKDOWN
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col text-right pr-2 pt-2 font-mono text-xs select-none overflow-hidden">
                {markdown.split("\n").map((_, i) => (
                  <div key={i} className="leading-relaxed text-gray-400">
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={handleInputChange}
                onPaste={handlePaste}
                className="w-full h-full font-mono text-sm p-2 pl-8 bg-white text-gray-800 border-gray-200 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                style={{
                  minHeight: focusMode
                    ? "calc(100vh - 150px)"
                    : "calc(100vh - 270px)",
                }}
                spellCheck="false"
                placeholder="Start writing..."
              />
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors duration-150"
          onMouseDown={(e) => {
            interface ResizeEvent extends MouseEvent {
              clientX: number;
            }

            const handleMouseMove = function (moveEvent: ResizeEvent): void {
              handleResize(moveEvent);
            };

            const handleMouseUp = function () {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        >
          <div className="text-gray-400">
            <Split size={14} />
          </div>
        </div>

        {/* Preview Pane */}
        <div
          className="overflow-auto bg-white"
          style={{ width: `${100 - editorSize}%` }}
        >
          <div className="p-4">
            <h2 className="text-lg font-medium mb-2 text-gray-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview
            </h2>
            <div className="bg-gray-100 text-gray-500 p-1 text-xs mb-2 rounded">
              PREVIEW
            </div>
            <div
              className="markdown-preview p-4 border-gray-200 bg-white text-gray-800 border rounded-md shadow-sm transition-colors duration-200"
              style={{ minHeight: "calc(100vh - 270px)" }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 text-gray-600 text-sm px-4 py-1 flex justify-between border-t border-gray-200">
        <div className="flex items-center">
          <span className="mr-2 flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Ready
          </span>
          {showSaveIndicator ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white shadow-sm animate-pulse">
              Saving...
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-sm">
              Auto-saved
            </span>
          )}
        </div>
        <div className="flex space-x-4">
          <span className="flex items-center">
            <Book size={14} className="mr-1 text-blue-500" />
            <div className="flex items-center">
              <span>{wordCount}</span>
              <span className="mx-1 text-gray-400">/</span>
              <span className="text-gray-500">{wordGoal}</span>
              <div className="ml-2 w-20 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    wordCount >= wordGoal ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (wordCount / wordGoal) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </span>
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            {markdown.split("\n").length} lines
          </span>
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            {markdown.length} characters
          </span>
          <span className="flex items-center">
            <Clock size={14} className="mr-1 text-indigo-500" />
            {readingTime}
          </span>
        </div>
      </div>

      {/* Style for markdown preview */}
      <style jsx>{`
        .markdown-preview {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          line-height: 1.6;
        }
        .markdown-preview h1 {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid #eaecef;
          color: #1a202c;
        }
        .markdown-preview h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid #eaecef;
          color: #1a202c;
        }
        .markdown-preview h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #1a202c;
        }
        .markdown-preview p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        .markdown-preview ul,
        .markdown-preview ol {
          margin-bottom: 1rem;
          padding-left: 2rem;
        }
        .markdown-preview ul {
          list-style-type: disc;
        }
        .markdown-preview ol {
          list-style-type: decimal;
        }
        .markdown-preview blockquote {
          padding: 0.5rem 1rem;
          color: #6a737d;
          border-left: 0.25rem solid #dfe2e5;
          margin-bottom: 1rem;
          background-color: rgba(27, 31, 35, 0.03);
          border-radius: 0.25rem;
        }
        .markdown-preview pre {
          background-color: #f6f8fa;
          border-radius: 0.5rem;
          padding: 1rem;
          overflow: auto;
          margin-bottom: 1rem;
          box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .markdown-preview code {
          background-color: rgba(27, 31, 35, 0.05);
          border-radius: 0.25rem;
          padding: 0.2em 0.4em;
          font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo,
            monospace;
          font-size: 0.9em;
        }
        .markdown-preview pre code {
          background-color: transparent;
          padding: 0;
          font-size: 0.9em;
          color: #1a202c;
        }
        .markdown-preview table {
          display: block;
          width: 100%;
          overflow: auto;
          border-spacing: 0;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }
        .markdown-preview table tr {
          background-color: #fff;
          border-top: 1px solid #c6cbd1;
        }
        .markdown-preview table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }
        .markdown-preview table th,
        .markdown-preview table td {
          padding: 8px 13px;
          border: 1px solid #dfe2e5;
        }
        .markdown-preview table th {
          font-weight: 600;
          background-color: #f0f0f0;
        }
        .markdown-preview .task-list-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .markdown-preview .task-list-item input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid #c6cbd1;
        }
        .markdown-preview .task-list-item input[type="checkbox"]:checked {
          background-color: #4299e1;
          border-color: #3182ce;
        }
        .markdown-preview img {
          max-width: 100%;
          border-radius: 0.25rem;
          margin: 1rem 0;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .markdown-preview a {
          color: #4299e1;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .markdown-preview a:hover {
          color: #2b6cb0;
          text-decoration: underline;
        }

        /* Customized scrollbars */
        textarea::-webkit-scrollbar,
        .markdown-preview::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        textarea::-webkit-scrollbar-track,
        .markdown-preview::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        textarea::-webkit-scrollbar-thumb,
        .markdown-preview::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        textarea::-webkit-scrollbar-thumb:hover,
        .markdown-preview::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;
