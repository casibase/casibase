package storage

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/astaxie/beego"
	"github.com/casbin/casibase/casdoor"
	"github.com/casbin/casibase/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type casdoorClient struct {
	Storage
}

func NewCasdoorStorage() Storage {
	return &casdoorClient{}
}

func (s *casdoorClient) Get(key string) (io.ReadCloser, error) {
	res, err := casdoor.GetResource(key)
	if err != nil {
		return nil, err
	}

	response, err := http.Get(res.Url)
	if err != nil {
		return nil, err
	}

	return response.Body, nil
}

func (s *casdoorClient) Put(user, key string, bytes []byte) error {
	_, _, err := casdoorsdk.UploadResource(user, "Casibase", "Casibase",
		util.GetIdFromOwnerAndName(fmt.Sprintf("/resource/%s/%s/casibase",
			beego.AppConfig.String("casdoorOrganization"),
			beego.AppConfig.String("casdoorApplication")), key), bytes)
	if err != nil {
		return err
	}
	return nil
}

func (s *casdoorClient) Delete(key string) error {
	_, err := casdoorsdk.DeleteResource(util.GetIdFromOwnerAndName(fmt.Sprintf("/resource/%s/%s/casibase",
		beego.AppConfig.String("casdoorOrganization"),
		beego.AppConfig.String("casdoorApplication")), key))
	if err != nil {
		return err
	}
	return nil
}

func (s *casdoorClient) List(prefix string) ([]*Object, error) {
	res, err := casdoor.ListResources(prefix)
	if err != nil {
		return nil, err
	}

	result := make([]*Object, 0)
	for _, r := range res {
		created, _ := time.Parse(time.RFC3339, r.CreatedTime)
		result = append(result, &Object{
			Key:          util.GetNameFromIdNoCheck(r.Name),
			LastModified: &created,
			Storage:      s,
		})
	}

	return result, nil
}
