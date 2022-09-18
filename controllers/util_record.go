package controllers

import (
	"fmt"
	"strings"

	"github.com/astaxie/beego/context"
	"github.com/casbin/casbase/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
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

func addRecord(c *ApiController, userName string, requestUri string) {
	record := NewRecord(c.Ctx)
	record.User = userName
	if requestUri != "" {
		record.RequestUri = requestUri
	}

	util.SafeGoroutine(func() { casdoorsdk.AddRecord(record) })
}

func addRecordForFile(c *ApiController, userName string, action string, storeId string, key string, filename string, isLeaf bool) {
	typ := "Folder"
	if isLeaf {
		typ = "File"
	}

	_, storeName := util.GetOwnerAndNameFromId(storeId)

	path := fmt.Sprintf("/%s/%s", key, filename)
	if filename == "" {
		path = key
	}

	text := fmt.Sprintf("%s%s, Store: %s, Path: %s", action, typ, storeName, path)
	addRecord(c, userName, text)
}
