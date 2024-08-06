package object

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/Ullaakut/nmap"
)

type ScanStatus string

// 枚举值
const (
	ScanStatusPending     ScanStatus = "pending"
	ScanStatusRunning     ScanStatus = "running"
	ScanStatusDoneForScan ScanStatus = "done for scan"
	ScanStatusDone        ScanStatus = "done"
	ScanStatusError       ScanStatus = "error"
)

type ScanTarget struct {
	Host string `json:"host"`
	Port string `json:"port"`
}

type AssetsConfig struct {
	Id              int64                `xorm:"pk autoincr" json:"id"`
	Name            string               `xorm:"varchar(100)" json:"name"`
	CreatedTime     time.Time            `xorm:"varchar(100) created" json:"createdTime"`
	Targets         []*ScanTarget        `xorm:"varchar(1000)" json:"targets"`
	ScanHistoryList []*AssetsScanHistory `json:"scanHistoryList"`
}

type AssetsScanHistory struct {
	Id           string         `json:"id"`
	CreatedTime  time.Time      `json:"createdTime"`
	FinishedTime time.Time      `json:"finishedTime"`
	Status       ScanStatus     `json:"status"`
	Result       []MyScanResult `json:"result"`
	AISuggestion string         `json:"aiSuggestion"`
}

type MyHost struct {
	Addresses []nmap.Address `xml:"address" json:"addresses"`
	Ports     []nmap.Port    `xml:"ports>port" json:"ports"`
}

type MyScanResult struct {
	Hosts []MyHost   `json:"hosts"`
	Stats nmap.Stats `json:"stats"`
}

func SaveAssetsScanConfig(scan *AssetsConfig) (bool, error) {
	insert, err := adapter.engine.Insert(scan)
	if err != nil {
		return false, err
	}
	return insert != 0, nil
}

func GetAAssetsConfig(id int) (*AssetsConfig, error) {
	scan := AssetsConfig{Id: int64(id)}
	existed, err := adapter.engine.Get(&scan)
	if err != nil {
		return &scan, err
	}
	if existed {
		return &scan, nil
	} else {
		return nil, nil
	}
}

func GetScans() ([]*AssetsConfig, error) {
	scans := []*AssetsConfig{}
	err := adapter.engine.Desc("created_time").Find(&scans)
	if err != nil {
		return scans, err
	}
	return scans, nil
}

func UpdateAConfig(id int64, scan *AssetsConfig) (bool, error) {
	_, err := adapter.engine.ID(id).AllCols().Update(scan)
	if err != nil {
		return false, err
	}
	return true, nil
}

func DeleteAScan(id int) (bool, error) {
	scan := AssetsConfig{Id: int64(id)}
	_, err := adapter.engine.Delete(&scan)
	if err != nil {
		return false, err
	}
	return true, nil
}

// StartScan
// @Param id query string true "The id of the scan"
func StartScan(id int, resMessage func(eventType string, data string)) (bool, error) {
	targetConfig, err := GetAAssetsConfig(id)
	if err != nil {
		return false, err
	}

	scanHistory := new(AssetsScanHistory)
	scanHistory.Id = "scan-" + time.Now().String()
	scanHistory.CreatedTime = time.Now()
	scanHistory.Status = ScanStatusRunning
	targetConfig.ScanHistoryList = append(targetConfig.ScanHistoryList, scanHistory)
	success, err := UpdateAConfig(int64(id), targetConfig)
	resMessage("start", "scan start")
	if err != nil || !success {
		return false, err
	}

	// the scanner is ready to start
	for i := 0; i < len(targetConfig.Targets); i++ {
		hosts := strings.Split(targetConfig.Targets[i].Host, ",")
		ports := strings.Split(targetConfig.Targets[i].Port, ",")

		scanner, err := nmap.NewScanner(
			nmap.WithTargets(hosts...),
			nmap.WithPorts(ports...),
			nmap.WithContext(context.Background()),
		)

		// send hint message to client
		data := "scan start for " + targetConfig.Targets[i].Host + targetConfig.Targets[i].Port + "\n\n"
		resMessage("message", data)

		if err != nil {
			return false, err
		}

		result, _, err := scanner.Run()
		if err != nil {
			return false, err
		}

		// send finish message to client, and save the result
		data = "scan done for: " + targetConfig.Targets[i].Host + "\n\n"
		resMessage("message", data)

		scanHistory.Result = append(scanHistory.Result, *transferToMyScanResult(result))

		for i2 := range targetConfig.ScanHistoryList {
			if targetConfig.ScanHistoryList[i2].Id == scanHistory.Id {
				targetConfig.ScanHistoryList[i2] = scanHistory
			}
		}
	}

	// scan finished and save result
	scanHistory.FinishedTime = time.Now()
	scanHistory.Status = ScanStatusDoneForScan

	_, err = UpdateAConfig(int64(id), targetConfig)
	if err != nil {
		return false, err
	}

	// get scan suggestion
	suggestion, err := GetScanSuggestion(scanHistory.Result)
	if err != nil {
		return false, err
	}

	resMessage("message", "AI Suggestion Finished")

	// 保存结果
	scanHistory.Status = ScanStatusDone
	scanHistory.AISuggestion = suggestion

	_, err = UpdateAConfig(int64(id), targetConfig)
	if err != nil {
		return false, err
	}

	return true, nil
}

func GetScanSuggestion(scanResult []MyScanResult) (string, error) {
	scanResultJSON, err := json.Marshal(scanResult)
	if err != nil {
		return "", err
	}

	question := "Generate a detailed security report based on the following port scan results, including potential risks, suggested improvements, and any other relevant security advice. The scan results are as follows: " + string(scanResultJSON)

	if err != nil {
		return "", err
	}

	answer, _, err := GetAnswer("", question)
	if err != nil {
		return "", err
	}

	return answer, nil
}

//func transferToMyScanResult(customResult *nmap.Run) *MyScanResult {
//	return &MyScanResult{
//		Hosts: customResult.Hosts,
//		Stats: customResult.Stats,
//	}
//}

func transferToMyScanResult(customResult *nmap.Run) *MyScanResult {
	myHosts := make([]MyHost, len(customResult.Hosts))
	for i, host := range customResult.Hosts {
		myHosts[i] = MyHost{
			Addresses: host.Addresses,
			Ports:     host.Ports,
		}
	}

	return &MyScanResult{
		Hosts: myHosts,
		Stats: customResult.Stats,
	}
}
