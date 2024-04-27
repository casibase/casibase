package txt

import (
	"archive/zip"
	"encoding/xml"
	"io"
	"strings"
)

func getTextFromPptx(path string) (string, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return "", err
	}
	defer r.Close()

	var text strings.Builder
	for _, f := range r.File {
		if strings.HasPrefix(f.Name, "ppt/slides/slide") && strings.HasSuffix(f.Name, ".xml") {
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			decoder := xml.NewDecoder(rc)
			for {
				token, err := decoder.Token()
				if err == io.EOF {
					break
				}
				if err != nil {
					return "", err
				}
				if startElement, ok := token.(xml.StartElement); ok && startElement.Name.Local == "t" {
					var content string
					if err := decoder.DecodeElement(&content, &startElement); err != nil {
						return "", err
					}
					text.WriteString(content)
					text.WriteString(" ")
				}
			}
			rc.Close()
		}
	}
	return text.String(), nil
}
