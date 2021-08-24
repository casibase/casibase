package object

import (
	"strconv"

	beego "github.com/beego/beego/v2/adapter"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

var CasdoorOrganization = beego.AppConfig.String("casdoorOrganization")

func CreateCasdoorUserFromMember(member *Member) *auth.User {
	if member == nil {
		return nil
	}

	properties := map[string]string{}
	properties["checkinDate"] = member.CheckinDate
	properties["emailVerifiedTime"] = member.EmailVerifiedTime
	properties["phoneVerifiedTime"] = member.PhoneVerifiedTime
	properties["oauth_QQ_displayName"] = member.QQAccount
	properties["oauth_QQ_id"] = member.QQOpenId
	properties["oauth_QQ_verifiedTime"] = member.QQVerifiedTime
	properties["oauth_WeChat_displayName"] = member.WechatAccount
	properties["oauth_WeChat_id"] = member.WechatOpenId
	properties["oauth_WeChat_verifiedTime"] = member.WechatVerifiedTime
	properties["editorType"] = member.EditorType
	properties["fileQuota"] = strconv.Itoa(member.FileQuota)
	properties["renameQuota"] = strconv.Itoa(member.RenameQuota)

	user := &auth.User{
		Owner:             CasdoorOrganization,
		Name:              member.Id,
		CreatedTime:       member.CreatedTime,
		UpdatedTime:       member.LastActionDate,
		Id:                util.GenerateId(),
		Type:              "normal-user",
		Password:          member.Password,
		DisplayName:       member.Id,
		Avatar:            member.Avatar,
		Email:             member.Email,
		Phone:             member.Phone,
		Location:          member.Location,
		Affiliation:       member.Company,
		Title:             member.CompanyTitle,
		Homepage:          member.Website,
		Bio:               member.Bio,
		Tag:               member.Tagline,
		Language:          member.Language,
		Score:             member.Score,
		Ranking:           member.No,
		IsOnline:          member.OnlineStatus,
		IsAdmin:           member.IsModerator,
		IsGlobalAdmin:     false,
		IsForbidden:       false,
		SignupApplication: CasdoorApplication,
		QQ:                member.QQOpenId,
		WeChat:            member.WechatOpenId,
		Properties:        properties,
	}
	return user
}
