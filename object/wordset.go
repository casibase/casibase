package object

import (
	"fmt"

	"github.com/casbin/casibase/util"
	"xorm.io/core"
)

type Wordset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName   string `xorm:"varchar(100)" json:"displayName"`
	DistanceLimit int    `json:"distanceLimit"`
	Vectorset     string `xorm:"varchar(100)" json:"vectorset"`

	Vectors []*Vector `xorm:"mediumtext" json:"vectors"`
}

func GetGlobalWordsets() ([]*Wordset, error) {
	wordsets := []*Wordset{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&wordsets)
	if err != nil {
		return wordsets, err
	}

	return wordsets, nil
}

func GetWordsets(owner string) ([]*Wordset, error) {
	wordsets := []*Wordset{}
	err := adapter.engine.Desc("created_time").Find(&wordsets, &Wordset{Owner: owner})
	if err != nil {
		return wordsets, err
	}

	return wordsets, nil
}

func getWordset(owner string, name string) (*Wordset, error) {
	wordset := Wordset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&wordset)
	if err != nil {
		return &wordset, err
	}

	if existed {
		return &wordset, nil
	} else {
		return nil, nil
	}
}

func GetWordset(id string) (*Wordset, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getWordset(owner, name)
}

func UpdateWordset(id string, wordset *Wordset) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getWordset(owner, name)
	if err != nil {
		return false, err
	}
	if wordset == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(wordset)
	if err != nil {
		return false, err
	}

	//return affected != 0
	return true, nil
}

func AddWordset(wordset *Wordset) (bool, error) {
	affected, err := adapter.engine.Insert(wordset)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteWordset(wordset *Wordset) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{wordset.Owner, wordset.Name}).Delete(&Wordset{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (wordset *Wordset) GetId() string {
	return fmt.Sprintf("%s/%s", wordset.Owner, wordset.Name)
}
