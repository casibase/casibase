import * as React from "react";
import {BadgeCheck, FileSearch, Fingerprint, MessageSquareWarning, ScanSearch, ShieldCheck, Wrench, X} from "lucide-react";
import {useLocation} from "react-router-dom";
import {useSite} from "@/hooks/use-site";
import {cn} from "@/lib/utils";

/**
 * The AI guardrail that protects this instance, shown when the built-in site sets
 * `guardrailName`: a seal in the footer, a note under the chat input, a tab on the
 * right edge and a side panel listing what it protects.
 */
type LayerId = "prompt" | "content" | "agent" | "document" | "privacy" | "mark";

const layers: Record<LayerId, {icon: typeof ScanSearch; name: string; items: string[]}> = {
  prompt: {icon: ScanSearch, name: "提示词防护", items: ["提示词注入检测", "越狱攻击拦截", "系统设定防泄露"]},
  content: {icon: MessageSquareWarning, name: "内容安全", items: ["输入输出双向审核", "有害与违规内容过滤", "未成年人不宜内容拦截"]},
  agent: {icon: Wrench, name: "Agent 工具防护", items: ["高危工具调用权限控制", "工具返回结果注入检测"]},
  document: {icon: FileSearch, name: "文档与知识库防护", items: ["上传文档隐藏指令检测", "知识库投毒片段过滤"]},
  privacy: {icon: Fingerprint, name: "隐私与数据保护", items: ["手机号、身份证号识别脱敏", "密钥与凭据脱敏"]},
  mark: {icon: BadgeCheck, name: "生成内容标识", items: ["AI 生成内容标注", "对话记录可追溯"]},
};

const features: {name: string; layers: LayerId[]}[] = [
  {name: "智能体对话", layers: ["prompt", "content", "privacy", "mark"]},
  {name: "知识库问答", layers: ["document", "prompt", "content"]},
  {name: "Agent 工具调用", layers: ["agent", "prompt"]},
];

// the chat runs prompts, tools and personal data through the guardrail
const noteLayers: LayerId[] = ["prompt", "content", "agent", "privacy"];

const allLayers = (Object.keys(layers) as LayerId[]).filter((id) => features.some((f) => f.layers.includes(id)));

type GuardrailInfo = {name: string; owner: string; logoUrl: string};

const GuardrailContext = React.createContext<{guardrail: GuardrailInfo | null; setOpen: (open: boolean) => void}>({guardrail: null, setOpen: () => undefined});

export function GuardrailProvider({children}: {children: React.ReactNode}) {
  const {site} = useSite();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const guardrail = React.useMemo<GuardrailInfo | null>(() => site?.guardrailName ? {name: site.guardrailName, owner: site.guardrailOwner ?? "", logoUrl: site.guardrailLogoUrl ?? ""} : null, [site?.guardrailName, site?.guardrailOwner, site?.guardrailLogoUrl]);
  const isRaw = new URLSearchParams(location.search).has("isRaw");
  const value = React.useMemo(() => ({guardrail, setOpen}), [guardrail]);

  return (
    <GuardrailContext.Provider value={value}>
      {children}
      {guardrail && !isRaw ? (
        <>
          <GuardrailTab open={open} onOpen={() => setOpen(true)} />
          <GuardrailDrawer guardrail={guardrail} open={open} onClose={() => setOpen(false)} />
        </>
      ) : null}
    </GuardrailContext.Provider>
  );
}

function GuardrailLogo({guardrail, className}: {guardrail: GuardrailInfo; className?: string}) {
  if (guardrail.logoUrl) {
    return <img src={guardrail.logoUrl} alt={guardrail.owner} className={cn("shrink-0 rounded-full bg-white object-contain", className)} />;
  }
  return <ShieldCheck className={cn("shrink-0 text-primary", className)} strokeWidth={1.75} />;
}

function StatusDot() {
  return <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />;
}

function GuardrailTab({open, onOpen}: {open: boolean; onOpen: () => void}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "fixed right-0 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-md border border-r-0 bg-card px-1.5 py-2.5 text-muted-foreground shadow-sm transition-transform hover:text-foreground",
        open && "translate-x-full",
      )}
      aria-label="AI安全护栏"
    >
      <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
      <span className="text-xs tracking-[0.15em] [writing-mode:vertical-rl]">AI安全护栏</span>
      <StatusDot />
    </button>
  );
}

function GuardrailDrawer({guardrail, open, onClose}: {guardrail: GuardrailInfo; open: boolean; onClose: () => void}) {
  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-black/20 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside
        role="dialog"
        aria-label={guardrail.name}
        className={cn("absolute inset-y-0 right-0 flex w-[340px] max-w-[88vw] flex-col border-l bg-card text-card-foreground shadow-xl transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")}
      >
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <GuardrailLogo guardrail={guardrail} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{guardrail.name}</div>
            {guardrail.owner ? <div className="mt-0.5 text-xs text-muted-foreground">{guardrail.owner}</div> : null}
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <StatusDot />
            防护中
          </span>
          <button type="button" onClick={onClose} className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="text-xs text-muted-foreground">本平台受防护的 AI 功能</div>
          <ul className="mt-2 space-y-2">
            {features.map((feature) => (
              <li key={feature.name} className="rounded-md bg-muted/60 px-3 py-2.5">
                <div className="text-sm font-medium">{feature.name}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {feature.layers.map((id) => {
                    const layer = layers[id];
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs text-foreground/80">
                        <layer.icon className="h-3 w-3 text-muted-foreground" />
                        {layer.name}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 text-xs text-muted-foreground">防护内容</div>
          <ul className="mt-1 divide-y">
            {allLayers.map((id) => {
              const layer = layers[id];
              return (
                <li key={id} className="flex gap-3 py-3">
                  <layer.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm font-medium">
                      {layer.name}
                      <span className="text-xs font-normal text-emerald-600">已启用</span>
                    </div>
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {layer.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t px-5 py-3 text-center text-xs text-muted-foreground">
          由{guardrail.owner}{guardrail.name}提供安全防护
        </div>
      </aside>
    </div>
  );
}

/** a small "Protected by" seal for the footer */
export function GuardrailSeal({className}: {className?: string}) {
  const {guardrail, setOpen} = React.useContext(GuardrailContext);
  if (!guardrail) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn("inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground", className)}
      aria-label={guardrail.name}
    >
      <GuardrailLogo guardrail={guardrail} className="h-7 w-7 p-px" />
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-medium uppercase tracking-[0.2em] opacity-60">Protected by</span>
        <span className="mt-1 text-[13px] font-semibold tracking-wide">{guardrail.name}</span>
      </span>
    </button>
  );
}

const categoryLabels: Record<string, string> = {
  prompt_injection: "提示词注入",
  jailbreak: "越狱攻击",
  prompt_leak: "套取系统设定",
  self_harm: "自伤自杀相关内容",
  harmful: "有害或违规内容",
  minor_unsafe: "不适合未成年人的内容",
};

const maskLabels: Record<string, string> = {phone: "手机号", id_card: "身份证号", secret: "密钥"};

function describeGuardrailTag(tag: string, name: string) {
  const [stage, value = ""] = tag.split(":");
  if (stage === "masked") {
    const kinds = Array.from(new Set(value.split(",").filter(Boolean))).map((kind) => maskLabels[kind] ?? kind);
    return `${name}已对${kinds.join("、")}脱敏`;
  }
  const label = categoryLabels[value] ?? value;
  return stage === "output" ? `${name}已撤回回答：${label}` : `${name}已拦截：${label}`;
}

/** under a chat message: the AI-generated label, and what the guardrail did to this message */
export function GuardrailMessageNote({message, className}: {message: any; className?: string}) {
  const {guardrail, setOpen} = React.useContext(GuardrailContext);
  if (!guardrail) {
    return null;
  }
  const isAi = message.author === "AI";
  const action = message.guardrail ? describeGuardrailTag(message.guardrail, guardrail.name) : "";
  if (!isAi && !action) {
    return null;
  }
  return (
    <button type="button" onClick={() => setOpen(true)} className={cn("inline-flex items-center gap-1 px-1 text-[11px] text-muted-foreground/80 hover:text-foreground", className)}>
      <ShieldCheck className="h-3 w-3" strokeWidth={1.75} />
      {[isAi ? "内容由 AI 生成" : "", action].filter(Boolean).join("，")}
    </button>
  );
}

/** one line under the chat input: which protections cover the chat */
export function GuardrailNote({className}: {className?: string}) {
  const {guardrail, setOpen} = React.useContext(GuardrailContext);
  if (!guardrail) {
    return null;
  }
  return (
    <div className={cn("flex justify-center", className)}>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
        {guardrail.name}：{noteLayers.map((id) => layers[id].name).join("、")}
      </button>
    </div>
  );
}
