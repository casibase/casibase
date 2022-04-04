package object

import (
	"github.com/casbin/casbase/util"
	"xorm.io/core"
)

type Vector struct {
	Name string    `xorm:"varchar(100)" json:"name"`
	Data []float64 `xorm:"varchar(1000)" json:"data"`
}

type Dataset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Distance    int    `json:"distance"`

	Vectors []*Vector `xorm:"mediumtext" json:"vectors"`
}

func GetGlobalDatasets() []*Dataset {
	datasets := []*Dataset{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&datasets)
	if err != nil {
		panic(err)
	}

	return datasets
}

func GetDatasets(owner string) []*Dataset {
	datasets := []*Dataset{}
	err := adapter.engine.Desc("created_time").Find(&datasets, &Dataset{Owner: owner})
	if err != nil {
		panic(err)
	}

	return datasets
}

func getDataset(owner string, name string) *Dataset {
	dataset := Dataset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&dataset)
	if err != nil {
		panic(err)
	}

	if existed {
		return &dataset
	} else {
		return nil
	}
}

func GetDataset(id string) *Dataset {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getDataset(owner, name)
}

func UpdateDataset(id string, dataset *Dataset) bool {
	owner, name := util.GetOwnerAndNameFromId(id)
	if getDataset(owner, name) == nil {
		return false
	}

	_, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(dataset)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddDataset(dataset *Dataset) bool {
	affected, err := adapter.engine.Insert(dataset)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteDataset(dataset *Dataset) bool {
	affected, err := adapter.engine.ID(core.PK{dataset.Owner, dataset.Name}).Delete(&Dataset{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}
