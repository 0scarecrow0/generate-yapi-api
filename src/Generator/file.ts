import consola from 'consola';
import { IProjectConfig, IOutPut } from '../types';
import fs from 'fs';
import { mkdirs,resolvePath, writeFileSync } from '../utils';
import prettier from 'prettier';
import chalk from 'chalk';
const chalk_text = chalk.hex('#67e6dc');


export class GenerateFile{

  config:IProjectConfig;
  /** 修改接口文件 */
  modifyFiles: string[] = [];
  /** 新增接口文件 */
  addFiles: string[] = [];

  constructor (config:IProjectConfig){
    this.config = config;
  }

  /** 写入API文件 */
  async writeFile (outputApiList:IOutPut[],callback?: (index:number,apiLength:number,) => void){
    /** 1.判断是否有写入的文件 */
    if (outputApiList.length === 0) return;
    /** 2.创建目录-->创建完成执行回调函数 写入文件 */
    mkdirs(this.config.outputFilePath, () => {
      /** 读取目录下的所有文件 */
      const files = fs.readdirSync(resolvePath(this.config.outputFilePath));
      /** 遍历匹配到的接口，并写入文件夹 */
      outputApiList.forEach((api,index)=>{
        const data = this.generateApiFileTemplateFun(api);
        this.compareApiFile(files, api.name, data);
        callback?.(index,outputApiList.length);
      });
    });
  }


  /** 生成api文件模板 */
  generateApiFileTemplateFun(api:IOutPut):string{
    if (this.config.generateApiFileTemplate) {
      return this.config.generateApiFileTemplate(api);
    }
    return `
      /**
      * ${api.title}
      **/



      export default (data: IReq) => request({
      method: '${api.method}',
      url: '${api.path}',
      data: data
      })
    `;
  }

  /**
   * 比对文件 确定文件状态
   */
  compareApiFile(files: string[], name: string, data: string) {
    // 查找是否已存在 相同文件
    const isExistence = files.filter(file => file.replace(`.${this.config.target}`, '') === name);
    if (isExistence.length > 0) {
      // 已存在该文件
      const realPath = `${this.config.outputFilePath}/${name}.${this.config.target}`;
      const oldData = fs.readFileSync(realPath, 'utf-8').toString();
      // prettier 美化代码插件
      const data1 = prettier.format(data, {parser: this.config.target === 'ts' ? 'typescript' : 'babel'});
      if (oldData !== data1) {
        // 修改已存在文件
        this.modifyFiles.push(name);
        writeFileSync(
          resolvePath(`${this.config.outputFilePath}/${name}.${this.config.target}`),
          data1,
        );
      }
    } else {
      // 不存在 新增
      this.addFiles.push(name);
      writeFileSync(
        resolvePath(`${this.config.outputFilePath}/${name}.${this.config.target}`),
        prettier.format(data, {
          parser: this.config.target === 'ts' ? 'typescript' : 'babel'
        }),
      );
    }
  }


  /** 接口写入详情 */
  generateApiInfo(index:number,apiLength:number){
    if (index !== apiLength - 1) return;
    consola.log(`=======================👇 projectId: ${this.config.projectId} 👇=====================`);
    if (!this.modifyFiles.length && !this.addFiles.length) {
      consola.log('接口无变动');
      consola.log(`=======================👆 projectId: ${this.config.projectId} 👆=====================`);
      return;
    }
    if (this.addFiles.length) {
      consola.log(`新增接口: ${this.addFiles.length} 个`);
      this.addFiles.forEach(e => consola.info(e));
    }
    if (this.modifyFiles.length) {
      if (this.addFiles.length) consola.log('---------------------------------------------------');
      consola.log(`修改接口: ${this.modifyFiles.length} 个`);
      this.modifyFiles.forEach(e => consola.info(e));
    }
    consola.log(chalk_text(`共计更新${this.addFiles.length + this.modifyFiles.length}个接口文件，请到git工作区比对文件更新`));
    consola.log(`=======================👆 projectId: ${this.config.projectId} 👆=====================`);
  }
}
