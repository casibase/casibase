package routers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/casbin/casibase/util"
)

func TransparentStatic(ctx *context.Context) {
	urlPath := ctx.Request.URL.Path
	if strings.HasPrefix(urlPath, "/api/") {
		return
	}

	landingFolder := beego.AppConfig.String("landingFolder")
	if landingFolder != "" {
		if urlPath == "" || urlPath == "/" || urlPath == "/about" {
			http.ServeFile(ctx.ResponseWriter, ctx.Request, fmt.Sprintf("../%s/web/build/index.html", landingFolder))
			return
		}

		landingPath := fmt.Sprintf("../%s/web/build%s", landingFolder, urlPath)
		if util.FileExist(landingPath) {
			http.ServeFile(ctx.ResponseWriter, ctx.Request, landingPath)
			return
		}
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
