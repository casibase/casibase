package storage

import "github.com/aliyun/aliyun-oss-go-sdk/oss"

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

func ListObjects(bucketName string) []oss.ObjectProperties {
	bucket := getBucket(bucketName)

	res := []oss.ObjectProperties{}
	marker := oss.Marker("")
	i := 0
	for {
		resp, err := bucket.ListObjects(oss.MaxKeys(1000), marker)
		if err != nil {
			panic(err)
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

func DeleteObject(bucketName string, key string) {
	bucket := getBucket(bucketName)

	err := bucket.DeleteObject(key)
	if err != nil {
		panic(err)
	}
}
