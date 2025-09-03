package controllers

import (
	"encoding/json"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalKnowledgeGraphs
// @Title GetGlobalKnowledgeGraphs
// @Tag KnowledgeGraph API
// @Description get global knowledge graphs
// @Success 200 {array} object.KnowledgeGraph The Response object
// @router /get-global-knowledge-graphs [get]
func (c *ApiController) GetGlobalKnowledgeGraphs() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")
	store := c.Input().Get("store")

	if limit == "" || page == "" {
		knowledgeGraphs, err := object.GetGlobalKnowledgeGraphs()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(knowledgeGraphs)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetKnowledgeGraphCount("", field, value, store)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		knowledgeGraphs, err := object.GetPaginationKnowledgeGraphs("", paginator.Offset(), limit, field, value, sortField, sortOrder, store)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(knowledgeGraphs, paginator.Nums())
	}
}

// GetKnowledgeGraphs
// @Title GetKnowledgeGraphs
// @Tag KnowledgeGraph API
// @Description get knowledge graphs
// @Success 200 {array} object.KnowledgeGraph The Response object
// @router /get-knowledge-graphs [get]
func (c *ApiController) GetKnowledgeGraphs() {
	user := c.Input().Get("user")
	selectedUser := c.Input().Get("selectedUser")

	if c.IsAdmin() {
		user = ""
	}

	if selectedUser != "" && selectedUser != "null" && c.IsAdmin() {
		user = selectedUser
	}

	if !c.IsAdmin() && user != selectedUser && selectedUser != "" {
		c.ResponseError("You can only view your own knowledge graphs")
		return
	}

	var knowledgeGraphs []*object.KnowledgeGraph
	var err error

	if user == "" {
		knowledgeGraphs, err = object.GetGlobalKnowledgeGraphs()
	} else {
		knowledgeGraphs, err = object.GetKnowledgeGraphs(user)
	}

	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(knowledgeGraphs)
}

// GetKnowledgeGraph
// @Title GetKnowledgeGraph
// @Tag KnowledgeGraph API
// @Description get knowledge graph
// @Success 200 {object} object.KnowledgeGraph The Response object
// @router /get-knowledge-graph [get]
func (c *ApiController) GetKnowledgeGraph() {
	id := c.Input().Get("id")
	if id == "" {
		c.ResponseError("id is empty")
		return
	}

	knowledgeGraph, err := object.GetKnowledgeGraph(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if knowledgeGraph == nil {
		c.ResponseError("knowledge graph not found")
		return
	}

	c.ResponseOk(knowledgeGraph)
}

// UpdateKnowledgeGraph
// @Title UpdateKnowledgeGraph
// @Tag KnowledgeGraph API
// @Description update knowledge graph
// @Success 200 {object} controllers.Response The Response object
// @router /update-knowledge-graph [post]
func (c *ApiController) UpdateKnowledgeGraph() {
	id := c.Input().Get("id")
	if id == "" {
		c.ResponseError("id is empty")
		return
	}

	var knowledgeGraph object.KnowledgeGraph
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	knowledgeGraph.UpdatedTime = util.GetCurrentTime()

	success, err := object.UpdateKnowledgeGraph(id, &knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddKnowledgeGraph
// @Title AddKnowledgeGraph
// @Tag KnowledgeGraph API
// @Description add knowledge graph
// @Success 200 {object} controllers.Response The Response object
// @router /add-knowledge-graph [post]
func (c *ApiController) AddKnowledgeGraph() {
	var knowledgeGraph object.KnowledgeGraph
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	owner := c.GetSessionUsername()
	if owner == "" {
		c.ResponseError("not signed in")
		return
	}

	knowledgeGraph.Owner = owner
	knowledgeGraph.CreatedTime = util.GetCurrentTime()
	knowledgeGraph.UpdatedTime = util.GetCurrentTime()

	if knowledgeGraph.GraphType == "" {
		knowledgeGraph.GraphType = "force"
	}

	success, err := object.AddKnowledgeGraph(&knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteKnowledgeGraph
// @Title DeleteKnowledgeGraph
// @Tag KnowledgeGraph API
// @Description delete knowledge graph
// @Success 200 {object} controllers.Response The Response object
// @router /delete-knowledge-graph [post]
func (c *ApiController) DeleteKnowledgeGraph() {
	var knowledgeGraph object.KnowledgeGraph
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteKnowledgeGraph(&knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// GenerateKnowledgeGraph
// @Title GenerateKnowledgeGraph
// @Tag KnowledgeGraph API
// @Description generate knowledge graph data and analysis
// @Success 200 {object} controllers.Response The Response object
// @router /generate-knowledge-graph [get]
func (c *ApiController) GenerateKnowledgeGraph() {
	id := c.Input().Get("id")
	if id == "" {
		c.ResponseError("id is empty")
		return
	}

	knowledgeGraph, err := object.GetKnowledgeGraph(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if knowledgeGraph == nil {
		c.ResponseError("knowledge graph not found")
		return
	}

	graphData, analysis, err := c.generateGraphData(knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	graphDataJson, _ := json.Marshal(graphData)
	analysisJson, _ := json.Marshal(analysis)
	knowledgeGraph.GraphData = string(graphDataJson)
	knowledgeGraph.Analysis = string(analysisJson)
	knowledgeGraph.UpdatedTime = util.GetCurrentTime()

	success, err := object.UpdateKnowledgeGraph(id, knowledgeGraph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(map[string]interface{}{
		"success":   success,
		"graphData": graphData,
		"analysis":  analysis,
	})
}

func (c *ApiController) generateGraphData(knowledgeGraph *object.KnowledgeGraph) (object.GraphData, object.Analysis, error) {
	var graphData object.GraphData
	var analysis object.Analysis

	allMessages := []*object.Message{}

	for _, chatName := range knowledgeGraph.Chats {
		messages, err := object.GetChatMessages(chatName)
		if err != nil {
			continue
		}

		for _, msg := range messages {
			if len(knowledgeGraph.Users) == 0 || util.InSlice(knowledgeGraph.Users, msg.User) {
				allMessages = append(allMessages, msg)
			}
		}
	}

	if len(allMessages) == 0 {
		return graphData, analysis, nil
	}

	graphData = c.processMessagesToGraph(allMessages)
	analysis = c.calculateAnalysis(graphData)

	return graphData, analysis, nil
}

func (c *ApiController) processMessagesToGraph(messages []*object.Message) object.GraphData {
	nodeMap := make(map[string]*object.KnowledgeGraphNode)
	linkMap := make(map[string]*object.KnowledgeGraphLink)

	users := make(map[string]bool)
	for _, msg := range messages {
		if msg.User != "" {
			users[msg.User] = true
		}
	}

	for user := range users {
		nodeId := "user_" + user
		nodeMap[nodeId] = &object.KnowledgeGraphNode{
			ID:       nodeId,
			Name:     user,
			Category: 0,
			Value:    1,
			ItemStyle: object.ItemStyle{
				Color: "#1890ff",
			},
		}
	}

	topics := c.extractTopics(messages)
	entities := c.extractEntities(messages)

	usedWords := make(map[string]bool)

	for _, entity := range entities {
		normalizedName := strings.ToLower(entity.Name)
		if !usedWords[normalizedName] {
			nodeId := "entity_" + entity.Name
			usedWords[normalizedName] = true

			nodeMap[nodeId] = &object.KnowledgeGraphNode{
				ID:       nodeId,
				Name:     entity.Name,
				Category: 2,
				Value:    entity.Frequency,
				ItemStyle: object.ItemStyle{
					Color: "#fa8c16",
				},
			}
		}
	}

	for _, topic := range topics {
		normalizedName := strings.ToLower(topic.Name)
		if !usedWords[normalizedName] {
			nodeId := "topic_" + topic.Name
			usedWords[normalizedName] = true

			nodeMap[nodeId] = &object.KnowledgeGraphNode{
				ID:       nodeId,
				Name:     topic.Name,
				Category: 1,
				Value:    topic.Weight,
				ItemStyle: object.ItemStyle{
					Color: "#52c41a",
				},
			}
		}
	}

	for _, msg := range messages {
		userNodeId := "user_" + msg.User

		msgTopics := c.extractTopics([]*object.Message{msg})
		for _, topic := range msgTopics {
			topicNodeId := "topic_" + topic.Name

			if nodeMap[topicNodeId] != nil {
				linkId := userNodeId + "-" + topicNodeId

				if linkMap[linkId] == nil {
					linkMap[linkId] = &object.KnowledgeGraphLink{
						Source: userNodeId,
						Target: topicNodeId,
						Value:  1,
					}
				} else {
					linkMap[linkId].Value += 1
				}
			}
		}

		msgEntities := c.extractEntities([]*object.Message{msg})
		for _, entity := range msgEntities {
			entityNodeId := "entity_" + entity.Name

			if nodeMap[entityNodeId] != nil {
				linkId := userNodeId + "-" + entityNodeId

				if linkMap[linkId] == nil {
					linkMap[linkId] = &object.KnowledgeGraphLink{
						Source: userNodeId,
						Target: entityNodeId,
						Value:  1,
					}
				} else {
					linkMap[linkId].Value += 1
				}
			}
		}
	}

	nodes := make([]object.KnowledgeGraphNode, 0, len(nodeMap))
	for _, node := range nodeMap {
		nodes = append(nodes, *node)
	}

	links := make([]object.KnowledgeGraphLink, 0, len(linkMap))
	for _, link := range linkMap {
		links = append(links, *link)
	}

	return object.GraphData{
		Nodes: nodes,
		Links: links,
	}
}

func (c *ApiController) extractTopics(messages []*object.Message) []object.TopicWeight {
	topicMap := make(map[string]int)

	for _, msg := range messages {
		text := msg.Text
		if text == "" {
			continue
		}

		words := strings.Fields(text)
		for _, word := range words {
			cleanWord := strings.ToLower(strings.TrimSpace(word))
			if len(cleanWord) > 1 && !c.isStopWord(cleanWord) && !c.isNumeric(cleanWord) {
				topicMap[cleanWord]++
			}
		}
	}

	var topics []object.TopicWeight
	for name, weight := range topicMap {
		if weight > 1 {
			topics = append(topics, object.TopicWeight{
				Name:   name,
				Weight: weight,
			})
		}
	}

	sort.Slice(topics, func(i, j int) bool {
		return topics[i].Weight > topics[j].Weight
	})
	if len(topics) > 20 {
		topics = topics[:20]
	}

	return topics
}

func (c *ApiController) extractEntities(messages []*object.Message) []object.EntityFrequency {
	entityMap := make(map[string]int)

	for _, msg := range messages {
		text := msg.Text
		if text == "" {
			continue
		}

		entities := c.extractNamedEntities(text)
		for _, entity := range entities {
			cleanEntity := strings.TrimSpace(entity)
			if len(cleanEntity) > 1 && !c.isStopWord(strings.ToLower(cleanEntity)) && !c.isNumeric(cleanEntity) {
				normalizedEntity := strings.ToLower(cleanEntity)
				entityMap[normalizedEntity]++
			}
		}
	}

	var entities []object.EntityFrequency
	for name, frequency := range entityMap {
		if frequency > 1 {
			entities = append(entities, object.EntityFrequency{
				Name:      name,
				Frequency: frequency,
			})
		}
	}

	sort.Slice(entities, func(i, j int) bool {
		return entities[i].Frequency > entities[j].Frequency
	})
	if len(entities) > 15 {
		entities = entities[:15]
	}

	return entities
}

func (c *ApiController) extractNamedEntities(text string) []string {
	var entities []string

	patterns := []string{
		`[""]([^""]+)[""]`,
		`[""]([^""]+)[""]`,
		`\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b`,
		`([一-龯]{2,})`,
		`\b([A-Za-z]+\d+[A-Za-z]*)\b`,
		`\b(\d+[A-Za-z]+)\b`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllStringSubmatch(text, -1)
		for _, match := range matches {
			if len(match) > 1 {
				entities = append(entities, match[1])
			}
		}
	}

	return entities
}

func (c *ApiController) isStopWord(word string) bool {
	stopWords := map[string]bool{
		"a": true, "an": true, "the": true, "this": true, "that": true,
		"is": true, "are": true, "was": true, "were": true, "be": true,
		"of": true, "in": true, "on": true, "at": true, "by": true,
		"and": true, "or": true, "but": true, "nor": true,
		"i": true, "you": true, "he": true, "she": true, "it": true,
	}

	return stopWords[word] || len(word) <= 2
}

func (c *ApiController) isNumeric(word string) bool {
	_, err := strconv.Atoi(word)
	return err == nil
}

func (c *ApiController) calculateAnalysis(graphData object.GraphData) object.Analysis {
	analysis := object.Analysis{
		TotalNodes: len(graphData.Nodes),
		TotalLinks: len(graphData.Links),
	}

	if analysis.TotalNodes == 0 {
		return analysis
	}

	userNodes := 0
	topicNodes := 0
	entityNodes := 0

	for _, node := range graphData.Nodes {
		switch node.Category {
		case 0:
			userNodes++
		case 1:
			topicNodes++
		case 2:
			entityNodes++
		}
	}

	analysis.UserCount = userNodes
	analysis.TopicCount = topicNodes
	analysis.EntityCount = entityNodes

	if analysis.TotalNodes > 0 {
		analysis.AvgConnections = float64(analysis.TotalLinks) / float64(analysis.TotalNodes)
	}

	nodeConnections := make(map[string]int)
	for _, link := range graphData.Links {
		nodeConnections[link.Source]++
		nodeConnections[link.Target]++
	}

	var mostActiveNodes []object.ActiveNode
	for nodeId, count := range nodeConnections {
		var nodeName string
		for _, node := range graphData.Nodes {
			if node.ID == nodeId {
				nodeName = node.Name
				break
			}
		}

		mostActiveNodes = append(mostActiveNodes, object.ActiveNode{
			Name:        nodeName,
			Connections: count,
		})
	}

	sort.Slice(mostActiveNodes, func(i, j int) bool {
		return mostActiveNodes[i].Connections > mostActiveNodes[j].Connections
	})
	if len(mostActiveNodes) > 5 {
		mostActiveNodes = mostActiveNodes[:5]
	}
	analysis.MostActiveNodes = mostActiveNodes

	var topicWeights []object.TopicWeight
	for _, node := range graphData.Nodes {
		if node.Category == 1 {
			topicWeights = append(topicWeights, object.TopicWeight{
				Name:   node.Name,
				Weight: node.Value,
			})
		}
	}

	sort.Slice(topicWeights, func(i, j int) bool {
		return topicWeights[i].Weight > topicWeights[j].Weight
	})
	if len(topicWeights) > 5 {
		topicWeights = topicWeights[:5]
	}
	analysis.TopicWeights = topicWeights

	var entityFrequencies []object.EntityFrequency
	for _, node := range graphData.Nodes {
		if node.Category == 2 {
			entityFrequencies = append(entityFrequencies, object.EntityFrequency{
				Name:      node.Name,
				Frequency: node.Value,
			})
		}
	}

	sort.Slice(entityFrequencies, func(i, j int) bool {
		return entityFrequencies[i].Frequency > entityFrequencies[j].Frequency
	})
	if len(entityFrequencies) > 5 {
		entityFrequencies = entityFrequencies[:5]
	}
	analysis.EntityFrequencies = entityFrequencies

	if analysis.TotalNodes > 1 {
		analysis.Density = float64(2*analysis.TotalLinks) / float64(analysis.TotalNodes*(analysis.TotalNodes-1))
	}

	analysis.GiantComponentRatio = c.calculateGiantComponentRatio(graphData)

	return analysis
}

func (c *ApiController) calculateGiantComponentRatio(graphData object.GraphData) float64 {
	if len(graphData.Nodes) == 0 {
		return 0
	}

	components := c.calculateConnectedComponents(graphData)
	if len(components) == 0 {
		return 0
	}

	largestComponent := 0
	for _, component := range components {
		if len(component) > largestComponent {
			largestComponent = len(component)
		}
	}

	return float64(largestComponent) / float64(len(graphData.Nodes))
}

func (c *ApiController) calculateConnectedComponents(graphData object.GraphData) [][]string {
	if len(graphData.Nodes) == 0 {
		return [][]string{}
	}

	adjacencyList := make(map[string][]string)
	for _, node := range graphData.Nodes {
		adjacencyList[node.ID] = []string{}
	}

	for _, link := range graphData.Links {
		adjacencyList[link.Source] = append(adjacencyList[link.Source], link.Target)
		adjacencyList[link.Target] = append(adjacencyList[link.Target], link.Source)
	}

	visited := make(map[string]bool)
	var components [][]string

	var dfs func(nodeId string, component *[]string)
	dfs = func(nodeId string, component *[]string) {
		if visited[nodeId] {
			return
		}
		visited[nodeId] = true
		*component = append(*component, nodeId)

		for _, neighbor := range adjacencyList[nodeId] {
			if !visited[neighbor] {
				dfs(neighbor, component)
			}
		}
	}

	for _, node := range graphData.Nodes {
		if !visited[node.ID] {
			component := []string{}
			dfs(node.ID, &component)
			components = append(components, component)
		}
	}

	return components
}
