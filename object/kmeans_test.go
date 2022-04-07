package object

import "testing"

func TestUpdateDatasetVectorCategories(t *testing.T) {
	InitConfig()

	updateDatasetVectorCategories("admin", "word")
}
