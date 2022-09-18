package util

import (
	"net/url"
	"os"
	"strings"
)

func FileExist(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

func FilterQuery(urlString string, blackList []string) string {
	urlData, err := url.Parse(urlString)
	if err != nil {
		return urlString
	}

	queries := urlData.Query()
	retQuery := make(url.Values)
	inBlackList := false
	for key, value := range queries {
		inBlackList = false
		for _, blackListItem := range blackList {
			if blackListItem == key {
				inBlackList = true
				break
			}
		}
		if !inBlackList {
			retQuery[key] = value
		}
	}
	if len(retQuery) > 0 {
		return urlData.Path + "?" + strings.ReplaceAll(retQuery.Encode(), "%2F", "/")
	} else {
		return urlData.Path
	}
}
