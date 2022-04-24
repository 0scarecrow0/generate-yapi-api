import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';


export const resolvePath = (relativePath: string) => path.resolve(process.cwd(), relativePath);
/** 根据传入的路径，创建目录 */
export const mkdirs = (dirpath: string, callback: () => any) => {
  // 判断是否存在路径
  const exists = fs.existsSync(dirpath);
  if (exists) {
    callback();
  } else {
    // 判断父级路径是否存在 存在则创建子目录，否则创建父级目录
    mkdirs(path.dirname(dirpath), () => {
      fs.mkdirSync(dirpath);
      callback();
    });
  }
};


/** 写入文件 */
export const writeFileSync = (dirpath: string, data: string) => fs.writeFileSync(dirpath, data, 'utf8');

/** 删除文件 */
export const removeFileSync = (dirpath: string) => fs.unlinkSync(dirpath);


/** 获取git当前工作区域状态，以及当前分支名 */
export function getGetStatus(type:'isClean'):Promise<boolean>;
export function getGetStatus(type:'currentBranch'):Promise<string>;
export async function getGetStatus(type:'isClean'|'currentBranch'):Promise<any>{
  try {
    /** 存在 git 工作区 */
    const SimpleGit = simpleGit();
    const status = await SimpleGit.status();
    switch (type) {
      case 'isClean':
        return status.isClean();
      case 'currentBranch':
        return status.current;
    }
  } catch (error) {
    /** 不存在 */
    return type==='isClean' ? true :'';
  }
}


/** 账号密码地址 */
export const userInfoPath = path.resolve((process.env.HOME || process.env.USERPROFILE) as string, '.yapiUser');