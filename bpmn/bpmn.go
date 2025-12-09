// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package bpmn

import (
	"encoding/xml"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/casibase/casibase/i18n"
)

type Definitions struct {
	XMLName   xml.Name  `xml:"definitions"`
	Processes []Process `xml:"process"`
}

type Process struct {
	XMLName      xml.Name      `xml:"process"`
	ID           string        `xml:"id,attr"`
	Name         string        `xml:"name,attr,omitempty"`
	FlowElements []FlowElement `xml:",any"`
}

type Task struct {
	XMLName xml.Name `xml:"task"`
	ID      string   `xml:"id,attr"`
	Name    string   `xml:"name,attr"`
}

type FlowElement struct {
	XMLName           xml.Name
	ID                string               `xml:"id,attr"`
	Name              string               `xml:"name,attr,omitempty"`
	SourceRef         string               `xml:"sourceRef,attr,omitempty"`
	TargetRef         string               `xml:"targetRef,attr,omitempty"`
	ExtensionElements *ExtensionElements   `xml:"extensionElements,omitempty"`
}

type ExtensionElements struct {
	Weight *WeightElement `xml:"weight,omitempty"`
}

type WeightElement struct {
	Value float64 `xml:"value,attr"`
}

type SequenceFlow struct {
	XMLName             xml.Name `xml:"sequenceFlow"`
	ID                  string   `xml:"id,attr"`
	SourceRef           string   `xml:"sourceRef,attr"`
	TargetRef           string   `xml:"targetRef,attr"`
	ConditionExpression string   `xml:"conditionExpression,omitempty"`
	Weight              float64
}

type PathNode struct {
	Task           Task
	Next           []*PathNode
	Concurrent     []*PathNode
	IsMandatory    bool
	Delay          int
	ActualExecTime time.Time
}

func NewPathNode(task Task, isMandatory bool, delay int) *PathNode {
	return &PathNode{
		Task:        task,
		IsMandatory: isMandatory,
		Next:        []*PathNode{},
		Concurrent:  []*PathNode{},
		Delay:       delay,
	}
}

func (pn *PathNode) AddNext(next *PathNode) {
	pn.Next = append(pn.Next, next)
}

func (pn *PathNode) AddConcurrent(concurrent *PathNode) {
	pn.Concurrent = append(pn.Concurrent, concurrent)
}

func PathToString(node *PathNode, indent string) string {
	if node == nil {
		return ""
	}

	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("%sTask: %s (Name: %s, Delay: %d days, Executed at: %v)\n", indent, node.Task.ID, node.Task.Name, node.Delay, node.ActualExecTime))

	indent += "    "

	if len(node.Concurrent) > 0 {
		for _, concurrent := range node.Concurrent {
			sb.WriteString(fmt.Sprintf("%sConcurrent Task:\n", indent))
			sb.WriteString(PathToString(concurrent, indent+"    "))
		}
	}

	for _, next := range node.Next {
		sb.WriteString(PathToString(next, indent))
	}
	return sb.String()
}

func ParseBPMN(bpmnText string, lang string) (map[string]Task, map[string][]SequenceFlow, map[string]bool, map[string]bool, map[string]int, []string, error) {
	bytes := []byte(bpmnText)
	var definitions Definitions
	err := xml.Unmarshal(bytes, &definitions)
	if err != nil {
		return nil, nil, nil, nil, nil, nil, fmt.Errorf(i18n.Translate(lang, "bpmn:Error parsing BPMN file: %v"), err)
	}

	tasks := map[string]Task{}
	sequenceFlows := map[string][]SequenceFlow{}
	exclusiveGateways := map[string]bool{}
	parallelGateways := map[string]bool{}
	timerEvents := map[string]int{}
	startEvents := []string{}

	for _, process := range definitions.Processes {
		for _, flowElement := range process.FlowElements {
			switch flowElement.XMLName.Local {
			case "task":
				tasks[flowElement.ID] = Task{ID: flowElement.ID, Name: flowElement.Name}
			case "startEvent", "endEvent", "intermediateCatchEvent", "intermediateThrowEvent":
				defaultName := "Event"
				if flowElement.Name != "" {
					defaultName = flowElement.Name
				}
				tasks[flowElement.ID] = Task{ID: flowElement.ID, Name: defaultName}
				if flowElement.XMLName.Local == "startEvent" {
					startEvents = append(startEvents, flowElement.ID)
				}
			case "sequenceFlow":
				sourceRef := flowElement.SourceRef
				targetRef := flowElement.TargetRef
				weight := 1.0
				if flowElement.ExtensionElements != nil && flowElement.ExtensionElements.Weight != nil {
					weight = flowElement.ExtensionElements.Weight.Value
				}
				seqFlow := SequenceFlow{
					ID:                  flowElement.ID,
					SourceRef:           sourceRef,
					TargetRef:           targetRef,
					ConditionExpression: flowElement.Name,
					Weight:              weight,
				}
				sequenceFlows[sourceRef] = append(sequenceFlows[sourceRef], seqFlow)
			case "exclusiveGateway", "parallelGateway":
				tasks[flowElement.ID] = Task{ID: flowElement.ID, Name: flowElement.XMLName.Local}
				if flowElement.XMLName.Local == "exclusiveGateway" {
					exclusiveGateways[flowElement.ID] = true
				} else if flowElement.XMLName.Local == "parallelGateway" {
					parallelGateways[flowElement.ID] = true
				}
			case "timerEventDefinition":
				var days int
				fmt.Sscanf(flowElement.Name, "P%dD", &days)
				timerEvents[flowElement.ID] = days
			}
		}
	}

	return tasks, sequenceFlows, exclusiveGateways, parallelGateways, timerEvents, startEvents, nil
}

func evaluateCondition(condition string, variables map[string]float64) bool {
	condition = strings.ReplaceAll(condition, "&lt;", "<")
	condition = strings.ReplaceAll(condition, "&gt;", ">")
	condition = strings.ReplaceAll(condition, "&amp;&amp;", "&&")
	condition = strings.ReplaceAll(condition, "${", "")
	condition = strings.ReplaceAll(condition, "}", "")

	re := regexp.MustCompile(`([a-zA-Z_]+)\s*([<>=!]+)\s*([a-zA-Z0-9._]+)`)
	matches := re.FindAllStringSubmatch(condition, -1)

	for _, match := range matches {
		varName := match[1]
		operator := match[2]
		thresholdStr := match[3]

		var threshold float64
		if val, ok := variables[thresholdStr]; ok {
			threshold = val
		} else {
			parsedThreshold, err := strconv.ParseFloat(thresholdStr, 64)
			if err != nil {
				return false
			}
			threshold = parsedThreshold
		}

		actualValue, exists := variables[varName]
		if !exists {
			// fmt.Printf("Variable %s not found in provided data.\n", varName)
			return false
		}

		switch operator {
		case "<":
			if !(actualValue < threshold) {
				return false
			}
		case ">":
			if !(actualValue > threshold) {
				return false
			}
		case "==":
			if !(actualValue == threshold) {
				return false
			}
		case "<=":
			if !(actualValue <= threshold) {
				return false
			}
		case ">=":
			if !(actualValue >= threshold) {
				return false
			}
		case "!=":
			if !(actualValue != threshold) {
				return false
			}
		}
	}

	return true
}

func buildPaths(currentTask string, tasks map[string]Task, sequenceFlows map[string][]SequenceFlow, exclusiveGateways map[string]bool, parallelGateways map[string]bool, timerEvents map[string]int, variables map[string]float64) []*PathNode {
	visited := make(map[string]bool)
	return buildPathsHelper(currentTask, tasks, sequenceFlows, exclusiveGateways, parallelGateways, timerEvents, variables, visited)
}

func buildPathsHelper(currentTask string, tasks map[string]Task, sequenceFlows map[string][]SequenceFlow, exclusiveGateways map[string]bool, parallelGateways map[string]bool, timerEvents map[string]int, variables map[string]float64, visited map[string]bool) []*PathNode {
	if visited[currentTask] {
		// fmt.Printf("Task %s already visited, skipping to avoid loop\n", currentTask)
		return nil
	}

	visited[currentTask] = true
	task, exists := tasks[currentTask]
	if !exists {
		// fmt.Printf("Task %s not found in task list\n", currentTask)
		return nil
	}

	// fmt.Printf("Building paths for task: %s (Name: %s)\n", task.ID, task.Name)

	delay := timerEvents[currentTask]
	currentNode := NewPathNode(task, true, delay)

	nextFlows, hasNext := sequenceFlows[currentTask]
	if !hasNext {
		// fmt.Printf("No outgoing sequence flows for task %s\n", task.Name)
		return []*PathNode{currentNode}
	}

	var allPaths []*PathNode

	if _, isExclusiveGateway := exclusiveGateways[currentTask]; isExclusiveGateway {
		// fmt.Printf("Evaluating exclusive gateway for task: %s (Name: %s)\n", task.ID, task.Name)
		for _, flow := range nextFlows {
			// fmt.Printf("Evaluating condition: %s for flow to %s\n", flow.ConditionExpression, flow.TargetRef)
			if evaluateCondition(flow.ConditionExpression, variables) {
				// fmt.Printf("Condition met, choosing path to %s (Condition: %s)\n", flow.TargetRef, flow.ConditionExpression)
				newVisited := make(map[string]bool)
				newPath := buildPathsHelper(flow.TargetRef, tasks, sequenceFlows, exclusiveGateways, parallelGateways, timerEvents, variables, newVisited)
				for _, path := range newPath {
					pathWithStart := NewPathNode(task, true, delay)
					pathWithStart.AddNext(path)
					allPaths = append(allPaths, pathWithStart)
				}
			} else {
				// fmt.Printf("Condition not met: %s (Condition: %s)\n", flow.TargetRef, flow.ConditionExpression)
			}
		}
	} else if _, isParallelGateway := parallelGateways[currentTask]; isParallelGateway {
		// fmt.Printf("Evaluating parallel gateway for task: %s (Name: %s)\n", task.ID, task.Name)
		var concurrentPaths []*PathNode
		for _, flow := range nextFlows {
			nextNode := buildPathsHelper(flow.TargetRef, tasks, sequenceFlows, exclusiveGateways, parallelGateways, timerEvents, variables, visited)
			if len(nextNode) > 0 {
				concurrentPaths = append(concurrentPaths, nextNode...)
			}
		}
		currentNode.Concurrent = concurrentPaths
		allPaths = append(allPaths, currentNode)
	} else {
		// fmt.Printf("Following sequence flow for task: %s (Name: %s)\n", task.ID, task.Name)
		for _, flow := range nextFlows {
			nextNodes := buildPathsHelper(flow.TargetRef, tasks, sequenceFlows, exclusiveGateways, parallelGateways, timerEvents, variables, visited)
			for _, nextNode := range nextNodes {
				currentNode.AddNext(nextNode)
			}
		}
		allPaths = append(allPaths, currentNode)
	}

	return allPaths
}

func ComparePaths(standardPath, actualPath *PathNode, variance *int, mandatoryTasks map[string]bool, variances *strings.Builder) {
	if standardPath == nil && actualPath == nil {
		return
	}

	if standardPath == nil {
		variances.WriteString(fmt.Sprintf("差异：发现额外的实际任务 %s\n", actualPath.Task.Name))
		*variance++
		return
	}

	if actualPath == nil {
		variances.WriteString(fmt.Sprintf("差异：实际路径中缺少任务 %s\n", standardPath.Task.Name))
		*variance++
		return
	}

	// 只在任务名称或ID不匹配时计算一次差异
	if standardPath.Task.Name != actualPath.Task.Name || standardPath.Task.ID != actualPath.Task.ID {
		variances.WriteString(fmt.Sprintf("检测到差异：任务 %s 与实际任务 %s 不匹配\n", standardPath.Task.Name, actualPath.Task.Name))
		*variance++
	}

	// 检查执行时间差异
	if !actualPath.ActualExecTime.IsZero() {
		if standardPath.Delay > 0 {
			expectedExecTime := standardPath.ActualExecTime.Add(time.Duration(standardPath.Delay) * 24 * time.Hour)
			if actualPath.ActualExecTime.Before(expectedExecTime) {
				variances.WriteString(fmt.Sprintf("差异：任务 %s 执行过早\n", actualPath.Task.Name))
				*variance++
			} else if actualPath.ActualExecTime.After(expectedExecTime) {
				variances.WriteString(fmt.Sprintf("差异：任务 %s 执行过晚\n", actualPath.Task.Name))
				*variance++
			}
		} else if actualPath.ActualExecTime.After(standardPath.ActualExecTime) {
			variances.WriteString(fmt.Sprintf("差异：任务 %s 执行晚于预期\n", actualPath.Task.Name))
			*variance++
		}
	}

	// 检查并行任务数量差异
	if len(standardPath.Concurrent) != len(actualPath.Concurrent) {
		variances.WriteString(fmt.Sprintf("差异：并行任务数量不匹配（期望%d个，实际发现%d个）\n", len(standardPath.Concurrent), len(actualPath.Concurrent)))
		*variance++
	}

	// 递归比较并行任务
	maxConcurrent := len(standardPath.Concurrent)
	if len(actualPath.Concurrent) > maxConcurrent {
		maxConcurrent = len(actualPath.Concurrent)
	}
	for i := 0; i < maxConcurrent; i++ {
		var stdConcurrent, actualConcurrent *PathNode
		if i < len(standardPath.Concurrent) {
			stdConcurrent = standardPath.Concurrent[i]
		}
		if i < len(actualPath.Concurrent) {
			actualConcurrent = actualPath.Concurrent[i]
		}
		ComparePaths(stdConcurrent, actualConcurrent, variance, mandatoryTasks, variances)
	}

	// 递归比较下一个任务
	maxNext := len(standardPath.Next)
	if len(actualPath.Next) > maxNext {
		maxNext = len(actualPath.Next)
	}
	for i := 0; i < maxNext; i++ {
		var stdNext, actualNext *PathNode
		if i < len(standardPath.Next) {
			stdNext = standardPath.Next[i]
		}
		if i < len(actualPath.Next) {
			actualNext = actualPath.Next[i]
		}
		ComparePaths(stdNext, actualNext, variance, mandatoryTasks, variances)
	}
}


// ParseResult represents intermediate parsed data for structure comparison
type ParseResult struct {
	Tasks             map[string]Task
	SequenceFlows     map[string][]SequenceFlow
	ExclusiveGateways map[string]bool
	ParallelGateways  map[string]bool
	TimerEvents       map[string]int
	StartEvents       []string
}

// Connection records logical connections for comparison
type Connection struct {
	SourceName string
	TargetName string
}

// VarianceResult collects comparison details
type VarianceResult struct {
	VarianceCount int
	VarianceScore float64
	Details       []string
}

// BPMNParser parses BPMN XML text into simplified structures for structure comparison
type BPMNParser struct{}

// NewBPMNParser constructs a parser instance
func NewBPMNParser() *BPMNParser {
	return &BPMNParser{}
}

// Parse consumes BPMN XML content and returns ParseResult
func (p *BPMNParser) Parse(bpmnText string) (*ParseResult, error) {
	var definitions Definitions
	if err := xml.Unmarshal([]byte(bpmnText), &definitions); err != nil {
		return nil, fmt.Errorf("error parsing BPMN content: %w", err)
	}

	result := &ParseResult{
		Tasks:             make(map[string]Task),
		SequenceFlows:     make(map[string][]SequenceFlow),
		ExclusiveGateways: make(map[string]bool),
		ParallelGateways:  make(map[string]bool),
		TimerEvents:       make(map[string]int),
		StartEvents:       []string{},
	}

	for _, process := range definitions.Processes {
		p.parseProcess(process, result)
	}

	return result, nil
}

func (p *BPMNParser) parseProcess(process Process, result *ParseResult) {
	for _, flowElement := range process.FlowElements {
		switch flowElement.XMLName.Local {
		case "task":
			result.Tasks[flowElement.ID] = Task{ID: flowElement.ID, Name: flowElement.Name}
		case "startEvent", "endEvent", "intermediateCatchEvent", "intermediateThrowEvent":
			defaultName := "Event"
			if flowElement.Name != "" {
				defaultName = flowElement.Name
			}
			result.Tasks[flowElement.ID] = Task{ID: flowElement.ID, Name: defaultName}
			if flowElement.XMLName.Local == "startEvent" {
				result.StartEvents = append(result.StartEvents, flowElement.ID)
			}
		case "sequenceFlow":
			weight := 1.0
			if flowElement.ExtensionElements != nil && flowElement.ExtensionElements.Weight != nil {
				weight = flowElement.ExtensionElements.Weight.Value
			}
			seqFlow := SequenceFlow{
				ID:                  flowElement.ID,
				SourceRef:           flowElement.SourceRef,
				TargetRef:           flowElement.TargetRef,
				ConditionExpression: flowElement.Name,
				Weight:              weight,
			}
			result.SequenceFlows[flowElement.SourceRef] = append(result.SequenceFlows[flowElement.SourceRef], seqFlow)
		case "exclusiveGateway", "parallelGateway", "inclusiveGateway":
			result.Tasks[flowElement.ID] = Task{ID: flowElement.ID, Name: flowElement.XMLName.Local}
			if flowElement.XMLName.Local == "exclusiveGateway" {
				result.ExclusiveGateways[flowElement.ID] = true
			} else if flowElement.XMLName.Local == "parallelGateway" {
				result.ParallelGateways[flowElement.ID] = true
			}
		case "timerEventDefinition":
			var days int
			fmt.Sscanf(flowElement.Name, "P%dD", &days)
			result.TimerEvents[flowElement.ID] = days
		}
	}
}

// ExtractTaskNames returns task name set excluding gateways/events
func ExtractTaskNames(tasks map[string]Task) map[string]bool {
	taskNames := make(map[string]bool)
	for _, task := range tasks {
		if !strings.HasSuffix(task.Name, "Gateway") &&
			task.Name != "startEvent" &&
			task.Name != "endEvent" &&
			task.Name != "Event" {
			taskNames[task.Name] = true
		}
	}
	return taskNames
}

// ExtractConnections builds logical connections from flows
func ExtractConnections(tasks map[string]Task, sequenceFlows map[string][]SequenceFlow) map[Connection]bool {
	connections := make(map[Connection]bool)
	for sourceID, flows := range sequenceFlows {
		sourceTask, ok := tasks[sourceID]
		if !ok {
			continue
		}
		for _, flow := range flows {
			targetTask, ok := tasks[flow.TargetRef]
			if !ok {
				continue
			}
			conn := Connection{
				SourceName: sourceTask.Name,
				TargetName: targetTask.Name,
			}
			connections[conn] = true
		}
	}
	return connections
}

// StructureComparator compares BPMN structures
type StructureComparator struct{}

// NewStructureComparator constructs a StructureComparator
func NewStructureComparator() *StructureComparator {
	return &StructureComparator{}
}

// CompareStructures compares tasks and flows of two BPMN processes
func (sc *StructureComparator) CompareStructures(
	standardTasks map[string]Task,
	standardFlows map[string][]SequenceFlow,
	actualTasks map[string]Task,
	actualFlows map[string][]SequenceFlow,
) *VarianceResult {
	result := &VarianceResult{
		VarianceCount: 0,
		VarianceScore: 0.0,
		Details:       []string{},
	}

	standardTaskNames := ExtractTaskNames(standardTasks)
	actualTaskNames := ExtractTaskNames(actualTasks)

	for taskName := range standardTaskNames {
		if !actualTaskNames[taskName] {
			result.VarianceCount++
			result.VarianceScore += 1.0
			detail := fmt.Sprintf("差异#%d: 文件2中缺失任务: %s", result.VarianceCount, taskName)
			result.Details = append(result.Details, detail)
		}
	}

	for taskName := range actualTaskNames {
		if !standardTaskNames[taskName] {
			result.VarianceCount++
			result.VarianceScore += 1.0
			detail := fmt.Sprintf("差异#%d: 文件2中额外任务: %s", result.VarianceCount, taskName)
			result.Details = append(result.Details, detail)
		}
	}

	totalFlows1 := 0
	for _, flows := range standardFlows {
		totalFlows1 += len(flows)
	}
	totalFlows2 := 0
	for _, flows := range actualFlows {
		totalFlows2 += len(flows)
	}

	if totalFlows1 != totalFlows2 {
		info := fmt.Sprintf("[信息] 流数量差异: 文件1有%d个流，文件2有%d个流", totalFlows1, totalFlows2)
		result.Details = append(result.Details, info)
	}

	standardConnections := ExtractConnections(standardTasks, standardFlows)
	actualConnections := ExtractConnections(actualTasks, actualFlows)

	for conn := range standardConnections {
		if !actualConnections[conn] {
			result.VarianceCount++
			result.VarianceScore += 0.8
			detail := fmt.Sprintf("差异#%d: 文件2中缺失连接: %s -> %s",
				result.VarianceCount, conn.SourceName, conn.TargetName)
			result.Details = append(result.Details, detail)
		}
	}

	for conn := range actualConnections {
		if !standardConnections[conn] {
			result.VarianceCount++
			result.VarianceScore += 0.8
			detail := fmt.Sprintf("差异#%d: 文件2中额外连接: %s -> %s",
				result.VarianceCount, conn.SourceName, conn.TargetName)
			result.Details = append(result.Details, detail)
		}
	}

	return result
}

func formatVarianceResult(v *VarianceResult) string {
	if v == nil {
		return "无差异信息"
	}

	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("差异数量: %d\n", v.VarianceCount))
	builder.WriteString(fmt.Sprintf("差异得分: %.2f\n", v.VarianceScore))

	if len(v.Details) == 0 {
		builder.WriteString("详细信息: 无\n")
		return builder.String()
	}

	builder.WriteString("详细信息:\n")
	for idx, detail := range v.Details {
		builder.WriteString(fmt.Sprintf("- %d. %s\n", idx+1, detail))
	}

	return builder.String()
}
func ComparePath(standardBpmnText string, unknownBpmnText string, lang string) string {
	parser := NewBPMNParser()
	result1, err := parser.Parse(standardBpmnText)
	if err != nil {
		return fmt.Sprintf("解析标准BPMN文件时出错：%v", err)
	}

	result2, err := parser.Parse(unknownBpmnText)
	if err != nil {
		return fmt.Sprintf("解析待比较BPMN文件时出错：%v", err)
	}

	comparator := NewStructureComparator()
	variance := comparator.CompareStructures(result1.Tasks, result1.SequenceFlows, result2.Tasks, result2.SequenceFlows)

	resultText := formatVarianceResult(variance)
	return resultText
}
