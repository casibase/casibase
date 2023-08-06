package service

import (
	"fmt"
	"sync"

	"github.com/casbin/casibase/ai"
)

type AIService interface {
	listen()
}

var (
	aiOnce sync.Once
	AI     AIService
)

type AIImpl struct {
	name      string
	message   Message
	authToken string
}

func NewAIImpl(name string, authToken string) AIService {
	aiOnce.Do(func() {
		AI = &AIImpl{
			name:      name,
			authToken: authToken,
			message:   NewMessageService(),
		}
	})
	return AI
}

func (a *AIImpl) listen() {
	ch, err := a.message.Subscribe(a.name)
	if err != nil {
		panic(err)
	}

	for {
		msg := <-ch
		text := ai.QueryAnswerSafe(a.authToken, msg.Text)
		err := a.message.Send(a.name, msg.Chat, text)
		if err != nil {
			fmt.Println("ai error:", err.Error())
		}
	}
}
