package object

import "testing"

func TestUpdateStoreFolders(t *testing.T) {
	InitConfig()

	objects, _ := storageProvider.List("/")
	for _, object := range objects {
		println(object.Path)
	}
}
