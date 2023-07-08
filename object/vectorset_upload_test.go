package object

import "testing"

func TestUpdateVectorsetVectors(t *testing.T) {
	InitConfig()

	//vectorset := getVectorset("admin", "wikipedia")
	vectorset, _ := getVectorset("admin", "wordVector_utf-8")
	vectorset.LoadVectors("../../tmpFiles/")
	UpdateVectorset(vectorset.GetId(), vectorset)
}
