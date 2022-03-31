package routers

import (
	"net/http"
	"strings"

	"github.com/astaxie/beego/context"
	"github.com/casbin/casbase/util"
)

func TransparentStatic(ctx *context.Context) {
	urlPath := ctx.Request.URL.Path
	if strings.HasPrefix(urlPath, "/api/") {
		return
	}

	path := "web/build"
	if urlPath == "/" {
		path += "/index.html"
	} else {
		path += urlPath
	}

	if util.FileExist(path) {
		http.ServeFile(ctx.ResponseWriter, ctx.Request, path)
	} else {
		http.ServeFile(ctx.ResponseWriter, ctx.Request, "web/build/index.html")
	}
}
