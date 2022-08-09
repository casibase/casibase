// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package controllers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
)

type NewTopicForm struct {
	Title      string   `json:"title"`
	Body       string   `json:"body"`
	NodeId     string   `json:"nodeId"`
	EditorType string   `json:"editorType"`
	Tags       []string `json:"tags"`
}

// @Title GetTopics
// @Description get current topics
// @Param   limit     query    string  true        "topics size"
// @Param   page     query    string  true        "offset"
// @Success 200 {array} object.TopicWithAvatar The Response object
// @router /get-topics [get]
// @Tag Topic API
func (c *ApiController) GetTopics() {
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultHomePageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetTopics(limit, offset)
	c.ServeJSON()
}

// @Title GetTopicsAdmin
// @Description get topics for admin
// @Param   limit     query    string  true        "topics size"
// @Param   page     query    string  true        "offset"
// @Param   un     query    string  true        "username(author)"
// @Param   ti     query    string  true        "search: title"
// @Param   cn     query    string  true        "search: content"
// @Param   sdt     query    string  true        "sort: show deleted topics"
// @Param   cs     query    string  true        "sort: created time"
// @Param   lrs     query    string  true        "sort: last reply time"
// @Param   us     query    string  true        "sort: username"
// @Param   rcs     query    string  true        "sort: reply count"
// @Param   hs     query    string  true        "sort: hot"
// @Param   fcs     query    string  true        "sort: favorite count"
// @Success 200 {object} controllers.Response The Response object
// @router /get-topics-admin [get]
// @Tag Topic API
func (c *ApiController) GetTopicsAdmin() {
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")

	usernameSearchKw := c.Input().Get("un") // search: username(author)
	titleSearchKw := c.Input().Get("ti")    // search: title
	contentSearchKw := c.Input().Get("cn")  // search: content

	showDeletedTopics := c.Input().Get("sdt") // sort: show deleted topics

	createdTimeSort := c.Input().Get("cs") // sort: created time
	lastReplySort := c.Input().Get("lrs")  // sort: last reply time
	usernameSort := c.Input().Get("us")    // sort: username
	replyCountSort := c.Input().Get("rcs") // sort: reply count
	hotSort := c.Input().Get("hs")         // sort: hot
	favCountSort := c.Input().Get("fcs")   // sort: favorite count

	defaultLimit := object.DefaultHomePageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	res, num := object.GetTopicsAdmin(usernameSearchKw, titleSearchKw, contentSearchKw, showDeletedTopics, createdTimeSort, lastReplySort, usernameSort, replyCountSort, hotSort, favCountSort, limit, offset)

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
	c.ServeJSON()
}

// @Title GetTopic
// @Description get one topic by id
// @Param   id     query    string  true        "id"
// @Success 200 {object} object.TopicWithAvatar The Response object
// @router /get-topic [get]
// @Tag Topic API
func (c *ApiController) GetTopic() {
	user := c.GetSessionUser()

	id := util.ParseInt(c.Input().Get("id"))

	topic := object.GetTopicWithAvatar(id, user)
	if topic == nil || topic.Deleted {
		c.Data["json"] = nil
		c.ServeJSON()
		return
	}

	if user != nil {
		topic.NodeModerator = object.CheckNodeModerator(user, topic.NodeId)
	}

	c.Data["json"] = topic
	c.ServeJSON()
}

// @Title GetTopicAdmin
// @Description get topic for admin by id
// @Param   id     query    string  true        "id"
// @Success 200 {object} object.AdminTopicInfo The Response object
// @router /get-topic-admin [get]
// @Tag Topic API
func (c *ApiController) GetTopicAdmin() {
	idStr := c.Input().Get("id")

	id := util.ParseInt(idStr)

	c.Data["json"] = object.GetTopicAdmin(id)
	c.ServeJSON()
}

func (c *ApiController) UpdateTopic() {
	idStr := c.Input().Get("id")

	var topic object.Topic
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &topic)
	if err != nil {
		panic(err)
	}

	id := util.ParseInt(idStr)
	c.Data["json"] = object.UpdateTopic(id, &topic)
	c.ServeJSON()
}

// @Title AddTopic
// @Description add one topic
// @Param   form     body    controllers.NewTopicForm  true        "topic info"
// @Success 200 {object} controllers.Response The Response object
// @router /add-topic [post]
// @Tag Topic API
func (c *ApiController) AddTopic() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	if object.IsForbidden(user) {
		c.ResponseError("Your account has been forbidden to perform this operation")
		return
	}

	var form NewTopicForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}
	title, body, nodeId, editorType, tags := form.Title, form.Body, form.NodeId, form.EditorType, form.Tags

	node := object.GetNode(nodeId)
	if node == nil {
		c.ResponseError("Node does not exist.")
		return
	}

	if object.ContainsSensitiveWord(title) {
		c.ResponseError("Topic title contains sensitive word.")
		return
	}

	if object.ContainsSensitiveWord(body) {
		c.ResponseError("Topic body contains sensitive word.")
		return
	}

	if len(tags) == 0 {
		tags = service.Finalword(body)
	}

	topic := object.Topic{
		// Id:            util.IntToString(object.GetTopicId()),
		Author:         GetUserName(user),
		NodeId:         node.Id,
		NodeName:       node.Name,
		TabId:          node.TabId,
		Title:          title,
		CreatedTime:    util.GetCurrentTime(),
		Tags:           tags,
		LastReplyUser:  "",
		LastReplyTime:  util.GetCurrentTime(),
		UpCount:        0,
		DownCount:      0,
		HitCount:       0,
		FavoriteCount:  0,
		SubscribeCount: 0,
		Content:        body,
		Deleted:        false,
		EditorType:     editorType,
		IsHidden:       node.IsHidden,
	}

	balance := object.GetMemberBalance(user)
	if balance < object.CreateTopicCost {
		c.ResponseError("You don't have enough balance.")
		return
	}
	// payRes := object.CreateTopicConsumption(c.GetSessionUser(), topic.Id)

	// object.AddTopicNotification(topic.Id, c.GetSessionUser(), body)

	err = json.Unmarshal(c.Ctx.Input.RequestBody, &topic)
	if err != nil {
		panic(err)
	}
	topics := object.GetTopicsByTitleAndAuthor(topic.Title, topic.Author)
	if len(topics) != 0 {
		c.ResponseError("Duplicate topic")
		return
	}
	res, id := object.AddTopic(&topic)
	if res {
		object.CreateTopicConsumption(user, id)

		c.UpdateAccountBalance(-object.CreateTopicCost)
		c.UpdateAccountConsumptionSum(object.CreateTopicCost)
		object.AddTopicNotification(id, topic.Author, topic.Content)
		targetNode := object.GetNode(topic.NodeId)
		targetNode.AddTopicToMailingList(topic.Title, topic.Content, topic.Author)

		c.ResponseOk(topic.Id)
	} else {
		c.ResponseError("Failed to add topic.")
	}
}

// @Title UploadTopicPic
// @Description upload topic picture
// @Param   pic     formData    string  true        "the picture base64 code"
// @Param	type 	formData	string 	true		"the picture type"
// @Success 200 {object} _controllers.Response The Response object
// @router /upload-topic-pic [post]
// @Tag Topic API
func (c *ApiController) UploadTopicPic() {
	if c.RequireSignedIn() {
		return
	}

	memberId := c.GetSessionUsername()
	fileBase64 := c.Ctx.Request.Form.Get("pic")
	fileType := c.Ctx.Request.Form.Get("type")
	index := strings.Index(fileBase64, ",")
	fileBytes, _ := base64.StdEncoding.DecodeString(fileBase64[index+1:])
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	fileUrl, _ := service.UploadFileToStorage(memberId, "topicPic", "UploadTopicPic", fmt.Sprintf("casnode/topicPic/%s/%s.%s", memberId, timestamp, fileType), fileBytes)

	resp := Response{Status: "ok", Msg: timestamp + "." + fileType, Data: fileUrl}
	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title DeleteTopic
// @Description delete a topic by id
// @Param   id     query    string  true        "topic id"
// @Success 200 {bool} bool Delete success or failure
// @router /delete-topic [post]
// @Tag Topic API
func (c *ApiController) DeleteTopic() {
	idStr := c.Input().Get("id")
	user := c.GetSessionUser()

	id := util.ParseInt(idStr)
	nodeId := object.GetTopicNodeId(id)
	if !object.CheckIsAdmin(user) && !object.CheckNodeModerator(user, nodeId) {
		resp := Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	c.Data["json"] = object.DeleteTopic(id)
	c.ServeJSON()
}

// @Title GetTopicsNum
// @Description get the total number of topics
// @Success 200 {int} int The topic nums
// @router /get-topics-num [get]
// @Tag Topic API
func (c *ApiController) GetTopicsNum() {
	c.Data["json"] = object.GetTopicNum()
	c.ServeJSON()
}

// @Title GetAllCreatedTopics
// @Description get all created topics
// @Param   id     query    string  true        "author id"
// @Param   tab     query    string  true        "tab"
// @Param   limit     query    string  true        "mumber of topics"
// @Param   page     query    string  true        "page offset"
// @Success 200 {array} object.Topic The Response object
// @router /get-all-created-topics [get]
// @Tag Topic API
func (c *ApiController) GetAllCreatedTopics() {
	author := c.Input().Get("id")
	tab := c.Input().Get("tab")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	var (
		limit, offset int
		err           error
	)
	if len(limitStr) != 0 {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			panic(err)
		}
	} else {
		limit = 10
	}
	if len(pageStr) != 0 {
		page, err := strconv.Atoi(pageStr)
		if err != nil {
			panic(err)
		}
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetAllCreatedTopics(author, tab, limit, offset)
	c.ServeJSON()
}

// @Title GetCreatedTopicsNum
// @Description get created topics count
// @Param   id     query    string  true        "member id"
// @Success 200 {int} int topics count
// @router /get-created-topics-num [get]
// @Tag Topic API
func (c *ApiController) GetCreatedTopicsNum() {
	memberId := c.Input().Get("id")

	c.Data["json"] = object.GetCreatedTopicsNum(memberId)
	c.ServeJSON()
}

// @Title GetTopicsByNode
// @Description get topics by node
// @Param   node-id     query    string  true        "node id"
// @Param   limit     query    string  true        "number of topics"
// @Param   page     query    string  true        "page offset"
// @Success 200 {array} object.NodeTopic The Response object
// @router /get-topics-by-node [get]
// @Tag Topic API
func (c *ApiController) GetTopicsByNode() {
	nodeId := c.Input().Get("node-id")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultPageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetTopicsByNode(nodeId, limit, offset)
	c.ServeJSON()
}

// @Title GetTopicsByTag
// @Description get topics by tag
// @Param   tag-id     query    string  true        "tag id"
// @Param   limit     query    string  true        "number of topics"
// @Param   page     query    string  true        "page offset"
// @Success 200 {array} object.NodeTopic The Response object
// @router /get-topics-by-tag [get]
// @Tag Topic API
func (c *ApiController) GetTopicsByTag() {
	tagId := c.Input().Get("tag-id")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultPageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetTopicsByTag(tagId, limit, offset)
	c.ServeJSON()
}

// @Title AddTopicHitCount
// @Description add topic hit count,together with node
// @Param   id     query    string  true        "topic id"
// @Success 200 {object} controller.Response The Response object
// @router /add-topic-hit-count [post]
// @Tag Topic API
func (c *ApiController) AddTopicHitCount() {
	topicIdStr := c.Input().Get("id")

	var resp Response
	topicId := util.ParseInt(topicIdStr)
	res := object.AddTopicHitCount(topicId)
	topicInfo := object.GetTopic(topicId)
	hitRecord := object.BrowseRecord{
		MemberId:    c.GetSessionUsername(),
		RecordType:  1,
		ObjectId:    topicInfo.NodeId,
		CreatedTime: util.GetCurrentTime(),
		Expired:     false,
	}
	object.AddBrowseRecordNum(&hitRecord)
	if res {
		resp = Response{Status: "ok", Msg: "success"}
	} else {
		resp = Response{Status: "fail", Msg: "add topic hit count failed"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetTopicsByTab
// @Description get topics by tab
// @Param   tab-id     query    string  true        "tab id"
// @Param   limit     query    string  true        "number of topics"
// @Param   page     query    string  true        "page offset"
// @Success 200 {array} object.TopicWithAvatar The Response object
// @router /get-topics-by-tab [get]
// @Tag Topic API
func (c *ApiController) GetTopicsByTab() {
	tabId := c.Input().Get("tab-id")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultHomePageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetTopicsWithTab(tabId, limit, offset)
	c.ServeJSON()
}

// @Title AddTopicBrowseCount
// @Description add topic browse count
// @Param   id     query    string  true        "topicId"
// @Success 200 {object} controller.Response The Response object
// @router /add-topic-browse-record [post]
// @Tag Topic API
func (c *ApiController) AddTopicBrowseCount() {
	topicId := c.Input().Get("id")

	var resp Response
	hitRecord := object.BrowseRecord{
		MemberId:    c.GetSessionUsername(),
		RecordType:  2,
		ObjectId:    topicId,
		CreatedTime: util.GetCurrentTime(),
		Expired:     false,
	}
	res := object.AddBrowseRecordNum(&hitRecord)
	if res {
		resp = Response{Status: "ok", Msg: "success"}
	} else {
		resp = Response{Status: "fail", Msg: "add node hit count failed"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetHotTopic
// @Description get hot topic
// @Param   limit     query    string  true        "limit size"
// @Success 200 {object} controller.Response The Response object
// @router /get-hot-topic [get]
// @Tag Topic API
func (c *ApiController) GetHotTopic() {
	limitStr := c.Input().Get("limit")
	defaultLimit := object.HotTopicNum

	var limit int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}

	res := object.GetHotTopic(limit)
	c.ResponseOk(res)
}

// @Title GetSortedTopics
// @Description get sorted topics
// @Param   lps     query    string  true        "sort: last reply count"
// @Param   hs     query    string  true        "sort: hot"
// @Param   fcs     query    string  true        "sort: favorite count"
// @Param   cts     query    string  true        "sort: created time"
// @Param   page     query    string  true        "offset"
// @Param   limit     query    string  true        "limit size"
// @Success 200 {object} controller.Response The Response object
// @router /get-hot-topic [get]
// @Tag Topic API
func (c *ApiController) GetSortedTopics() {
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	lastReplySort := c.Input().Get("lps")   // sort: last reply time
	hotSort := c.Input().Get("hs")          // sort: hot
	favCountSort := c.Input().Get("fcs")    // sort: favorite count
	createdTimeSort := c.Input().Get("cts") // sort: created time

	defaultLimit := object.DefaultHomePageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	res := object.GetSortedTopics(lastReplySort, hotSort, favCountSort, createdTimeSort, limit, offset)

	c.ResponseOk(res)
}

// @Title UpdateTopicNode
// @Description update the topic node
// @Param   updateTopicNode     body    controllers.updateTopicNode  true        "topic node info"
// @Success 200 {object} controllers.Response The Response object
// @router /update-topic-node [post]
// @Tag Topic API
func (c *ApiController) UpdateTopicNode() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	var form updateTopicNode
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}
	id, _, nodeId := form.Id, form.NodeName, form.NodeId

	originalNode := object.GetTopicNodeId(id)
	if !object.CheckIsAdmin(user) && !object.CheckNodeModerator(user, originalNode) && object.GetTopicAuthor(id).Name != GetUserName(user) {
		c.ResponseError("Unauthorized.")
		return
	}

	node := object.GetNode(nodeId)
	if node == nil {
		c.ResponseError("Node does not exist.")
		return
	}

	topic := object.Topic{
		// Id:       id,
		NodeId:   node.Id,
		NodeName: node.Name,
		TabId:    node.TabId,
	}
	res := object.UpdateTopicWithLimitCols(id, &topic)

	c.ResponseOk(res)
}

// @Title EditContent
// @Description edit content
// @Param   editType     query    string  true        "edit Type"
// @Success 200 {object} controllers.Response The Response object
// @router /edit-content [post]
// @Tag Topic API
func (c *ApiController) EditContent() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	editType := c.Input().Get("editType")
	var resp Response
	if editType == "topic" {
		var form editTopic
		err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
		if err != nil {
			panic(err)
		}
		id, title, content, nodeId, editorType, tags := form.Id, form.Title, form.Content, form.NodeId, form.EditorType, form.Tags
		if !object.CheckIsAdmin(user) && !object.CheckNodeModerator(user, nodeId) && object.GetTopicAuthor(id).Name != GetUserName(user) {
			resp = Response{Status: "fail", Msg: "Unauthorized."}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}

		topic := object.Topic{
			Id:         id,
			Title:      title,
			Content:    content,
			EditorType: editorType,
			Tags:       tags,
		}
		res := object.UpdateTopicWithLimitCols(id, &topic)

		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		var form editReply
		err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
		if err != nil {
			panic(err)
		}
		id, content, editorType := form.Id, form.Content, form.EditorType
		if !object.CheckIsAdmin(user) && object.GetReplyAuthor(id).Name != GetUserName(user) {
			resp = Response{Status: "fail", Msg: "Unauthorized."}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}

		reply := object.Reply{
			Id:         id,
			Content:    content,
			EditorType: editorType,
		}
		res := object.UpdateReplyWithLimitCols(id, &reply)

		resp = Response{Status: "ok", Msg: "success", Data: res}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title TranslateTopic
// @router /translate-topic [get]
// @Tag Topic API
func (c *ApiController) TranslateTopic() {
	topicIdStr := c.Input().Get("id")
	targetLang := c.Input().Get("target")

	// ISO/IEC 15897 to ISO 639-1
	targetLang = targetLang[0:2]

	topicId := util.ParseInt(topicIdStr)

	translateData := &object.TranslateData{}

	topic := object.GetTopic(topicId)
	if topic == nil || topic.Deleted {
		translateData.ErrMsg = "Invalid TopicId"
		c.Data["json"] = translateData
		c.ServeJSON()
		return
	}

	c.Data["json"] = object.StrTranslate(topic.Content, targetLang)
	c.ServeJSON()
	return
}

// TopTopic tops topic according to the topType in the url.
// @Title TopTopic
// @Description tops topic according to the topType in the url.
// @Param   id     query    string  true        "id"
// @Success 200 {object} controllers.Response The Response object
// @router /top-topic [post]
// @Tag Topic API
func (c *ApiController) TopTopic() {
	if c.RequireSignedIn() {
		return
	}

	id := util.ParseInt(c.Input().Get("id"))

	user := c.GetSessionUser()

	var res bool
	nodeId := object.GetTopicNodeId(id)
	if object.CheckIsAdmin(user) || object.CheckNodeModerator(user, nodeId) {
		// timeStr := c.Input().Get("time")
		// time := util.ParseInt(timeStr)
		// date := util.GetTimeMinute(time)
		// res = object.ChangeTopicTopExpiredTime(id, date)
		topType := c.Input().Get("topType")
		date := util.GetTimeYear(100)
		res = object.ChangeTopicTopExpiredTime(id, date, topType)
	} else if object.GetTopicAuthor(id).Name == GetUserName(user) {
		balance := object.GetMemberBalance(user)
		if balance < object.TopTopicCost {
			c.ResponseError("You don't have enough balance.")
			return
		}

		object.TopTopicConsumption(user, id)

		c.UpdateAccountBalance(-object.TopTopicCost)

		date := util.GetTimeMinute(object.DefaultTopTopicTime)
		res = object.ChangeTopicTopExpiredTime(id, date, "node")
	} else {
		c.ResponseError("Unauthorized.")
		return
	}

	c.ResponseOk(res)
}

// @Title CancelTopTopic
// @Description cancels top topic according to the topType in the url.
// @Param   id     query    string  true        "id"
// @Success 200 {object} controllers.Response The Response object
// @router /cancel-top-topic [post]
// @Tag Topic API
func (c *ApiController) CancelTopTopic() {
	if c.RequireSignedIn() {
		return
	}

	idStr := c.Input().Get("id")
	user := c.GetSessionUser()

	id := util.ParseInt(idStr)
	var resp Response
	var res bool

	nodeId := object.GetTopicNodeId(id)
	if object.CheckIsAdmin(user) || object.CheckNodeModerator(user, nodeId) {
		topType := c.Input().Get("topType")
		res = object.ChangeTopicTopExpiredTime(id, "", topType)
	} else {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	resp = Response{Status: "ok", Msg: "success", Data: res}
	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetTopicByUrlPathAndTitle
// @router /get-topic-by-urlpath-and-title [get]
// @Tag Topic API
func (c *ApiController) GetTopicByUrlPathAndTitle() {
	urlPath := c.Input().Get("urlPath")
	title := c.Input().Get("title")
	author := c.Input().Get("author")
	nodeId := c.Input().Get("nodeId")

	if urlPath == "" {
		c.ResponseError(fmt.Sprintf("The urlPath: %s does not exist", urlPath))
		return
	}

	if title == "" {
		c.ResponseError(fmt.Sprintf("The title: %s does not exist", title))
		return
	}

	if author == "" {
		c.ResponseError(fmt.Sprintf("The author: %s does not exist", author))
		return
	}

	node := object.GetNode(nodeId)
	if nodeId == "" || node == nil {
		c.ResponseError(fmt.Sprintf("The node: %s does not exist", nodeId))
		return
	}

	topic := object.GetTopicByUrlPathAndTitle(urlPath, title, nodeId)
	if topic == nil {
		topic = &object.Topic{
			Author:        author,
			NodeId:        nodeId,
			NodeName:      node.Name,
			TabId:         node.TabId,
			Title:         title,
			CreatedTime:   util.GetCurrentTime(),
			LastReplyTime: util.GetCurrentTime(),
			Content:       fmt.Sprintf("URL: %s%s", nodeId, urlPath),
			UrlPath:       urlPath,
			EditorType:    "markdown",
			IsHidden:      node.IsHidden,
		}
		object.AddTopic(topic)
	}

	c.ResponseOk(topic)
}
