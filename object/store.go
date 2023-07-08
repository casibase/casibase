package object

import (
	"fmt"

	"github.com/casbin/casibase/util"
	"xorm.io/core"
)

type File struct {
	Key         string  `xorm:"varchar(100)" json:"key"`
	Title       string  `xorm:"varchar(100)" json:"title"`
	Size        int64   `json:"size"`
	CreatedTime string  `xorm:"varchar(100)" json:"createdTime"`
	IsLeaf      bool    `json:"isLeaf"`
	Children    []*File `xorm:"varchar(1000)" json:"children"`

	ChildrenMap map[string]*File `xorm:"-" json:"-"`
}

type Properties struct {
	CollectedTime string `xorm:"varchar(100)" json:"collectedTime"`
	Subject       string `xorm:"varchar(100)" json:"subject"`
}

type Store struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Bucket string `xorm:"varchar(100)" json:"bucket"`
	Domain string `xorm:"varchar(100)" json:"domain"`

	FileTree      *File                  `xorm:"mediumtext" json:"fileTree"`
	PropertiesMap map[string]*Properties `xorm:"mediumtext" json:"propertiesMap"`
}

func GetGlobalStores() ([]*Store, error) {
	stores := []*Store{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&stores)
	if err != nil {
		return stores, err
	}

	return stores, nil
}

func GetStores(owner string) ([]*Store, error) {
	stores := []*Store{}
	err := adapter.engine.Desc("created_time").Find(&stores, &Store{Owner: owner})
	if err != nil {
		return stores, err
	}

	return stores, nil
}

func getStore(owner string, name string) (*Store, error) {
	store := Store{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&store)
	if err != nil {
		return &store, err
	}

	if existed {
		return &store, nil
	} else {
		return nil, nil
	}
}

func GetStore(id string) (*Store, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getStore(owner, name)
}

func UpdateStore(id string, store *Store) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getStore(owner, name)
	if err != nil {
		return false, err
	}
	if store == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(store)
	if err != nil {
		return false, err
	}

	//return affected != 0
	return true, nil
}

func AddStore(store *Store) (bool, error) {
	affected, err := adapter.engine.Insert(store)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteStore(store *Store) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{store.Owner, store.Name}).Delete(&Store{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (store *Store) GetId() string {
	return fmt.Sprintf("%s/%s", store.Owner, store.Name)
}
