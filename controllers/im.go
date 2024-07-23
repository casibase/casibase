package controllers

import (
	"net/http"

	"github.com/casibase/casibase/object"
)

func (c *ApiController) AddConnection() {
	println(c.Ctx.Request.Host)
	user := c.Input().Get("user")
	if user == "" {
		c.ResponseError("owner is empty")
		return
	}

	c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
	c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
	c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")

	conn, ok := object.IMController.Connections[user]
	if ok {
		conn.Write([]byte("event: error\ndata: reconnected\n\n"))
		conn.(http.Flusher).Flush()
	}

	object.IMController.Connections[user] = c.Ctx.ResponseWriter

	println("AddConnection", user)
	for {
		select {
		case <-c.Ctx.ResponseWriter.CloseNotify():
			println("RemoveConnection", user)
			delete(object.IMController.Connections, user)
			return
		}
	}
}
