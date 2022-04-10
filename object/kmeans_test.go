package object

import "testing"

func TestUpdateWordsetVectorCategories(t *testing.T) {
	InitConfig()

	updateWordsetVectorCategories("admin", "word")
}
