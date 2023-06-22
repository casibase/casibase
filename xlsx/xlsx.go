package xlsx

import (
	"github.com/casbin/casibase/util"
	"github.com/tealeg/xlsx"
)

func ReadXlsxFile(fileId string) [][]string {
	path := util.GetUploadXlsxPath(fileId)
	file, err := xlsx.OpenFile(path)
	if err != nil {
		panic(err)
	}

	res := [][]string{}
	for _, sheet := range file.Sheets {
		for _, row := range sheet.Rows {
			line := []string{}
			for _, cell := range row.Cells {
				text := cell.String()
				line = append(line, text)
			}
			res = append(res, line)
		}
		break
	}

	return res
}
