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
import {ArrowUpRight, Bug, Flame, Gift, Heart, Lightbulb, MessageCircleQuestion, RefreshCw, Search, Trophy} from "lucide-react";
import * as ExperienceBackend from "@/backend/ExperienceBackend";
import * as MessageBackend from "@/backend/MessageBackend";
import {Button} from "@/components/ui/button";
import {ChatInput, isSupportedFile, readChatFile, type ChatFile} from "@/components/chat/ChatInput";
import {MessageItem} from "@/components/chat/MessageItem";
import type {CorrectionPayload} from "@/components/chat/MessageCorrection";
import {VirtualFigure} from "@/components/chat/VirtualFigure";
import * as Conf from "@/Conf";
import {useIsMobile} from "@/hooks/use-mobile";
import * as Setting from "@/lib/setting";
import {SpeechInput, TtsPlayer, type TtsState} from "@/lib/speech";
import {cn} from "@/lib/utils";

// what was typed into a chat and not sent survives switching to another chat
const drafts = new Map<string, string>();

const QUESTION_ICONS = [MessageCircleQuestion, Bug, Lightbulb, Flame, Heart, Gift, Trophy, Search];

function pickQuestions(all: any[], limit: number) {
  return all.length <= limit ? all : [...all].sort(() => 0.5 - Math.random()).slice(0, limit);
}

function EmptyState({store, onSend}: {store: any; onSend: (text: string) => void}) {
  const isMobile = useIsMobile();
  const all = store?.exampleQuestions ?? [];
  const limit = isMobile ? 4 : 6;
  const [questions, setQuestions] = React.useState(() => pickQuestions(all, limit));
  const key = JSON.stringify(all);

  React.useEffect(() => setQuestions(pickQuestions(all, limit)), [key, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        {store ? <img src={Setting.getStoreIconUrl(store)} alt="" className="h-14 w-14 rounded-full object-cover" /> : null}
        <h2 className="text-[22px] font-semibold tracking-tight">{store?.welcomeTitle || i18next.t("chat:Hello, I'm OpenAgent AI Assistant")}</h2>
        <p className="text-[15px] text-muted-foreground">{store?.welcomeText || i18next.t("chat:I'm here to help answer your questions")}</p>
      </div>
      {questions.length > 0 ? (
        <div className="w-full max-w-3xl space-y-4">
          <p className="text-center text-[13px] text-muted-foreground">{i18next.t("store:Click a question to get started")}</p>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {questions.map((question: any, index: number) => {
              const Icon = QUESTION_ICONS[index % QUESTION_ICONS.length];
              return (
                <button
                  key={`${question.text}-${index}`}
                  type="button"
                  className="group flex items-start gap-3 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                  onClick={() => onSend(question.text)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-primary">
                    {question.image ? <img src={question.image} alt="" referrerPolicy="no-referrer" className="h-5 w-5 object-contain" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px]">
                    {question.title && question.title !== question.text ? <span className="mb-1 block font-semibold">{question.title}</span> : null}
                    <span className="block break-words text-muted-foreground">{question.text || question.title}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </button>
              );
            })}
          </div>
          {all.length > limit ? (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setQuestions(pickQuestions(all, limit))}><RefreshCw />{i18next.t("general:Refresh")}</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface ChatBoxHandle {
  focus: () => void;
  /** reads a message aloud, as the store's "auto read" does when an answer finishes */
  read: (message: any) => void;
}

export interface ChatBoxProps {
  messages: any[] | null;
  loading: boolean;
  messageError: boolean;
  store: any;
  chat: any;
  account: any;
  sendMessage: (text: string, fileName: string, webSearchEnabled: boolean) => void;
  /** a message was edited or regenerated; the chat comes back with the new answer pending */
  onMessageEdit: (chat: any) => void;
  onCancel: () => void;
  onStoreUpdate?: (store: any) => void;
  showVirtualFigure?: boolean;
  autoFocus?: boolean;
  /** a transcript of someone else's chat: no input, likes or edits */
  readOnly?: boolean;
}

export const ChatBox = React.forwardRef<ChatBoxHandle, ChatBoxProps>(function ChatBox(props, ref) {
  const {messages, loading, messageError, store, chat, account, readOnly} = props;
  const chatKey = chat?.name ?? "";
  const [value, setValue] = React.useState(() => drafts.get(chatKey) ?? "");
  const [files, setFiles] = React.useState<ChatFile[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = React.useState(false);
  const [tts, setTts] = React.useState<TtsState>({readingMessage: null, isReading: false, isLoading: false});
  const [isVoiceInput, setIsVoiceInput] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [localMessages, setLocalMessages] = React.useState<any[] | null>(messages);
  const input = React.useRef<HTMLTextAreaElement>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const stickToBottom = React.useRef(true);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const player = React.useMemo(() => new TtsPlayer(setTts), []);
  // dictation inserts at the caret, after whatever was there when it started
  const voiceBase = React.useRef({text: "", at: 0});
  const speech = React.useMemo(() => new SpeechInput((transcript) => {
    const {text, at} = voiceBase.current;
    setValue(text.slice(0, at) + transcript + text.slice(at));
  }), []);

  React.useEffect(() => () => {
    player.dispose();
    speech.dispose();
  }, [player, speech]);

  React.useEffect(() => setLocalMessages(messages), [messages]);

  // switching chats keeps the old draft and restores the new one
  const previousChat = React.useRef(chatKey);
  React.useEffect(() => {
    if (previousChat.current !== chatKey) {
      drafts.set(previousChat.current, valueRef.current);
      previousChat.current = chatKey;
      setValue(drafts.get(chatKey) ?? "");
      drafts.delete(chatKey);
      setFiles([]);
      player.cancel();
      speech.stop();
      stickToBottom.current = true;
    }
  }, [chatKey, player, speech]);
  React.useEffect(() => () => {
    drafts.set(previousChat.current, valueRef.current);
  }, []);

  const focus = React.useCallback(() => input.current?.focus(), []);
  React.useImperativeHandle(ref, () => ({focus, read: (message: any) => player.read(message, store)}), [focus, player, store]);

  React.useEffect(() => {
    if (props.autoFocus !== false && !readOnly) {
      requestAnimationFrame(() => focus());
    }
  }, [chatKey, focus, props.autoFocus, readOnly]);

  // follows the answer as it streams, unless the reader scrolled up to read something
  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [localMessages]);

  const visible = (localMessages ?? []).filter((message) => message.isHidden === false || message.isHidden === undefined);

  const send = (text?: string) => {
    speech.stop();
    if (text !== undefined) {
      props.sendMessage(text, "", webSearchEnabled);
      stickToBottom.current = true;
      return;
    }
    let message = value;
    files.forEach((file) => {
      message = `${file.value}\n${message}`;
    });
    if (message === "" || readOnly) {
      return;
    }
    props.sendMessage(message, files[0]?.file.name ?? "", webSearchEnabled);
    setValue("");
    setFiles([]);
    stickToBottom.current = true;
  };

  const sendEdited = async(message: any, silent: boolean) => {
    const edited = {
      ...message,
      createdTime: dayjs().format(),
      store: store?.name,
      webSearchEnabled,
      modelProvider: chat?.modelProvider || store?.modelProvider,
    };
    try {
      const res: any = await MessageBackend.addMessage(edited);
      if (res.status === "ok") {
        props.onMessageEdit(res.data);
        if (!silent) {
          Setting.showMessage("success", i18next.t("general:Successfully saved"));
        }
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
    }
  };

  const onEdit = React.useCallback((message: any) => sendEdited(message, false), [store, chat, webSearchEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // regenerating re-asks the last question
  const onRegenerate = React.useCallback(async() => {
    const question = [...(localMessages ?? [])].reverse().find((message) => message.author !== "AI");
    if (question) {
      await sendEdited({...question, updatedTime: new Date().toISOString()}, true);
    }
  }, [localMessages, store, chat, webSearchEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const replaceMessage = (message: any) => setLocalMessages((prev) => (prev ?? []).map((m) => (m.name === message.name ? message : m)));

  const onLike = React.useCallback((message: any, reaction: "like" | "dislike") => {
    const opposite = reaction === "like" ? "dislike" : "like";
    const name = account?.name;
    const isCancel = Boolean(message[`${reaction}Users`]?.includes(name));
    const next = {
      ...message,
      [`${reaction}Users`]: isCancel ? (message[`${reaction}Users`] ?? []).filter((u: string) => u !== name) : [...new Set([...(message[`${reaction}Users`] ?? []), name])],
      [`${opposite}Users`]: (message[`${opposite}Users`] ?? []).filter((u: string) => u !== name),
    };
    replaceMessage(next);
    MessageBackend.updateMessage(next.owner, next.name, next).then((res: any) => {
      if (res.status === "ok") {
        const key = reaction === "like" ? (isCancel ? "Successfully unliked" : "Successfully liked") : (isCancel ? "Successfully undisliked" : "Successfully disliked");
        Setting.showMessage("success", i18next.t(`general:${key}`));
      } else {
        Setting.showMessage("error", res.msg);
      }
    });
  }, [account]);

  // a correction rewrites what the message shows and files the change in the experience library
  const onSaveCorrection = React.useCallback(async(message: any, payload: CorrectionPayload) => {
    try {
      const res: any = await ExperienceBackend.addExperience({
        owner: "admin",
        store: store?.name,
        chat: message.chat,
        message: message.name,
        question: "",
        ...payload,
      });
      if (res.status !== "ok") {
        Setting.showMessage("error", `${i18next.t("general:Failed to save")}: ${res.msg}`);
        return false;
      }
      replaceMessage({...message, correctedText: payload.correctedText});
      Setting.showMessage("success", i18next.t(res.data?.state === "Draft"
        ? "experience:Saved, waiting for review before it affects new answers"
        : "experience:Saved to the experience library"));
      return true;
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      return false;
    }
  }, [store]);

  const onRevertCorrection = React.useCallback(async(message: any) => {
    try {
      const res: any = await ExperienceBackend.getMessageExperience(message.name);
      if (res.status !== "ok") {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${res.msg}`);
        return;
      }
      if (!res.data) {
        Setting.showMessage("error", i18next.t("experience:The experience is not found"));
        return;
      }
      const deleted: any = await ExperienceBackend.deleteExperience(res.data);
      if (deleted.status === "ok") {
        replaceMessage({...message, correctedText: ""});
        Setting.showMessage("success", i18next.t("experience:Correction reverted"));
      } else {
        Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${deleted.msg}`);
      }
    } catch (error) {
      Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
    }
  }, []);

  const onToggleRead = React.useCallback((message: any) => player.toggle(message, store), [player, store]);
  const onSend = React.useCallback((text: string) => send(text), [webSearchEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const startVoice = async() => {
    const el = input.current;
    voiceBase.current = {text: value, at: el ? el.selectionStart ?? value.length : value.length};
    setIsVoiceInput(true);
    try {
      await speech.start(store, () => {
        setIsVoiceInput(false);
        requestAnimationFrame(() => {
          const area = input.current;
          area?.focus();
          area?.setSelectionRange(area.value.length, area.value.length);
        });
      });
    } catch (error: any) {
      Setting.showMessage("error", `${i18next.t("general:Failed to start recording")}: ${error?.message ?? error}`);
      setIsVoiceInput(false);
    }
  };

  const dropFiles = async(list: File[]) => {
    const accepted = list.filter(isSupportedFile);
    const read = await Promise.all(accepted.map((file) => readChatFile(file).catch(() => null)));
    setFiles((prev) => [...prev, ...read.filter(Boolean) as ChatFile[]]);
  };

  const canDrop = !readOnly && !props.messageError && !store?.disableFileUpload;
  const showFigure = props.showVirtualFigure && !readOnly && store?.figureEnabled !== false;
  const aiAvatar = store?.avatar || Setting.getDefaultAiAvatar();
  const hasUrlMessage = new URLSearchParams(window.location.search).get("newMessage");

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      onDragOver={(e) => {
        if (canDrop && e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        if (!canDrop) {
          return;
        }
        e.preventDefault();
        setDragging(false);
        dropFiles(Array.from(e.dataTransfer.files ?? []));
      }}
    >
      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {visible.length === 0 && !hasUrlMessage ? (
          <EmptyState store={store} onSend={(text) => send(text)} />
        ) : (
          <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 md:px-6">
            {visible.map((message, index) => (
              <MessageItem
                key={message.name || index}
                message={message}
                isLast={index === visible.length - 1}
                account={account}
                store={store}
                aiAvatar={aiAvatar}
                isGenerating={loading}
                readOnly={Boolean(readOnly)}
                hideThinking={store?.hideThinking === true}
                hideToolCalls={store?.hideToolCalls === true}
                readingMessage={tts.readingMessage}
                isReading={tts.isReading}
                isLoadingTts={tts.isLoading}
                onLike={onLike}
                onToggleRead={onToggleRead}
                onRegenerate={onRegenerate}
                onEdit={onEdit}
                onSaveCorrection={onSaveCorrection}
                onRevertCorrection={onRevertCorrection}
                onSend={onSend}
              />
            ))}
          </div>
        )}
      </div>

      {showFigure ? (
        <VirtualFigure
          store={store}
          imageUrl={store?.figureUrl || `${Conf.StaticBaseUrl}/img/openagent-figure.png`}
          loading={loading}
          messageError={messageError}
          messages={localMessages ?? []}
          inputValue={value}
          isVoiceInput={isVoiceInput}
          onStoreUpdate={props.onStoreUpdate}
        />
      ) : null}

      {!readOnly ? (
        <div className="shrink-0 px-4 pb-4 pt-2">
          <ChatInput
            ref={input}
            value={value}
            onChange={setValue}
            files={files}
            onFilesChange={setFiles}
            onSend={() => send()}
            loading={loading}
            messageError={messageError}
            onCancel={props.onCancel}
            isVoiceInput={isVoiceInput}
            onVoiceStart={startVoice}
            onVoiceStop={() => speech.stop()}
            webSearchEnabled={webSearchEnabled}
            onWebSearchChange={setWebSearchEnabled}
            store={store}
            chat={chat}
          />
        </div>
      ) : null}

      {dragging ? (
        <div className={cn("pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-lg font-semibold text-primary backdrop-blur-[1px]")}>
          {i18next.t("chat:Drop files here to upload")}
        </div>
      ) : null}
    </div>
  );
});
