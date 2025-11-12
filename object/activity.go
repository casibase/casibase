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

package object

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/util"
)

type Activity struct {
	Date       string `json:"date"`
	FieldCount map[string]int
}

var defaultDashboardFields = []string{
	"section",
	"diseaseCategory",
	"action",
	"response",
	"region",
	"city",
	"client_ip",
	"organization",
	"user_agent",
}

func normalizeDashboardFields(fieldNames []string) []string {
	if len(fieldNames) == 0 {
		return append([]string(nil), defaultDashboardFields...)
	}

	seen := make(map[string]struct{}, len(fieldNames))
	normalized := make([]string, 0, len(fieldNames))

	for _, fieldName := range fieldNames {
		name := strings.TrimSpace(fieldName)
		if name == "" {
			continue
		}
		if _, exists := seen[name]; exists {
			continue
		}
		if _, err := getFieldColumnName(name); err != nil {
			continue
		}
		seen[name] = struct{}{}
		normalized = append(normalized, name)
	}

	if len(normalized) == 0 {
		return append([]string(nil), defaultDashboardFields...)
	}

	return normalized
}

func reduceActivitiesToLatestDay(data map[string][]*Activity) map[string][]*Activity {
	if len(data) == 0 {
		return data
	}

	result := make(map[string][]*Activity, len(data))

	for field, activities := range data {
		if len(activities) == 0 {
			result[field] = nil
			continue
		}

		latest := activities[len(activities)-1]
		if latest == nil {
			result[field] = nil
			continue
		}

		copiedCount := make(map[string]int, len(latest.FieldCount))
		for k, v := range latest.FieldCount {
			copiedCount[k] = v
		}

		result[field] = []*Activity{
			{
				Date:       latest.Date,
				FieldCount: copiedCount,
			},
		}
	}

	return result
}

func getTargetfieldValue(record *Record, fieldName string) (string, error) {
	switch fieldName {
	case "action":
		return record.Action, nil
	case "language":
		return record.Language, nil
	case "client_ip":
		return record.ClientIp, nil
	case "owner":
		return record.Owner, nil
	case "organization":
		return record.Organization, nil
	case "user_agent":
		return record.UserAgent, nil
	case "response":
		status := "error"
		if record.Response == "{\"status\":\"ok\",\"msg\":\"\"}" {
			status = "ok"
		}
		return status, nil
	case "unit":
		return record.Unit, nil
	case "section":
		return record.Section, nil
	case "city":
		return record.City, nil
	case "region":
		return record.Region, nil
	case "diseaseCategory":
		return record.DiseaseCategory, nil

	}
	return "", errors.New("no matched field")
}

func buildDashboardCacheKey(days int, user string, fieldNames []string) string {
	normalizedFields := append([]string(nil), fieldNames...)
	sort.Strings(normalizedFields)
	return fmt.Sprintf("dashboard_activities:%d:%s:%s", days, user, strings.Join(normalizedFields, "|"))
}

func GetActivitiesDashBoard(days int, user string, fieldNames []string, lang string) (map[string][]*Activity, error) {
	fieldNames = normalizeDashboardFields(fieldNames)
	cacheKey := buildDashboardCacheKey(days, user, fieldNames)

	cacheJson, err := GetCacheByKey(cacheKey)
	if err != nil {
		return nil, err
	}
	if cacheJson != nil {
		var resp map[string][]*Activity
		if err := json.Unmarshal(cacheJson, &resp); err == nil {
			resp = reduceActivitiesToLatestDay(resp)
			go GetActivitiesBySQL(days, user, fieldNames, lang)
			return resp, nil
		}
	}

	resp, err := GetActivitiesBySQL(days, user, fieldNames, lang)
	if err != nil {
		return nil, err
	}
	return resp, nil

}

// getFieldColumnName 获取字段对应的数据库列名
func getFieldColumnName(fieldName string) (string, error) {
	switch fieldName {
	case "action":
		return "action", nil
	case "language":
		return "language", nil
	case "client_ip":
		return "client_ip", nil
	case "owner":
		return "owner", nil
	case "organization":
		return "organization", nil
	case "user_agent":
		return "user_agent", nil
	case "response":
		return "response", nil
	case "unit":
		return "unit", nil
	case "section":
		return "section", nil
	case "city":
		return "city", nil
	case "region":
		return "region", nil
	case "diseaseCategory":
		return "disease_category", nil
	default:
		return "", fmt.Errorf("unknown field: %s", fieldName)
	}
}

// GetActivitiesBySQL 使用 SQL 查询直接获取统计数据，性能更优
func GetActivitiesBySQL(days int, user string, fieldNames []string, lang string) (map[string][]*Activity, error) {
	fieldNames = normalizeDashboardFields(fieldNames)
	cacheKey := buildDashboardCacheKey(days, user, fieldNames)

	now := time.Now().UTC()
	startDateTime := now.AddDate(0, 0, -(days - 1)).Truncate(24 * time.Hour)

	// 获取表名
	tableName := adapter.engine.TableName(new(Record), true)
	driverName := adapter.driverName

	// 构建时间过滤条件（created_time 是 varchar，存储 RFC3339 格式）
	startTimeStr := startDateTime.Format(time.RFC3339)

	// 构建用户过滤条件
	userFilter := ""
	if user != "All" && user != "" {
		escapedUser := strings.ReplaceAll(user, "'", "''")

		var userColumn string
		switch driverName {
		case "mysql":
			userColumn = "`user`"
		case "postgres":
			userColumn = `"user"`
		default:
			userColumn = "user"
		}

		userFilter = fmt.Sprintf(" AND %s = '%s'", userColumn, escapedUser)
	}

	resp := make(map[string][]*Activity)

	// 初始化响应结构
	for _, fieldName := range fieldNames {
		activities := make([]*Activity, days)
		for i := 0; i < days; i++ {
			activities[i] = &Activity{
				Date:       startDateTime.AddDate(0, 0, i).Format("2006-01-02"),
				FieldCount: make(map[string]int),
			}
		}
		resp[fieldName] = activities
	}

	// 获取数据库类型
	// driverName := adapter.driverName

	// 为每个字段执行 SQL 查询
	for _, fieldName := range fieldNames {
		columnName, err := getFieldColumnName(fieldName)
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "object:unknown field %s: %v"), fieldName, err)
		}

		// 构建 SQL 查询
		var sqlQuery string
		if fieldName == "response" {
			// response 字段需要特殊处理，判断是否为 ok
			switch driverName {
			case "mysql":
				sqlQuery = fmt.Sprintf(`
					SELECT 
						DATE(SUBSTR(created_time, 1, 10)) as date,
						CASE 
							WHEN response = '{"status":"ok","msg":""}' THEN 'ok'
							ELSE 'error'
						END as value,
						COUNT(*) as count
					FROM %s
					WHERE created_time >= '%s' %s
						AND %s IS NOT NULL
						AND %s != ''
					GROUP BY date, value
					ORDER BY date, value`,
					tableName, startTimeStr, userFilter, columnName, columnName)
			case "postgres":
				sqlQuery = fmt.Sprintf(`
					SELECT
						DATE(created_time::timestamp) as date,
						CASE
							WHEN response = '{"status":"ok","msg":""}' THEN 'ok'
							ELSE 'error'
						END as value,
						COUNT(*) as count
					FROM %s
					WHERE created_time >= '%s' %s
						AND %s IS NOT NULL
						AND %s != ''
					GROUP BY date, value
					ORDER BY date, value`,
					tableName, startTimeStr, userFilter, columnName, columnName)
			default: // sqlite
				sqlQuery = fmt.Sprintf(`
					SELECT
						DATE(SUBSTR(created_time, 1, 10)) as date,
						CASE
							WHEN response = '{"status":"ok","msg":""}' THEN 'ok'
							ELSE 'error'
						END as value,
						COUNT(*) as count
					FROM %s
					WHERE created_time >= '%s' %s
						AND %s IS NOT NULL
						AND %s != ''
					GROUP BY date, value
					ORDER BY date, value`,
					tableName, startTimeStr, userFilter, columnName, columnName)
			}
		} else {
			// 普通字段
			switch driverName {
			case "mysql":
				sqlQuery = fmt.Sprintf(`
					SELECT 
						DATE(SUBSTR(created_time, 1, 10)) as date,
						%s as value,
						COUNT(*) as count
					FROM %s
					WHERE created_time >= '%s' %s
						AND %s IS NOT NULL
						AND %s != ''
					GROUP BY date, value
					ORDER BY date, value`,
					columnName, tableName, startTimeStr, userFilter, columnName, columnName)
			case "postgres":
				sqlQuery = fmt.Sprintf(`
					SELECT
						DATE(created_time::timestamp) as date,
						%s as value,
						COUNT(*) as count
					FROM %s
					WHERE created_time >= '%s' %s
						AND %s IS NOT NULL
						AND %s != ''
					GROUP BY date, value
					ORDER BY date, value`,
					columnName, tableName, startTimeStr, userFilter, columnName, columnName)
			default: // sqlite
				sqlQuery = fmt.Sprintf(`
					SELECT
						DATE(SUBSTR(created_time, 1, 10)) as date,
						%s as value,
						COUNT(*) as count
					FROM %s
					WHERE created_time >= '%s' %s
						AND %s IS NOT NULL
						AND %s != ''
					GROUP BY date, value
					ORDER BY date, value`,
					columnName, tableName, startTimeStr, userFilter, columnName, columnName)
			}
		}

		// 执行查询
		results, err := adapter.engine.Query(sqlQuery)
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to execute SQL query for field %s: %v"), fieldName, err)
		}

		// 处理查询结果
		for _, row := range results {
			dateStr := string(row["date"])
			value := string(row["value"])
			count := util.ParseInt(string(row["count"]))

			// 解析日期并找到对应的日期索引
			recordDate, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				// 如果日期格式不匹配，尝试其他格式
				recordDate, err = time.Parse("2006-01-02T15:04:05Z", dateStr)
				if err != nil {
					continue
				}
			}

			dayIndex := int(recordDate.Sub(startDateTime).Hours() / 24)
			if dayIndex < 0 || dayIndex >= days {
				continue
			}

			// 更新统计数据
			activity := resp[fieldName]
			activity[dayIndex].FieldCount[value] += count
		}
	}

	// 累积统计：每一天的数据包含之前所有天的累计
	for i := 1; i < days; i++ {
		for _, activities := range resp {
			for action, count := range activities[i-1].FieldCount {
				activities[i].FieldCount[action] += count
			}
		}
	}

	trimmedResp := reduceActivitiesToLatestDay(resp)

	// 将最新一天的数据存入缓存数据库中
	cacheData, err := json.Marshal(trimmedResp)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal cache data: %v", err)
	}
	if err := CacheSave(cacheKey, string(cacheData)); err != nil {
		return nil, fmt.Errorf("failed to save cache data: %v", err)
	}

	return trimmedResp, nil
}

func GetActivities(days int, user string, fieldNames []string, lang string) (map[string][]*Activity, error) {
	fieldNames = normalizeDashboardFields(fieldNames)
	records, err := getAllRecords()
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	// Adjusted to include today in the count by subtracting days-1
	startDateTime := now.AddDate(0, 0, -(days - 1)).Truncate(24 * time.Hour)

	resp := make(map[string][]*Activity)
	for j := 0; j < len(fieldNames); j++ {
		// Adjusted the size to days, as we're now including today
		activities := make([]*Activity, days)
		for i := 0; i < days; i++ {
			activities[i] = &Activity{
				Date:       startDateTime.AddDate(0, 0, i).Format("2006-01-02"),
				FieldCount: make(map[string]int),
			}
		}
		resp[fieldNames[j]] = activities
	}

	for _, record := range records {
		if !(record.User == user || user == "All") {
			continue
		}
		recordTime, _ := time.Parse(time.RFC3339, record.CreatedTime)

		if recordTime.Before(startDateTime) {
			break
		}

		// Find the date index for the message
		dayIndex := int(recordTime.Sub(startDateTime).Hours() / 24)
		if dayIndex < 0 || dayIndex >= days {
			continue
		}
		for _, fieldName := range fieldNames {
			value, err := getTargetfieldValue(record, fieldName)
			if err != nil {
				return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to parse record: name %s, field %s, error: %v"), record.Name, fieldName, err)
			}

			if value != "" {
				activity := resp[fieldName]
				activity[dayIndex].FieldCount[value] += 1
			}
		}
	}

	for i := 1; i < days; i++ {
		for _, activities := range resp {
			for action, count := range activities[i-1].FieldCount {
				activities[i].FieldCount[action] += count
			}
		}
	}

	// 将resp存入缓存数据库中
	cacheKey := buildDashboardCacheKey(days, user, fieldNames)
	cacheData, err := json.Marshal(resp)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal cache data: %v", err)
	}
	if err := CacheSave(cacheKey, string(cacheData)); err != nil {
		return nil, fmt.Errorf("failed to save cache data: %v", err)
	}

	return resp, nil
}
