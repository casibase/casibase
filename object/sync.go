package object

import (
	"fmt"
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
	properties["bio"] = member.Bio
	properties["checkinDate"] = member.CheckinDate
	properties["emailVerifiedTime"] = member.EmailVerifiedTime
	properties["phoneVerifiedTime"] = member.PhoneVerifiedTime
	properties["oauth_QQ_displayName"] = member.QQAccount
	properties["oauth_QQ_verifiedTime"] = member.QQVerifiedTime
	properties["fileQuota"] = strconv.Itoa(member.FileQuota)
	properties["oauth_WeChat_displayName"] = member.WechatAccount
	properties["oauth_WeChat_verifiedTime"] = member.WechatVerifiedTime
	properties["editorType"] = member.EditorType
	properties["renameQuota"] = strconv.Itoa(member.RenameQuota)
	properties["onlineStatus"] = fmt.Sprint(member.OnlineStatus)

	user := &auth.User{
		Owner:         CasdoorOrganization,
		Name:          member.Id,
		CreatedTime:   member.CreatedTime,
		UpdatedTime:   member.LastActionDate,
		Id:            util.GenerateId(),
		Type:          "normal-user",
		Password:      member.Password,
		DisplayName:   member.Id,
		Avatar:        member.Avatar,
		Email:         member.Email,
		Phone:         member.Phone,
		Location:      member.Location,
		Affiliation:   member.Company,
		Title:         member.CompanyTitle,
		Homepage:      member.Website,
		Tag:           member.Tagline,
		Language:      member.Language,
		Score:         member.Score,
		Ranking:       member.No,
		IsAdmin:       member.IsModerator,
		IsGlobalAdmin: false,
		IsForbidden:   false,
		Properties:    properties,
	}
	return user
}

func CreateMemberFromCasdoorUser(user *auth.User) *Member {
	if user == nil {
		return nil
	}

	fileQuota, _ := strconv.Atoi(user.Properties["fileQuota"])
	renameQuota, _ := strconv.Atoi(user.Properties["renameQuota"])
	onlineStatus := false
	if user.Properties["onlineStatus"] == "true" {
		onlineStatus = true
	}

	return &Member{
		Id:                 user.Name,
		CreatedTime:        user.CreatedTime,
		LastActionDate:     user.UpdatedTime,
		No:                 user.Ranking,
		Password:           user.Password,
		Avatar:             user.Avatar,
		Email:              user.Email,
		Phone:              user.Phone,
		Company:            user.Affiliation,
		CompanyTitle:       user.Title,
		Language:           user.Language,
		Score:              user.Score,
		IsModerator:        user.IsAdmin,
		QQOpenId:           user.QQ,
		WechatOpenId:       user.WeChat,
		Tagline:            user.Tag,
		Bio:                user.Properties["bio"],
		Website:            user.Homepage,
		Location:           user.Location,
		CheckinDate:        user.Properties["checkinDate"],
		EmailVerifiedTime:  user.Properties["emailVerifiedTime"],
		PhoneVerifiedTime:  user.Properties["phoneVerifiedTime"],
		QQAccount:          user.Properties["oauth_QQ_displayName"],
		QQVerifiedTime:     user.Properties["oauth_QQ_verifiedTime"],
		FileQuota:          fileQuota,
		WechatAccount:      user.Properties["oauth_WeChat_displayName"],
		WechatVerifiedTime: user.Properties["oauth_WeChat_verifiedTime"],
		EditorType:         user.Properties["editorType"],
		OnlineStatus:       onlineStatus,
		RenameQuota:        renameQuota,
	}
}

func ConvertFromCasdoorUsers(users []*auth.User) []*Member {
	var members []*Member
	var member *Member

	for _, user := range users {
		member = CreateMemberFromCasdoorUser(user)
		members = append(members, member)
	}

	return members
}

func GetMembersFromCasdoor() []*Member {
	users, err := auth.GetUsers()
	if err != nil {
		panic(err)
	}

	return ConvertFromCasdoorUsers(users)
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func Limit(users []*auth.User, start, limit int) []*auth.User {
	if start >= len(users) {
		return nil
	}

	end := minInt(len(users), start+limit)
	return users[start:end]
}

func GetMemberAvatarMapping() map[string]string {
	members := GetMembersFromCasdoor()
	memberAvatar := make(map[string]string)
	for _, member := range members {
		memberAvatar[member.Id] = member.Avatar
	}
	return memberAvatar
}
