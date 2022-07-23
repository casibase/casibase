package object

import "testing"

func TestUpdateStoreFolders(t *testing.T) {
	InitConfig()

	store := getStore("admin", "default")
	store.Populate()
}
