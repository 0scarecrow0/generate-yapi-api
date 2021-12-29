import consola from 'consola';
import { IProjectConfig, IOutPut } from '../types';
import fs from 'fs';
import { mkdirs,resolvePath, writeFileSync } from '../utils';
import prettier from 'prettier';


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
  async writeFile (outputApiList:IOutPut[],callback?: () => void){
    /** 1.判断是否有写入的文件 */
    if (outputApiList.length === 0) {
      consola.info('😄 customizeFilter 没有匹配接口，运行结束');
      return;
    }
    /** 2.创建目录-->创建完成执行回调函数 写入文件 */
    mkdirs(this.config.outputFilePath, () => {
      /** 读取目录下的所有文件 */
      const files = fs.readdirSync(resolvePath(this.config.outputFilePath));
      /** 遍历匹配到的接口，并写入文件夹 */
      outputApiList.forEach((api,index)=>{
        const data = this.generateApiFileTemplateFun(api);
        this.compareApiFile(files, api.name, data);
        this.generateApiInfo(index,outputApiList.length,callback);
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
  generateApiInfo(index:number,apiLength:number,callback?: () => void){
    if (index !== apiLength - 1) return;
    if (!this.modifyFiles.length && !this.addFiles.length) {
      consola.success('接口无变动');
      return callback?.();
    }
    if (this.addFiles.length) {
      consola.log('---------------------------------------------------');
      consola.success(`新增接口：${this.addFiles.length} 个:`);
      this.addFiles.forEach(e => consola.info(e));
    }
    if (this.modifyFiles.length) {
      consola.log('---------------------------------------------------');
      consola.success(`修改接口：${this.modifyFiles.length} 个:`);
      this.modifyFiles.forEach(e => consola.info(e));
    }
    consola.log('===================================================');
    consola.warn(`共计更新了${this.addFiles.length + this.modifyFiles.length}个接口文件，请到git工作区比对文件更新`);
    return callback?.();
  }
}
