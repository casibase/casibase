package video

import "github.com/aliyun/alibaba-cloud-sdk-go/services/vod"

func GetVideoPlayAuth(videoId string) string {
	r := vod.CreateGetVideoPlayAuthRequest()
	r.VideoId = videoId
	r.AcceptFormat = "JSON"

	resp, err := vodClient.GetVideoPlayAuth(r)
	if err != nil {
		panic(err)
	}

	playAuth := resp.PlayAuth
	return playAuth
}
