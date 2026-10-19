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

package guardrail

import (
	"regexp"
	"strings"
	"unicode"
)

type rule struct {
	category string
	re       *regexp.Regexp
}

// Chinese rules run on the text with all whitespace removed, so "忽 略 以 上" still matches.
// Each one has to name the AI or its setup: "忽略前面的要求" is how users correct
// their own earlier request, "忽略你的系统设定" is an attack.
var compactRules = []rule{
	{CategoryPromptInjection, regexp.MustCompile(`(忽略|无视|忘记|忘掉|不要理会|抛开|丢掉|丢弃|作废)(掉)?(你)?(之前|以前|先前|上面|以上|前面|上述|原来|原有|原先|最初)?(收到|接收|被设定|被赋予)?的?(所有|全部|一切|任何)的?(指令|指示|命令|设定|规则|提示词|约束|限制|安全策略)`)},
	{CategoryPromptInjection, regexp.MustCompile(`(忽略|无视|忘记|忘掉|不要理会|抛开|丢掉|丢弃|作废)(掉)?(你的|你)?(系统|开发者|初始|原始|预设|内置)的?(指令|指示|命令|设定|规则|提示词|提示|约束|限制|人设|角色|安全策略)`)},
	{CategoryPromptInjection, regexp.MustCompile(`(忽略|无视|忘记|忘掉|抛开|丢掉)(掉)?你(的|原来的|现在的)(设定|人设|角色设定|规则|身份设定|限制|约束)`)},
	{CategoryPromptInjection, regexp.MustCompile(`(以下|下面|接下来)(是|为)?(新的|最新的|更高优先级的)?系统(指令|设定|提示词|消息)`)},
	{CategoryPromptInjection, regexp.MustCompile(`(我是|我就是|本人是)(你的)?(开发者|开发人员|系统管理员|创造者)[,，。:：]?(现在|命令你|要求你|授权你)`)},
	{CategoryJailbreak, regexp.MustCompile(`(进入|开启|启用|激活|切换到|切换为)(了)?(越狱|上帝|无限制|无审查|dan)模式`)},
	{CategoryJailbreak, regexp.MustCompile(`你(现在)?(处于|进入了|已进入|已经进入)(越狱|开发者|上帝|无限制|无审查|dan)模式`)},
	{CategoryJailbreak, regexp.MustCompile(`你(现在|已经|将)?(是|变成|成为)?.{0,6}(没有|不受|摆脱了|解除了|无视)(任何)?(道德|伦理|安全|内容|审查)的?(限制|约束|审查|过滤|准则|底线)`)},
	{CategoryJailbreak, regexp.MustCompile(`(解除|绕过|突破|关闭|去掉|无视)你的(道德|伦理|安全|内容|审查)?(限制|约束|审查|过滤|机制|准则|底线)`)},
	{CategoryJailbreak, regexp.MustCompile(`(扮演|假装|你现在是|你就是|你变成|你将成为)(一个)?.{0,8}(没有|不受|不用遵守|无需遵守|不必遵守)(任何)?.{0,6}(限制|约束|审查|道德|规则)的?(ai|人工智能|助手|机器人|模型)`)},
	{CategoryJailbreak, regexp.MustCompile(`假装你(没有|不受)(任何)?.{0,4}(限制|约束|审查)`)},
	{CategoryJailbreak, regexp.MustCompile(`(扮演|假装|当).{0,12}(去世|过世|已故|死去)的?(奶奶|祖母|外婆|姥姥|爷爷|外公).{0,30}(哄我睡觉|讲给我听|念给我听|告诉我)`)},
	{CategoryPromptLeak, regexp.MustCompile(`(输出|告诉我|显示|打印|重复|复述|泄露|透露|给我看|展示|发给我|列出|念出|背出|贴出)(一下|一遍)?(你的|你)?(全部|完整|所有|原始|原本)?的?(系统提示词|systemprompt|初始指令|初始提示词|提示词原文|原始提示词|前置指令|隐藏指令|内部指令|预设指令)`)},
	{CategoryPromptLeak, regexp.MustCompile(`(系统提示词|systemprompt|初始指令|初始提示词|提示词原文|原始提示词|前置指令|隐藏指令|内部指令|预设指令)(原封不动|一字不差|完整|全部|逐字)?的?地?(输出|打印|复述|重复|发|贴|写|念|背)(出来|给我|一遍|一下)`)},
	{CategoryPromptLeak, regexp.MustCompile(`(你的|你被设定的|你收到的)(系统提示词|初始指令|systemprompt|隐藏指令|内部指令|预设指令)(是什么|有哪些|是啥|原文|全文|完整内容)`)},
	{CategoryPromptLeak, regexp.MustCompile(`(上面|以上|前面|之前)的?(所有|全部)?(内容|文字|文本|指令).{0,12}(从|以)["“'‘]?(你是|你叫|你扮演|#|system)`)},
}

// English rules run on lower-cased text with whitespace collapsed to single spaces.
var spacedRules = []rule{
	{CategoryPromptInjection, regexp.MustCompile(`\b(ignore|disregard|forget|override|bypass)\s+(all\s+|any\s+|the\s+|your\s+|of\s+)*(previous|prior|above|earlier|preceding|initial|original|system|developer)\s+(instructions?|prompts?|rules|directions|guidelines)\b`)},
	{CategoryPromptInjection, regexp.MustCompile(`(<\|im_start\|>|<\|im_end\|>|<\|system\|>|\[/?inst\]|<<\s*sys\s*>>|</?system>|<\|endoftext\|>)`)},
	{CategoryPromptInjection, regexp.MustCompile(`\bnew system (instructions?|prompt)\s*:`)},
	{CategoryJailbreak, regexp.MustCompile(`\b(do anything now|dan mode|jailbreak mode|jailbroken mode|enter developer mode|developer mode (enabled|activated)|you are (now )?in developer mode)\b`)},
	{CategoryJailbreak, regexp.MustCompile(`\byou (are|have|now have|will have) (no|zero) (ethical|moral|safety|content) (restrictions|guidelines|limits|filters|rules)\b`)},
	{CategoryJailbreak, regexp.MustCompile(`\bignore (all |any |your )?(ethical|moral|safety|content) (guidelines|restrictions|policies|rules|filters)\b`)},
	{CategoryJailbreak, regexp.MustCompile(`\bpretend (that )?you (are|have) (an? )?(ai |assistant )?(with )?(no|without) (restrictions|rules|limits|filters)\b`)},
	{CategoryPromptLeak, regexp.MustCompile(`\b(repeat|print|show|reveal|output|display|tell me|write out|leak)\s+(me\s+)?(your|the)\s+(full\s+|entire\s+|complete\s+|original\s+|initial\s+|hidden\s+|exact\s+)*(system\s+prompt|system\s+message|system\s+instructions|initial\s+prompt|initial\s+instructions|hidden\s+instructions)\b`)},
	{CategoryPromptLeak, regexp.MustCompile(`\bwhat (is|are|were) your (system prompt|system instructions|initial instructions|hidden instructions)\b`)},
}

// Text that only makes sense addressed to an AI reading it, when found inside a
// document, a knowledge chunk or a tool result.
var documentRules = []rule{
	{CategoryHiddenInstruction, regexp.MustCompile(`(如果你是|你作为|作为一个|致读到这段话的)(ai|人工智能|大模型|语言模型|ai助手|智能助手|聊天机器人).{0,30}(必须|务必|请你|应该|需要|不要|禁止)`)},
	{CategoryHiddenInstruction, regexp.MustCompile(`(ai|人工智能|大模型|语言模型|助手)(在)?(回答|总结|阅读|处理)(这|本)(份|篇|个)?(文档|文件|内容|资料|网页)时(必须|务必|请|应该|一定要)`)},
}

var spacedDocumentRules = []rule{
	{CategoryHiddenInstruction, regexp.MustCompile(`\b(if you are|as) an? (ai|language model|llm|assistant|chatbot)\b.{0,60}\b(must|should|ignore|instead|do not|don't)\b`)},
	{CategoryHiddenInstruction, regexp.MustCompile(`\bnote to (the )?(ai|assistant|llm|model)\b`)},
}

var spacePattern = regexp.MustCompile(`\s+`)

func normalize(text string) (compact string, spaced string) {
	var b strings.Builder
	b.Grow(len(text))
	for _, r := range text {
		if isInvisible(r) {
			continue
		}
		// full-width ASCII to half-width
		if r >= 0xFF01 && r <= 0xFF5E {
			r -= 0xFEE0
		} else if r == 0x3000 {
			r = ' '
		}
		b.WriteRune(unicode.ToLower(r))
	}
	spaced = strings.TrimSpace(spacePattern.ReplaceAllString(b.String(), " "))
	compact = spacePattern.ReplaceAllString(spaced, "")
	return compact, spaced
}

func matchRules(compact string, spaced string, compactSet []rule, spacedSet []rule) *Verdict {
	for _, r := range compactSet {
		if m := r.re.FindString(compact); m != "" {
			return &Verdict{Category: r.category, Reason: m, Source: "rule"}
		}
	}
	for _, r := range spacedSet {
		if m := r.re.FindString(spaced); m != "" {
			return &Verdict{Category: r.category, Reason: m, Source: "rule"}
		}
	}
	return nil
}

// DetectPromptAttack looks for prompt injection, jailbreak and system prompt
// extraction attempts in a user's message. Only patterns that leave little doubt
// are listed here; the review model handles everything subtler. It returns nil
// when nothing matches.
func DetectPromptAttack(text string) *Verdict {
	compact, spaced := normalize(text)
	return matchRules(compact, spaced, compactRules, spacedRules)
}

// DetectHiddenInstruction checks content the user did not type: an uploaded
// document, a knowledge base chunk or a tool result. Invisible characters used
// to smuggle text, instructions addressed to an AI and the prompt attack rules
// all count. It returns nil when nothing matches.
func DetectHiddenInstruction(text string) *Verdict {
	if count := countSmuggling(text); count > 0 {
		return &Verdict{Category: CategoryHiddenInstruction, Reason: "invisible characters", Source: "rule"}
	}
	compact, spaced := normalize(text)
	if v := matchRules(compact, spaced, documentRules, spacedDocumentRules); v != nil {
		return v
	}
	if v := matchRules(compact, spaced, compactRules, spacedRules); v != nil {
		v.Category = CategoryHiddenInstruction
		return v
	}
	return nil
}

func isInvisible(r rune) bool {
	switch {
	case r == 0x200B || r == 0x200C || r == 0x200D || r == 0x2060 || r == 0xFEFF || r == 0x00AD:
		return true
	case r >= 0x202A && r <= 0x202E, r >= 0x2066 && r <= 0x2069:
		return true
	case r >= 0xE0000 && r <= 0xE007F:
		return true
	}
	return false
}

// countSmuggling counts characters that only exist to hide text from a human
// reader: Unicode tag characters (which spell out ASCII invisibly) and runs of
// zero-width characters. A lone zero-width joiner in an emoji is fine.
func countSmuggling(text string) int {
	tags := 0
	run := 0
	longRuns := 0
	for _, r := range text {
		if r >= 0xE0000 && r <= 0xE007F {
			tags++
		}
		if r == 0x200B || r == 0x200C || r == 0x2060 || (r >= 0x202A && r <= 0x202E) || (r >= 0x2066 && r <= 0x2069) {
			run++
			if run == 4 {
				longRuns++
			}
		} else if r != 0x200D {
			run = 0
		}
	}
	if tags >= 4 {
		return tags
	}
	return longRuns
}
