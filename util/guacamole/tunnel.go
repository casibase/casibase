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

package guacamole

import (
	"bufio"
	"encoding/base64"
	"errors"
	"fmt"
	"net"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

type Tunnel struct {
	conn         net.Conn
	ConnectionID string

	reader *bufio.Reader
	writer *bufio.Writer

	IsOpen bool
}

func NewTunnel(address string, config *Configuration) (*Tunnel, error) {
	conn, err := net.DialTimeout("tcp", address, 5*time.Second)
	if err != nil {
		return nil, err
	}

	t := &Tunnel{
		conn:   conn,
		reader: bufio.NewReader(conn),
		writer: bufio.NewWriter(conn),
	}

	err = t.Handshake(config)
	if err != nil {
		t.conn.Close()
		return nil, err
	}

	return t, nil
}

func (t *Tunnel) Handshake(config *Configuration) (err error) {
	selectArg := config.ConnectionID
	if len(selectArg) == 0 {
		selectArg = config.Protocol
	}

	if err := t.WriteInstructionAndFlush(NewInstruction("select", selectArg)); err != nil {
		return err
	}

	args, err := t.expect("args")
	if err != nil {
		return err
	}

	// Build Args list off provided names and config
	argNameS := args.Args
	argValueS := make([]string, 0, len(argNameS))
	for _, argName := range argNameS {

		// Retrieve argument name

		// Get defined value for name
		value := config.Parameters[argName]

		// If value defined, set that value
		if len(value) == 0 {
			value = ""
		}
		argValueS = append(argValueS, value)
	}

	width := config.GetParameter("width")
	height := config.GetParameter("height")
	dpi := config.GetParameter("dpi")

	// send size
	if err := t.WriteInstructionAndFlush(NewInstruction("size", width, height, dpi)); err != nil {
		return nil
	}
	if err := t.WriteInstructionAndFlush(NewInstruction("audio", "audio/L8", "audio/L16")); err != nil {
		return nil
	}
	if err := t.WriteInstructionAndFlush(NewInstruction("video")); err != nil {
		return nil
	}
	if err := t.WriteInstructionAndFlush(NewInstruction("image", "image/jpeg", "image/png", "image/webp")); err != nil {
		return nil
	}
	if err := t.WriteInstructionAndFlush(NewInstruction("timezone", "Asia/Shanghai")); err != nil {
		return nil
	}

	// Send Args
	if err := t.WriteInstructionAndFlush(NewInstruction("connect", argValueS...)); err != nil {
		return nil
	}

	// Wait for ready, store ID
	ready, err := t.expect("ready")
	if err != nil {
		return
	}

	if len(ready.Args) == 0 {
		return errors.New("no connection id received")
	}

	t.ConnectionID = ready.Args[0]
	t.IsOpen = true

	return nil
}

func (t *Tunnel) WriteInstructionAndFlush(instruction *Instruction) error {
	_, err := t.writer.WriteString(instruction.String())
	if err != nil {
		return err
	}

	err = t.writer.Flush()
	if err != nil {
		return err
	}

	return nil
}

func (t *Tunnel) expect(opcode string) (instruction *Instruction, err error) {
	instruction, err = t.ReadInstruction()
	if err != nil {
		return instruction, err
	}

	if opcode != instruction.Opcode {
		msg := fmt.Sprintf(`expected "%s" instruction but instead received "%s"`, opcode, instruction.Opcode)
		return instruction, errors.New(msg)
	}
	return instruction, nil
}

func (t *Tunnel) WriteAndFlush(p []byte) (int, error) {
	nn, err := t.writer.Write(p)
	if err != nil {
		return nn, err
	}
	err = t.writer.Flush()
	if err != nil {
		return nn, err
	}
	return nn, nil
}

func (t *Tunnel) ReadInstruction() (instruction *Instruction, err error) {
	msg, err := t.Read()
	if err != nil {
		return instruction, err
	}
	return instruction.Parse(string(msg)), err
}

func (t *Tunnel) Read() (p []byte, err error) {
	data, err := t.reader.ReadBytes(Delimiter)
	if err != nil {
		return
	}
	s := string(data)

	if s == "rate=44100,channels=2;" {
		return make([]byte, 0), nil
	}
	if s == "rate=22050,channels=2;" {
		return make([]byte, 0), nil
	}
	if s == "5.audio,1.1,31.audio/L16;" {
		s += "rate=44100,channels=2;"
	}
	return []byte(s), err
}

func (t *Tunnel) Close() error {
	t.IsOpen = false
	return t.conn.Close()
}

func Disconnect(ws *websocket.Conn, code int, msg string) {
	// guacd cannot handle Chinese characters, so base64 encoding is done
	encodeReason := base64.StdEncoding.EncodeToString([]byte(msg))
	err := NewInstruction("error", encodeReason, strconv.Itoa(code))
	_ = ws.WriteMessage(websocket.TextMessage, []byte(err.String()))
	disconnect := NewInstruction("disconnect")
	_ = ws.WriteMessage(websocket.TextMessage, []byte(disconnect.String()))
}
