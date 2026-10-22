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

import * as React from "react";
import i18next from "i18next";
import dayjs from "dayjs";
import copy from "copy-to-clipboard";
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Globe,
  Highlighter,
  Info,
  Loader2,
  Pause,
  Pencil,
  Play,
  RotateCw,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import {Link} from "react-router-dom";
import * as UserBackend from "@/backend/UserBackend";
import {GuardrailMessageNote} from "@/components/layout/Guardrail";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {CorrectionBanner, CorrectionEditor, type CorrectionPayload} from "@/components/chat/MessageCorrection";
import {
  GeneratedResourceList,
  MessageSuggestions,
  ReasoningSection,
  StatusStrip,
  ThinkingDots,
  ToolCallSection,
  extractGeneratedResources,
} from "@/components/chat/MessageParts";
import {MessageText} from "@/components/chat/MessageText";
import {KnowledgeSourcesSheet, WebSourcesSheet} from "@/components/chat/SourcesSheet";
import {getRefinedErrorText, isNoModelProviderError} from "@/lib/chat-stream";
import * as Setting from "@/lib/setting";
import {cn, isComposing} from "@/lib/utils";

/** The message as plain text for the clipboard, tool calls first, the way the answer was produced. */
export function copyMessage(message: any, includeToolCalls = true) {
  const parts: string[] = [];
  const pretty = (raw: string) => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  };
  (includeToolCalls ? message.toolCalls ?? [] : []).forEach((toolCall: any) => {
    let part = `Tool calls (1)\n${toolCall.name}`;
    if (toolCall.arguments) {
      part += `\nArguments:\n${pretty(toolCall.arguments)}`;
    }
    if (toolCall.content) {
      part += `\nResult:\n${pretty(toolCall.content)}`;
    }
    parts.push(part);
  });
  // parsed in an inert document, so markup in the text (an <img onerror>) never runs
  const text = new DOMParser().parseFromString(message.correctedText || message.text || "", "text/html").body.innerText;
  if (text) {
    parts.push(text);
  }
  copy(parts.join("\n\n"));
  Setting.showMessage("success", i18next.t("general:Successfully copied"));
}

// the web pages fetched by tools count as sources too, next to the search results
function mergeSearchResults(message: any) {
  const merged = [...(message.searchResults ?? [])];
  (message.toolCalls ?? []).filter((toolCall: any) => toolCall.name === "web_fetch" && toolCall.content).forEach((toolCall: any) => {
    let url = "";
    let purpose = "";
    try {
      const args = JSON.parse(toolCall.arguments);
      url = args.url || "";
      purpose = args.purpose || "";
    } catch {
      return;
    }
    if (!url || purpose === "get_list") {
      return;
    }
    let title = url;
    try {
      const line = JSON.parse(toolCall.content)[0].text.split("\n").find((l: string) => l.includes("Title:"));
      title = line ? line.replace("Title:", "").trim() || url : url;
    } catch {
      title = url;
    }
    let siteName = "";
    try {
      siteName = new URL(url).hostname;
    } catch {
      siteName = "";
    }
    merged.push({url, title, site_name: siteName, icon: null, index: merged.length + 1});
  });
  return merged;
}

function useUserAvatar(user: string, account: any) {
  const isSelf = account && user === account.name;
  const [avatar, setAvatar] = React.useState<string>(isSelf ? Setting.getEffectiveAvatarUrl(account) : "");
  React.useEffect(() => {
    if (isSelf || !user || user === "AI" || user.startsWith("u-")) {
      return;
    }
    let cancelled = false;
    UserBackend.getUserInfo(user).then((info: any) => !cancelled && setAvatar(info?.avatar || ""));
    return () => {
      cancelled = true;
    };
  }, [user, isSelf]);
  return avatar;
}

function MessageAvatar({message, account, aiAvatar}: {message: any; account: any; aiAvatar: string}) {
  const isAi = message.author === "AI";
  const userAvatar = useUserAvatar(isAi ? "" : message.author, account);
  const src = isAi ? aiAvatar : userAvatar;
  return (
    <Avatar className="mt-5 h-8 w-8 shrink-0">
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback className="text-xs text-white" style={{backgroundColor: Setting.getAvatarColor(message.author || "")}}>
        {(message.author || "?").charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function ActionButton({label, onClick, disabled, children}: {label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="iconSm" className="h-7 w-7 text-muted-foreground hover:text-primary" aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export interface MessageItemProps {
  message: any;
  isLast: boolean;
  account: any;
  store: any;
  aiAvatar: string;
  /** the chat is answering right now */
  isGenerating: boolean;
  /** a read-only view of someone else's chat: no editing, liking or regenerating */
  readOnly: boolean;
  hideThinking: boolean;
  hideToolCalls: boolean;
  readingMessage: string | null;
  isReading: boolean;
  isLoadingTts: boolean;
  onLike: (message: any, reaction: "like" | "dislike") => void;
  onToggleRead: (message: any) => void;
  onRegenerate: () => Promise<void>;
  onEdit: (message: any) => void;
  onSaveCorrection: (message: any, payload: CorrectionPayload) => Promise<boolean>;
  onRevertCorrection: (message: any) => void;
  onSend: (text: string) => void;
}

function MessageItemInner(props: MessageItemProps) {
  const {message, isLast, account, store, aiAvatar, isGenerating, readOnly, hideThinking, hideToolCalls} = props;
  const [editing, setEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState("");
  const [correcting, setCorrecting] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [webOpen, setWebOpen] = React.useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = React.useState(false);

  const isAi = message.author === "AI";
  const toolCalls = message.toolCalls ?? [];
  const hasTools = toolCalls.length > 0;
  const displayText = message.correctedText || message.text;
  const isCorrected = Boolean(message.correctedText);
  const webSources = React.useMemo(() => mergeSearchResults(message), [message]);
  const resources = React.useMemo(() => extractGeneratedResources(message.toolCalls), [message.toolCalls]);
  // only a curator may make a correction a standing rule; the backend queues the rest for review
  const isCurator = Setting.isAdminUser(account) || (store?.owners ?? []).includes(account?.name);
  const showToolCalls = !hideToolCalls;
  const canCorrect = !readOnly && Boolean(account?.name) && !message.isReadOnly && isAi && Boolean(message.text) && !isGenerating;
  const answering = isGenerating && isLast && isAi && !message.errorText;
  // while reasoning streams in, it gets a bubble of its own above the (still empty) answer
  const reasoningOnly = isAi && message.isReasoningPhase && !hasTools && !message.text;

  const regenerate = () => {
    setRegenerating(true);
    props.onRegenerate().finally(() => setRegenerating(false));
  };

  const saveEdit = () => {
    props.onEdit({...message, text: editedText, updatedTime: new Date().toISOString()});
    setEditing(false);
  };

  const renderError = () => {
    const noProvider = isNoModelProviderError(message.errorText);
    const refinedErrorText = getRefinedErrorText(message.errorText);
    const detailIndex = refinedErrorText.indexOf("\n\n");
    const errorSummary = detailIndex === -1 ? refinedErrorText : refinedErrorText.slice(0, detailIndex);
    const errorDetail = detailIndex === -1 ? "" : refinedErrorText.slice(detailIndex + 2);
    return (
      <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        <span className={cn("break-all", !noProvider && !errorDetail && "font-mono")}>
          {errorSummary}
          {noProvider ? (
            <Link to="/quick-setup" className="ml-2 font-semibold text-primary hover:underline">{i18next.t("chat:No model provider - action")} →</Link>
          ) : !readOnly ? (
            <button type="button" className="ml-2 font-semibold text-primary hover:underline disabled:opacity-50" disabled={regenerating} onClick={regenerate}>
              {i18next.t(regenerating ? "general:Regenerating..." : "general:Regenerate")} →
            </button>
          ) : null}
          {errorDetail ? <span className="mt-1 block font-mono text-[11px] text-muted-foreground">{errorDetail}</span> : null}
        </span>
      </div>
    );
  };

  const renderContent = () => {
    if (message.errorText) {
      return renderError();
    }
    if (isAi && !message.text && !message.reasonText && !hasTools) {
      // the status strip already says what is going on; a stopped answer that never began stays empty
      if (answering) {
        return null;
      }
      return isGenerating ? <ThinkingDots label={message.statusText} /> : <span className="text-muted-foreground">…</span>;
    }
    if (isAi && (message.reasonText || hasTools)) {
      const showReason = (!message.isReasoningPhase || hasTools) && !hideThinking;
      return (
        <>
          {showReason ? <ReasoningSection reasonText={message.reasonText} isReasoningPhase={message.isReasoningPhase} /> : null}
          {showToolCalls ? <ToolCallSection toolCalls={toolCalls} /> : null}
          <GeneratedResourceList resources={resources} />
          {displayText ? <MessageText text={displayText} /> : null}
        </>
      );
    }
    return <MessageText text={displayText} className={isAi ? undefined : "[&_a]:text-primary-foreground"} />;
  };

  const isReadingThis = props.readingMessage === message.name;
  const ttsLabel = isReadingThis && props.isLoadingTts ? "general:Loading..." : isReadingThis && props.isReading ? "general:Pause" : isReadingThis ? "general:Resume" : "chat:Read it out";

  const bubble = () => {
    if (editing && !isAi) {
      return (
        <div className="ml-auto w-full max-w-md space-y-2 rounded-2xl rounded-br-sm border bg-card p-3 shadow-sm">
          <Textarea
            autoFocus
            rows={3}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onKeyDown={(e) => {
              if (isComposing(e)) {
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
              } else if (e.key === "Escape") {
                setEditing(false);
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="select-none text-[11px] text-muted-foreground">Enter {i18next.t("general:Save")} · Esc {i18next.t("general:Cancel")}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 rounded-full" onClick={() => setEditing(false)}><X />{i18next.t("general:Cancel")}</Button>
              <Button size="sm" className="h-7 rounded-full" onClick={saveEdit}><Check />{i18next.t("general:Save")}</Button>
            </div>
          </div>
        </div>
      );
    }
    if (correcting) {
      return (
        <CorrectionEditor
          message={message}
          canSetGlobalRule={isCurator}
          onCancel={() => setCorrecting(false)}
          onSave={async(payload) => {
            if (await props.onSaveCorrection(message, payload)) {
              setCorrecting(false);
            }
          }}
        />
      );
    }
    return (
      <div className={cn(
        "min-w-0 max-w-full px-4 py-2.5 text-sm",
        isAi ? "rounded-2xl rounded-tl-sm border bg-muted/40" : "rounded-2xl rounded-br-sm bg-primary text-primary-foreground",
      )}>
        {message.hintText ? (
          <div className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" />{message.hintText}</div>
        ) : null}
        {answering ? <StatusStrip message={message} /> : null}
        {isCorrected ? <CorrectionBanner message={message} canRevert={!readOnly && !message.isReadOnly} onRevert={() => props.onRevertCorrection(message)} /> : null}
        {renderContent()}
      </div>
    );
  };

  return (
    <div className={cn("group/message flex max-w-[90%] gap-2.5", isAi ? "mr-auto" : "ml-auto flex-row-reverse")} id={`chat-message-${message.name}`}>
      <MessageAvatar message={message} account={account} aiAvatar={aiAvatar} />
      <div className={cn("flex min-w-0 flex-col gap-1.5", isAi ? "items-start" : "items-end")}>
        <div className="px-1 text-[11px] text-muted-foreground/70">{dayjs(message.createdTime).format("HH:mm")}</div>

        {reasoningOnly && message.reasonText ? (
          <div className="rounded-2xl rounded-tl-sm border bg-muted/40 px-4 py-2.5 text-sm">
            {hideThinking ? <ThinkingDots /> : <ReasoningSection reasonText={message.reasonText} isReasoningPhase />}
          </div>
        ) : null}

        {!reasoningOnly ? (
          <div className={cn("flex max-w-full items-center gap-1", !isAi && "flex-row-reverse")}>
            {bubble()}
            {!isAi && !editing ? (
              <div className="flex shrink-0 opacity-0 transition-opacity group-hover/message:opacity-80">
                <ActionButton label={i18next.t("general:Copy")} onClick={() => copyMessage(message, showToolCalls)}><Copy /></ActionButton>
                {!readOnly ? (
                  <ActionButton label={i18next.t("general:Edit")} onClick={() => {
                    setEditedText(message.text);
                    setEditing(true);
                  }}>
                    <Pencil />
                  </ActionButton>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {!isAi && !editing ? <GuardrailMessageNote message={message} /> : null}

        {isAi && !reasoningOnly && !correcting && !answering ? (
          <div className="flex flex-wrap items-center gap-0.5">
            <ActionButton label={i18next.t("general:Copy")} onClick={() => copyMessage(message, showToolCalls)}><Copy /></ActionButton>
            {!readOnly ? (
              <>
                <ActionButton label={i18next.t("general:Like")} onClick={() => props.onLike(message, "like")}>
                  <ThumbsUp className={message.likeUsers?.includes(account?.name) ? "fill-current text-primary" : undefined} />
                </ActionButton>
                <ActionButton label={i18next.t("general:Dislike")} onClick={() => props.onLike(message, "dislike")}>
                  <ThumbsDown className={message.dislikeUsers?.includes(account?.name) ? "fill-current text-primary" : undefined} />
                </ActionButton>
              </>
            ) : null}
            <ActionButton label={i18next.t(ttsLabel)} disabled={isReadingThis && props.isLoadingTts} onClick={() => props.onToggleRead(message)}>
              {isReadingThis && props.isLoadingTts ? <Loader2 className="animate-spin" /> : isReadingThis && props.isReading ? <Pause /> : <Play />}
            </ActionButton>
            {canCorrect ? (
              <ActionButton label={i18next.t("experience:Correct this answer")} onClick={() => setCorrecting(true)}><Highlighter /></ActionButton>
            ) : null}
            {!readOnly && isLast ? (
              <ActionButton label={i18next.t("general:Regenerate")} disabled={regenerating} onClick={regenerate}><RotateCw /></ActionButton>
            ) : null}
            {webSources.length > 0 ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" onClick={() => setWebOpen(true)}>
                <Globe />{webSources.length} {i18next.t("chat:Web sources")}
              </Button>
            ) : null}
            {message.vectorScores?.length > 0 ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" onClick={() => setKnowledgeOpen(true)}>
                <FileText />{message.vectorScores.length} {i18next.t("chat:Knowledge sources")}
              </Button>
            ) : null}
            {!message.errorText ? <GuardrailMessageNote message={message} /> : null}
          </div>
        ) : null}

        {isAi && isLast && !isGenerating ? <MessageSuggestions message={message} onSend={props.onSend} /> : null}
      </div>

      {webSources.length > 0 ? <WebSourcesSheet open={webOpen} onClose={() => setWebOpen(false)} results={webSources} /> : null}
      {message.vectorScores?.length > 0 ? (
        <KnowledgeSourcesSheet open={knowledgeOpen} onClose={() => setKnowledgeOpen(false)} vectorScores={message.vectorScores} account={account} />
      ) : null}
    </div>
  );
}

/** only the message being streamed changes during an answer, so the rest skip re-rendering */
export const MessageItem = React.memo(MessageItemInner);
