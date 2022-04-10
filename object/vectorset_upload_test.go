package object

import "testing"

func TestUpdateVectorsetVectors(t *testing.T) {
	InitConfig()

	vectorset := getVectorset("admin", "wikipedia")
	vectorset.LoadVectors("../../tmpFiles/")
	UpdateVectorset(vectorset.GetId(), vectorset)
}
