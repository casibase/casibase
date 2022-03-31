package i18n

import "testing"

func TestGenerateI18nStrings(t *testing.T) {
	dataEn := parseToData()
	writeI18nFile("en", dataEn)

	dataZh := readI18nFile("zh")
	println(dataZh)

	applyData(dataEn, dataZh)
	writeI18nFile("zh", dataEn)
}
