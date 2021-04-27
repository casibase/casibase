package object

import (
	"fmt"
	"strings"
	"time"

	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
	crawler "github.com/casbin/google-groups-crawler"
	"github.com/gomarkdown/markdown"
)

func (n Node) AddTopicToMailingList(title, content, author string) {
	if len(n.MailingList) == 0 {
		return
	}
	content = string(markdown.ToHTML([]byte(content), nil, nil))
	_ = service.SendEmail(title, content, n.MailingList, author)
}

func (n Node) SyncFromGoogleGroup() {
	if !strings.Contains(n.MailingList, "@googlegroups.com") {
		return
	}
	topicTitles := n.GetAllTopicTitlesOfNode()

	isInTopicList := func(topicTitle string) bool {
		for _, title := range topicTitles {
			if title == topicTitle {
				return true
			}
		}
		return false
	}

	group := crawler.NewGoogleGroup(n.MailingList)
	conversations := group.GetConversations(httpClient)
	for _, conv := range conversations {
		messages := conv.GetAllMessages(httpClient)
		var newTopic Topic
		if !isInTopicList(conv.Title) {
			newTopic = Topic{
				Author:        messages[0].Author,
				NodeId:        n.Id,
				NodeName:      n.Name,
				Title:         conv.Title,
				Content:       FilterUnsafeHTML(messages[0].Content),
				CreatedTime:   util.GetCurrentTime(),
				LastReplyTime: util.GetCurrentTime(),
				EditorType:    "richtext",
			}
			AddTopic(&newTopic)
		} else {
			_, err := adapter.engine.Where("title = ?", conv.Title).Desc("id").Get(&newTopic)
			if err != nil {
				panic(err)
			}
		}

		replies := newTopic.GetAllRepliesOfTopic()
		isInReplies := func(replyStr string) bool {
			for _, c := range replies {
				if c == replyStr {
					return true
				}
			}
			return false
		}

		for _, msg := range messages[1:] {
			msg.Content = FilterUnsafeHTML(msg.Content)
			if isInReplies(msg.Content) {
				continue
			}
			newReply := Reply{
				Author:      msg.Author,
				TopicId:     newTopic.Id,
				EditorType:  "richtext",
				Content:     msg.Content,
				CreatedTime: util.GetCurrentTime(),
			}
			AddReply(&newReply)
			newTopic.LastReplyTime = util.GetCurrentTime()
			newTopic.LastReplyUser = msg.Author
		}
		UpdateTopic(newTopic.Id, &newTopic)
	}
}

func AutoSyncGoogleGroup() {
	if AutoSyncPeriodSecond < 30 {
		return
	}
	for {
		time.Sleep(time.Duration(AutoSyncPeriodSecond) * time.Second)
		SyncAllNodeFromGoogleGroup()
	}
}

func SyncAllNodeFromGoogleGroup() {
	if AutoSyncPeriodSecond < 30 {
		return
	}
	fmt.Println("Sync from google group started...")
	var nodes []Node
	err := adapter.engine.Find(&nodes)
	if err != nil {
		panic(err)
	}
	for _, node := range nodes {
		go node.SyncFromGoogleGroup()
	}
}

func (r Reply) AddReplyToMailingList() {
	targetTopic := GetTopic(r.TopicId)
	targetNode := GetNode(targetTopic.NodeId)
	if len(targetNode.MailingList) == 0 {
		return
	}
	if r.EditorType == "markdown" {
		r.Content = string(markdown.ToHTML([]byte(r.Content), nil, nil))
	}
	_ = service.SendEmail(targetTopic.Title, r.Content, targetNode.MailingList, r.Author)
}
