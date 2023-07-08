package storage

import (
	"bytes"
	"fmt"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

func getBucket(bucketName string) (*oss.Bucket, error) {
	client, err := oss.New(endpoint, clientId, clientSecret)
	if err != nil {
		panic(err)
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		return nil, err
	}

	return bucket, nil
}

func ListObjects(bucketName string, prefix string) ([]oss.ObjectProperties, error) {
	if bucketName == "" {
		return nil, fmt.Errorf("bucket name is empty")
	}

	bucket, err := getBucket(bucketName)
	if err != nil {
		return nil, err
	}

	res := []oss.ObjectProperties{}
	marker := oss.Marker("")
	i := 0
	for {
		resp, err := bucket.ListObjects(oss.Prefix(prefix), oss.MaxKeys(1000), marker)
		if err != nil {
			return nil, err
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

	return res, nil
}

func PutObject(bucketName string, key string, fileBuffer *bytes.Buffer) error {
	bucket, err := getBucket(bucketName)
	if err != nil {
		return err
	}

	err = bucket.PutObject(key, fileBuffer)
	return err
}

func DeleteObject(bucketName string, key string) error {
	bucket, err := getBucket(bucketName)
	if err != nil {
		return err
	}

	err = bucket.DeleteObject(key)
	return err
}
