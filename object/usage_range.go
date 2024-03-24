package object

import (
	"fmt"
	"time"

	"github.com/casibase/casibase/model"
)

func GetRangeUsages(rangeType string, count int) ([]*Usage, error) {
	messages, err := GetGlobalMessagesByCreatedTime()
	if err != nil {
		return nil, err
	}

	now := time.Now()

	var startDateTime time.Time

	switch rangeType {
	case "Hour":
		startDateTime = now.Truncate(time.Hour).Add(-time.Hour * time.Duration(count-1))
	case "Day":
		startDateTime = now.Truncate(24*time.Hour).AddDate(0, 0, -(count - 1))
	case "Week":
		// Find the start of the week for the current time, then subtract the number of weeks specified by count
		// Assuming the week starts on Monday
		offset := int(time.Monday - now.Weekday())
		if offset > 0 {
			offset -= 7 // go back to the previous week if today is past Monday
		}
		startOfWeek := now.AddDate(0, 0, offset)
		startDateTime = startOfWeek.Truncate(24*time.Hour).AddDate(0, 0, -7*(count-1))
	case "Month":
		startDateTime = now.Truncate(24*time.Hour).AddDate(0, -count+1, 0)
	default:
		return nil, fmt.Errorf("invalid range type: %s", rangeType)
	}

	usages := make([]*Usage, count)

	for i := 0; i < count; i++ {
		var dateLabel string
		switch rangeType {
		case "Hour":
			dateLabel = startDateTime.Add(time.Hour * time.Duration(i)).Format("2006-01-02 15")
		case "Day":
			dateLabel = startDateTime.AddDate(0, 0, i).Format("2006-01-02")
		case "Week":
			// Use the start of each week for the date label
			dateLabel = startDateTime.AddDate(0, 0, 7*i).Format("2006-01-02")
		case "Month":
			dateLabel = startDateTime.AddDate(0, i, 0).Format("2006-01")
		}
		usages[i] = &Usage{
			Date: dateLabel,
		}
	}

	// Reset userSet and chatSet for each bucket
	userSet := make(map[string]struct{})
	chatSet := make(map[string]struct{})

	for _, message := range messages {
		messageTime, _ := time.Parse(time.RFC3339, message.CreatedTime)
		bucketIndex := -1

		switch rangeType {
		case "Hour":
			bucketIndex = int(messageTime.Sub(startDateTime).Hours())
		case "Day":
			bucketIndex = int(messageTime.Sub(startDateTime).Hours() / 24)
		case "Week":
			bucketIndex = int(messageTime.Sub(startDateTime).Hours() / (24 * 7))
		case "Month":
			monthDiff := (messageTime.Year()-startDateTime.Year())*12 + int(messageTime.Month()-startDateTime.Month())
			bucketIndex = monthDiff
		}

		if bucketIndex >= 0 && bucketIndex < count {
			currentUsage := usages[bucketIndex]
			if _, exists := userSet[message.User]; !exists {
				userSet[message.User] = struct{}{}
				currentUsage.UserCount++
			}
			if _, exists := chatSet[message.Chat]; !exists {
				chatSet[message.Chat] = struct{}{}
				currentUsage.ChatCount++
			}
			currentUsage.MessageCount++
			currentUsage.TokenCount += message.TokenCount
			currentUsage.Price += message.Price
			if currentUsage.Currency == "" {
				currentUsage.Currency = message.Currency
			}
		}

		// Reset sets at the start of each new bucket
		if bucketIndex != -1 && (bucketIndex == count-1 || messageTime.Before(startDateTime.Add(time.Hour*time.Duration((bucketIndex+1)*24)))) {
			userSet = make(map[string]struct{})
			chatSet = make(map[string]struct{})
		}
	}

	// Refine price for each usage
	for _, usage := range usages {
		usage.Price = model.RefinePrice(usage.Price)
	}

	return usages, nil
}
