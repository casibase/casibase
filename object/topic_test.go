package object

import (
	"fmt"
	"strconv"
	"testing"
)

func TestSyncTopicReplyCount(t *testing.T) {
	InitConfig()
	InitAdapter()

	topics := GetAllTopics()
	for _, topic := range topics {
		num := GetTopicReplyNum(topic.Id)
		if num != topic.ReplyCount {
			tmp := topic.ReplyCount
			topic.ReplyCount = num
			UpdateTopic(topic.Id, topic)
			fmt.Printf("[update topic:%d]: ReplyCount: %d -> %d\n", topic.Id, tmp, topic.ReplyCount)
		}
	}
	fmt.Println("Synced ReplyCount of all topics!")
}

func TestSyncTopicFavoriteCount(t *testing.T) {
	InitConfig()
	InitAdapter()

	topics := GetAllTopics()
	for _, topic := range topics {
		num := GetTopicFavoritesNum(strconv.Itoa(topic.Id))
		if num != topic.FavoriteCount {
			tmp := topic.FavoriteCount
			topic.FavoriteCount = num
			UpdateTopic(topic.Id, topic)
			fmt.Printf("[update topic:%d]: FavoriteCount: %d -> %d\n", topic.Id, tmp, topic.FavoriteCount)
		}
	}
	fmt.Println("Synced FavoriteCount of all topics!")
}

func TestSyncTopicSubscribeCount(t *testing.T) {
	InitConfig()
	InitAdapter()

	Topics := GetAllTopics()
	for _, topic := range Topics {
		num := GetTopicSubscribeNum(strconv.Itoa(topic.Id))
		if num != topic.SubscribeCount {
			tmp := topic.SubscribeCount
			topic.SubscribeCount = num
			UpdateTopic(topic.Id, topic)
			fmt.Printf("[update topic:%d]: SubscribeCount: %d -> %d\n", topic.Id, tmp, topic.SubscribeCount)
		}
	}
	fmt.Println("Synced SubscribeCount of all topics!")
}
