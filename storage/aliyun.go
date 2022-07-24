package storage

import "github.com/aliyun/aliyun-oss-go-sdk/oss"

func ListObjects(bucketName string) []oss.ObjectProperties {
	client, err := oss.New(endpoint, clientId, clientSecret)
	if err != nil {
		panic(err)
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		panic(err)
	}

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
