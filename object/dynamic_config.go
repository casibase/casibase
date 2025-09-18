package object

type DynamicConfig struct {
	Id         int    `xorm:"pk autoincr" json:"id"`
	ConfigKey   string `xorm:"varchar(256)" json:"configkey"`
	ConfigValue string `xorm:"varchar(2048)" json:"configvalue"`
}

func GetDynamicConfigs() ([]*DynamicConfig, error) {
	configs := []*DynamicConfig{}
	err := adapter.engine.Find(&configs)
	return configs, err
}

func GetDynamicConfig(id string) (*DynamicConfig, error) {
	config := &DynamicConfig{}
	has, err := adapter.engine.Where("id = ?", id).Get(config)
	if err != nil || !has {
		return nil, err
	}
	return config, nil
}

func AddDynamicConfig(config *DynamicConfig) (bool, error) {
	affected, err := adapter.engine.Insert(config)
	return affected > 0, err
}

func UpdateDynamicConfig(id string, config *DynamicConfig) (bool, error) {
	config.Id = 0 // 防止主键被覆盖
	affected, err := adapter.engine.Where("id = ?", id).Update(config)
	return affected > 0, err
}

func DeleteDynamicConfig(config *DynamicConfig) (bool, error) {
	affected, err := adapter.engine.Where("id = ?", config.Id).Delete(&DynamicConfig{})
	return affected > 0, err
}
