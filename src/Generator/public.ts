import request from 'request-promise-native';
import consola from 'consola';
import fs from 'fs';
import path from 'path';
import { IYapiCookie } from '../types/index';
import { resolvePath, userInfoPath } from '../utils';

export class PublicMethods {

  /** 登录 */
  async yapiLogin  ({email, password}:{email:string, password:string},serverUrl:string) :Promise<IYapiCookie>{
    try {
      const res = await request({
        method: 'POST',
        uri: `${serverUrl}/api/user/login`,
        body: { email,password },
        json: true,
        resolveWithFullResponse: true
      });
      const [cookie0, cookie1] = res.headers['set-cookie'];
      const _yapi_token = cookie0.split(';')[0].split('=')[1];
      const _yapi_uid = cookie1.split(';')[0].split('=')[1];
      consola.success('账户已登录');
      return { _yapi_token, _yapi_uid };
    } catch (e) {
      consola.error('yapi登录异常,请输入 yta get account 检查账号密码是否正确');
      return Promise.reject(e);
    }
  }



  /** 获取yapiConfig配置 */
  getYapiConfig(isInit = false):string|undefined{
    /** 查询是否存在ts配置文件 */
    let configFilePath = resolvePath('yapiConfig.ts');
    /** 如果不存在，替换为js文件 */
    if (!fs.existsSync(configFilePath)) {
      configFilePath = resolvePath('yapiConfig.js');
    }
    if (!fs.existsSync(configFilePath)) {
      /** 不是init命令 提示执行init */
      !isInit && consola.error('未在项目中找到 yapiConfig 配置文件，请执行init命令');
      return;
    }
    consola.success(`找到配置文件: ${configFilePath}`);
    return configFilePath;
  }

  /** 获取账号密码 */

  getUserInfo():{email:string,password:string}|undefined{
    try {
    // 获取配置中的账号密码
      if (!fs.existsSync(userInfoPath)) {
        consola.warn('获取账号密码失败，请执行 yta set account 设置yapi账号密码');
      } else {
        const conf = JSON.parse(fs.readFileSync(userInfoPath, 'utf-8'));
        if (conf.email && conf.password) {
          return { email:conf.email,password:conf.password };
        }
        consola.warn('账号密码异常，请执行 yta get account 查看账号密码是否正确');
      }
    } catch (error) {
      consola.error('yapi 账号密码获取失败');
    }
  }


}