package object

import (
	"fmt"
	"testing"
)

func TestDoVectorsetTsne(t *testing.T) {
	InitConfig()

	dimension := 5

	//vectorset := getVectorset("admin", "wikipedia")
	vectorset := getVectorset("admin", "wordVector_utf-8")
	vectorset.LoadVectors("../../tmpFiles/")
	vectorset.DoTsne(dimension)

	vectorset.Name = fmt.Sprintf("%s_Dim_%d", vectorset.Name, dimension)
	vectorset.FileName = fmt.Sprintf("%s.ob", vectorset.FileName)
	vectorset.FileSize = ""
	vectorset.Dimension = dimension
	vectorset.WriteVectors("../../tmpFiles/")
	AddVectorset(vectorset)
}
