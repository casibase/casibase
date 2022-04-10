package object

import "testing"

func TestUploadVectorNames(t *testing.T) {
	InitConfig()

	uploadVectorNames("admin", "../../tmpFiles/filename")
}
