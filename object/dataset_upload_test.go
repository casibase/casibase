package object

import "testing"

func TestUploadVectorNames(t *testing.T) {
	InitConfig()

	uploadVectorNames("admin", "../../tmpFiles/filename")
}

func TestUpdateDatasetVectors(t *testing.T) {
	InitConfig()

	vectors := readVectorData("../../tmpFiles/wordVector_utf-8")
	updateDatasetVectors("admin", "word", vectors)
}
