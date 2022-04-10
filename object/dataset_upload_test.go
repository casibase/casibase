package object

import "testing"

func TestUploadVectorNames(t *testing.T) {
	InitConfig()

	uploadVectorNames("admin", "../../tmpFiles/filename")
}

func TestUpdateWordsetVectors(t *testing.T) {
	InitConfig()

	vectors := readVectorData("../../tmpFiles/wordVector_utf-8")
	updateWordsetVectors("admin", "word", vectors)
}
