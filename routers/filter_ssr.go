package routers

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
)

// var chromeCtx ctx.Context
var chromeCtxPool *SsrPool

var (
	isChromeInstalled bool
	isChromeInit      bool
)

type PageCache struct {
	time time.Time
	html string
}

var renderCache = make(map[string]PageCache)

// modified from https://github.com/chromedp/chromedp/blob/master/allocate.go#L331
func isChromeFound() bool {
	for _, path := range [...]string{
		// Unix-like
		"headless_shell",
		"headless-shell",
		"chromium",
		"chromium-browser",
		"google-chrome",
		"google-chrome-stable",
		"google-chrome-beta",
		"google-chrome-unstable",
		"/usr/bin/google-chrome",

		// Windows
		"chrome",
		"chrome.exe", // in case PATHEXT is misconfigured
		`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
		`C:\Program Files\Google\Chrome\Application\chrome.exe`,
		filepath.Join(os.Getenv("USERPROFILE"), `AppData\Local\Google\Chrome\Application\chrome.exe`),

		// Mac
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	} {
		_, err := exec.LookPath(path)
		if err == nil {
			// return found -> return true
			// modified by Kininaru<shiftregister233@outlook.com>
			return true
		}
	}
	// return "google-chrome" -> return false
	// modified by Kininaru<shiftregister233@outlook.com>
	return false
}

func InitChromeDp() {
	isChromeInit = true
	isChromeInstalled = isChromeFound()
	if isChromeInstalled {
		chromeCtxNum, _ := beego.AppConfig.Int("chromeCtxNum")
		if chromeCtxNum <= 0 {
			chromeCtxNum = 1 // default
		}
		chromeCtxPool = NewSsrPool(chromeCtxNum)
	}
	go chromeCtxPool.Run() // start ssr_pool
}

func cacheSave(urlString string, res string) {
	renderCache[urlString] = PageCache{time.Now(), res}
}

func cacheRestore(urlString string, cacheExpireSeconds int64) (string, bool) {
	if _, ok := renderCache[urlString]; ok {
		if time.Now().Sub(renderCache[urlString].time) < time.Duration(cacheExpireSeconds)*time.Second {
			return renderCache[urlString].html, true
		}
	}
	return "", false
}

var botRegex *regexp.Regexp

func isBot(userAgent string) bool {
	if botRegex == nil {
		botRegex, _ = regexp.Compile("bot|slurp|bing|crawler|spider")
	}
	userAgent = strings.ToLower(userAgent)
	return botRegex.MatchString(userAgent)
}

func BotFilter(ctx *context.Context) {
	if strings.HasPrefix(ctx.Request.URL.Path, "/api/") {
		return
	}
	if isBot(ctx.Request.UserAgent()) {
		ctx.ResponseWriter.WriteHeader(200)
		urlStr := fmt.Sprintf("http://%s%s", ctx.Request.Host, ctx.Request.URL.Path)
		if !isChromeInit {
			InitChromeDp()
		}
		if !isChromeInstalled {
			_, err := ctx.ResponseWriter.Write([]byte("Chrome is not installed in your server"))
			if err != nil {
				panic(err)
			}
		}

		// the context will be canceled when the task send to channel
		// sync.WaitGroup will wait for the task to be finished, it can avoid this problem
		var wg sync.WaitGroup
		wg.Add(1)
		// create ssr_task and put it into task channel
		task := NewRenderTask(ctx, urlStr, &wg)
		chromeCtxPool.TaskChannel <- task
		wg.Wait()
	}
}
