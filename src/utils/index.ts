import fs from 'fs';
import path from 'path';


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