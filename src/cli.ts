#!/usr/bin/env node
import * as TSNODE from 'ts-node';
import fs from 'fs';
import { IProjectConfig, IYapiCookie, IYapiConfig } from './types/index';
import { Command } from 'commander';
import { getGetStatus, removeFileSync, resolvePath,userInfoPath } from './utils';
import consola from 'consola';
import { isArray } from 'lodash';
import { YapiGenerator } from './Generator/yapi';
import { GenerateFile } from './Generator/file';
import { PublicMethods } from './Generator/public';
import { yapiConfigTemplate } from './template/init';
const { Confirm,prompt } = require('enquirer');
const pkg = require('../package.json') ;
import ora from 'ora';
import chalk from 'chalk';
const chalk_error = chalk.hex('#ee5253');
const chalk_warn = chalk.hex('#feca57');
const chalk_sucess = chalk.hex('#10ac84');
const chalk_load = chalk.hex('#54a0ff');
const chalk_info = chalk.hex('#48dbfb');

/** 无需预编译即可直接在 Node.js 上执行 TypeScript */
TSNODE.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const generatoraFiles = async (config: IProjectConfig ,yapiCookie:IYapiCookie,serverUrl:string) => {
  const spinner = ora();
  spinner.start(chalk_load(`🏖 Project-${config.projectId}: 正在准备接口...`));
  try {
    /** yapi操作 */
    const yapiGenerator = new YapiGenerator(config,yapiCookie,serverUrl);
    /** 获取 输出的yapi 数据 */
    const outputList = await yapiGenerator.generateApiList();
    if (outputList.length === 0) {
      spinner.succeed(chalk_sucess(`🏜 Project-${config.projectId}: 没有匹配到接口，运行结束`));
      return;
    }
    const spinner2 = spinner.succeed(chalk_sucess(`🏝 Project-${config.projectId}: 筛选出 ${chalk.hex('#f368e0')(outputList.length)} 个接口`));
    /** 写入文件 */
    spinner2.start(chalk_load(`🚀 Project-${config.projectId}: 正在写入文件...`));
    try {
      const generateFile = new GenerateFile(config);
      generateFile.writeFile(outputList, (index,apiLength)=>{
        if (index !== apiLength - 1) return;
        spinner2.succeed(chalk_sucess('🦄文件写入成功，查看写入详情👇'));
        generateFile.generateApiInfo(index,apiLength);
      });
    } catch (error) {
      spinner2.fail(chalk_error('文件写入异常，流程已中断'));
    }

  } catch (e) {
    spinner.fail(chalk_error('遇到错误，流程已中断'));
    consola.error(e);
  }
};


const program = new Command(pkg.name);
program.version(pkg.version);


/** 初始化配置文件 */
program
  .command('init')
  .description('初始化')
  .action(async () => {
    const publicMethods = new PublicMethods();
    let yapiConfigPath = publicMethods.getYapiConfig(true);
    /** 查看是否存在配置文件 */
    if (yapiConfigPath) {
      /** 请选择是否覆盖 */
      const promptConfigCover = new Confirm({ message: chalk_warn('已存在配置文件，是否覆盖')});
      const isCover = await promptConfigCover.run();
      if (!isCover) return;
    }
    const configs = await prompt([
      {
        type: 'select',
        name: 'target',
        message: chalk_info('请选择初始化配置文件'),
        choices: ['js', 'ts']
      },
      {
        type: 'input',
        name: 'serverUrl',
        message: chalk_info('请输入yapi地址'),
        initial:'http://122.51.157.252:3000'
      },
      {
        type: 'list',
        name: 'projectIds',
        message: chalk_info('请输入projectId,逗号分隔'),
        initial:'11,22'
      },
      ,
      {
        type: 'input',
        name: 'outputFilePath',
        message: chalk_info('请输入输出路径'),
        initial:'src/apis'
      }
    ]);
    /** 如果文件与选择的 生成文件类型不一致，删除原有的文件，并将类型替换为新的 */
    if (yapiConfigPath &&  !yapiConfigPath?.includes(`.${configs.target}`)) removeFileSync(yapiConfigPath as string);
    yapiConfigPath = resolvePath(`yapiConfig.${configs.target}`);
    fs.writeFileSync(yapiConfigPath, yapiConfigTemplate(configs));
    consola.success(chalk_sucess('写入配置文件完毕'));
  });


/** 设置 yapi 账号密码 */
program
  .command('set account')
  .description('设置账号密码')
  .action(async () => {
    const userInfo = await prompt([
      {
        type: 'input',
        name: 'email',
        message: chalk_info('请输入yapi账号🙉'),
        required: true
      },
      {
        type: 'input',
        name: 'password',
        message: chalk_info('输入yapi密码🙈'),
        required: true
      }
    ]);
    if (fs.existsSync(userInfoPath)) removeFileSync(userInfoPath as string);
    fs.writeFileSync(userInfoPath, JSON.stringify(userInfo));
    consola.success(chalk_sucess('账号密码配置成功'));
  });

/** 设置 yapi 账号密码 */
program
  .command('get account')
  .description('设置账号密码')
  .action(() => {
    if (!fs.existsSync(userInfoPath)) {
      consola.error(chalk_error('获取账号密码失败，请执行 yta set account 设置yapi账号密码'));
      return;
    } else {
      const conf = JSON.parse(fs.readFileSync(userInfoPath, 'utf-8'));
      consola.success(conf);
    }
  });




/** 获取接口 */
program
  .command('generate api')
  .description('获取api接口')
  .action(async () => {
    try {
      const publicMethods = new PublicMethods();

      /** 判断git工作区域是否干净 */
      if (!await getGetStatus('isClean')) {
        consola.error(chalk_warn('请先清空本地git工作区域，再拉取api'));
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
        consola.error(chalk_error('配置文件 yapiConfig 配置错误，请仔细检查'));
      }
    } catch (error) {
      return consola.error(error);
    }
  });
program.parse(process.argv);
