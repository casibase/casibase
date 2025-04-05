// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {marked} from "marked";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark-reasonable.css";

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true,
});

export function renderMarkdown(text) {
  const rawHtml = marked(text);
  let cleanHtml = DOMPurify.sanitize(rawHtml);
  /* replace <p></p> with <div></div>, reduce paragraph spacing. */
  cleanHtml = cleanHtml.replace(/<p>/g, "<div>").replace(/<\/p>/g, "</div>");
  /* h2 is larger than h1, h2 is the largest, so replace h1 with h2, and set margin as 20px. */
  cleanHtml = cleanHtml.replace(/<h1>/g, "<h2>").replace(/<(h[1-6])>/g, "<$1 style='margin-top: 20px; margin-bottom: 20px'>");
  /* adjust margin and internal gap for unordered list and ordered list. */
  cleanHtml = cleanHtml.replace(/<(ul)>/g, "<ul style='display: flex; flex-direction: column; gap: 10px; margin-top: 10px; margin-bottom: 10px'>").replace(/<(ol)>/g, "<ol style='display: flex; flex-direction: column; gap: 0px; margin-top: 20px; margin-bottom: 20px'>");
  /* adjust code block, for auto line feed. */
  cleanHtml = cleanHtml.replace(/<pre>/g, "<pre style='white-space: pre-wrap; white-space: -moz-pre-wrap; white-space: -pre-wrap; white-space: -o-pre-wrap; word-wrap: break-word;'>");
  return cleanHtml;
}

export function renderLatex(text) {
  const inlineLatexRegex = /\(\s*(([a-zA-Z])|(\\.+?)|([^)]*?[_^!].*?))\s*\)/g;
  const blockLatexRegex = /\[\s*(.+?)\s*\]/g;

  text = text.replace(blockLatexRegex, (match, formula) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (error) {
      return match;
    }
  });

  return text.replace(inlineLatexRegex, (match, formula) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (error) {
      return match;
    }
  });
}

export function renderCode(text) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  tempDiv.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightBlock(block);
  });
  return tempDiv.innerHTML;
}

export function renderText(text) {
  let html;
  html = renderMarkdown(text);
  html = renderLatex(html);
  html = renderCode(html);
  return (
    <div dangerouslySetInnerHTML={{__html: html}} style={{display: "flex", flexDirection: "column", gap: "0px"}} />
  );
}

export function renderReason(text) {
  if (!text) {return null;}

  // Apply the same markdown, LaTeX, and code highlighting as renderText
  let html = renderMarkdown(text);
  html = renderLatex(html);
  html = renderCode(html);

  return (
    <div
      dangerouslySetInnerHTML={{__html: html}}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0px",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
        fontStyle: "italic",
        color: "#505050",
      }}
    />
  );
}
