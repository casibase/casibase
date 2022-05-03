package object

import (
	"testing"
)

func TestInitSyncGitter(t *testing.T) {
	InitAdapter()

	// delete all sync gitter data
	var roomId = "test"
	node := GetNode(roomId)
	node.DeleteAllTopicsHard()

	SyncGitter()
}
