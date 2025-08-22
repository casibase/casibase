/**
 * 数据类型转换工具类
 * 用于将数字编号的dataType转换为对应的中文描述
 */
class DataTypeConverter {
  /**
   * 将dataType数字转换为中文描述
   * @param {number} dataType - 数字编号
   * @returns {string} 对应的中文描述
   */
  static convertToChinese(dataType) {
    const dataTypeMap = {
      1: '门诊就诊记录',
      2: '住院诊疗数据',
      3: '专病知识库数据',
      4: '互联网医院就诊记录'
    };

    return dataTypeMap[dataType] || '未知数据类型';
  }

  /**
   * 检查dataType是否有效
   * @param {number} dataType - 数字编号
   * @returns {boolean} 是否有效
   */
  static isValidDataType(dataType) {
    return [1, 2, 3, 4].includes(dataType);
  }

  /**
   * 获取所有dataType的映射关系
   * @returns {object} 所有dataType的映射
   */
  static getAllDataTypes() {
    return {
      1: '门诊就诊记录',
      2: '住院诊疗数据',
      3: '专病知识库数据',
      4: '互联网医院就诊记录'
    };
  }
}

export default DataTypeConverter;