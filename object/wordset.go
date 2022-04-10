package object

import (
	"fmt"

	"github.com/casbin/casbase/util"
	"xorm.io/core"
)

type Wordset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Distance    int    `json:"distance"`

	Vectors []*Vector `xorm:"mediumtext" json:"vectors"`
}

func GetGlobalWordsets() []*Wordset {
	wordsets := []*Wordset{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&wordsets)
	if err != nil {
		panic(err)
	}

	return wordsets
}

func GetWordsets(owner string) []*Wordset {
	wordsets := []*Wordset{}
	err := adapter.engine.Desc("created_time").Find(&wordsets, &Wordset{Owner: owner})
	if err != nil {
		panic(err)
	}

	return wordsets
}

func getWordset(owner string, name string) *Wordset {
	wordset := Wordset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&wordset)
	if err != nil {
		panic(err)
	}

	if existed {
		return &wordset
	} else {
		return nil
	}
}

func GetWordset(id string) *Wordset {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getWordset(owner, name)
}

func UpdateWordset(id string, wordset *Wordset) bool {
	owner, name := util.GetOwnerAndNameFromId(id)
	if getWordset(owner, name) == nil {
		return false
	}

	_, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(wordset)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddWordset(wordset *Wordset) bool {
	affected, err := adapter.engine.Insert(wordset)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteWordset(wordset *Wordset) bool {
	affected, err := adapter.engine.ID(core.PK{wordset.Owner, wordset.Name}).Delete(&Wordset{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func (wordset *Wordset) GetId() string {
	return fmt.Sprintf("%s/%s", wordset.Owner, wordset.Name)
}
