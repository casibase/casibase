package object

import (
	"github.com/casdoor/casdoor/storage"
	"github.com/casdoor/oss"
)

var storageProvider oss.StorageInterface

func init() {
	storageProvider = storage.GetStorageProvider(providerType, clientId, clientSecret, region, bucket, endpoint)
}
