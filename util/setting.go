package util

import "fmt"

func GetUploadXlsxPath(fileId string) string {
	return fmt.Sprintf("tmpFiles/%s.xlsx", fileId)
}

func GetUploadCsvPath(fileId string) string {
	return fmt.Sprintf("tmpFiles/%s.csv", fileId)
}
