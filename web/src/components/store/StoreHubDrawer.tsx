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
import {Bot, Copy, Link2, MessageSquare, QrCode} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {Sheet, SheetContent, SheetDescription, SheetTitle} from "@/components/ui/sheet";
import {UserLabel} from "@/components/common/UserLabel";
import {StoreQrCodeDialog} from "@/components/store/StoreQrCodeDialog";
import * as Setting from "@/lib/setting";

/** The absolute chat URL of a store, on its own site when it comes from another hub. */
export function getChatUrl(store: any) {
  const chatPath = `/stores/${store.owner}/${store.name}/chat`;
  return `${store.endpoint || window.location.origin}${chatPath}`;
}

export function StoreAvatar({store, className}: {store: any; className?: string}) {
  const name = store.displayName || store.name || "?";
  return (
    <Avatar className={className}>
      {store.avatar ? <AvatarImage src={store.avatar} alt="" className="object-cover" /> : null}
      <AvatarFallback className="text-white" style={{backgroundColor: Setting.getAvatarColor(store.name ?? "")}}>
        {name[0].toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** Who made the agent: the author typed on the store, or else its owner. */
export function StoreAuthor({store}: {store: any}) {
  return (
    <span className="inline-flex items-center gap-1">
      {i18next.t("store:By")} {store.author ? store.author : <UserLabel user={store.owner} />}
    </span>
  );
}

export function StoreTags({store}: {store: any}) {
  const tags = [store.subject, store.grade, store.topic].filter(Boolean);
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[11px] font-normal">{tag}</Badge>)}
    </div>
  );
}

interface StoreHubDrawerProps {
  store: any;
  onClose: () => void;
  onStartChat: (store: any) => void;
  onViewAgent?: (store: any) => void;
}

/** A published agent's details, slid in from the hub. */
export function StoreHubDrawer({store, onClose, onStartChat, onViewAgent}: StoreHubDrawerProps) {
  const chatUrl = store ? getChatUrl(store) : "";
  const [qrCodeOpen, setQrCodeOpen] = React.useState(false);

  const field = (labelKey: string, value: string | undefined) => (value ? (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{i18next.t(labelKey)}</div>
      <div className="whitespace-pre-wrap text-sm">{value}</div>
    </div>
  ) : null);

  return (
    <Sheet open={store !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {store ? (
          <>
            <div className="flex items-start gap-4 p-6 pb-5">
              <StoreAvatar store={store} className="h-[72px] w-[72px] text-2xl" />
              <div className="min-w-0 flex-1 space-y-1">
                <SheetTitle className="break-words text-lg">{store.displayName || store.name}</SheetTitle>
                <SheetDescription asChild>
                  <div className="space-y-1 text-sm">
                    <StoreAuthor store={store} />
                    {store.affiliation ? <div className="text-xs">{store.affiliation}</div> : null}
                  </div>
                </SheetDescription>
                <div className="pt-1"><StoreTags store={store} /></div>
              </div>
            </div>
            <Separator />
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              {field("store:Brief", store.brief)}
              {field("store:Tutor", store.tutor)}
              {field("general:Description", store.description)}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Link2 className="h-3.5 w-3.5" />{i18next.t("store:Chat Link")}
                </div>
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 break-all text-xs underline-offset-4 hover:underline">{chatUrl}</a>
                  <Button variant="ghost" size="iconSm" aria-label={i18next.t("general:Copy")} onClick={() => Setting.copyToClipboard(chatUrl)}><Copy /></Button>
                  <Button variant="ghost" size="iconSm" aria-label={i18next.t("store:QR Code")} onClick={() => setQrCodeOpen(true)}><QrCode /></Button>
                </div>
              </div>
            </div>
            <div className="space-y-2 border-t p-6 pt-4">
              {onViewAgent ? (
                <Button variant="outline" size="lg" className="w-full" onClick={() => onViewAgent(store)}><Bot />{i18next.t("store:Enter Agent")}</Button>
              ) : null}
              <Button size="lg" className="w-full" onClick={() => onStartChat(store)}><MessageSquare />{i18next.t("store:Start Chat")}</Button>
            </div>
          </>
        ) : null}
        <StoreQrCodeDialog store={qrCodeOpen ? store : null} url={chatUrl} onOpenChange={setQrCodeOpen} />
      </SheetContent>
    </Sheet>
  );
}
