package casdoor

import (
	"fmt"

	"github.com/astaxie/beego"
	"github.com/casbin/casibase/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

func ListResources(prefix string) ([]*casdoorsdk.Resource, error) {
	prefix = util.GetIdFromOwnerAndName(fmt.Sprintf("/resource/%s/%s/casibase",
		beego.AppConfig.String("casdoorOrganization"),
		beego.AppConfig.String("casdoorApplication")), prefix)

	result := make([]*casdoorsdk.Resource, 0)
	err := adapter.Engine.Where("name like ?", prefix+"%").Find(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func GetResource(key string) (*casdoorsdk.Resource, error) {
	id := util.GetIdFromOwnerAndName(fmt.Sprintf("/resource/%s/%s/casibase",
		beego.AppConfig.String("casdoorOrganization"),
		beego.AppConfig.String("casdoorApplication")), key)
	resource := casdoorsdk.Resource{Owner: CasdoorOrganization, Name: id}
	existed, err := adapter.Engine.Get(&resource)
	if err != nil {
		return nil, err
	}

	if existed {
		return &resource, nil
	} else {
		return nil, fmt.Errorf("resource %s not found", key)
	}
}
