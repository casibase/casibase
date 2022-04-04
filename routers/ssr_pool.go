package routers

import (
	ctx "context"
	"sync"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/chromedp/chromedp"
)

type RenderTask struct {
	HttpCtx *context.Context
	Url     string
	Render  func(chromeCtx ctx.Context, url string) string
	Wg      *sync.WaitGroup
}

type SsrPool struct {
	TaskChannel chan *RenderTask
	JobsChannel chan *RenderTask
	WorkerNum   int
}

func NewRenderTask(httpCtx *context.Context, url string, wg *sync.WaitGroup) *RenderTask {
	return &RenderTask{
		HttpCtx: httpCtx,
		Url:     url,
		Render:  render,
		Wg:      wg,
	}
}

func NewSsrPool(cap int) *SsrPool {
	pool := SsrPool{
		TaskChannel: make(chan *RenderTask),
		JobsChannel: make(chan *RenderTask),
		WorkerNum:   cap,
	}
	return &pool
}

func render(chromeCtx ctx.Context, url string) string {
	cacheExpireSeconds, err := beego.AppConfig.Int64("cacheExpireSeconds")
	if err != nil {
		panic(err)
	}
	res, cacheHit := cacheRestore(url, cacheExpireSeconds)
	if cacheHit {
		return res
	}
	if !isChromeInit {
		InitChromeDp()
	}
	if !isChromeInstalled {
		return "Chrome is not installed in your server"
	}
	err = chromedp.Run(chromeCtx,
		chromedp.Navigate(url),
		chromedp.OuterHTML("html", &res),
	)
	if err != nil {
		panic(err)
	}
	cacheSave(url, res)
	return res
}

func (pool *SsrPool) worker() {
	//chromeCtx, _ := chromedp.NewExecAllocator(ctx.Background(), append(
	//	chromedp.DefaultExecAllocatorOptions[:],
	//	chromedp.Flag("headless", false))...)
	//chromeCtx, _ = chromedp.NewContext(chromeCtx)
	chromeCtx, _ := chromedp.NewContext(ctx.Background()) // set default context with headless mode
	for task := range pool.JobsChannel {
		urlStr := task.Render(chromeCtx, task.Url)
		_, err := task.HttpCtx.ResponseWriter.Write([]byte(urlStr))
		if err != nil {
			panic(err)
		}
		task.Wg.Done()
	}
}

func (pool *SsrPool) Run() {
	for i := 0; i < pool.WorkerNum; i++ {
		go pool.worker()
	}
	for task := range pool.TaskChannel {
		pool.JobsChannel <- task
	}
}
