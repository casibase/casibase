package routers

import (
	ctx "context"
	"crypto/md5"
	"fmt"
	"github.com/astaxie/beego"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/astaxie/beego/context"
	"github.com/chromedp/chromedp"
)

var chromeCtx ctx.Context
var isChromeInstalled bool
var isChromeInit bool

type SSRCache struct {
	time time.Time
	html string
}

var isCacheSettingsInit bool
var renderCache = make(map[string]SSRCache) //map[string: md5 of url][string: html cache] //in App.conf
var cacheExpirationTime int64               // default is 60 seconds

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
		chromeCtx, _ = chromedp.NewContext(ctx.Background())
	}
}

func cacheSave(md5urlString string, res string) {
	renderCache[md5urlString] = SSRCache{time.Now(), res}
}

func cacheRestore(md5urlString string) (string, bool) {
	if _, ok := renderCache[md5urlString]; ok {
		if time.Now().Sub(renderCache[md5urlString].time) < time.Duration(cacheExpirationTime)*time.Second {
			return renderCache[md5urlString].html, true
		}
	}
	return "", false
}

func url2md5(urlString string) string {
	md5url := md5.New()
	md5url.Write([]byte(urlString))
	md5urlString := fmt.Sprintf("%x", md5url.Sum(nil))
	return md5urlString
}

func initCacheSettings() {
	isCacheSettingsInit = true
	var err error
	cacheExpirationTime, err = beego.AppConfig.Int64("cacheExpirationTime")
	if err != nil {
		panic(err)
	}
}

func RenderPage(urlString string) string {
	if !isCacheSettingsInit {
		initCacheSettings()
	}
	md5urlString := url2md5(urlString)
	res, cacheHit := cacheRestore(md5urlString)
	if cacheHit {
		return res //cache of urlString
	}
	if !isChromeInit {
		InitChromeDp()
	}
	if !isChromeInstalled {
		return "Chrome is not installed in your server"
	}
	err := chromedp.Run(chromeCtx,
		chromedp.Navigate(urlString),
		//chromedp.Sleep(3*time.Second),
		//chromedp.OuterHTML("html", &res),
		chromedp.Text("html", &res),
	)
	if err != nil {
		panic(err)
	}
	cacheSave(md5urlString, res)
	return res
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
		_, err := ctx.ResponseWriter.Write([]byte(RenderPage(urlStr)))
		if err != nil {
			panic(err)
		}
	}
}
