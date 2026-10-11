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
import {ArrowUp, Check, Globe, Mic, Paperclip, Plus, Square, X} from "lucide-react";
import * as ProviderBackend from "@/backend/ProviderBackend";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {FileTypeIcon} from "@/components/common/FileTypeIcon";
import * as ProviderSetting from "@/lib/provider-setting";
import * as Setting from "@/lib/setting";
import {cn, isComposing} from "@/lib/utils";
import {GuardrailNote} from "@/components/layout/Guardrail";

export const ACCEPTED_FILE_TYPES = "image/*, .txt, .md, .yaml, .csv, .docx, .pdf, .xlsx, .pptx";
const SUPPORTED_EXTENSIONS = new Set(["txt", "md", "yaml", "csv", "docx", "pdf", "xlsx", "pptx"]);
const SUPPORTED_TYPES = new Set([
  "text/plain", "text/markdown", "text/yaml", "text/csv", "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
// an attached image is shown in the chat at most this wide
const CHAT_IMAGE_MAX_WIDTH = 600;

export interface ChatFile {
  uid: string;
  file: File;
  /** what the chip previews: the image data URL */
  preview: string;
  /** what is put in front of the message text when it is sent */
  value: string;
}

export function isSupportedFile(file: File) {
  const type = (file.type || "").toLowerCase();
  return type.startsWith("image/") || SUPPORTED_TYPES.has(type) || SUPPORTED_EXTENSIONS.has(file.name.split(".").pop()?.toLowerCase() ?? "");
}

/** Reads a file into the form the backend expects inline in a message: an <img> for pictures, a data URL otherwise. */
export function readChatFile(file: File): Promise<ChatFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const uid = `${Date.now()}-${Math.random()}`;
      if (!file.type.startsWith("image/")) {
        resolve({uid, file, preview: "", value: dataUrl});
        return;
      }
      const image = new Image();
      image.onerror = () => reject(new Error("image"));
      image.onload = () => {
        const ratio = image.width > CHAT_IMAGE_MAX_WIDTH ? CHAT_IMAGE_MAX_WIDTH / image.width : 1;
        const value = `<img src="${dataUrl}" alt="" width="${Math.round(image.width * ratio)}" height="${Math.round(image.height * ratio)}">`;
        resolve({uid, file, preview: dataUrl, value});
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/** whether the chat's model can search the web; switching models turns web search off */
function useWebSearchSupport(providerName: string | undefined, enabled: boolean, onChange: (value: boolean) => void) {
  const [supported, setSupported] = React.useState(false);
  const previous = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (previous.current !== undefined && previous.current !== providerName && enabled) {
      onChange(false);
    }
    previous.current = providerName;
    if (!providerName) {
      setSupported(false);
      return;
    }
    let cancelled = false;
    ProviderBackend.getProvider("admin", providerName)
      .then((res: any) => !cancelled && setSupported(res.status === "ok" && res.data ? ProviderSetting.isProviderSupportWebSearch(res.data) : false))
      .catch(() => !cancelled && setSupported(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerName]);

  return supported;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  files: ChatFile[];
  onFilesChange: (files: ChatFile[]) => void;
  onSend: () => void;
  /** the chat is answering; the send button becomes a stop button */
  loading: boolean;
  disabled?: boolean;
  messageError?: boolean;
  onCancel: () => void;
  isVoiceInput: boolean;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  webSearchEnabled: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  store: any;
  chat: any;
}

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput(props, ref) {
  const {value, files, loading, disabled, messageError, store, chat} = props;
  const textarea = React.useRef<HTMLTextAreaElement>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);
  // files are read asynchronously, so a second one added meanwhile must not be dropped
  const filesRef = React.useRef(files);
  filesRef.current = files;
  React.useImperativeHandle(ref, () => textarea.current as HTMLTextAreaElement);

  const webSearchSupported = useWebSearchSupport(chat?.modelProvider || store?.modelProvider, props.webSearchEnabled, props.onWebSearchChange);
  const locked = disabled || messageError;
  const canSend = !locked && !loading && (value.trim() !== "" || files.length > 0);

  // grows with its content up to a few lines, then scrolls
  const fitHeight = React.useCallback(() => {
    const el = textarea.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, []);
  React.useLayoutEffect(fitHeight, [value, fitHeight]);
  // the first measurement can happen before the box has its width, so a width change measures again
  React.useEffect(() => {
    const el = textarea.current;
    if (!el) {
      return;
    }
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        fitHeight();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitHeight]);

  const addFiles = async(list: File[]) => {
    const read = await Promise.all(list.map((file) => readChatFile(file).catch(() => {
      Setting.showMessage("error", i18next.t("general:Failed to upload"));
      return null;
    })));
    const next = [...filesRef.current, ...read.filter(Boolean) as ChatFile[]];
    filesRef.current = next;
    props.onFilesChange(next);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-2">
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-2.5 px-1">
          {files.map((item) => (
            <div key={item.uid} className="relative flex w-16 flex-col items-center gap-1">
              {item.preview ? (
                <img src={item.preview} alt="" className="h-12 w-12 rounded object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-muted"><FileTypeIcon filename={item.file.name} className="h-7 w-7" /></div>
              )}
              <div className="w-full truncate text-center text-[10px]" title={item.file.name}>{item.file.name}</div>
              <button
                type="button"
                aria-label={i18next.t("general:Delete")}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                onClick={() => props.onFilesChange(files.filter((f) => f.uid !== item.uid))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {props.webSearchEnabled ? (
        <div className="px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 py-0.5 pl-3 pr-1 text-xs font-medium text-primary">
            <Globe className="h-3 w-3" />{i18next.t("chat:Web search")}
            <button type="button" aria-label={i18next.t("general:Close")} className="rounded-full p-0.5 opacity-70 hover:bg-primary/10 hover:opacity-100" onClick={() => props.onWebSearchChange(false)}>
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        </div>
      ) : null}

      <div className="flex items-end gap-1.5 rounded-2xl border bg-card p-2 shadow-lg shadow-black/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full" disabled={locked} aria-label={i18next.t("chat:Add attachment")}><Plus /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-48">
            <DropdownMenuItem disabled={store?.disableFileUpload} onSelect={() => fileInput.current?.click()}>
              <Paperclip />{i18next.t("chat:Add attachment")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!webSearchSupported} onSelect={() => props.onWebSearchChange(!props.webSearchEnabled)}>
              <Globe />{i18next.t("chat:Web search")}
              {props.webSearchEnabled ? <Check className="ml-auto text-primary" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        <textarea
          ref={textarea}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={messageError ? "" : i18next.t("chat:Type message here")}
          className="max-h-[200px] min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          onChange={(e) => props.onChange(e.target.value)}
          onPaste={(e) => {
            const pasted = Array.from(e.clipboardData.files ?? []).filter(isSupportedFile);
            if (pasted.length === 0) {
              return;
            }
            e.preventDefault();
            if (!locked && !store?.disableFileUpload) {
              addFiles(pasted);
            }
          }}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter breaks the line; an IME composing Chinese also uses Enter
            if (e.key === "Enter" && !e.shiftKey && !isComposing(e)) {
              e.preventDefault();
              if (canSend) {
                props.onSend();
              }
            }
          }}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={props.isVoiceInput ? "destructive" : "ghost"}
              size="icon"
              className={cn("shrink-0 rounded-full", props.isVoiceInput && "animate-pulse")}
              disabled={disabled || loading}
              aria-label={i18next.t(props.isVoiceInput ? "chat:Stop" : "chat:Speak")}
              onClick={props.isVoiceInput ? props.onVoiceStop : props.onVoiceStart}
            >
              {props.isVoiceInput ? <Square className="fill-current" /> : <Mic />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{i18next.t(props.isVoiceInput ? "chat:Stop" : "chat:Speak")}</TooltipContent>
        </Tooltip>

        {loading ? (
          <Button size="icon" className="shrink-0 rounded-full" aria-label={i18next.t("chat:Stop")} onClick={props.onCancel}>
            <Square className="fill-current" />
          </Button>
        ) : (
          <Button size="icon" className="shrink-0 rounded-full" aria-label={i18next.t("pipe:Send")} disabled={!canSend} onClick={props.onSend}>
            <ArrowUp />
          </Button>
        )}
      </div>
      <GuardrailNote />
    </div>
  );
});
