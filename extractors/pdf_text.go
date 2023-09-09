package extractor

import (
	"fmt"
	"os"
	"strings"

	"github.com/ledongthuc/pdf"
)

func GetPdfTextFromUrl(url string) (string, error) {
	localPath, err := getLocalPathFromUrl(url)
	if err != nil {
		return "", err
	}

	defer func() {
		err := os.Remove(localPath)
		if err != nil {
			fmt.Println("remove file error: ", err)
		}
	}()

	text, err := getPdfTextFromLocalPath(localPath)
	if err != nil {
		return "", err
	}

	return text, nil
}

func getPdfTextFromLocalPath(path string) (string, error) {
	f, r, err := pdf.Open(path)
	defer f.Close()
	if err != nil {
		return "", err
	}
	totalPage := r.NumPage()
	var mergedTexts []string

	for pageIndex := 1; pageIndex <= totalPage; pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() {
			continue
		}
		var lastTextStyle pdf.Text
		var mergedSentence string

		texts := p.Content().Text
		for _, text := range texts {
			if isSameLine(text, lastTextStyle) {
				mergedSentence += text.S
			} else {
				if mergedSentence != "" {
					mergedTexts = append(mergedTexts, mergedSentence)
				}
				lastTextStyle = text
				mergedSentence = text.S
			}
		}

		if mergedSentence != "" {
			mergedTexts = append(mergedTexts, mergedSentence)
		}
	}

	mergedText := strings.Join(mergedTexts, "\n")

	fmt.Println(mergedText)

	return mergedText, nil
}

func isSameLine(text1, text2 pdf.Text) bool {
	return text1.Y == text2.Y
}
