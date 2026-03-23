// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

package object

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/beego/beego/logs"
)

const analyzeTaskPrompt = `请对以下教学设计文本进行深度分析，根据提供的评价量表对每个二级评价项进行评分和详细分析。

评分要求：每个二级评价项的得分必须在 60-100 分之间（整数）。请根据达成程度在该区间内给分：表现较好给高分（80-100），一般给中分（70-79），有待改进给较低分（60-69），以更好区分不同水平的教学设计。

评价量表：
%s

教学设计文本：
%s

请严格按照以下JSON格式返回分析结果，不要包含任何其他内容，只返回合法的JSON：
{
  "title": "从文档中提取的课题/单元名称",
  "designer": "从文档中提取的设计/实施者姓名或团队",
  "stage": "从文档中提取的学段（如：小学、初中、高中）",
  "participants": "从文档中提取的参与者描述",
  "grade": "从文档中提取的年级",
  "instructor": "从文档中提取的指导教师姓名",
  "subject": "从文档中提取的学科",
  "school": "从文档中提取的学校名称",
  "otherSubjects": "从文档中提取的其他相关领域或学科（逗号分隔）",
  "textbook": "从文档中提取的主要教材信息",
  "score": 所有二级评价项得分的平均值（保留一位小数的数字，不是字符串）,
  "categories": [
    {
      "name": "一级评价项名称",
      "score": 该类别下所有二级评价项得分的平均值（保留两位小数的数字）,
      "items": [
        {
          "name": "二级评价项名称",
          "score": 该项得分（0-100的整数）,
          "advantage": "优点分析（详细说明教学设计在该项的优势和亮点）",
          "disadvantage": "不足分析（详细说明教学设计在该项存在的问题和不足）",
          "suggestion": "改进建议（提供具体可操作的改进措施和建议）"
        }
      ]
    }
  ]
}`

func AnalyzeTask(task *Task, lang string) (*TaskResult, error) {
	taskID := task.GetId()
	logs.Info("[analyze-task] start task=%s provider=%s lang=%s", taskID, task.Provider, lang)

	effectiveScale, err := GetTaskEffectiveScale(task)
	if err != nil {
		logs.Error("[analyze-task] GetTaskEffectiveScale failed task=%s: %v", taskID, err)
		return nil, err
	}
	if effectiveScale == "" {
		return nil, fmt.Errorf("任务量表不能为空")
	}
	scaleRunes := utf8.RuneCountInString(effectiveScale)
	logs.Info("[analyze-task] rubric loaded task=%s scaleRef=%s rubricLen=%d runes", taskID, task.Scale, scaleRunes)

	if task.DocumentText == "" {
		return nil, fmt.Errorf("任务文档不能为空，请先上传文档")
	}
	docRunes := utf8.RuneCountInString(task.DocumentText)
	logs.Info("[analyze-task] document ready task=%s documentLen=%d runes", taskID, docRunes)

	question := fmt.Sprintf(analyzeTaskPrompt, effectiveScale, task.DocumentText)
	promptRunes := utf8.RuneCountInString(question)
	logs.Info("[analyze-task] prompt built task=%s fullPromptLen=%d runes (rubric+template+document)", taskID, promptRunes)

	var answer string
	aiStart := time.Now()
	if strings.Contains(strings.ToLower(task.Name), "demo") {
		logs.Info("[analyze-task] using GetAnswerFake (task name contains \"demo\") task=%s", taskID)
		answer, _, err = GetAnswerFake(task.Provider, question, lang)
	} else {
		logs.Info("[analyze-task] calling AI model task=%s provider=%s (this may take several minutes)...", taskID, task.Provider)
		answer, _, err = GetAnswer(task.Provider, question, lang)
	}
	aiElapsed := time.Since(aiStart)
	if err != nil {
		logs.Error("[analyze-task] AI call failed task=%s after %v: %v", taskID, aiElapsed, err)
		return nil, fmt.Errorf("从AI模型获取分析失败: %v", err)
	}
	logs.Info("[analyze-task] AI returned task=%s elapsed=%v answerLen=%d bytes", taskID, aiElapsed, len(answer))

	answer = strings.TrimSpace(answer)
	// Strip markdown code block if present
	if strings.HasPrefix(answer, "```json") {
		answer = strings.TrimPrefix(answer, "```json")
		answer = strings.TrimSuffix(answer, "```")
		answer = strings.TrimSpace(answer)
	} else if strings.HasPrefix(answer, "```") {
		answer = strings.TrimPrefix(answer, "```")
		answer = strings.TrimSuffix(answer, "```")
		answer = strings.TrimSpace(answer)
	}

	logs.Info("[analyze-task] parsing JSON task=%s bodyLen=%d bytes", taskID, len(answer))
	var result TaskResult
	if err = json.Unmarshal([]byte(answer), &result); err != nil {
		logs.Error("[analyze-task] JSON unmarshal failed task=%s: %v", taskID, err)
		return nil, fmt.Errorf("解析AI分析结果为JSON失败: %v\n原始回复: %s", err, answer)
	}

	logs.Info("[analyze-task] done task=%s score=%.2f categories=%d", taskID, result.Score, len(result.Categories))
	return &result, nil
}
