#!/usr/bin/env node
import * as TSNODE from 'ts-node';
import fs from 'fs';
import { IProjectConfig, IYapiCookie, IYapiConfig } from './types/index';
import { Command } from 'commander';

import { getGetStatus, removeFileSync, resolvePath } from './utils';
import consola from 'consola';
import { isArray } from 'lodash';
import { YapiGenerator } from './Generator/yapi';
import { GenerateFile } from './Generator/file';
import { PublicMethods } from './Generator/public';
import { yapiConfigTemplate } from './template/init';
const { Confirm,prompt } = require('enquirer');
const pkg = require('../package.json') ;

/** 无需预编译即可直接在 Node.js 上执行 TypeScript */
TSNODE.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const generatoraFiles = async (config: IProjectConfig ,yapiCookie:IYapiCookie,serverUrl:string) => {
  try {

    /** yapi操作 */
    const yapiGenerator = new YapiGenerator(config,yapiCookie,serverUrl);
    /** 获取 输出的yapi 数据 */
    const outputList = await yapiGenerator.generateApiList();

    /** 写入文件 */
    const generateFile = new GenerateFile(config);
    generateFile.writeFile(outputList, ()=>{
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
  .action(async () => {
    const publicMethods = new PublicMethods();
    let yapiConfigPath = publicMethods.getYapiConfig();
    /** 查看是否存在配置文件 */
    if (yapiConfigPath) {
      /** 请选择是否覆盖 */
      const promptConfigCover = new Confirm({ message: '已存在配置文件，是否覆盖'});
      const isCover = await promptConfigCover.run();
      if (!isCover) return;
    }
    const configs = await prompt([
      {
        type: 'select',
        name: 'target',
        message: '请选择初始化配置文件',
        choices: ['js', 'ts']
      },
      {
        type: 'input',
        name: 'serverUrl',
        message: '请输入yapi地址',
        initial:'http://122.51.157.252:3000'
      },
      {
        type: 'list',
        name: 'projectIds',
        message: '请输入projectId',
        initial:'11,22'
      },
      ,
      {
        type: 'input',
        name: 'outputFilePath',
        message: '请输入输出路径',
        initial:'src/apis'
      }
    ]);
    console.log(configs);
    /** 如果文件与选择的 生成文件类型不一致，删除原有的文件，并将类型替换为新的 */
    if (!yapiConfigPath?.includes(`.${configs.target}`)) {
      removeFileSync(yapiConfigPath as string);
      yapiConfigPath = resolvePath(`yapiConfig.${configs.target}`);
    }
    fs.writeFileSync(yapiConfigPath, yapiConfigTemplate(configs));
    consola.success('写入配置文件完毕');
  });


/** 获取接口 */
program
  .command('getApi')
  .description('获取api接口')
  .action(async () => {
    try {
      const publicMethods = new PublicMethods();

      /** 判断git工作区域是否干净 */
      if (!await getGetStatus('isClean')) {
        consola.warn('请先清空本地git工作区域，再拉取api');
        return;
      }

      /** 判断是否存在配置文件 */
      const yapiConfigPath = publicMethods.getYapiConfig();
      if (!yapiConfigPath) return;


      /** 判断是否存在账号密码 */
			 const userInfo = publicMethods.getUserInfo();
			 if (!userInfo) return;


      /** 引入配置文件，判断是否是数组 */
      const configs = require(yapiConfigPath);
      const yapiCookie =await publicMethods.yapiLogin(userInfo,configs.serverUrl);
      if (isArray(configs.projectConfigs)) {
        (configs as IYapiConfig).projectConfigs.forEach(configItem => generatoraFiles(configItem,yapiCookie,configs.serverUrl));
      }else{
        consola.error(' 配置文件 yapiConfig 配置错误，请仔细检查');
      }
    } catch (error) {
      return consola.error(error);
    }
  });
program.parse(process.argv);
