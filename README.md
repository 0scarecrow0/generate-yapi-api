# generate-yapi-api
基于yapi自动生成api接口，支持ts

### 安装
```
yarn add yapi-to-api -D
```
### 使用
```
// 1.查看版本号
yapiTool -V

// 2.初始化
yapiTool init

// 3.本地配置登录账号与密码 路径（～/.yapiUser）
{
  "email": "xxxx",
  "password": "xxxx"
}

// 3.拉取代码
yapiTool getApi
```
#### yapiConfig配置
```
// init 之后参考模板配置
export interface IProjectConfig {
  /**
   * 生成ts 、js版本
   */
  target: 'ts' | 'js',
  /**
   * 项目id
   * 'http://122.51.157.252:3000/project/11/interface/api/20' projectId 对应 11
   */
  projectId: string,
  /**
   * 输出api文件路径。
   */
  outputFilePath: string,
  /**
   * 过滤需要比对的文件方法
   * currentGitBranch 当前git分支号
   */
  customizeFilter?:
  (api: Omit<IOutPut, 'reqInterfaceName' | 'resInterfaceName' | 'requestInterface' | 'responseInterface'>,options: {currentGitBranch: string}) => boolean,
  /**
   * 文件名称生成规则
   */
  generateApiName?: (path: string, _id: string | number) => string,
  /**
   * 自定义代码片段函数
   */
  generateApiFileTemplate?: (api: IOutPut) => string,
}

export type IYapiConfig ={
  /**
   * YApi 服务地址。
   * 'http://122.51.157.252:3000'
   */
  serverUrl: string,
  projectConfigs:IProjectConfig[]
}
```
