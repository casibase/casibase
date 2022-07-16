package object

import (
	"fmt"

	"github.com/casbin/casbase/util"
	"xorm.io/core"
)

type Folder struct {
	Name     string    `xorm:"varchar(100)" json:"name"`
	Desc     string    `xorm:"mediumtext" json:"desc"`
	Children []*Folder `xorm:"varchar(1000)" json:"children"`
}

type Store struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Folders []*Folder `xorm:"mediumtext" json:"folders"`
}

func GetGlobalStores() []*Store {
	stores := []*Store{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&stores)
	if err != nil {
		panic(err)
	}

	return stores
}

func GetStores(owner string) []*Store {
	stores := []*Store{}
	err := adapter.engine.Desc("created_time").Find(&stores, &Store{Owner: owner})
	if err != nil {
		panic(err)
	}

	return stores
}

func getStore(owner string, name string) *Store {
	store := Store{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&store)
	if err != nil {
		panic(err)
	}

	if existed {
		return &store
	} else {
		return nil
	}
}

func GetStore(id string) *Store {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getStore(owner, name)
}

func UpdateStore(id string, store *Store) bool {
	owner, name := util.GetOwnerAndNameFromId(id)
	if getStore(owner, name) == nil {
		return false
	}

	_, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(store)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddStore(store *Store) bool {
	affected, err := adapter.engine.Insert(store)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteStore(store *Store) bool {
	affected, err := adapter.engine.ID(core.PK{store.Owner, store.Name}).Delete(&Store{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func (store *Store) GetId() string {
	return fmt.Sprintf("%s/%s", store.Owner, store.Name)
}
