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
	"fmt"
	"log"

	"github.com/robfig/cron"
)

type ChatCleaner struct{}

func (c *ChatCleaner) Start(cronStr string) {
	cr := cron.New()
	cr.AddFunc(cronStr, func() {
		deleteRedundantChats()
	})
	cr.Start()
}

func deleteRedundantChats() (err error) {
	sql := `
        SELECT DISTINCT m1.chat, m1.owner
        FROM message m1
        JOIN message m2 ON m1.chat = m2.chat AND m1.name <> m2.name
        JOIN (
            SELECT chat
            FROM message
            GROUP BY chat
            HAVING COUNT(*) = 2
        ) AS chat_count_2 ON m1.chat = chat_count_2.chat
        WHERE 
            (m1.author <> 'AI' AND m2.author = 'AI' AND m2.text = '' AND m2.reply_to = 'Welcome')
            OR
            (m2.author <> 'AI' AND m1.author = 'AI' AND m1.text = '' AND m1.reply_to = 'Welcome')
    `
	results, err := adapter.engine.QueryString(sql)
	if err != nil {
		log.Fatalf("Failed to query: %v", err)
	}

	if len(results) == 0 {
		return
	}
	log.Printf("Deleting %d redundant chats.", len(results))

	owners := make([]string, 0, len(results))
	names := make([]string, 0, len(results))
	for _, key := range results {
		owners = append(owners, key["owner"])
		names = append(names, key["chat"])
	}

	session := adapter.engine.NewSession()
	defer session.Close()
	if err := session.Begin(); err != nil {
		return err
	}

	_, err = session.In("chat", names).In("owner", owners).Delete(&Message{})
	if err != nil {
		session.Rollback()
		return err
	}

	_, err = session.In("name", names).In("owner", owners).Delete(&Chat{})
	if err != nil {
		session.Rollback()
		return err
	}

	fmt.Printf("Deleted %d redundant chats.\n", len(results))
	session.Commit()
	return nil
}
