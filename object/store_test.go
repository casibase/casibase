package object

import "testing"

func TestUpdateStoreFolders(t *testing.T) {
	InitConfig()

	store, _ := getStore("admin", "default")
	//store.Populate()
	store.GetVideoData()
}
