package object

import (
	"fmt"

	"github.com/casbin/casibase/util"
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

	Vectors    []*Vector          `xorm:"mediumtext" json:"vectors"`
	AllVectors []*Vector          `xorm:"-" json:"allVectors"`
	VectorMap  map[string]*Vector `xorm:"-" json:"vectorMap"`
}

func GetGlobalVectorsets() ([]*Vectorset, error) {
	vectorsets := []*Vectorset{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&vectorsets)
	if err != nil {
		return vectorsets, err
	}

	return vectorsets, nil
}

func GetVectorsets(owner string) ([]*Vectorset, error) {
	vectorsets := []*Vectorset{}
	err := adapter.engine.Desc("created_time").Find(&vectorsets, &Vectorset{Owner: owner})
	if err != nil {
		return vectorsets, err
	}

	return vectorsets, nil
}

func getVectorset(owner string, name string) (*Vectorset, error) {
	vectorset := Vectorset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&vectorset)
	if err != nil {
		return &vectorset, err
	}

	if existed {
		return &vectorset, nil
	} else {
		return nil, nil
	}
}

func GetVectorset(id string) (*Vectorset, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getVectorset(owner, name)
}

func UpdateVectorset(id string, vectorset *Vectorset) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getVectorset(owner, name)
	if err != nil {
		return false, err
	}
	if vectorset == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(vectorset)
	if err != nil {
		return false, err
	}

	//return affected != 0
	return true, nil
}

func AddVectorset(vectorset *Vectorset) (bool, error) {
	affected, err := adapter.engine.Insert(vectorset)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteVectorset(vectorset *Vectorset) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{vectorset.Owner, vectorset.Name}).Delete(&Vectorset{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (vectorset *Vectorset) GetId() string {
	return fmt.Sprintf("%s/%s", vectorset.Owner, vectorset.Name)
}
