package casdoor

import (
	"github.com/casbin/casbase/util"
	"xorm.io/core"
)

type Permission struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Users   []string `xorm:"mediumtext" json:"users"`
	Roles   []string `xorm:"mediumtext" json:"roles"`
	Domains []string `xorm:"mediumtext" json:"domains"`

	Model        string   `xorm:"varchar(100)" json:"model"`
	ResourceType string   `xorm:"varchar(100)" json:"resourceType"`
	Resources    []string `xorm:"mediumtext" json:"resources"`
	Actions      []string `xorm:"mediumtext" json:"actions"`
	Effect       string   `xorm:"varchar(100)" json:"effect"`
	IsEnabled    bool     `json:"isEnabled"`

	Submitter   string `xorm:"varchar(100)" json:"submitter"`
	Approver    string `xorm:"varchar(100)" json:"approver"`
	ApproveTime string `xorm:"varchar(100)" json:"approveTime"`
	State       string `xorm:"varchar(100)" json:"state"`
}

func GetPermissions(owner string) []*Permission {
	permissions := []*Permission{}
	err := adapter.Engine.Desc("created_time").Find(&permissions, &Permission{Owner: owner})
	if err != nil {
		panic(err)
	}

	return permissions
}

func getPermission(owner string, name string) *Permission {
	if owner == "" || name == "" {
		return nil
	}

	permission := Permission{Owner: owner, Name: name}
	existed, err := adapter.Engine.Get(&permission)
	if err != nil {
		panic(err)
	}

	if existed {
		return &permission
	} else {
		return nil
	}
}

func GetPermission(id string) *Permission {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getPermission(owner, name)
}

func UpdatePermission(id string, permission *Permission) bool {
	owner, name := util.GetOwnerAndNameFromId(id)
	oldPermission := getPermission(owner, name)
	if oldPermission == nil {
		return false
	}

	affected, err := adapter.Engine.ID(core.PK{owner, name}).AllCols().Update(permission)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddPermission(permission *Permission) bool {
	affected, err := adapter.Engine.Insert(permission)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeletePermission(permission *Permission) bool {
	affected, err := adapter.Engine.ID(core.PK{permission.Owner, permission.Name}).Delete(&Permission{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}
