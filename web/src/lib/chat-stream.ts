// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
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

import i18next from "i18next";
import * as MessageBackend from "@/backend/MessageBackend";

// ---- answer carriers ----------------------------------------------------------
// The model appends a chat title after "=====" and follow-up questions after "|||"
// to its answer; both are cut off before the answer is shown.

const TITLE_DIVIDER = "=====";
const SUGGESTION_DIVIDER = "|||";
const FALLBACK_TITLE_MAX_RUNES = 16;
const MAX_CHAT_DISPLAY_NAME_RUNES = 100;

export interface Suggestion {
  text: string;
  isHit: boolean;
}

function truncateRunes(text: string, maxRunes: number, withEllipsis: boolean) {
  if (maxRunes <= 0 || !text) {
    return "";
  }
  const runes = Array.from(text);
  if (runes.length <= maxRunes) {
    return text;
  }
  return withEllipsis && maxRunes > 1 ? `${runes.slice(0, maxRunes - 1).join("")}…` : runes.slice(0, maxRunes).join("");
}

function normalizeAITitle(title: string) {
  let value = (title || "").trim();
  const lineBreak = value.search(/[\r\n]/);
  if (lineBreak >= 0) {
    value = value.slice(0, lineBreak).trim();
  }
  if (value.includes(SUGGESTION_DIVIDER)) {
    value = value.split(SUGGESTION_DIVIDER, 1)[0].trim();
  }
  return value;
}

function fallbackTitle(userMessage: string) {
  const sanitized = (userMessage || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return truncateRunes(sanitized, FALLBACK_TITLE_MAX_RUNES, true);
}

/** Splits a (partial) answer into what to show, its follow-up suggestions and, when the chat still needs one, a title. */
export function parseAnswer(answer: string, needTitle: boolean, userMessage = "") {
  // whatever follows the title divider is never shown, even once the chat has its title
  const [body, rawTitle = ""] = answer.split(TITLE_DIVIDER);
  const title = normalizeAITitle(rawTitle);
  const [finalAnswer, ...rest] = body.split(SUGGESTION_DIVIDER);
  const resolvedTitle = !needTitle ? "" : truncateRunes(title || fallbackTitle(userMessage), MAX_CHAT_DISPLAY_NAME_RUNES, false);
  return {
    finalAnswer,
    suggestions: rest.map((text) => ({text, isHit: false})) as Suggestion[],
    title: resolvedTitle,
  };
}

export function getFirstUserMessageText(messages: any[]) {
  return (messages ?? []).find((m) => m.author !== "AI" && !m.isHidden && (m.text || "").trim() !== "")?.text ?? "";
}

/** "<What is X>" -> "What is X?", the way follow-up questions are shown and sent. */
export function formatSuggestion(text: string) {
  let value = text.split(TITLE_DIVIDER)[0].trim().replace(/^</, "").replace(/>$/, "");
  if (!value.endsWith("?") && !value.endsWith("？")) {
    value += "?";
  }
  return value;
}

export function getRefinedErrorText(errorText: string) {
  if (errorText.startsWith("error, status code: 400, message: The response was filtered due to the prompt triggering")) {
    return i18next.t("chat:Your chat text involves sensitive content. This chat has been forcibly terminated.");
  }
  if (errorText.startsWith("write tcp ")) {
    return i18next.t("chat:The response has been interrupted. Please do not refresh the page during responding.");
  }
  if (isNoModelProviderError(errorText)) {
    return i18next.t("chat:No model configured - notice");
  }
  return errorText;
}

export function isNoModelProviderError(errorText: string) {
  return errorText.includes("Please add a model provider first") || errorText.includes("请先添加模型提供商");
}

// ---- generation mode, remembered per chat --------------------------------------

export type GenerationMode = "text" | "image";

export function loadGenerationMode(owner?: string, chatName?: string): GenerationMode {
  if (!owner || !chatName) {
    return "text";
  }
  try {
    return localStorage.getItem(`openagent_chat_generation_mode:${owner}:${chatName}`) === "image" ? "image" : "text";
  } catch {
    return "text";
  }
}

export function saveGenerationMode(owner: string | undefined, chatName: string | undefined, mode: GenerationMode) {
  if (!owner || !chatName) {
    return;
  }
  try {
    localStorage.setItem(`openagent_chat_generation_mode:${owner}:${chatName}`, mode);
  } catch {
    // a full or blocked storage only loses the remembered mode
  }
}

// ---- tool calls ------------------------------------------------------------------

export const TOOL_DELTA_PREVIEW_LIMIT = 6000;
const TOOL_DELTA_FLUSH_INTERVAL = 80;

export interface ToolCall {
  index?: number;
  id?: string;
  name: string;
  arguments: string;
  content: string;
  isError?: boolean;
  generatingArguments?: boolean;
}

function trimToolArguments(text: string) {
  return !text || text.length <= TOOL_DELTA_PREVIEW_LIMIT ? text || "" : text.slice(text.length - TOOL_DELTA_PREVIEW_LIMIT);
}

/** Appends a streamed piece of a tool call's arguments, opening the call when it is new. */
export function applyToolDelta(toolCalls: ToolCall[], data: any) {
  const index = data.index ?? 0;
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i].generatingArguments && toolCalls[i].index === index) {
      toolCalls[i] = {
        ...toolCalls[i],
        id: data.id || toolCalls[i].id,
        name: data.name || toolCalls[i].name,
        arguments: trimToolArguments(`${toolCalls[i].arguments || ""}${data.argumentsDelta || ""}`),
      };
      return;
    }
  }
  toolCalls.push({index, id: data.id, name: data.name || "tool", arguments: trimToolArguments(data.argumentsDelta || ""), content: "", generatingArguments: true});
}

/** Records a tool starting (no content yet) or finishing (with its result). */
export function applyToolEvent(toolCalls: ToolCall[], data: any) {
  if (!data.content) {
    for (let i = toolCalls.length - 1; i >= 0; i--) {
      const call = toolCalls[i];
      const pending = call.generatingArguments && !call.content && (!data.name || call.name === data.name || call.name === "tool");
      if (pending) {
        toolCalls[i] = {...call, name: data.name || call.name, arguments: data.arguments || call.arguments || "", content: "", isError: false, generatingArguments: false};
        return;
      }
    }
    toolCalls.push({name: data.name, arguments: data.arguments || "", content: "", isError: false});
    return;
  }
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i].name === data.name && !toolCalls[i].content) {
      toolCalls[i] = {...toolCalls[i], arguments: data.arguments || toolCalls[i].arguments || "", content: data.content, isError: !!data.isError, generatingArguments: false};
      return;
    }
  }
  toolCalls.push({name: data.name, arguments: data.arguments || "", content: data.content, isError: !!data.isError});
}

// ---- streaming one answer ------------------------------------------------------

function parseText(data: string) {
  const text = JSON.parse(data).text;
  // an empty chunk is a line break the model sent on its own
  return text === "" ? "\n" : text;
}

export interface StreamHandlers {
  /** the answer in progress, as a new message object, every time it changes */
  onUpdate: (message: any) => void;
  /** a title for a chat that did not have one yet */
  onTitle?: (title: string) => void;
  onDone: (message: any) => void;
  onError: (message: any, error: string) => void;
}

/**
 * Streams the answer to `answer` (the empty AI message the backend created when
 * the question was added) and reports it as it grows: reasoning first, then tool
 * calls, sources and the text itself. The final message has its title and
 * suggestions cut off.
 */
export function streamAnswer(chat: any, messages: any[], answer: any, handlers: StreamHandlers): () => void {
  let current = {...answer};
  let text = "";
  let reasonText = "";
  const toolCalls: ToolCall[] = [];
  // the guardrail's final say on the answer: a refusal, or the text with personal data masked
  let guarded: any = null;
  const needTitle = Boolean(chat?.needTitle);
  const userText = getFirstUserMessageText(messages);
  let timer: number | null = null;

  const emit = (patch: Record<string, any>) => {
    current = {...current, ...patch};
    handlers.onUpdate(current);
  };
  const flushTools = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    emit({toolCalls: [...toolCalls]});
  };
  const title = (value: string) => {
    if (value && handlers.onTitle) {
      handlers.onTitle(value);
    }
  };

  const stop = MessageBackend.getMessageAnswer(
    answer.owner,
    answer.name,
    (data: string) => {
      text += parseText(data);
      const parsed = parseAnswer(text, needTitle, userText);
      title(parsed.title);
      emit({text: parsed.finalAnswer, isReasoningPhase: false});
    },
    (data: string) => {
      reasonText += parseText(data);
      emit({reasonText, isReasoningPhase: toolCalls.length === 0, ...(text ? {text} : {})});
    },
    (data: string) => {
      applyToolEvent(toolCalls, JSON.parse(data));
      flushTools();
    },
    (data: string) => emit({searchResults: JSON.parse(data)}),
    (data: string) => emit({vectorScores: JSON.parse(data)}),
    (error: string) => {
      current = {...current, errorText: error};
      handlers.onError(current, error);
    },
    () => {
      flushTools();
      const parsed = parseAnswer(text, needTitle, userText);
      title(parsed.title);
      current = {...current, text: parsed.finalAnswer, suggestions: parsed.suggestions, isReasoningPhase: false, statusText: ""};
      if (guarded) {
        current = {...current, text: guarded.text, reasonText: guarded.reasonText, suggestions: guarded.suggestions ?? [], guardrail: guarded.guardrail};
      }
      handlers.onDone(current);
    },
    (info: string) => emit({hintText: info}),
    (update: any) => {
      if (update?.name === chat?.name && update.displayName) {
        title(update.displayName);
      }
    },
    (data: string) => {
      applyToolDelta(toolCalls, JSON.parse(data));
      // argument deltas arrive per token, so they are batched into a few renders a second
      if (timer === null) {
        timer = window.setTimeout(flushTools, TOOL_DELTA_FLUSH_INTERVAL);
      }
    },
    (status: string) => emit({statusText: status}),
    (data: any) => {
      guarded = data;
      emit({text: data.text, reasonText: data.reasonText, suggestions: data.suggestions ?? [], guardrail: data.guardrail, isReasoningPhase: false});
    },
  );

  return () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    stop();
  };
}

/** The message the backend is still answering, if the last one is an empty AI reply. */
export function getPendingAnswer(messages: any[]) {
  const last = messages[messages.length - 1];
  return last && last.author === "AI" && last.replyTo !== "" && last.text === "" ? last : null;
}
