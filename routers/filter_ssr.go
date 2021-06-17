package routers

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	beegoContext "github.com/beego/beego/v2/adapter/context"
	"github.com/chromedp/chromedp"
)

var chromeCtx context.Context
var isChromeInstalled bool
var isChromeInit bool

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

func InitSsr() {
	isChromeInit = true
	isChromeInstalled = isChromeFound()
	if isChromeInstalled {
		chromeCtx, _ = chromedp.NewContext(context.Background())
	}
}

func RenderPage(urlString string) string {
	if !isChromeInit {
		InitSsr()
	}
	if !isChromeInstalled {
		return "Chrome is not installed in your server"
	}
	var res string
	err := chromedp.Run(chromeCtx,
		chromedp.Navigate(urlString),
		chromedp.Sleep(3 * time.Second),
		chromedp.OuterHTML("html", &res),
	)
	if err != nil {
		panic(err)
	}
	return res
}

var botRegex *regexp.Regexp

func isBot(userAgent string) bool {
	if botRegex == nil {
		botRegex, _ = regexp.Compile("bot|slurp|bing|crawler")
	}
	userAgent = strings.ToLower(userAgent)
	return botRegex.MatchString(userAgent)
}

func BotFilter(ctx *beegoContext.Context) {
	if strings.HasPrefix(ctx.Request.URL.Path, "/api/") {
		return
	}
	if isBot(ctx.Request.UserAgent()) {
		ctx.ResponseWriter.WriteHeader(200)
		urlStr := fmt.Sprintf("http://%s%s", ctx.Request.Host, ctx.Request.URL.Path)
		_, err := ctx.ResponseWriter.Write([]byte(RenderPage(urlStr)))
		if err != nil {
			panic(err)
		}
	}
}
