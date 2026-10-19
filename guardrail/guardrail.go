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

// Package guardrail holds the content checks behind the site's AI guardrail:
// prompt attack rules, personal data masking, system prompt leak detection and
// the prompts of the review model. Like package guard it does not depend on
// OpenAgent, the host decides when to run each check and what to do with it.
package guardrail

const (
	CategorySafe              = "safe"
	CategoryPromptInjection   = "prompt_injection"
	CategoryJailbreak         = "jailbreak"
	CategoryPromptLeak        = "prompt_leak"
	CategorySelfHarm          = "self_harm"
	CategoryHarmful           = "harmful"
	CategoryMinorUnsafe       = "minor_unsafe"
	CategoryHiddenInstruction = "hidden_instruction"
)

var categoryLabels = map[string]string{
	CategoryPromptInjection:   "提示词注入",
	CategoryJailbreak:         "越狱攻击",
	CategoryPromptLeak:        "套取系统设定",
	CategorySelfHarm:          "自伤自杀相关内容",
	CategoryHarmful:           "有害或违规内容",
	CategoryMinorUnsafe:       "不适合未成年人的内容",
	CategoryHiddenInstruction: "隐藏指令",
}

func GetCategoryLabel(category string) string {
	if label, ok := categoryLabels[category]; ok {
		return label
	}
	return category
}

// Verdict is the outcome of one check. Source is "rule" or "model".
type Verdict struct {
	Category string `json:"category"`
	Reason   string `json:"reason"`
	Source   string `json:"source"`
}

func (v *Verdict) IsBlocked() bool {
	return v != nil && v.Category != "" && v.Category != CategorySafe
}
