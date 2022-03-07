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
var renderCache = make(map[string]int64) //map[string: md5 of url][int64: created time of cache]
var renderCachePath string               //in App.conf
var cacheExpirationTime int64

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
	renderCache[md5urlString] = time.Now().Unix()
	f, err := os.Create(fmt.Sprint(renderCachePath, md5urlString))
	if err != nil {
		panic(err)
	}
	defer f.Close()
	f.WriteString(res)
	f.Sync()
}

func cacheRestore(md5urlString string) (string, bool) {
	if renderCache[md5urlString] > 0 {
		// cache is valid in 1 minutes
		if time.Now().Unix()-renderCache[md5urlString] < cacheExpirationTime {
			file, err := os.Open(fmt.Sprint(renderCachePath, md5urlString))
			if err != nil {
				return md5urlString, false
			}
			defer file.Close()
			//read the file
			fileInfo, err := file.Stat()
			if err != nil {
				panic(err)
			}
			fileSize := fileInfo.Size()
			fileBytes := make([]byte, fileSize)
			_, err = file.Read(fileBytes)
			if err != nil {
				panic(err)
			}
			//return the fileBytes
			return string(fileBytes), true
		}
	}
	return md5urlString, false
}

func url2md5(urlString string) string {
	md5url := md5.New()
	md5url.Write([]byte(urlString))
	md5urlString := fmt.Sprintf("%x", md5url.Sum(nil))
	return md5urlString
}

func initCacheSettings() {
	// get the cache path from beego app.conf
	renderCachePath = beego.AppConfig.String("cachePath")
	// if the cache path is not exist, create it
	if _, err := os.Stat(renderCachePath); os.IsNotExist(err) {
		err = os.Mkdir(renderCachePath, os.ModePerm)
		if err != nil {
			panic(err)
		}
	}
	// if the last char is not '/', add it
	if renderCachePath[len(renderCachePath)-1] != '/' {
		renderCachePath = renderCachePath + "/"
	}
	//get the cache expiration time from beego app.conf
	var err error
	cacheExpirationTime, err = beego.AppConfig.Int64("cacheExpirationTime")
	if err != nil {
		cacheExpirationTime = 60
	}
}

func RenderPage(urlString string) string {
	initCacheSettings()
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
		chromedp.Sleep(3*time.Second),
		chromedp.OuterHTML("html", &res),
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
		KillChrome()
	}
}

func KillChrome() {
	if isChromeInit {
		chromedp.Cancel(chromeCtx)
		isChromeInit = false
	}
}
