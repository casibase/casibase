package object

import (
	"time"
)

func AutoSyncGitter() {
	if AutoSyncPeriodSecond < 30 {
		return
	}
	for {
		time.Sleep(time.Duration(AutoSyncPeriodSecond) * time.Second)
		SyncGitter()
	}
}

func SyncGitter() error {
	//api := gitter.New("") // ACCESS_TOKEN
	//room, err := api.GetRoom(RoomID)
	//if err != nil {
	//	return err
	//}
	return nil
}
