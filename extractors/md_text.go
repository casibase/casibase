package extractor

import (
	"fmt"
	"os"
)

func GetMdTextFromUrl(url string) (string, error) {
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

	text, err := getMdTextFromLocalPath(localPath)
	if err != nil {
		return "", err
	}

	return text, nil
}

func getMdTextFromLocalPath(path string) (string, error) {
	mdContent, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read MD file: %v", err)
	}

	mdText := string(mdContent)

	return mdText, nil
}
