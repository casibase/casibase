package i18n

import (
	"fmt"

	"github.com/casbin/casbase/util"
)

func getI18nFilePath(language string) string {
	return fmt.Sprintf("../web/src/locales/%s/data.json", language)
}

func readI18nFile(language string) *I18nData {
	s := util.ReadStringFromPath(getI18nFilePath(language))

	data := &I18nData{}
	err := util.JsonToStruct(s, data)
	if err != nil {
		panic(err)
	}
	return data
}

func writeI18nFile(language string, data *I18nData) {
	s := util.StructToJson(data)
	println(s)

	util.WriteStringToPath(s, getI18nFilePath(language))
}

func applyData(data1 *I18nData, data2 *I18nData) {
	for namespace, pairs2 := range *data2 {
		if _, ok := (*data1)[namespace]; !ok {
			continue
		}

		pairs1 := (*data1)[namespace]

		for key, value := range pairs2 {
			if _, ok := pairs1[key]; !ok {
				continue
			}

			pairs1[key] = value
		}
	}
}
