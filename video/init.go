package video

import "github.com/aliyun/alibaba-cloud-sdk-go/services/vod"

var vodClient *vod.Client

func init() {
	vodClient = InitVodClient()
}

func InitVodClient() *vod.Client {
	vodClient, err := vod.NewClientWithAccessKey(regionId, accessKeyId, accessKeySecret)
	if err != nil {
		panic(err)
	}

	return vodClient
}
