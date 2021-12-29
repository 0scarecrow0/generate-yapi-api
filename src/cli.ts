#!/usr/bin/env node
import * as TSNODE from 'ts-node';
import { IYapiConfig } from './types';
import { Command } from 'commander';
import pkg from './../package.json';
import { Generator } from './Generator';
import consola from 'consola';
import fs from 'fs';
import path from 'path';
import { isArray } from 'lodash';
import { getGetStatus } from './utils';


/** 无需预编译即可直接在 Node.js 上执行 TypeScript */
TSNODE.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

/** 获取yapiConfig配置 */
const getYapiConfig=():string|undefined=>{

  /** 查询是否存在ts配置文件 */
  let configFilePath = path.join(process.cwd(), 'yapiConfig.ts');
  /** 如果不存在，替换为js文件 */
  if (!fs.existsSync(configFilePath)) {
    configFilePath = path.join(process.cwd(), 'yapiConfig.js');
  }
  if (!fs.existsSync(configFilePath)) {
    consola.error('未在项目中找到 yapiConfig 配置文件，请执行init命令');
    return;
  }
  consola.success(`找到配置文件: ${configFilePath}`);
  return configFilePath;
};
/** 获取账号密码 */

const  getUserInfo = ():{email:string,password:string}|undefined=>{
  try {
    // 获取配置中的账号密码
    const USER_HOME = (process.env.HOME || process.env.USERPROFILE) as string;
    const filePath = path.resolve(USER_HOME, '.yapiUser');
    if (!fs.existsSync(filePath)) {
      consola.warn(`系统配置中没有检测到 .yapiUser 文件, 请在 ${USER_HOME} 目录中配置该文件`);
    } else {
      const conf = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (conf.email && conf.password) {
        return { email:conf.email,password:conf.password };
      }
      consola.warn(`未获取到账号密码,请仔细检查${filePath}文件,是否配置正确`);
    }
  } catch (error) {
    consola.error('未获取到账号密码,请仔细检查配置文件,是否配置正确');
  }
};




const generatoraFiles = async (config: IYapiConfig ,userInfo:{email:string,password:string}) => {
  try {
    const generator = new Generator(config);
    /** 获取要写入的文件 */
    const outputList = await generator.generateApiList(userInfo);
    consola.success('接口数据成功获取');
    generator.writeFile(outputList, ()=>{
      consola.success('文件写入成功');
    });
  } catch (e) {
    consola.error('遇到错误，流程已中断');
    consola.error(e);
  }
};


const program = new Command(pkg.name);
program.version(pkg.version);


/** 初始化命令 */
program
  .command('init')
  .description('初始化')
  .action(() => {
    console.log(12333);
  });


/** 获取接口 */
program
  .command('getApi')
  .description('获取api接口')
  .action(async () => {
    try {

      /** 判断git工作区域是否干净 */
      if (!await getGetStatus('isClean')) {
        consola.warn('请先清空本地git工作区域，再拉取api');
        return;
      }

      /** 判断是否存在配置文件 */
      const yapiConfigPath = getYapiConfig();
      if (!yapiConfigPath) return;

      /** 判断是否存在账号密码 */
			 const userInfo = getUserInfo();
			 if (!userInfo) return;

      /** 引入配置文件，判断是否是数组 */
      const configs = require(yapiConfigPath);
      if (isArray(configs)) {
        configs.forEach(configItem => generatoraFiles((<IYapiConfig>configItem),userInfo));
      }else{
        consola.error(' 配置文件 yapiConfig 配置错误，请仔细检查');
      }
    } catch (error) {
      return consola.error(error);
    }
  }).parse(process.argv);

