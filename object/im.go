package object

import (
	"errors"
	"net/http"
)

type IM struct {
	Connections map[string]http.ResponseWriter
}

// IMMessage body is json type
// the type of message to send to client
// if type is MessageAction , body is Message
type IMMessage struct {
	Body Message `json:"body"`
}

var IMController *IM

func init() {
	IMController = NewIM()
}

func NewIM() *IM {
	return &IM{
		Connections: make(map[string]http.ResponseWriter),
	}
}

func (im *IM) SendMessageTo(user string, message string) error {
	conn, ok := im.Connections[user]
	if !ok {
		return errors.New("user not found")
	}

	_, err := conn.Write([]byte("event: message\ndata: " + message + "\n\n"))
	if err != nil {
		println("Error writing to connection", err.Error())
		return err
	}
	conn.(http.Flusher).Flush()
	return nil
}

func (im *IM) SendMessageToChat(chat Chat, message string) {
	for _, user := range chat.Users {
		im.SendMessageTo(user, message)
	}
	im.SendMessageTo(chat.User, message)
	im.SendMessageTo(chat.User1, message)
	im.SendMessageTo(chat.User2, message)
}
