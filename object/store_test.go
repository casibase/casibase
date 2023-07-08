package object

import "testing"

func TestUpdateStoreFolders(t *testing.T) {
	InitConfig()

	store, err := getStore("admin", "default")
	if err != nil {
		panic(err)
	}

	//err = store.Populate()
	//if err != nil {
	//	panic(err)
	//}

	_, err = store.GetVideoData()
	if err != nil {
		panic(err)
	}
}
