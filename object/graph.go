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

type GraphNode struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Value  int    `json:"val"`
	Color  string `json:"color"`
	Tag    string `json:"tag"`
	Weight int    `json:"weight"`
}

func newNode(id string, name string, value int, color string, tag string, weight int) *GraphNode {
	n := GraphNode{}
	n.Id = id
	n.Name = name
	n.Value = value
	n.Color = color
	n.Tag = tag
	n.Weight = weight
	return &n
}

type Link struct {
	Name   string `json:"name"`
	Source string `json:"source"`
	Target string `json:"target"`
	Value  int    `json:"value"`
	Color  string `json:"color"`
	Tag    string `json:"tag"`
}

func newLink(name string, source string, target string, value int, color string, tag string) *Link {
	l := Link{}
	l.Name = name
	l.Source = source
	l.Target = target
	l.Value = value
	l.Color = color
	l.Tag = tag
	return &l
}

type Graph struct {
	Nodes []*GraphNode `json:"nodes"`
	Links []*Link      `json:"links"`
}

func newGraph() *Graph {
	g := Graph{}
	return &g
}

func (g *Graph) addNode(id string, name string, value int, color string, tag string, weight int) {
	n := newNode(id, name, value, color, tag, weight)
	g.Nodes = append(g.Nodes, n)
}

func (g *Graph) addLink(name string, source string, target string, value int, color string, tag string) {
	l := newLink(name, source, target, value, color, tag)
	g.Links = append(g.Links, l)
}
