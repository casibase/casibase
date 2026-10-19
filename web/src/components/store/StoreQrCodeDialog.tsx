// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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
import {Copy, Download} from "lucide-react";
import {QRCodeCanvas} from "qrcode.react";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import * as Setting from "@/lib/setting";

const qrSize = 480;
const padding = 40;

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let chars = Array.from(text);
  while (chars.length > 0 && ctx.measureText(`${chars.join("")}…`).width > maxWidth) {
    chars = chars.slice(0, -1);
  }
  return `${chars.join("")}…`;
}

export function StoreQrCodeDialog({store, url, onOpenChange}: {store: any; url: string; onOpenChange: (open: boolean) => void}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const title = store?.displayName || store?.name || "";

  const download = () => {
    const qr = canvasRef.current;
    if (!qr) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qr, padding, padding, qrSize, qrSize);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(fitText(ctx, title, qrSize), canvas.width / 2, qrSize + padding + 36);
    ctx.fillStyle = "#666666";
    ctx.font = "22px sans-serif";
    ctx.fillText(i18next.t("store:Scan to chat with this agent"), canvas.width / 2, qrSize + padding + 80);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${title}.png`;
    link.click();
  };

  return (
    <Dialog open={store !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{i18next.t("store:QR Code")}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-md border bg-white p-3">
            <QRCodeCanvas ref={canvasRef} value={url} size={qrSize} marginSize={2} style={{width: 220, height: 220}} />
          </div>
          <p className="text-center text-xs text-muted-foreground">{i18next.t("store:Scan to chat with this agent")}</p>
          <div className="flex w-full items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <span className="min-w-0 flex-1 break-all text-xs">{url}</span>
            <Button variant="ghost" size="iconSm" aria-label={i18next.t("general:Copy")} onClick={() => Setting.copyToClipboard(url)}><Copy /></Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={download}><Download />{i18next.t("store:Download QR Code")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
