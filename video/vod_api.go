package video

import (
	"fmt"

	"github.com/aliyun/alibaba-cloud-sdk-go/services/vod"
)

func GetVideoPlayAuth(videoId string) string {
	r := vod.CreateGetVideoPlayAuthRequest()
	r.VideoId = videoId
	r.AcceptFormat = "JSON"

	resp, err := vodClient.GetVideoPlayAuth(r)
	if err != nil {
		fmt.Println(err)
		return err.Error()
	}

	playAuth := resp.PlayAuth
	return playAuth
}
