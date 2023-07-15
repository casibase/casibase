package object

import (
	"fmt"

	"github.com/casbin/casibase/util"
	"xorm.io/core"
)

type Provider struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName  string `xorm:"varchar(100)" json:"displayName"`
	Category     string `xorm:"varchar(100)" json:"category"`
	Type         string `xorm:"varchar(100)" json:"type"`
	ClientId     string `xorm:"varchar(100)" json:"clientId"`
	ClientSecret string `xorm:"varchar(2000)" json:"clientSecret"`
	ProviderUrl  string `xorm:"varchar(200)" json:"providerUrl"`
}

func GetGlobalProviders() ([]*Provider, error) {
	providers := []*Provider{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&providers)
	if err != nil {
		return providers, err
	}

	return providers, nil
}

func GetProviders(owner string) ([]*Provider, error) {
	providers := []*Provider{}
	err := adapter.engine.Desc("created_time").Find(&providers, &Provider{Owner: owner})
	if err != nil {
		return providers, err
	}

	return providers, nil
}

func getProvider(owner string, name string) (*Provider, error) {
	provider := Provider{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&provider)
	if err != nil {
		return &provider, err
	}

	if existed {
		return &provider, nil
	} else {
		return nil, nil
	}
}

func GetProvider(id string) (*Provider, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getProvider(owner, name)
}

func UpdateProvider(id string, provider *Provider) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getProvider(owner, name)
	if err != nil {
		return false, err
	}
	if provider == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(provider)
	if err != nil {
		return false, err
	}

	//return affected != 0
	return true, nil
}

func AddProvider(provider *Provider) (bool, error) {
	affected, err := adapter.engine.Insert(provider)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteProvider(provider *Provider) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{provider.Owner, provider.Name}).Delete(&Provider{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (provider *Provider) GetId() string {
	return fmt.Sprintf("%s/%s", provider.Owner, provider.Name)
}
