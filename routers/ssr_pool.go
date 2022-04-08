package routers

import (
	ctx "context"
	"fmt"
	"runtime"
	"sync"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/astaxie/beego/logs"
	"github.com/chromedp/chromedp"
)

type RenderTask struct {
	HttpCtx *context.Context
	Url     string
	Render  func(chromeCtx ctx.Context, url string) (string, error)
	Wg      *sync.WaitGroup
}

type SsrPool struct {
	TaskChannel      chan *RenderTask
	JobsChannel      chan *RenderTask
	AddWorkerChannel chan bool
	WorkerNum        int
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

func render(chromeCtx ctx.Context, url string) (string, error) {
	cacheExpireSeconds, err := beego.AppConfig.Int64("cacheExpireSeconds")
	if err != nil {
		return "", err
	}
	res, cacheHit := cacheRestore(url, cacheExpireSeconds)
	if cacheHit {
		return res, nil
	}
	err = chromedp.Run(chromeCtx,
		chromedp.Navigate(url),
		chromedp.OuterHTML("html", &res),
	)
	if err != nil {
		return "", err
	}
	cacheSave(url, res)
	return res, nil
}

func (pool *SsrPool) worker() {
	//chromeCtx, _ := chromedp.NewExecAllocator(ctx.Background(), append(
	//	chromedp.DefaultExecAllocatorOptions[:],
	//	chromedp.Flag("headless", false))...)
	//chromeCtx, _ = chromedp.NewContext(chromeCtx)
	chromeCtx, _ := chromedp.NewContext(ctx.Background()) // set default context with headless mode
	for task := range pool.JobsChannel {
		cancel := func() bool {
			defer func() {
				if err := recover(); err != nil {
					handleErr(task.HttpCtx, err.(error))
					task.Wg.Done()
				}
			}()
			urlStr, err := task.Render(chromeCtx, task.Url)
			if err != nil {
				if err.Error() == "context canceled" { // when browser process has terminated
					handleErr(task.HttpCtx, err)
					task.Wg.Done()
					return true
				} else {
					panic(err)
				}
			}
			_, err = task.HttpCtx.ResponseWriter.Write([]byte(urlStr))
			if err != nil {
				panic(err)
			}
			task.Wg.Done()
			return false
		}()
		// if canceled, break the loop
		if cancel {
			break
		}
	}
	// if break, add a new worker
	pool.AddWorkerChannel <- true
}

func (pool *SsrPool) Run() {
	pool.AddWorkerChannel = make(chan bool, pool.WorkerNum)
	for i := 0; i < pool.WorkerNum; i++ {
		pool.AddWorkerChannel <- true
	}
	go func() {
		for j := range pool.AddWorkerChannel {
			if j == true {
				go pool.worker()
			}
		}
	}()
	for task := range pool.TaskChannel {
		pool.JobsChannel <- task
	}
}

func handleErr(ctx *context.Context, err error) {
	var stack string
	logs.Critical("the request url is ", ctx.Input.URL())
	logs.Critical("Handler crashed with error:", err)
	for i := 1; ; i++ {
		_, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}
		logs.Critical(fmt.Sprintf("%s:%d", file, line))
		stack = stack + fmt.Sprintln(fmt.Sprintf("%s:%d", file, line))
	}
	if ctx.Output.Status != 0 {
		ctx.ResponseWriter.WriteHeader(ctx.Output.Status)
	} else {
		ctx.ResponseWriter.WriteHeader(500)
	}
	_, _err := ctx.ResponseWriter.Write([]byte(err.(error).Error()))
	if _err != nil {
		logs.Critical("write response error:", err)
	}
}
