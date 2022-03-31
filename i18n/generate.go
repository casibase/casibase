package i18n

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/casbin/casbase/util"
)

type I18nData map[string]map[string]string

var reI18n *regexp.Regexp

func init() {
	reI18n, _ = regexp.Compile("i18next.t\\(\"(.*)\"\\)")
}

func getAllI18nStrings(fileContent string) []string {
	res := []string{}

	matches := reI18n.FindAllStringSubmatch(fileContent, -1)
	if matches == nil {
		return res
	}

	for _, match := range matches {
		res = append(res, match[1])
	}
	return res
}

func getAllJsFilePaths() []string {
	path := "../web/src"

	res := []string{}
	err := filepath.Walk(path,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if !strings.HasSuffix(info.Name(), ".js") {
				return nil
			}

			res = append(res, path)
			fmt.Println(path, info.Name())
			return nil
		})
	if err != nil {
		panic(err)
	}

	return res
}

func parseToData() *I18nData {
	allWords := []string{}
	paths := getAllJsFilePaths()
	for _, path := range paths {
		fileContent := util.ReadStringFromPath(path)
		words := getAllI18nStrings(fileContent)
		allWords = append(allWords, words...)
	}
	fmt.Printf("%v\n", allWords)

	data := I18nData{}
	for _, word := range allWords {
		tokens := strings.Split(word, ":")
		namespace := tokens[0]
		key := tokens[1]

		if _, ok := data[namespace]; !ok {
			data[namespace] = map[string]string{}
		}
		data[namespace][key] = key
	}

	return &data
}
