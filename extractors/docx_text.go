package extractor

import (
	"fmt"
	"os"
	"strings"

	"github.com/unidoc/unioffice/document"
)

func GetDocxTextFromUrl(url string) (string, error) {
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

	text, err := getDocxTextFromLocalPath(localPath)
	if err != nil {
		return "", err
	}

	return text, nil
}

func getDocxTextFromLocalPath(path string) (string, error) {
	docx, err := document.Open(path)
	if err != nil {
		return "", fmt.Errorf("failed to open DOCX file: %v", err)
	}

	var paragraphs []string

	for _, para := range docx.Paragraphs() {
		var paraText string

		for _, run := range para.Runs() {
			paraText += run.Text()
		}

		if len(para.Runs()) > 1 {
			paragraphs = append(paragraphs, paraText+"\n\n")
		} else {
			paragraphs = append(paragraphs, paraText+"\n")
		}
	}

	if len(paragraphs) == 0 {
		return "", fmt.Errorf("DOCX file is empty")
	}

	text := strings.Join(paragraphs, "")

	return text, nil
}
