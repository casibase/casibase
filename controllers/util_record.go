package controllers

import (
	"strings"

	"github.com/astaxie/beego/context"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/openbrainorg/openbrain/util"
)

func NewRecord(ctx *context.Context) *casdoorsdk.Record {
	ip := strings.Replace(util.GetIPFromRequest(ctx.Request), ": ", "", -1)
	action := strings.Replace(ctx.Request.URL.Path, "/api/", "", -1)
	requestUri := util.FilterQuery(ctx.Request.RequestURI, []string{"accessToken"})
	if len(requestUri) > 1000 {
		requestUri = requestUri[0:1000]
	}

	record := casdoorsdk.Record{
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTime(),
		ClientIp:    ip,
		User:        "",
		Method:      ctx.Request.Method,
		RequestUri:  requestUri,
		Action:      action,
		IsTriggered: false,
	}
	return &record
}

func addRecord(c *ApiController, userName string) {
	record := NewRecord(c.Ctx)
	record.User = userName
	util.SafeGoroutine(func() { casdoorsdk.AddRecord(record) })
}
