package object

import "testing"

func TestUpdateStoreFolders(t *testing.T) {
	InitConfig()
	InitStore()

	store := getStore("admin", "default")
	store.Populate()
}
