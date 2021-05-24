package object

import (
	"fmt"
	"regexp"
	"strconv"
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

	group := crawler.NewGoogleGroup(n.MailingList, n.GoogleGroupCookie)
	conversations := group.GetConversations(*HttpClient)
	for _, conv := range conversations {
		messages := conv.GetAllMessages(*HttpClient)
		var newTopic Topic
		AuthorMember := AddMemberByNameAndEmailIfNotExist(messages[0].Author, conv.AuthorNameToEmail[messages[0].Author])
		if AuthorMember == nil {
			continue
		}
		if !isInTopicList(conv.Title) {
			newTopic = Topic{
				Author:        AuthorMember.Id,
				NodeId:        n.Id,
				NodeName:      n.Name,
				Title:         conv.Title,
				Content:       FilterUnsafeHTML(messages[0].Content),
				CreatedTime:   ConvertToRFC3339Format(conv.Time),
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
			AuthorMember = AddMemberByNameAndEmailIfNotExist(msg.Author, conv.AuthorNameToEmail[msg.Author])
			if AuthorMember == nil {
				continue
			}
			if isInReplies(msg.Content) {
				continue
			}
			newReply := Reply{
				Author:      AuthorMember.Id,
				TopicId:     newTopic.Id,
				EditorType:  "richtext",
				Content:     msg.Content,
				CreatedTime: ConvertToRFC3339Format(msg.Time),
			}
			AddReply(&newReply)
			newTopic.LastReplyTime = util.GetCurrentTime()
			newTopic.LastReplyUser = AuthorMember.Id
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

var timeRegex []*regexp.Regexp

func monthToInt(month string) int64 {
	switch month {
	case "Jan":
		return 1
	case "Feb":
		return 2
	case "Mar":
		return 3
	case "Apr":
		return 4
	case "May":
		return 5
	case "Jun":
		return 6
	case "Jul":
		return 7
	case "Aug":
		return 8
	case "Sep":
		return 9
	case "Oct":
		return 10
	case "Nov":
		return 11
	case "Dec":
		return 12
	}
	return 0
}

func RegexpCompile() {
	timeRegex = append(timeRegex, regexp.MustCompile("start[A-Z][a-z]{2} [0-9]{1,2}end"))
	timeRegex = append(timeRegex, regexp.MustCompile("start([0-9]{1,2}/){2}[0-9]{1,2}end"))
	timeRegex = append(timeRegex, regexp.MustCompile("start[A-Z][a-z]{2} [0-9]{1,2}, [0-9]{4}, [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2} [AP]Mend"))
}

func ConvertToRFC3339Format(timeStr string) string {
	if timeStr == "yesterday" {
		timestamp := time.Now().Unix() - 86400
		tm := time.Unix(timestamp, 0)
		return tm.Format(time.RFC3339)
	}

	if len(timeRegex) == 0{
		RegexpCompile()
	}

	index := -1
	stringToMatch := fmt.Sprintf("start%send", timeStr)
	for i, reg := range timeRegex {
		if reg.MatchString(stringToMatch) {
			index = i
			break
		}
	}

	if index == -1 {
		return util.GetCurrentTime()
	}

	now := time.Now()
	year := now.Year()
	month := int(now.Month())
	day := int64(now.Day())
	hour := now.Hour()
	minute := now.Minute()
	second := now.Second()

	var subStr []string

	var retMonth int64
	var retDay int64
	var retYear int64
	var retHour int64
	var retMin int64
	var retSec int64
	isAm := true
	switch index {
	case 0:
		subStr = strings.Split(timeStr, " ")
		if len(subStr) != 2 {
			return util.GetCurrentTime()
		}
		retMonth = monthToInt(subStr[0])
		retDay, _ = strconv.ParseInt(subStr[1], 10, 64)
	case 1:
		subStr = strings.Split(timeStr, "/")
		if len(subStr) != 3 {
			return util.GetCurrentTime()
		}
		retMonth, _ = strconv.ParseInt(subStr[0], 10, 64)
		retDay, _ = strconv.ParseInt(subStr[1], 10, 64)
		retYear, _ = strconv.ParseInt(subStr[2], 10, 64)
	case 2:
		subStr = strings.Split(timeStr, ", ")
		if len(subStr) != 3 {
			return util.GetCurrentTime()
		}
		sub := strings.Split(subStr[0], " ")
		if len(sub) != 2 {
			return util.GetCurrentTime()
		}
		retMonth = monthToInt(sub[0])
		retDay, _ = strconv.ParseInt(sub[1], 10, 64)
		retYear, _ = strconv.ParseInt(subStr[1], 10, 64)
		sub = strings.Split(subStr[2], " ")
		if len(sub) != 2 {
			return util.GetCurrentTime()
		}
		if sub[1] != "AM" {
			isAm = false
		}
		sub = strings.Split(sub[0], ":")
		if len(sub) != 3 {
			return util.GetCurrentTime()
		}
		retHour, _ = strconv.ParseInt(sub[0], 10, 64)
		retMin, _ = strconv.ParseInt(sub[1], 10, 64)
		retSec, _ = strconv.ParseInt(sub[2], 10, 64)
	}
	if retYear != 0 {
		year = int(retYear)
		if year < 1000 {
			year += 2000
		}
	}
	if retMonth != 0 {
		month = int(retMonth)
	}
	if retDay != 0 {
		day = retDay
	}
	if retHour != 0 {
		hour = int(retHour)
		if !isAm {
			hour += 12
		}
	}
	if retMin != 0 {
		minute = int(retMin)
	}
	if retSec != 0 {
		second = int(retSec)
	}

	return fmt.Sprintf("%04d-%02d-%02dT%02d:%02d:%02d+07:00", year, month, day, hour, minute, second)
}
