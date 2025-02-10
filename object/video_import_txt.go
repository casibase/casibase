// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

package object

import (
	"fmt"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/casibase/casibase/txt"
	"github.com/casibase/casibase/util"
)

type TxtLabel struct {
	Type      string  `xorm:"varchar(100)" json:"type"`
	StartTime float64 `json:"startTime"`
	EndTime   float64 `json:"endTime"`
	Speaker   string  `xorm:"varchar(100)" json:"speaker"`
	Text      string  `xorm:"varchar(100)" json:"text"`
}

func getImportedVideos2(path string) ([]*Video, error) {
	files, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	videos := []*Video{}
	for _, file := range files {
		if filepath.Ext(file.Name()) != ".docx" {
			continue
		}

		filePath := filepath.Join(path, file.Name())
		video, err := parseVideoFile2(filePath)
		if err != nil {
			return nil, err
		}

		videos = append(videos, video)
	}

	return videos, nil
}

func parseTxtLabelsFromContent(content string) ([]*TxtLabel, error) {
	var labels []*TxtLabel
	lines := strings.Split(content, "\n")
	timeRegex := regexp.MustCompile(`(\d+)\.(\d+)\.(\d+)——(\d+)\.(\d+)\.(\d+)`)
	textRegex := regexp.MustCompile(`^(生|师)：(.*)`)

	for _, line := range lines {
		if timeMatch := timeRegex.FindStringSubmatch(line); timeMatch != nil {
			startTime, _ := timeInSeconds(timeMatch[1:4])
			endTime, _ := timeInSeconds(timeMatch[4:])
			label := &TxtLabel{
				Type:      "Time",
				StartTime: startTime,
				EndTime:   endTime,
			}
			labels = append(labels, label)
		} else if textMatch := textRegex.FindStringSubmatch(line); textMatch != nil {
			label := &TxtLabel{
				Type:    "Text",
				Speaker: textMatch[1],
				Text:    textMatch[2],
			}
			labels = append(labels, label)
		}
	}

	return labels, nil
}

func mapSpeaker2(speaker string) string {
	switch speaker {
	case "生":
		return "Student"
	case "师":
		return "Teacher"
	default:
		return "Unknown"
	}
}

func parseTxtLabelsFromContent2(txtLabels []*TxtLabel) ([]*Label, error) {
	var labels []*Label
	var currentTime float64 = 0

	const wordsPerSecond = 9

	for i, txtLabel := range txtLabels {
		textLength := float64(len(txtLabel.Text))
		duration := textLength * 1.0 / wordsPerSecond
		duration = math.Round(duration*1000) / 1000

		label := &Label{
			Id:        strconv.Itoa(i),
			StartTime: currentTime,
			EndTime:   currentTime + duration,
			Text:      txtLabel.Text,
			Speaker:   mapSpeaker2(txtLabel.Speaker),
		}
		labels = append(labels, label)
		currentTime += duration
	}

	return labels, nil
}

func timeInSeconds(parts []string) (float64, error) {
	hours, _ := strconv.ParseFloat(parts[0], 64)
	minutes, _ := strconv.ParseFloat(parts[1], 64)
	seconds, _ := strconv.ParseFloat(parts[2], 64)
	totalSeconds := hours*3600 + minutes*60 + seconds
	return totalSeconds, nil
}

func parseVideoFile2(filePath string) (*Video, error) {
	content, err := txt.GetTextFromDocx(filePath)
	if err != nil {
		return nil, err
	}

	fileId := strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))
	tag := getParentFolderName(filePath)
	video := &Video{
		Owner:        "admin",
		Name:         fileId,
		DisplayName:  fileId,
		Tag:          tag,
		Type:         ".docx",
		EditMode:     "Text Tagging",
		Labels:       []*Label{},
		Segments:     []*Label{},
		WordCountMap: map[string]int{},
		DataUrls:     []string{},
		Keywords:     []string{},
	}

	txtLabels, err := parseTxtLabelsFromContent(content)
	if err != nil {
		return nil, err
	}

	txtLabels2 := []*TxtLabel{}
	for _, label := range txtLabels {
		if label.Type == "Text" {
			txtLabels2 = append(txtLabels2, label)
		}
	}

	labels, err := parseTxtLabelsFromContent2(txtLabels2)
	if err != nil {
		return nil, err
	}

	for _, label := range labels {
		fmt.Printf("%v\n", label)
	}

	video.CreatedTime = util.GetCurrentTime()
	video.Segments = labels

	return video, nil
}

func importVideos2(path string) error {
	videos, err := getImportedVideos2(path)
	if err != nil {
		return err
	}

	for i, video := range videos {
		fmt.Printf("[%d] Add video: %v\n", i, video)
		_, err = AddVideo(video)
		if err != nil {
			return err
		}
	}

	return nil
}
