package service

import (
	"github.com/casbin/casibase/object"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type ChatResp struct {
	ChatName    string `json:"chatName"`
	DisplayName string `json:"displayName"`
	LastMessage string `json:"lastMessage"`
	Avatar      string `json:"avatar"`
}

type MessageResp struct {
	Author   string `json:"author"`
	Avatar   string `json:"avatar"`
	Text     string `json:"text"`
	ChatName string `json:"chatName"`
}

func WrapMessage(msg *object.Message) (*MessageResp, error) {
	user, err := casdoorsdk.GetUser(msg.Author)
	if err != nil {
		return nil, err
	}

	result := MessageResp{
		Author:   user.Name,
		Avatar:   user.Avatar,
		Text:     msg.Text,
		ChatName: msg.Chat,
	}

	if result.Avatar == "" {
		result.Avatar = DefaultAvatar
	}

	return &result, nil
}
