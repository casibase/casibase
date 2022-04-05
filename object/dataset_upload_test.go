package object

import "testing"

func TestUploadVectorNames(t *testing.T) {
	InitConfig()

	uploadVectorNames("admin", "../../tmpFiles/filename")
}

func TestUploadVectorData(t *testing.T) {
	InitConfig()

	vectors := readVectorData("../../tmpFiles/wordVector_utf-8")
	println(vectors)
}
