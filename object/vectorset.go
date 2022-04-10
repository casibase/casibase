package object

import (
	"fmt"

	"github.com/casbin/casbase/util"
	"xorm.io/core"
)

type Vectorset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(500)" json:"displayName"`
	Url         string `xorm:"varchar(100)" json:"url"`
	FileName    string `xorm:"varchar(100)" json:"fileName"`
	FileSize    string `xorm:"varchar(100)" json:"fileSize"`
	Dimension   int    `json:"dimension"`
	Count       int    `json:"count"`

	Vectors   []*Vector          `xorm:"mediumtext" json:"vectors"`
	VectorMap map[string]*Vector `xorm:"-" json:"vectorMap"`
}

func GetGlobalVectorsets() []*Vectorset {
	vectorsets := []*Vectorset{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&vectorsets)
	if err != nil {
		panic(err)
	}

	return vectorsets
}

func GetVectorsets(owner string) []*Vectorset {
	vectorsets := []*Vectorset{}
	err := adapter.engine.Desc("created_time").Find(&vectorsets, &Vectorset{Owner: owner})
	if err != nil {
		panic(err)
	}

	return vectorsets
}

func getVectorset(owner string, name string) *Vectorset {
	vectorset := Vectorset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&vectorset)
	if err != nil {
		panic(err)
	}

	if existed {
		return &vectorset
	} else {
		return nil
	}
}

func GetVectorset(id string) *Vectorset {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getVectorset(owner, name)
}

func UpdateVectorset(id string, vectorset *Vectorset) bool {
	owner, name := util.GetOwnerAndNameFromId(id)
	if getVectorset(owner, name) == nil {
		return false
	}

	_, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(vectorset)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddVectorset(vectorset *Vectorset) bool {
	affected, err := adapter.engine.Insert(vectorset)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteVectorset(vectorset *Vectorset) bool {
	affected, err := adapter.engine.ID(core.PK{vectorset.Owner, vectorset.Name}).Delete(&Vectorset{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func (vectorset *Vectorset) GetId() string {
	return fmt.Sprintf("%s/%s", vectorset.Owner, vectorset.Name)
}
