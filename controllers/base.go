package controllers

import (
	"encoding/gob"

	"github.com/astaxie/beego"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

type ApiController struct {
	beego.Controller
}

func init() {
	gob.Register(auth.Claims{})
}

func GetUserName(user *auth.User) string {
	if user == nil {
		return ""
	}

	return user.Name
}

func (c *ApiController) GetSessionClaims() *auth.Claims {
	s := c.GetSession("user")
	if s == nil {
		return nil
	}

	claims := s.(auth.Claims)
	return &claims
}

func (c *ApiController) SetSessionClaims(claims *auth.Claims) {
	if claims == nil {
		c.DelSession("user")
		return
	}

	c.SetSession("user", *claims)
}

func (c *ApiController) GetSessionUser() *auth.User {
	claims := c.GetSessionClaims()
	if claims == nil {
		return nil
	}

	return &claims.User
}

func (c *ApiController) SetSessionUser(user *auth.User) {
	if user == nil {
		c.DelSession("user")
		return
	}

	claims := c.GetSessionClaims()
	if claims != nil {
		claims.User = *user
		c.SetSessionClaims(claims)
	}
}

func (c *ApiController) GetSessionUsername() string {
	user := c.GetSessionUser()
	if user == nil {
		return ""
	}

	return GetUserName(user)
}
