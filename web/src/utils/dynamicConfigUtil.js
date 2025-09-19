import * as DynamicConfigBackend from '../backend/DynamicConfigBackend';

/**
 * 获取动态配置的值（异步）
 * @param {string} key 配置key
 * @param {string} defaultValue 默认值（如果未获取到则返回此值）
 * @returns {Promise<string>} 配置值
 */
export async function getDynamicConfigValue(key, defaultValue = '') {
    try {
        const res = await DynamicConfigBackend.getDynamicConfigValueByKey(key, defaultValue);
        // 兼容后端返回格式
        if (res && res.status === 'ok' && typeof res.data === 'string') {
            return res.data;
        }
        return defaultValue;
    } catch (e) {
        return defaultValue;
    }
}