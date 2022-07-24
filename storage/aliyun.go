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

	res, err := bucket.ListObjects()
	if err != nil {
		panic(err)
	}

	//for _, object := range res.Objects {
	//	fmt.Printf("%s\n", object.Key)
	//}

	return res.Objects
}
