package storage

import (
	"bytes"
	"fmt"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

func getBucket(bucketName string) *oss.Bucket {
	client, err := oss.New(endpoint, clientId, clientSecret)
	if err != nil {
		panic(err)
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		panic(err)
	}

	return bucket
}

func ListObjects(bucketName string, prefix string) []oss.ObjectProperties {
	res := []oss.ObjectProperties{}

	if bucketName == "" {
		return res
	}

	bucket := getBucket(bucketName)

	marker := oss.Marker("")
	i := 0
	for {
		resp, err := bucket.ListObjects(oss.Prefix(prefix), oss.MaxKeys(1000), marker)
		if err != nil {
			fmt.Println(err.Error())
			return res
		}

		marker = oss.Marker(resp.NextMarker)

		for _, object := range resp.Objects {
			res = append(res, object)
			//fmt.Printf("[%d] %s\n", i, object.Key)
			i += 1
		}

		if !resp.IsTruncated {
			break
		}
	}

	return res
}

func PutObject(bucketName string, key string, fileBuffer *bytes.Buffer) {
	bucket := getBucket(bucketName)

	err := bucket.PutObject(key, fileBuffer)
	if err != nil {
		panic(err)
	}
}

func DeleteObject(bucketName string, key string) {
	bucket := getBucket(bucketName)

	err := bucket.DeleteObject(key)
	if err != nil {
		panic(err)
	}
}
