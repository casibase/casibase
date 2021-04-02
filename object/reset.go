package object

import "github.com/casbin/casnode/util"

// RecordType: 1 means phone, 2 means email, resetInformation means phone number or email.
type ResetRecord struct {
	Id               int    `xorm:"int notnull pk autoincr" json:"id"`
	MemberId         string `xorm:"varchar(100) index" json:"memberId"`
	RecordType       int    `xorm:"int" json:"recordType"`
	ResetInformation string `xorm:"varchar(100)" json:"resetInformation"`
	CreatedTime      string `xorm:"varchar(40)" json:"createdTime"`
	Expired          bool   `xorm:"bool" json:"expired"`
	ValidateCode     string `xorm:"varchar(100)" json:"validateCode"`
}

func GetMemberResetFrequency(memberId, date string) int {
	record := new(ResetRecord)
	total, err := adapter.engine.Where("member_id = ?", memberId).And("created_time > ?", date).Count(record)
	if err != nil {
		panic(err)
	}

	return int(total)
}

// AddValidateCode: return validate code
func AddNewResetRecord(resetInformation, memberId string, recordType int) (int, string) {
	record := &ResetRecord{
		MemberId:         memberId,
		RecordType:       recordType,
		ResetInformation: resetInformation,
		CreatedTime:      util.GetCurrentTime(),
		Expired:          false,
		ValidateCode:     getRandomId(20),
	}
	affected, err := adapter.engine.Insert(record)
	if err != nil {
		panic(err)
	}

	if affected != 0 {
		return record.Id, record.ValidateCode
	}
	return 0, ""
}

func CheckResetCodeExpired(id string) bool {
	var record ResetRecord
	existed, err := adapter.engine.Id(id).Get(&record)
	if err != nil {
		panic(err)
	}

	if existed {
		return record.Expired
	}
	return true
}

func VerifyResetInformation(id, validateCode, memberId string, recordType int) bool {
	var record ResetRecord
	existed, err := adapter.engine.Id(id).Get(&record)
	if err != nil {
		panic(err)
	}

	if !existed || record.Expired || record.ValidateCode != validateCode || record.MemberId != memberId || record.RecordType != recordType {
		return false
	}

	record.Expired = true
	affected, err := adapter.engine.Id(id).Cols("expired").Update(record)
	if err != nil {
		panic(err)
	}

	if affected != 0 {
		return true
	}
	return false
}

func ExpireResetRecord(date string) int {
	record := new(ResetRecord)
	record.Expired = true
	affected, err := adapter.engine.Where("expired = ?", 0).And("created_time < ?", date).Cols("expired").Update(record)
	if err != nil {
		panic(err)
	}

	return int(affected)
}
