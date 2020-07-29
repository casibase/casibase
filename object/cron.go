package object

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/mileusna/crontab"
)

type CronJob struct {
	Id       string `json:"id"`
	BumpTime string `json:"bumpTime"`
	State    string `json:"state"`
}

type PostJob struct {
	Id      string `json:"id"`
	JobId   string `json:"jobId"`
	State   string `json:"state"`
	Url     string `json:"url"`
	Content string `json:"content"`
}

var ctab *crontab.Crontab

func init() {
	ctab = crontab.New()
}

func schedulePost(postId string) {
	post := GetPost(postId)
	isBumped := post.bumpPost()
	if isBumped {
		fmt.Printf("Bump post: %s\n", post.Id)
	}
}

func (post *PostJob) bumpPost() bool {
	content := bytes.NewBuffer([]byte(post.Content))
	response, err := http.Post(post.Url, "application/json", content)
	defer response.Body.Close()
	if err != nil {
		panic(err)
	}
	_, err = ioutil.ReadAll(response.Body)

	return true
}

func GetPost(id string) *PostJob {
	posts := GetCronPosts()
	for _, v := range posts {
		if v.Id == id {
			return v
		}
	}
	return &PostJob{}
}

func GetJobs() []*CronJob {
	return GetCronJobs()
}

func GetPosts(jobId string) []*PostJob {
	posts := GetCronPosts()
	var jobs []*PostJob
	for _, v := range posts {
		if v.JobId == jobId {
			jobs = append(jobs, v)
		}
	}

	return jobs
}

func parseDumpTime(bumpTime string) (string, string) {
	tokens := strings.Split(bumpTime, ":")
	return tokens[0], tokens[1]
}

func refreshCronTasks() bool {
	ctab.Clear()

	jobs := GetJobs()
	for _, job := range jobs {
		if job.State != "active" || job.BumpTime == "" {
			continue
		}

		hours, minutes := parseDumpTime(job.BumpTime)

		posts := GetPosts(job.Id)
		for _, post := range posts {
			if post.State != "sent" || post.Url == "" {
				continue
			}

			schedule := fmt.Sprintf("%s %s * * *", minutes, hours)
			//schedule := "* * * * *"
			err := ctab.AddJob(schedule, schedulePost, post.Id)
			if err != nil {
				panic(err)
			}
		}
	}

	return true
}

func timerRoutine() {
	for range time.Tick(time.Second * 3600) {
		//println("timer")
		refreshCronTasks()
	}
}

func InitTimer() {
	refreshCronTasks()

	go timerRoutine()
}
