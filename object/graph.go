package object

type Node struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Value  int    `json:"val"`
	Color  string `json:"color"`
	Tag    string `json:"tag"`
	Weight int    `json:"weight"`
}

func newNode(id string, name string, value int, color string, tag string, weight int) *Node {
	n := Node{}
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
	Nodes []*Node `json:"nodes"`
	Links []*Link `json:"links"`
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
