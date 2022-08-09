package object

import (
	"fmt"
	"strings"
	"time"

	"github.com/mileusna/crontab"

	"github.com/casbin/casnode/util"
)

type CronJob struct {
	Id       string `json:"id"`
	BumpTime string `json:"bumpTime"`
	State    string `json:"state"`
}

type UpdateJob struct {
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
	post := GetUpdateJob(postId)
	isUpdated, num := post.updateInfo()
	if isUpdated && num != 0 {
		fmt.Printf("Update forum info: %s, update num: %d\n", post.Id, num)
	}
}

func (job *UpdateJob) updateInfo() (bool, int) {
	var num int
	switch job.Id {
	case "expireData":
		expiredNodeDate := util.GetTimeMonth(-NodeHitRecordExpiredTime)
		expiredTopicDate := util.GetTimeDay(-TopicHitRecordExpiredTime)

		updateNodeNum := ChangeExpiredDataStatus(1, expiredNodeDate)
		updateTopicNum := ChangeExpiredDataStatus(2, expiredTopicDate)

		num = updateNodeNum + updateTopicNum
	case "hotInfo":
		last := GetLastRecordId()
		latest := GetLatestSyncedRecordId()
		if last == latest {
			num = 0
		} else {
			UpdateLatestSyncedRecordId(last)
			updateNodeNum := UpdateHotNode(latest)
			updateTopicNum := UpdateHotTopic(latest)

			num = updateTopicNum + updateNodeNum
		}
	case "expireTopTopic":
		num = ExpireTopTopic()
	}

	return true, num
}

func GetUpdateJob(id string) *UpdateJob {
	posts := GetCronUpdateJobs()
	for _, v := range posts {
		if v.Id == id {
			return v
		}
	}
	return &UpdateJob{}
}

func GetJobs() []*CronJob {
	return GetCronJobs()
}

func GetUpdateJobs(jobId string) []*UpdateJob {
	posts := GetCronUpdateJobs()
	var jobs []*UpdateJob
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

		posts := GetUpdateJobs(job.Id)
		for _, post := range posts {
			if post.State != "active" {
				continue
			}

			schedule := fmt.Sprintf("%s %s * * *", minutes, hours)
			// schedule := "* * * * *"
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
		refreshCronTasks()
	}
}

// InitTimer initializes scheduled tasks.
func InitTimer() {
	refreshCronTasks()

	go timerRoutine()
}
