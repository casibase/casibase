// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package txt

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/carmel/gooxml/document"
	"github.com/pdfcpu/pdfcpu/pkg/api"
)

const (
	// Alibaba cloud market
	appCode    = ""
	apiHost    = "https://generalpdf.market.alicloudapi.com"
	apiPath    = "/ocrservice/pdf"
	pdfDirPath = "papar_QA_dataset\\papers"
	tmpDir     = "tmp_splits"
	outDir     = "outputdir"
)

type OcrResponse struct {
	FileBase64 string `json:"fileBase64"`
}

type RequestBody struct {
	FileBase64 string `json:"fileBase64"`
	FileType   string `json:"fileType"`
}

func processPdf(localPDFPath, number string) error {
	err := os.RemoveAll(tmpDir)
	if err != nil {
		return err
	}

	ctx, err := api.ReadContextFile(localPDFPath)
	if err != nil {
		return err
	}

	pageCount := ctx.PageCount
	fmt.Printf("Total pages: %d\n", pageCount)

	ans := ""
	batchSize := 20
	for start := 1; start <= pageCount; start += batchSize {
		err = os.Mkdir(tmpDir, 0o755)
		if err != nil {
			return err
		}

		end := start + batchSize - 1
		if end > pageCount {
			end = pageCount
		}

		rangeStr := fmt.Sprintf("%d-%d", start, end)
		err = api.ExtractPagesFile(localPDFPath, tmpDir, []string{rangeStr}, nil)
		if err != nil {
			return err
		}

		files, err := os.ReadDir(tmpDir)
		if err != nil {
			return err
		}

		pagesToMerge := []string{}
		for _, f := range files {
			if !f.IsDir() && filepath.Ext(f.Name()) == ".pdf" {
				pagesToMerge = append(pagesToMerge, filepath.Join(tmpDir, f.Name()))
			}
		}

		mergedFile := filepath.Join(tmpDir, fmt.Sprintf("merged_%d_%d.pdf", start, end))

		err = api.MergeCreateFile(pagesToMerge, mergedFile, false, nil)
		if err != nil {
			return fmt.Errorf("failed to extract pages %s: %v", rangeStr, err)
		}

		res := parsePdf(mergedFile)
		ans = ans + res

		err = os.RemoveAll(tmpDir)
		if err != nil {
			return err
		}
	}

	outputFile := outDir + "\\" + number + ".txt"
	err = os.WriteFile(outputFile, []byte(ans), 0o644)
	if err != nil {
		return fmt.Errorf("write to %s failed: %v", outputFile, err)
	}

	fmt.Println("Saved result to:", outputFile)

	return nil
}

func parsePdf(outputFile string) string {
	b64, err := fileToBase64(outputFile)
	if err != nil {
		return fmt.Sprintf("file to base64 failed: %v", err)
	}

	reqBody := RequestBody{
		FileBase64: b64,
		FileType:   "word",
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Sprintf("json marshal failed: %v", err)
	}

	url := apiHost + apiPath
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Sprintf("create request failed: %v", err)
	}

	req.Header.Add("Authorization", "APPCODE "+appCode)
	req.Header.Add("Content-Type", "application/json; charset=UTF-8")

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Sprintf("http request failed: %v", err)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Sprintf("read response failed: %v", err)
	}

	var ocrResp OcrResponse
	err = json.Unmarshal(body, &ocrResp)
	if err != nil {
		return err.Error()
	}

	text, err := extractTextFromWordBase64(ocrResp.FileBase64)
	if err != nil {
		return fmt.Sprintf("extract text from word base64 failed: %v", err)
	}

	return text
}

func extractTextFromWordBase64(base64Str string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(base64Str)
	if err != nil {
		return "", fmt.Errorf("base64 decode error: %v", err)
	}

	doc, err := document.Read(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("failed to read docx: %v", err)
	}

	var text string
	for _, para := range doc.Paragraphs() {
		for _, run := range para.Runs() {
			text += run.Text()
		}
	}
	return text, nil
}

func fileToBase64(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("cannot read file: %v", err)
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	return encoded, nil
}
