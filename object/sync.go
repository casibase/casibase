package object

import (
	"github.com/casdoor/casdoor-go-sdk/auth"
)

func GetMembersFromCasdoor() []*auth.User {
	users, err := auth.GetUsers()
	if err != nil {
		panic(err)
	}

	return users
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func Limit(members []*auth.User, start, limit int) []*auth.User {
	if start >= len(members) {
		return nil
	}

	end := minInt(len(members), start+limit)
	return members[start:end]
}

func GetMemberFromCasdoor(id string) *auth.User {
	user, err := auth.GetUser(id)
	if err != nil {
		return nil
	}

	return user
}

func UpdateMembersToCasdoor(members []*auth.User) bool {
	for _, member := range members {
		affected, err := auth.UpdateUser(*member)
		if !affected || err != nil {
			return affected
		}
	}
	return true
}

func GetMemberAvatarMapping() map[string]string {
	members := GetMembersFromCasdoor()
	membersAvatar := make(map[string]string)
	for _, member := range members {
		membersAvatar[member.Name] = member.Avatar
	}
	return membersAvatar
}
