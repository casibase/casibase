package object

import (
	"github.com/casbin/casbase/util"
	"xorm.io/core"
)

type TreeItem struct {
	Key       string      `xorm:"varchar(100)" json:"key"`
	Title     string      `xorm:"varchar(100)" json:"title"`
	Content   string      `xorm:"mediumtext" json:"content"`
	TitleEn   string      `xorm:"varchar(100)" json:"titleEn"`
	ContentEn string      `xorm:"mediumtext" json:"contentEn"`
	Children  []*TreeItem `xorm:"varchar(1000)" json:"children"`
}

type Dataset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	StartDate string `xorm:"varchar(100)" json:"startDate"`
	EndDate   string `xorm:"varchar(100)" json:"endDate"`
	FullName  string `xorm:"varchar(100)" json:"fullName"`
	Organizer string `xorm:"varchar(100)" json:"organizer"`
	Location  string `xorm:"varchar(100)" json:"location"`
	Address   string `xorm:"varchar(100)" json:"address"`
	Status    string `xorm:"varchar(100)" json:"status"`
	Language  string `xorm:"varchar(100)" json:"language"`

	Tags        []string    `xorm:"mediumtext" json:"tags"`
	Carousels   []string    `xorm:"mediumtext" json:"carousels"`
	IntroText   string      `xorm:"mediumtext" json:"introText"`
	DefaultItem string      `xorm:"mediumtext" json:"defaultItem"`
	TreeItems   []*TreeItem `xorm:"mediumtext" json:"treeItems"`
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
