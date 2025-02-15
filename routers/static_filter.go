// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package routers

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/beego/beego"
	"github.com/beego/beego/context"
	"github.com/casibase/casibase/util"
)

const (
	headerAllowOrigin  = "Access-Control-Allow-Origin"
	headerAllowMethods = "Access-Control-Allow-Methods"
	headerAllowHeaders = "Access-Control-Allow-Headers"
)

func StaticFilter(ctx *context.Context) {
	urlPath := ctx.Request.URL.Path
	if strings.HasPrefix(urlPath, "/api/") {
		return
	}

	landingFolder := beego.AppConfig.String("landingFolder")
	if landingFolder != "" {
		if urlPath == "" || urlPath == "/" || urlPath == "/about" {
			makeGzipResponse(ctx.ResponseWriter, ctx.Request, fmt.Sprintf("../%s/web/build/index.html", landingFolder))
			return
		}

		landingPath := fmt.Sprintf("../%s/web/build%s", landingFolder, urlPath)
		if util.FileExist(landingPath) {
			makeGzipResponse(ctx.ResponseWriter, ctx.Request, landingPath)
			return
		}
	}

	if strings.HasPrefix(urlPath, "/storage") {
		ctx.Output.Header(headerAllowOrigin, "*")
		ctx.Output.Header(headerAllowMethods, "POST, GET, OPTIONS, DELETE")
		ctx.Output.Header(headerAllowHeaders, "Content-Type, Authorization")

		urlPath = strings.TrimPrefix(urlPath, "/storage/")
		urlPath = strings.Replace(urlPath, "|", ":", 1)
		makeGzipResponse(ctx.ResponseWriter, ctx.Request, urlPath)
		return
	}

	path := "web/build"
	if urlPath == "/" {
		path += "/index.html"
	} else {
		path += urlPath
	}

	if util.FileExist(path) {
		makeGzipResponse(ctx.ResponseWriter, ctx.Request, path)
	} else {
		makeGzipResponse(ctx.ResponseWriter, ctx.Request, "web/build/index.html")
	}
}

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func makeGzipResponse(w http.ResponseWriter, r *http.Request, path string) {
	if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
		serveFileWithReplace(w, r, path)
		return
	}
	w.Header().Set("Content-Encoding", "gzip")
	gz := gzip.NewWriter(w)
	defer gz.Close()
	gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
	serveFileWithReplace(gzw, r, path)
}

func serveFileWithReplace(w http.ResponseWriter, r *http.Request, path string) {
	if !regexp.MustCompile(`/static/js/main\.[a-f0-9]+\.js$`).MatchString(path) {
		http.ServeFile(w, r, path)
		return
	}

	f, err := os.Open(filepath.Clean(path))
	if err != nil {
		panic(err)
	}
	defer f.Close()

	d, err := f.Stat()
	if err != nil {
		panic(err)
	}

	oldContent := util.ReadStringFromPath(path)
	newContent := oldContent

	serverUrl := beego.AppConfig.String("casdoorEndpoint")
	clientId := beego.AppConfig.String("clientId")
	appName := beego.AppConfig.String("casdoorApplication")
	organizationName := beego.AppConfig.String("casdoorOrganization")

	newContent = regexp.MustCompile(`serverUrl:"[^"]*"`).ReplaceAllString(newContent, fmt.Sprintf(`serverUrl:"%s"`, serverUrl))
	newContent = regexp.MustCompile(`clientId:"[^"]*"`).ReplaceAllString(newContent, fmt.Sprintf(`clientId:"%s"`, clientId))
	newContent = regexp.MustCompile(`appName:"[^"]*"`).ReplaceAllString(newContent, fmt.Sprintf(`appName:"%s"`, appName))
	newContent = regexp.MustCompile(`organizationName:"[^"]*"`).ReplaceAllString(newContent, fmt.Sprintf(`organizationName:"%s"`, organizationName))

	http.ServeContent(w, r, d.Name(), d.ModTime(), strings.NewReader(newContent))
}
