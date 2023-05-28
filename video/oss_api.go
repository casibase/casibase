package video

import (
	"bytes"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

func getOssClient(endpoint string, accessKeyId string, accessKeySecret string, securityToken string) *oss.Client {
	client, err := oss.New(endpoint, accessKeyId, accessKeySecret, oss.SecurityToken(securityToken))
	if err != nil {
		panic(err)
	}

	return client
}

func uploadLocalFile(ossClient *oss.Client, bucketName string, objectKey string, fileBuffer *bytes.Buffer) {
	bucket, err := ossClient.Bucket(bucketName)
	if err != nil {
		panic(err)
	}

	err = bucket.PutObject(objectKey, fileBuffer)
	if err != nil {
		panic(err)
	}
}
