package object

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
)

type Translator struct {
	Id         string `xorm:"varchar(50) notnull pk" json:"id"`
	Name       string `xorm:"varchar(50)" json:"name"`
	Translator string `xorm:"varchar(50)" json:"translator"`
	Key        string `xorm:"varchar(200)" json:"key"`
	Enable     bool   `xorm:"bool" json:"enable"`
	Visible    bool   `xorm:"bool" json:"visible"`
}

type TranslateData struct {
	SrcLang string `json:"srcLang"`
	Target  string `json:"target"`
	ErrMsg  string `json:"err_msg"`
}

type GoogleTranslationResult struct {
	Data struct {
		Translations []struct {
			TranslatedText         string `json:"translatedText"`
			DetectedSourceLanguage string `json:"detectedSourceLanguage"`
		} `json:"translations"`
	} `json:"data"`
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Errors  []struct {
			Message string `json:"message"`
			Domain  string `json:"domain"`
			Reason  string `json:"reason"`
		} `json:"errors"`
	} `json:"error"`
}

func StrTranslate(srcStr, targetLang string) *TranslateData {
	replaceStr := "<code>RplaceWithCasnodeTranslator<code/>"
	contentReg := regexp.MustCompile(`(?s)\x60{1,3}[^\x60](.*?)\x60{1,3}`)
	translateReg := regexp.MustCompile(replaceStr)
	translateData := &TranslateData{}

	translator := GetEnableTranslator()
	if translator == nil || !translator.Visible {
		translateData.ErrMsg = "Translate Failed"
		return translateData
	}

	codeBlocks := contentReg.FindAllString(srcStr, -1)
	var cbList []string

	if codeBlocks != nil {
		for _, cbItem := range codeBlocks {
			cbList = append(cbList, cbItem)
		}
	}

	srcStr = contentReg.ReplaceAllString(srcStr, replaceStr)

	params := url.Values{
		"target": {targetLang},
		"format": {"text"},
		"key":    {translator.Key},
		"q":      {srcStr},
	}
	resp, _ := http.PostForm("https://translation.googleapis.com/language/translate/v2", params)
	defer resp.Body.Close()

	respByte, _ := ioutil.ReadAll(resp.Body)
	var translateResp GoogleTranslationResult
	translateResp.Error.Code = 0

	err := json.Unmarshal(respByte, &translateResp)
	if err != nil {
		panic(err)
	}
	translateStr := translateResp.Data.Translations[0].TranslatedText
	detectSrcLang := translateResp.Data.Translations[0].DetectedSourceLanguage

	replacedCb := translateReg.FindAllString(translateStr, -1)
	var replacedCbList []string
	if replacedCb != nil {
		for _, replacedCbItem := range replacedCb {
			replacedCbList = append(replacedCbList, replacedCbItem)
		}
	}

	if len(replacedCbList) != len(codeBlocks) {
		translateData.ErrMsg = "Translate Failed"
		return translateData
	}

	replaceIndex := 0
	translateStr = translateReg.ReplaceAllStringFunc(translateStr, func(src string) string {
		replaceIndex = replaceIndex + 1
		return cbList[replaceIndex-1]
	})

	if translateResp.Error.Code != 0 {
		translateData.ErrMsg = translateResp.Error.Message
	} else {
		translateData.SrcLang = detectSrcLang
		translateData.Target = translateStr
	}

	return translateData
}

func AddTranslator(translator Translator) bool {
	affected, err := adapter.Engine.Insert(translator)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetTranslator(id string) *[]Translator {
	translators := []Translator{}
	var err error
	if id != "" {
		err = adapter.Engine.Where("id = ?", id).Find(&translators)
	} else {
		err = adapter.Engine.Find(&translators)
	}

	if err != nil {
		panic(err)
	}

	return &translators
}

func GetEnableTranslator() *Translator {
	var translator Translator
	resultNum, err := adapter.Engine.Where("enable = ?", true).Get(&translator)
	if err != nil {
		panic(err)
	}
	if resultNum {
		return &translator
	}
	return nil
}

func UpdateTranslator(translator Translator) bool {
	_, err := adapter.Engine.Where("enable = ?", true).Cols("enable").Update(Translator{Enable: false})
	if err != nil {
		return false
	}

	affected, err := adapter.Engine.Id(translator.Id).AllCols().Update(translator)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DelTranslator(id string) bool {
	affected, err := adapter.Engine.Where("id = ?", id).Delete(&Translator{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}
