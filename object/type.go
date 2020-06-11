package object

type LatestReply struct {
	TopicId string `json:"topicId"`
	NodeId string `json:"nodeId"`
	NodeName string `json:"nodeName"`
	Author string `json:"author"`
	ReplyContent string `json:"replyContent"`
	TopicTitle string `json:"topicTitle"`
	ReplyTime string `json:"replyTime"`
}
