package extractor

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func generateCacheFileName(originalFileName string) string {
	timestamp := time.Now().Unix()

	hash := sha1.New()
	hash.Write([]byte(originalFileName))
	hashValue := hex.EncodeToString(hash.Sum(nil))

	cacheFileName := fmt.Sprintf("%d_%s.cache", timestamp, hashValue)

	return cacheFileName
}

func getLocalPathFromUrl(url string) (string, error) {
	response, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("wrong status code: %d", response.StatusCode)
	}

	tempDir := os.TempDir()
	localFilePath := filepath.Join(tempDir, generateCacheFileName(url))
	localFile, err := os.Create(localFilePath)
	if err != nil {
		return "", err
	}
	defer localFile.Close()

	_, err = io.Copy(localFile, response.Body)
	if err != nil {
		return "", err
	}

	return localFilePath, nil
}
