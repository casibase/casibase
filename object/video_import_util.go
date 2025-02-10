// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"regexp"
	"strconv"
	"strings"
	"time"
)

func parseTimeString(input string) (string, string, error) {
	// 正则表达式，可选地匹配小时和分钟部分
	re := regexp.MustCompile(`(\d+)年(\d+)月(\d+)日 (上午|下午) (\d+):(\d+)\|((\d+)小时 )?((\d+)分钟 )?(\d+)秒`)
	matches := re.FindStringSubmatch(input)

	// 检查匹配结果
	if len(matches) != 12 {
		return "", "", fmt.Errorf("invalid format")
	}

	year, _ := strconv.Atoi(matches[1])
	month, _ := strconv.Atoi(matches[2])
	day, _ := strconv.Atoi(matches[3])
	ampm := matches[4]
	hour, _ := strconv.Atoi(matches[5])
	minute, _ := strconv.Atoi(matches[6])
	durationHoursStr := matches[8]    // 小时部分字符串
	durationMinutesStr := matches[10] // 分钟部分字符串
	durationSeconds, _ := strconv.Atoi(matches[11])

	// 转换12小时制为24小时制
	if ampm == "下午" && hour != 12 {
		hour += 12
	}

	// 创建时间对象
	timeObj := time.Date(year, time.Month(month), day, hour, minute, 0, 0, time.FixedZone("CST", 8*3600))
	formattedTime := timeObj.Format(time.RFC3339)

	// 解析持续时间的小时和分钟
	durationHours := 0
	if durationHoursStr != "" {
		durationHours, _ = strconv.Atoi(durationHoursStr)
	}
	durationMinutes := 0
	if durationMinutesStr != "" {
		durationMinutes, _ = strconv.Atoi(durationMinutesStr)
	}

	// 转换视频时长
	formattedDuration := fmt.Sprintf("%02d:%02d:%02d", durationHours, durationMinutes, durationSeconds)

	return formattedTime, formattedDuration, nil
}

func parseKeywords(content string) []string {
	tokens := strings.Split(content, "、")
	res := []string{}
	for _, token := range tokens {
		res = append(res, strings.Trim(token, "\n"))
	}
	return res
}

func timeToSeconds(timeStr string) (float64, error) {
	parts := strings.Split(timeStr, ":")
	partsLen := len(parts)
	if partsLen < 1 || partsLen > 3 {
		return 0, fmt.Errorf("invalid time format")
	}

	// 初始化为0
	var hours, minutes, seconds int
	var err error

	switch partsLen {
	case 1:
		// 只有秒
		seconds, err = strconv.Atoi(parts[0])
	case 2:
		// 有分钟和秒
		minutes, err = strconv.Atoi(parts[0])
		if err == nil {
			seconds, err = strconv.Atoi(parts[1])
		}
	case 3:
		// 有小时、分钟和秒
		hours, err = strconv.Atoi(parts[0])
		if err == nil {
			minutes, err = strconv.Atoi(parts[1])
		}
		if err == nil {
			seconds, err = strconv.Atoi(parts[2])
		}
	}

	if err != nil {
		return 0, err
	}

	res := float64(hours*3600 + minutes*60 + seconds)
	return res, nil
}

func mapSpeaker(s string) string {
	if strings.Contains(s, "老师") {
		return strings.ReplaceAll(s, "老师", "Teacher")
	} else if strings.Contains(s, "学生") {
		return strings.ReplaceAll(s, "学生", "Student")
	} else if strings.Contains(s, "说话人") {
		return strings.ReplaceAll(s, "说话人", "Speaker")
	} else {
		return fmt.Sprintf("Unknown speaker: %s", s)
	}
}

func SplitLastN(s, sep string, n int) []string {
	if n <= 0 {
		return nil
	}

	// 查找最后一个分隔符的位置
	lastSepIndex := strings.LastIndex(s, sep)
	if lastSepIndex == -1 {
		// 如果没有找到分隔符，返回整个字符串
		return []string{s}
	}

	// 根据找到的分隔符位置分割字符串
	if n == 1 {
		return []string{s[:lastSepIndex]}
	}

	return []string{s[:lastSepIndex], s[lastSepIndex+len(sep):]}
}
